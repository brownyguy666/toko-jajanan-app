-- ==============================================================================
-- MIGRATION: FITUR STOK MINIMUM PRODUK
-- ==============================================================================

-- 1. TAMBAH KOLOM STOK_MINIMUM DI TABEL PRODUK (DEFAULT: 5)
ALTER TABLE public.produk
ADD COLUMN IF NOT EXISTS stok_minimum INTEGER NOT NULL DEFAULT 5 CHECK (stok_minimum >= 0);
