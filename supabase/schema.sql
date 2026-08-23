-- ==============================================================================
-- SKEMA DATABASE & ROW LEVEL SECURITY (RLS) TOKO JAJANAN
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'pegawai')),
    status_aktif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABEL PRODUK
CREATE TABLE IF NOT EXISTS public.produk (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama TEXT NOT NULL,
    kategori TEXT NOT NULL,
    harga_jual INTEGER NOT NULL CHECK (harga_jual >= 0),
    harga_modal INTEGER NOT NULL CHECK (harga_modal >= 0),
    hpp_terkini INTEGER NOT NULL DEFAULT 0 CHECK (hpp_terkini >= 0),
    stok INTEGER NOT NULL DEFAULT 0 CHECK (stok >= 0),
    stok_minimum INTEGER NOT NULL DEFAULT 5 CHECK (stok_minimum >= 0),
    foto_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 4. TABEL BAHAN BAKU
CREATE TABLE IF NOT EXISTS public.bahan_baku (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama TEXT NOT NULL,
    satuan_terkecil TEXT NOT NULL CHECK (satuan_terkecil IN ('gram', 'ml', 'pcs')),
    harga_per_satuan_terkecil NUMERIC NOT NULL CHECK (harga_per_satuan_terkecil >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABEL RESEP (KOMPOSISI BAHAN BAKU PER 1 UNIT PRODUK)
CREATE TABLE IF NOT EXISTS public.resep (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produk_id UUID NOT NULL REFERENCES public.produk(id) ON DELETE CASCADE,
    bahan_baku_id UUID NOT NULL REFERENCES public.bahan_baku(id) ON DELETE CASCADE,
    jumlah_terpakai NUMERIC NOT NULL CHECK (jumlah_terpakai > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_produk_bahan UNIQUE (produk_id, bahan_baku_id)
);

-- 6. TABEL TRANSAKSI
CREATE TABLE IF NOT EXISTS public.transaksi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kasir_id UUID NOT NULL REFERENCES public.profiles(id),
    tanggal TIMESTAMPTZ NOT NULL DEFAULT now(),
    total INTEGER NOT NULL CHECK (total >= 0),
    metode_bayar TEXT NOT NULL CHECK (metode_bayar IN ('tunai', 'qris', 'transfer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABEL TRANSAKSI_ITEM
CREATE TABLE IF NOT EXISTS public.transaksi_item (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaksi_id UUID NOT NULL REFERENCES public.transaksi(id) ON DELETE CASCADE,
    produk_id UUID NOT NULL REFERENCES public.produk(id),
    qty INTEGER NOT NULL CHECK (qty > 0),
    harga_saat_jual INTEGER NOT NULL CHECK (harga_saat_jual >= 0),
    hpp_saat_jual INTEGER NOT NULL DEFAULT 0 CHECK (hpp_saat_jual >= 0),
    subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TABEL PENGELUARAN
CREATE TABLE IF NOT EXISTS public.pengeluaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tanggal TIMESTAMPTZ NOT NULL DEFAULT now(),
    kategori TEXT NOT NULL CHECK (kategori IN ('bahan baku', 'gas', 'kemasan', 'sewa', 'lainnya')),
    jumlah INTEGER NOT NULL CHECK (jumlah >= 0),
    keterangan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ==============================================================================
-- FUNGSI & TRIGGER HELPER UNTUK PROFILES & ROLES
-- ==============================================================================

-- Fungsi cek apakah pengguna saat ini adalah 'owner'
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner' AND status_aktif = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger membuat profile otomatis saat user baru mendaftar di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, email, role, status_aktif)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'pegawai'),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Aktifkan RLS di semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengeluaran ENABLE ROW LEVEL SECURITY;

-- 1. POLICIES UNTUK PROFILES
CREATE POLICY "Owner dapat melihat semua profil"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_owner() OR id = auth.uid());

CREATE POLICY "Owner dapat mengelola semua profil"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_owner());

-- 2. POLICIES UNTUK PRODUK
CREATE POLICY "Pegawai dan Owner dapat membaca katalog produk"
  ON public.produk FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Hanya Owner yang dapat mengubah data produk"
  ON public.produk FOR ALL
  TO authenticated
  USING (public.is_owner());

-- 3. POLICIES UNTUK TRANSAKSI
CREATE POLICY "Pegawai hanya bisa melihat transaksi miliknya, Owner melihat semua"
  ON public.transaksi FOR SELECT
  TO authenticated
  USING (public.is_owner() OR kasir_id = auth.uid());

CREATE POLICY "Kasir terdaftar dan aktif dapat membuat transaksi baru"
  ON public.transaksi FOR INSERT
  TO authenticated
  WITH CHECK (kasir_id = auth.uid());

CREATE POLICY "Hanya Owner yang dapat mengubah atau menghapus transaksi"
  ON public.transaksi FOR UPDATE
  TO authenticated
  USING (public.is_owner());

CREATE POLICY "Hanya Owner yang dapat menghapus transaksi"
  ON public.transaksi FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- 4. POLICIES UNTUK TRANSAKSI_ITEM
CREATE POLICY "Pegawai melihat item transaksi miliknya, Owner melihat semua item"
  ON public.transaksi_item FOR SELECT
  TO authenticated
  USING (
    public.is_owner() OR EXISTS (
      SELECT 1 FROM public.transaksi
      WHERE public.transaksi.id = public.transaksi_item.transaksi_id
      AND public.transaksi.kasir_id = auth.uid()
    )
  );

CREATE POLICY "Kasir dapat menambah item transaksi miliknya"
  ON public.transaksi_item FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transaksi
      WHERE public.transaksi.id = public.transaksi_item.transaksi_id
      AND public.transaksi.kasir_id = auth.uid()
    )
  );

CREATE POLICY "Hanya Owner yang dapat mengubah atau menghapus transaksi item"
  ON public.transaksi_item FOR ALL
  TO authenticated
  USING (public.is_owner());

-- 5. POLICIES UNTUK PENGELUARAN
CREATE POLICY "Hanya Owner yang dapat mengakses pengeluaran"
  ON public.pengeluaran FOR ALL
  TO authenticated
  USING (public.is_owner());

-- 6. POLICIES UNTUK BAHAN BAKU & RESEP
ALTER TABLE public.bahan_baku ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resep ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hanya Owner yang dapat mengelola bahan baku"
  ON public.bahan_baku FOR ALL
  TO authenticated
  USING (public.is_owner());

CREATE POLICY "Hanya Owner yang dapat mengelola resep"
  ON public.resep FOR ALL
  TO authenticated
  USING (public.is_owner());

-- ==============================================================================
-- FUNGSI & TRIGGER PERHITUNGAN HPP DINAMIS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.recalculate_produk_hpp()
RETURNS TRIGGER AS $$
DECLARE
  target_produk_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'resep' THEN
    target_produk_id := COALESCE(NEW.produk_id, OLD.produk_id);
    
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

DROP TRIGGER IF EXISTS trg_resep_update_hpp ON public.resep;
CREATE TRIGGER trg_resep_update_hpp
  AFTER INSERT OR UPDATE OR DELETE ON public.resep
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_produk_hpp();

DROP TRIGGER IF EXISTS trg_bahan_baku_update_hpp ON public.bahan_baku;
CREATE TRIGGER trg_bahan_baku_update_hpp
  AFTER UPDATE OF harga_per_satuan_terkecil ON public.bahan_baku
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_produk_hpp();

-- ==============================================================================
-- STORAGE BUCKET UNTUK FOTO PRODUK
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('produk-foto', 'produk-foto', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Foto produk dapat dilihat secara publik"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'produk-foto');

CREATE POLICY "Hanya Owner yang dapat upload & kelola foto produk"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'produk-foto' AND public.is_owner());

