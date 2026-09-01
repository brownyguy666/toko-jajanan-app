-- ==============================================================================
-- MIGRATION: FITUR BUKU RESEP & CATATAN MENU JAJANAN
-- ==============================================================================

-- 1. TAMBAH KOLOM PANDUAN RESEP & CARA MEMBUAT DI TABEL PRODUK
ALTER TABLE public.produk
ADD COLUMN IF NOT EXISTS langkah_pembuatan TEXT,
ADD COLUMN IF NOT EXISTS catatan_resep TEXT,
ADD COLUMN IF NOT EXISTS porsi_standar INTEGER NOT NULL DEFAULT 1 CHECK (porsi_standar > 0),
ADD COLUMN IF NOT EXISTS durasi_menit INTEGER NOT NULL DEFAULT 30 CHECK (durasi_menit >= 0);
