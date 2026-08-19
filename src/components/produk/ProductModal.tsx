"use client";

import React, { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Produk } from "@/types/database";
import { formatRupiah, parseRupiah } from "@/lib/utils";
import {
  X,
  Upload,
  Image as ImageIcon,
  TrendingUp,
  Package,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: Produk | null;
}

const DEFAULT_CATEGORIES = [
  "Gorengan",
  "Kue Basah",
  "Keripik & Kerupuk",
  "Minuman",
  "Dimsum & Frozen",
  "Roti & Bolu",
  "Lainnya",
];

// Inner Form component with clean state initialization via key
function ProductFormContent({
  productToEdit,
  onClose,
  onSuccess,
}: {
  productToEdit?: Produk | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const isEditing = Boolean(productToEdit);

  // Initialize initial states directly from props
  const [nama, setNama] = useState(() => productToEdit?.nama || "");
  const [kategori, setKategori] = useState(() => {
    if (!productToEdit) return "Gorengan";
    return DEFAULT_CATEGORIES.includes(productToEdit.kategori)
      ? productToEdit.kategori
      : "Lainnya";
  });
  const [customKategori, setCustomKategori] = useState(() => {
    if (!productToEdit) return "";
    return DEFAULT_CATEGORIES.includes(productToEdit.kategori)
      ? ""
      : productToEdit.kategori;
  });
  const [hargaJualStr, setHargaJualStr] = useState(() =>
    productToEdit ? productToEdit.harga_jual.toString() : ""
  );
  const [hargaModalStr, setHargaModalStr] = useState(() =>
    productToEdit ? productToEdit.harga_modal.toString() : ""
  );
  const [stokStr, setStokStr] = useState(() =>
    productToEdit ? productToEdit.stok.toString() : "20"
  );
  const [fotoUrl, setFotoUrl] = useState<string | null>(() => productToEdit?.foto_url || null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => productToEdit?.foto_url || null);

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Real-time calculations
  const hargaJual = parseRupiah(hargaJualStr);
  const hargaModal = parseRupiah(hargaModalStr);
  const stok = parseInt(stokStr, 10) || 0;
  const labaPerItem = hargaJual - hargaModal;
  const marginPercent = hargaJual > 0 ? Math.round((labaPerItem / hargaJual) * 100) : 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 3 * 1024 * 1024) {
        setErrorMsg("Ukuran foto maksimal 3MB.");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nama.trim()) {
      setErrorMsg("Nama produk wajib diisi.");
      return;
    }

    if (hargaJual <= 0) {
      setErrorMsg("Harga jual harus lebih dari Rp 0.");
      return;
    }

    if (hargaModal < 0) {
      setErrorMsg("Harga modal tidak boleh negatif.");
      return;
    }

    const finalKategori =
      kategori === "Lainnya" && customKategori.trim()
        ? customKategori.trim()
        : kategori;

    setLoading(true);

    try {
      let finalFotoUrl = fotoUrl;

      // Upload file to Supabase Storage jika ada file baru yang dipilih
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop() || "jpg";
        const uniqueToken = crypto.randomUUID();
        const filePath = `produk-${uniqueToken}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("produk-foto")
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Gagal upload foto: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("produk-foto")
          .getPublicUrl(filePath);

        finalFotoUrl = publicUrlData.publicUrl;
      }

      if (isEditing && productToEdit) {
        // UPDATE PRODUK
        const { error: updateError } = await supabase
          .from("produk")
          .update({
            nama: nama.trim(),
            kategori: finalKategori,
            harga_jual: hargaJual,
            harga_modal: hargaModal,
            stok: stok,
            foto_url: finalFotoUrl,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", productToEdit.id);

        if (updateError) throw updateError;
      } else {
        // INSERT PRODUK BARU
        const { error: insertError } = await supabase.from("produk").insert({
          nama: nama.trim(),
          kategori: finalKategori,
          harga_jual: hargaJual,
          harga_modal: hargaModal,
          stok: stok,
          foto_url: finalFotoUrl,
        } as never);

        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Error saving product:", err);
      const message = err instanceof Error ? err.message : "Gagal menyimpan produk.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-[#d62934]/10 border border-[#d62934]/30 flex items-start gap-2.5 text-xs text-[#81181f]">
          <AlertCircle className="w-4 h-4 text-[#d62934] shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Foto Produk */}
      <div>
        <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-2">
          Foto Produk Jajanan
        </label>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-2xl bg-[#efe6e6] border-2 border-dashed border-[#d59a9e] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-[#d59a9e]" />
            )}
          </div>

          <div className="flex-1 space-y-1.5">
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#efe6e6] hover:bg-[#d59a9e]/30 text-[#81181f] text-xs font-bold border border-[#d59a9e]/50 cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5" />
              <span>{previewUrl ? "Ganti Foto" : "Pilih Foto Produk"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {previewUrl && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setFotoUrl(null);
                }}
                className="block text-[11px] text-[#d62934] font-semibold hover:underline cursor-pointer"
              >
                Hapus Foto
              </button>
            )}
            <p className="text-[11px] text-zinc-400">
              Format JPG, PNG, atau WebP (Maks. 3MB)
            </p>
          </div>
        </div>
      </div>

      {/* 2. Nama Produk */}
      <div>
        <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
          Nama Jajanan / Produk *
        </label>
        <input
          type="text"
          required
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Contoh: Risoles Mayo Spesial"
          className="input-field"
        />
      </div>

      {/* 3. Kategori */}
      <div>
        <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
          Kategori Jajanan
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
          {DEFAULT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setKategori(cat)}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                kategori === cat
                  ? "bg-[#d62934] text-white border-[#d62934] shadow-xs"
                  : "bg-[#efe6e6]/50 text-[#81181f] border-[#d59a9e]/40 hover:bg-[#efe6e6]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {kategori === "Lainnya" && (
          <input
            type="text"
            value={customKategori}
            onChange={(e) => setCustomKategori(e.target.value)}
            placeholder="Tulis nama kategori kustom..."
            className="input-field mt-2"
          />
        )}
      </div>

      {/* 4. Harga Jual & Modal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
            Harga Jual (Rp) *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={hargaJualStr ? formatRupiah(hargaJual) : ""}
              onChange={(e) => setHargaJualStr(e.target.value)}
              placeholder="Rp 0"
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
            Harga Modal (Rp) *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={hargaModalStr ? formatRupiah(hargaModal) : ""}
              onChange={(e) => setHargaModalStr(e.target.value)}
              placeholder="Rp 0"
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Live Profit Insight Card */}
      <div className="p-3.5 rounded-2xl bg-[#efe6e6]/60 border border-[#d59a9e]/40 grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-zinc-500 block">Estimasi Laba / Porsi:</span>
          <span
            className={`font-extrabold text-sm ${
              labaPerItem >= 0 ? "text-[#0c6b57]" : "text-[#d62934]"
            }`}
          >
            {formatRupiah(labaPerItem)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-zinc-500 block">Margin Keuntungan:</span>
          <span
            className={`inline-flex items-center gap-1 font-extrabold text-sm ${
              marginPercent >= 0 ? "text-[#0c6b57]" : "text-[#d62934]"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            {marginPercent}%
          </span>
        </div>
      </div>

      {/* 5. Stok Jajanan */}
      <div>
        <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
          Stok Tersedia (Porsi / Pcs) *
        </label>
        <input
          type="number"
          min="0"
          required
          value={stokStr}
          onChange={(e) => setStokStr(e.target.value)}
          placeholder="0"
          className="input-field"
        />
      </div>

      {/* Modal Actions */}
      <div className="pt-4 border-t border-[#efe6e6] flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white text-xs font-bold shadow-md shadow-[#d62934]/25 hover:opacity-95 active:scale-98 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? "Simpan Perubahan" : "Tambah Produk"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function ProductModal({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
}: ProductModalProps) {
  if (!isOpen) return null;

  const isEditing = Boolean(productToEdit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-[#d59a9e]/40 shadow-2xl max-w-lg w-full overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-[#81181f] to-[#d62934] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Package className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-extrabold text-base tracking-tight">
              {isEditing ? "Edit Data Jajanan" : "Tambah Produk Jajanan"}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form keyed by edit ID to cleanly initialize state without effects */}
        <ProductFormContent
          key={productToEdit?.id || "new-product"}
          productToEdit={productToEdit}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  );
}
