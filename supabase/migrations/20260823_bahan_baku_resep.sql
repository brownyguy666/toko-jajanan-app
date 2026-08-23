-- ==============================================================================
-- MIGRATION: FITUR BAHAN BAKU, RESEP, & HPP DINAMIS
-- ==============================================================================

-- 1. TABEL BAHAN BAKU
CREATE TABLE IF NOT EXISTS public.bahan_baku (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama TEXT NOT NULL,
    satuan_terkecil TEXT NOT NULL CHECK (satuan_terkecil IN ('gram', 'ml', 'pcs')),
    harga_per_satuan_terkecil NUMERIC NOT NULL CHECK (harga_per_satuan_terkecil >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABEL RESEP (KOMPOSISI PRODUK PER 1 UNIT)
CREATE TABLE IF NOT EXISTS public.resep (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produk_id UUID NOT NULL REFERENCES public.produk(id) ON DELETE CASCADE,
    bahan_baku_id UUID NOT NULL REFERENCES public.bahan_baku(id) ON DELETE CASCADE,
    jumlah_terpakai NUMERIC NOT NULL CHECK (jumlah_terpakai > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_produk_bahan UNIQUE (produk_id, bahan_baku_id)
);

-- 3. TAMBAH KOLOM HPP_TERKINI DI TABEL PRODUK
ALTER TABLE public.produk
ADD COLUMN IF NOT EXISTS hpp_terkini INTEGER NOT NULL DEFAULT 0 CHECK (hpp_terkini >= 0);

-- Backfill initial hpp_terkini from existing harga_modal
UPDATE public.produk
SET hpp_terkini = COALESCE(harga_modal, 0)
WHERE hpp_terkini = 0 AND harga_modal IS NOT NULL;

-- 4. TAMBAH KOLOM HPP_SAAT_JUAL DI TABEL TRANSAKSI_ITEM
ALTER TABLE public.transaksi_item
ADD COLUMN IF NOT EXISTS hpp_saat_jual INTEGER NOT NULL DEFAULT 0 CHECK (hpp_saat_jual >= 0);

-- Backfill initial hpp_saat_jual from linked product harga_modal
UPDATE public.transaksi_item ti
SET hpp_saat_jual = COALESCE(p.harga_modal, 0)
FROM public.produk p
WHERE ti.produk_id = p.id AND ti.hpp_saat_jual = 0;

-- 5. FUNCTION & TRIGGERS PERHITUNGAN HPP OTOMATIS
CREATE OR REPLACE FUNCTION public.recalculate_produk_hpp()
RETURNS TRIGGER AS $$
DECLARE
  target_produk_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'resep' THEN
    target_produk_id := COALESCE(NEW.produk_id, OLD.produk_id);
    
    -- Hitung total HPP dari seluruh bahan di resep produk ini
    UPDATE public.produk
    SET hpp_terkini = COALESCE((
      SELECT ROUND(SUM(r.jumlah_terpakai * b.harga_per_satuan_terkecil))::INTEGER
      FROM public.resep r
      JOIN public.bahan_baku b ON b.id = r.bahan_baku_id
      WHERE r.produk_id = target_produk_id
    ), harga_modal, 0),
    updated_at = now()
    WHERE id = target_produk_id;
    
  ELSIF TG_TABLE_NAME = 'bahan_baku' THEN
    -- Update HPP seluruh produk yang menggunakan bahan baku yang berubah harganya
    UPDATE public.produk p
    SET hpp_terkini = COALESCE((
      SELECT ROUND(SUM(r.jumlah_terpakai * b.harga_per_satuan_terkecil))::INTEGER
      FROM public.resep r
      JOIN public.bahan_baku b ON b.id = r.bahan_baku_id
      WHERE r.produk_id = p.id
    ), p.harga_modal, 0),
    updated_at = now()
    WHERE p.id IN (
      SELECT DISTINCT produk_id FROM public.resep WHERE bahan_baku_id = NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pada tabel resep
DROP TRIGGER IF EXISTS trg_resep_update_hpp ON public.resep;
CREATE TRIGGER trg_resep_update_hpp
  AFTER INSERT OR UPDATE OR DELETE ON public.resep
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_produk_hpp();

-- Trigger pada tabel bahan_baku saat harga berubah
DROP TRIGGER IF EXISTS trg_bahan_baku_update_hpp ON public.bahan_baku;
CREATE TRIGGER trg_bahan_baku_update_hpp
  AFTER UPDATE OF harga_per_satuan_terkecil ON public.bahan_baku
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_produk_hpp();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.bahan_baku ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resep ENABLE ROW LEVEL SECURITY;

-- Policy bahan_baku: Hanya Owner yang dapat membaca & mengelola
DROP POLICY IF EXISTS "Owner dapat mengelola bahan baku" ON public.bahan_baku;
CREATE POLICY "Owner dapat mengelola bahan baku"
  ON public.bahan_baku FOR ALL
  TO authenticated
  USING (public.is_owner());

-- Policy resep: Hanya Owner yang dapat membaca & mengelola
DROP POLICY IF EXISTS "Owner dapat mengelola resep" ON public.resep;
CREATE POLICY "Owner dapat mengelola resep"
  ON public.resep FOR ALL
  TO authenticated
  USING (public.is_owner());
