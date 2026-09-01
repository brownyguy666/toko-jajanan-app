"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Produk, BahanBaku, Resep } from "@/types/database";
import { formatRupiah, parseRupiah } from "@/lib/utils";
import {
  X,
  Upload,
  Image as ImageIcon,
  TrendingUp,
  Package,
  AlertCircle,
  CheckCircle2,
  Wheat,
  Plus,
  Trash2,
  Sparkles,
  Info,
  ChefHat,
  Clock,
  UtensilsCrossed,
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

interface RecipeRowState {
  bahan_baku_id: string;
  jumlah_terpakai: number;
}

// Inner Form component with clean state initialization via key
function ProductFormContent({
  productToEdit,
  onClose,
  onSuccess,
  bahanBakuList,
}: {
  productToEdit?: Produk | null;
  onClose: () => void;
  onSuccess: () => void;
  bahanBakuList: BahanBaku[];
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
    productToEdit
      ? (productToEdit.hpp_terkini || productToEdit.harga_modal || 0).toString()
      : ""
  );
  const [stokStr, setStokStr] = useState(() =>
    productToEdit ? productToEdit.stok.toString() : "20"
  );
  const [stokMinimumStr, setStokMinimumStr] = useState(() =>
    productToEdit?.stok_minimum !== undefined
      ? productToEdit.stok_minimum.toString()
      : "5"
  );
  const [fotoUrl, setFotoUrl] = useState<string | null>(() => productToEdit?.foto_url || null);

  // Recipe steps & notes state
  const [langkahPembuatan, setLangkahPembuatan] = useState(() => productToEdit?.langkah_pembuatan || "");
  const [catatanResep, setCatatanResep] = useState(() => productToEdit?.catatan_resep || "");
  const [durasiMenitStr, setDurasiMenitStr] = useState(() =>
    productToEdit?.durasi_menit ? productToEdit.durasi_menit.toString() : "30"
  );
  const [porsiStandarStr, setPorsiStandarStr] = useState(() =>
    productToEdit?.porsi_standar ? productToEdit.porsi_standar.toString() : "1"
  );

  // Recipe rows state
  const [recipeRows, setRecipeRows] = useState<RecipeRowState[]>([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);


  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => productToEdit?.foto_url || null);

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch existing recipe if editing
  useEffect(() => {
    let isMounted = true;
    if (productToEdit?.id) {
      setLoadingRecipe(true);
      supabase
        .from("resep")
        .select("bahan_baku_id, jumlah_terpakai")
        .eq("produk_id", productToEdit.id)
        .then(({ data, error }) => {
          if (isMounted) {
            if (!error && data) {
              const rows = data as unknown as { bahan_baku_id: string; jumlah_terpakai: number }[];
              setRecipeRows(
                rows.map((r) => ({
                  bahan_baku_id: r.bahan_baku_id,
                  jumlah_terpakai: Number(r.jumlah_terpakai),
                }))
              );
            }
            setLoadingRecipe(false);
          }

        });
    }
    return () => {
      isMounted = false;
    };
  }, [productToEdit?.id, supabase]);

  // Bahan baku lookup map
  const bahanMap = new Map<string, BahanBaku>(bahanBakuList.map((b) => [b.id, b]));

  // Calculate live recipe HPP
  const hasRecipe = recipeRows.length > 0;
  const calculatedRecipeHpp = recipeRows.reduce((sum, row) => {
    const bahan = bahanMap.get(row.bahan_baku_id);
    if (!bahan) return sum;
    return sum + (row.jumlah_terpakai * Number(bahan.harga_per_satuan_terkecil) || 0);
  }, 0);

  const effectiveHpp = hasRecipe
    ? Math.round(calculatedRecipeHpp)
    : parseRupiah(hargaModalStr);

  const hargaJual = parseRupiah(hargaJualStr);
  const stok = parseInt(stokStr, 10) || 0;
  const labaPerItem = hargaJual - effectiveHpp;
  const marginPercent = hargaJual > 0 ? Math.round((labaPerItem / hargaJual) * 100) : 0;

  // Recipe row operations
  const handleAddRecipeRow = () => {
    const availableBahan = bahanBakuList.find(
      (b) => !recipeRows.some((r) => r.bahan_baku_id === b.id)
    );
    if (!availableBahan) return;

    setRecipeRows((prev) => [
      ...prev,
      {
        bahan_baku_id: availableBahan.id,
        jumlah_terpakai: availableBahan.satuan_terkecil === "pcs" ? 1 : 10,
      },
    ]);
  };

  const handleUpdateRecipeRow = (
    index: number,
    field: "bahan_baku_id" | "jumlah_terpakai",
    value: string | number
  ) => {
    setRecipeRows((prev) => {
      const next = [...prev];
      if (field === "bahan_baku_id") {
        next[index] = { ...next[index], bahan_baku_id: value as string };
      } else {
        next[index] = {
          ...next[index],
          jumlah_terpakai: Math.max(0.01, Number(value) || 0),
        };
      }
      return next;
    });
  };

  const handleRemoveRecipeRow = (index: number) => {
    setRecipeRows((prev) => prev.filter((_, i) => i !== index));
  };

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

    if (effectiveHpp < 0) {
      setErrorMsg("HPP / Modal tidak boleh negatif.");
      return;
    }

    const finalKategori =
      kategori === "Lainnya" && customKategori.trim()
        ? customKategori.trim()
        : kategori;

    const stokMinimum = Math.max(0, parseInt(stokMinimumStr, 10) || 5);
    const durasiMenit = Math.max(1, parseInt(durasiMenitStr, 10) || 30);
    const porsiStandar = Math.max(1, parseInt(porsiStandarStr, 10) || 1);

    setLoading(true);

    try {
      let finalFotoUrl = fotoUrl;

      // Upload file to Supabase Storage jika ada file baru
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

      let targetProductId = productToEdit?.id;

      if (isEditing && targetProductId) {
        // UPDATE PRODUK
        const { error: updateError } = await supabase
          .from("produk")
          .update({
            nama: nama.trim(),
            kategori: finalKategori,
            harga_jual: hargaJual,
            harga_modal: effectiveHpp,
            hpp_terkini: effectiveHpp,
            stok: stok,
            stok_minimum: stokMinimum,
            langkah_pembuatan: langkahPembuatan.trim() || null,
            catatan_resep: catatanResep.trim() || null,
            durasi_menit: durasiMenit,
            porsi_standar: porsiStandar,
            foto_url: finalFotoUrl,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", targetProductId);

        if (updateError) throw updateError;
      } else {
        // INSERT PRODUK BARU
        const { data: newProd, error: insertError } = await supabase
          .from("produk")
          .insert({
            nama: nama.trim(),
            kategori: finalKategori,
            harga_jual: hargaJual,
            harga_modal: effectiveHpp,
            hpp_terkini: effectiveHpp,
            stok: stok,
            stok_minimum: stokMinimum,
            langkah_pembuatan: langkahPembuatan.trim() || null,
            catatan_resep: catatanResep.trim() || null,
            durasi_menit: durasiMenit,
            porsi_standar: porsiStandar,
            foto_url: finalFotoUrl,
          } as never)
          .select("id")
          .single();

        if (insertError || !newProd) throw insertError;
        targetProductId = (newProd as { id: string }).id;
      }



      // SYNC RESEP ITEMS
      if (targetProductId) {
        // 1. Hapus resep lama
        await supabase.from("resep").delete().eq("produk_id", targetProductId);

        // 2. Insert resep baru jika ada
        if (recipeRows.length > 0) {
          const resepToInsert = recipeRows.map((r) => ({
            produk_id: targetProductId,
            bahan_baku_id: r.bahan_baku_id,
            jumlah_terpakai: r.jumlah_terpakai,
          }));

          const { error: resepErr } = await supabase
            .from("resep")
            .insert(resepToInsert as never);

          if (resepErr) {
            console.warn("Recipe insert notice:", resepErr.message);
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Error saving product & recipe:", err);
      const message = err instanceof Error ? err.message : "Gagal menyimpan produk.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
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

      {/* 4. SEKSI RESEP & BAHAN BAKU (HPP OTOMATIS) */}
      <div className="p-4 rounded-3xl bg-[#efe6e6]/70 border border-[#d59a9e]/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wheat className="w-4 h-4 text-[#d62934]" />
            <span className="text-xs font-extrabold text-[#81181f] uppercase tracking-wider">
              Komposisi Resep (HPP Otomatis)
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddRecipeRow}
            disabled={bahanBakuList.length === 0}
            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#d62934] hover:underline disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Bahan</span>
          </button>
        </div>

        {bahanBakuList.length === 0 ? (
          <div className="p-3 bg-white/80 rounded-2xl border border-[#d59a9e]/30 text-center">
            <p className="text-xs text-zinc-500">
              Belum ada bahan baku di database. Anda bisa menambahkan bahan baku di menu{" "}
              <strong>Kelola Bahan Baku</strong> untuk perhitungan HPP otomatis.
            </p>
          </div>
        ) : loadingRecipe ? (
          <p className="text-xs text-zinc-500 py-2 text-center">Memuat resep produk...</p>
        ) : recipeRows.length === 0 ? (
          <div className="p-3 bg-white/80 rounded-2xl border border-[#d59a9e]/30 flex items-center justify-between gap-2 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#d59a9e]" />
              <span>Belum menyusun resep bahan baku untuk produk ini.</span>
            </span>
            <button
              type="button"
              onClick={handleAddRecipeRow}
              className="px-2.5 py-1 rounded-xl bg-[#d62934] text-white font-bold text-[11px]"
            >
              + Susun Resep
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recipeRows.map((row, idx) => {
              const selectedBahan = bahanMap.get(row.bahan_baku_id);
              const subtotalBahan =
                selectedBahan && row.jumlah_terpakai
                  ? row.jumlah_terpakai * Number(selectedBahan.harga_per_satuan_terkecil)
                  : 0;

              return (
                <div
                  key={idx}
                  className="p-2.5 bg-white rounded-2xl border border-[#d59a9e]/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs shadow-2xs"
                >
                  {/* Select Bahan */}
                  <div className="flex-1">
                    <select
                      value={row.bahan_baku_id}
                      onChange={(e) =>
                        handleUpdateRecipeRow(idx, "bahan_baku_id", e.target.value)
                      }
                      className="input-field text-xs py-1.5"
                    >
                      {bahanBakuList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nama} ({formatRupiah(b.harga_per_satuan_terkecil)}/{b.satuan_terkecil})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Input Qty */}
                  <div className="flex items-center gap-1.5 w-full sm:w-44">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={row.jumlah_terpakai}
                      onChange={(e) =>
                        handleUpdateRecipeRow(idx, "jumlah_terpakai", e.target.value)
                      }
                      placeholder="Qty"
                      className="input-field text-xs py-1.5 text-right w-20"
                    />
                    <span className="text-[11px] font-bold text-zinc-500 w-12 truncate">
                      {selectedBahan?.satuan_terkecil || ""}
                    </span>
                    <span className="text-xs font-extrabold text-[#81181f] w-16 text-right truncate">
                      {formatRupiah(subtotalBahan)}
                    </span>
                  </div>

                  {/* Remove Row */}
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipeRow(idx)}
                    className="p-1 text-zinc-400 hover:text-red-600 transition-colors self-end sm:self-center cursor-pointer"
                    title="Hapus Bahan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {/* Total HPP Resep Indicator */}
            <div className="p-2.5 rounded-2xl bg-white border border-[#47d1b5]/60 flex items-center justify-between text-xs">
              <span className="font-bold text-[#0c6b57] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#47d1b5]" />
                <span>Total HPP Terkini (Resep):</span>
              </span>
              <span className="font-extrabold text-sm text-[#0c6b57]">
                {formatRupiah(calculatedRecipeHpp)} / porsi
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Harga Jual & Modal (Manual / Otomatis) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
            Harga Jual ke Pelanggan (Rp) *
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
            {hasRecipe ? "HPP Produk (Dari Resep)" : "Harga Modal Manual (Rp) *"}
          </label>
          <div className="relative">
            <input
              type="text"
              required
              disabled={hasRecipe}
              value={formatRupiah(effectiveHpp)}
              onChange={(e) => setHargaModalStr(e.target.value)}
              placeholder="Rp 0"
              className={`input-field ${hasRecipe ? "bg-zinc-100 font-bold text-zinc-700 cursor-not-allowed" : ""}`}
            />
          </div>
          {hasRecipe && (
            <span className="text-[10px] text-emerald-700 mt-1 block">
              ✓ Terhitung otomatis dari resep bahan di atas.
            </span>
          )}
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

      {/* 6. PANDUAN MEMASAK & CATATAN RESEP (BUKU RESEP) */}
      <div className="p-4 rounded-3xl bg-[#efe6e6]/60 border border-[#d59a9e]/40 space-y-3">
        <div className="flex items-center gap-2">
          <ChefHat className="w-4 h-4 text-[#d62934]" />
          <span className="text-xs font-extrabold text-[#81181f] uppercase tracking-wider">
            Panduan Memasak & Catatan Dapur (Opsional)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1 text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5 text-[#d62934]" />
              <span>Durasi Masak (Menit)</span>
            </label>
            <input
              type="number"
              min="1"
              value={durasiMenitStr}
              onChange={(e) => setDurasiMenitStr(e.target.value)}
              placeholder="30"
              className="input-field text-xs"
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1">
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#d62934]" />
              <span>Porsi Acuan Resep</span>
            </label>
            <input
              type="number"
              min="1"
              value={porsiStandarStr}
              onChange={(e) => setPorsiStandarStr(e.target.value)}
              placeholder="1"
              className="input-field text-xs"
            />
          </div>
        </div>


        <div>
          <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1">
            Langkah-Langkah Pembuatan / Cara Masak
          </label>
          <textarea
            rows={3}
            value={langkahPembuatan}
            onChange={(e) => setLangkahPembuatan(e.target.value)}
            placeholder="1. Siapkan adonan...&#10;2. Goreng dengan api sedang..."
            className="input-field text-xs leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1">
            Tips & Rahasia Bumbu Dapur
          </label>
          <textarea
            rows={2}
            value={catatanResep}
            onChange={(e) => setCatatanResep(e.target.value)}
            placeholder="Catatan bumbu khusus, suhu penggorengan, tips renyah..."
            className="input-field text-xs leading-relaxed"
          />
        </div>
      </div>

      {/* 7. Stok Jajanan & Stok Minimum Peringatan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <div>
          <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
            Stok Tersedia (Porsi) *
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

        <div>
          <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
            Batas Stok Minimum (Peringatan) *
          </label>
          <input
            type="number"
            min="0"
            required
            value={stokMinimumStr}
            onChange={(e) => setStokMinimumStr(e.target.value)}
            placeholder="5"
            className="input-field"
          />
          <span className="text-[10px] text-zinc-400 mt-1 block">
            Peringatan otomatis muncul jika stok ≤ batas ini.
          </span>
        </div>
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
              <span>{isEditing ? "Simpan Perubahan & Resep" : "Tambah Produk & Resep"}</span>
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
  const [bahanBakuList, setBahanBakuList] = useState<BahanBaku[]>([]);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      supabase
        .from("bahan_baku")
        .select("*")
        .order("nama", { ascending: true })
        .then(({ data }) => {
          if (isMounted && data) {
            setBahanBakuList(data as unknown as BahanBaku[]);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, supabase]);

  if (!isOpen) return null;

  const isEditing = Boolean(productToEdit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-[#d59a9e]/40 shadow-2xl max-w-xl w-full overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-[#81181f] to-[#d62934] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Package className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-extrabold text-base tracking-tight">
              {isEditing ? "Edit Data Jajanan & Resep" : "Tambah Produk Jajanan Baru"}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <ProductFormContent
          key={productToEdit?.id || "new-product"}
          productToEdit={productToEdit}
          onClose={onClose}
          onSuccess={onSuccess}
          bahanBakuList={bahanBakuList}
        />
      </div>
    </div>
  );
}
