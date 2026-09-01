"use client";

import React, { useState } from "react";
import { ProdukWithRecipeDetails, updateRecipeNotesAction } from "@/app/dashboard/resep/actions";
import {
  X,
  CheckCircle2,
  Clock,
  Scale,
  UtensilsCrossed,
  Sparkles,
  AlertCircle,
} from "lucide-react";


interface RecipeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: ProdukWithRecipeDetails | null;
}

export function RecipeEditorModal({
  isOpen,
  onClose,
  onSuccess,
  product,
}: RecipeEditorModalProps) {
  const [durasiMenit, setDurasiMenit] = useState<string>(() =>
    product?.durasi_menit ? product.durasi_menit.toString() : "30"
  );
  const [porsiStandar, setPorsiStandar] = useState<string>(() =>
    product?.porsi_standar ? product.porsi_standar.toString() : "1"
  );
  const [langkahPembuatan, setLangkahPembuatan] = useState<string>(
    () => product?.langkah_pembuatan || ""
  );
  const [catatanResep, setCatatanResep] = useState<string>(
    () => product?.catatan_resep || ""
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const res = await updateRecipeNotesAction(product.id, {
      durasi_menit: Math.max(1, parseInt(durasiMenit, 10) || 30),
      porsi_standar: Math.max(1, parseInt(porsiStandar, 10) || 1),
      langkah_pembuatan: langkahPembuatan.trim() || null,
      catatan_resep: catatanResep.trim() || null,
    });

    setLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || "Gagal menyimpan catatan resep.");
    }
  };

  const handleInsertSampleTemplate = () => {
    if (langkahPembuatan.trim() && !confirm("Ganti teks langkah memasak dengan contoh template?")) {
      return;
    }
    setLangkahPembuatan(
      "1. Siapkan dan timbang seluruh bahan baku sesuai takaran.\n" +
        "2. Campurkan bahan kering ke dalam wadah, lalu aduk hingga rata.\n" +
        "3. Tambahkan bahan cair perlahan-lahan sambil diuleni sampai kalis.\n" +
        "4. Bentuk adonan menjadi porsi kecil dan beri isian.\n" +
        "5. Panaskan minyak di wajan dengan api sedang (~170°C).\n" +
        "6. Goreng/kukus hingga matang keemasan, lalu tiriskan sebelum disajikan."
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-[#d59a9e]/40 shadow-2xl max-w-xl w-full overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-[#81181f] to-[#d62934] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base tracking-tight">
              Tulis Panduan Resep: {product.nama}
            </h3>
            <p className="text-[11px] text-white/80">
              Catatan cara memasak & bumbu rahasia dapur
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/15 hover:bg-black/25 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[#d62934]/10 border border-[#d62934]/30 flex items-start gap-2.5 text-xs text-[#81181f]">
              <AlertCircle className="w-4 h-4 text-[#d62934] shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Durasi & Porsi Acuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5 text-[#d62934]" />
                <span>Estimasi Durasi (Menit)</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={durasiMenit}
                onChange={(e) => setDurasiMenit(e.target.value)}
                placeholder="30"
                className="input-field text-xs sm:text-sm"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Total waktu persiapan & memasak
              </span>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1">
                <Scale className="w-3.5 h-3.5 text-[#d62934]" />
                <span>Porsi Acuan Resep Standar</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={porsiStandar}
                onChange={(e) => setPorsiStandar(e.target.value)}
                placeholder="1"
                className="input-field text-xs sm:text-sm"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Misal: 1 adonan menghasilkan 1 porsi (atau 30 pcs)
              </span>
            </div>
          </div>

          {/* Langkah-Langkah Pembuatan */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#81181f] uppercase tracking-wider">
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#d62934]" />
                <span>Langkah-Langkah Pembuatan / Cara Masak</span>
              </label>

              <button
                type="button"
                onClick={handleInsertSampleTemplate}
                className="text-[11px] text-[#d62934] font-bold hover:underline cursor-pointer"
              >
                + Gunakan Template Contoh
              </button>
            </div>

            <textarea
              rows={6}
              value={langkahPembuatan}
              onChange={(e) => setLangkahPembuatan(e.target.value)}
              placeholder="Tuliskan urutan cara memasak, satu langkah per baris:&#10;1. Campurkan tepung dan air...&#10;2. Tumis isian daging sampai harum...&#10;3. Gulung dengan kulit lumpia..."
              className="input-field text-xs sm:text-sm leading-relaxed"
            />
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Gunakan baris baru (Enter) untuk memisahkan tiap nomor urutan langkah.
            </span>
          </div>

          {/* Catatan Rahasia Dapur & Bumbu Khusus */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Tips & Rahasia Dapur (Catatan Bumbu Khusus)</span>
            </label>
            <textarea
              rows={3}
              value={catatanResep}
              onChange={(e) => setCatatanResep(e.target.value)}
              placeholder="Contoh: Gunakan api sedang saat menggoreng. Tambahkan 1/2 sdt vanili untuk aroma lebih harum. Simpan di chiller maks. 3 hari..."
              className="input-field text-xs sm:text-sm leading-relaxed"
            />
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Catatan penting untuk menjaga cita rasa dan kualitas jajanan.
            </span>
          </div>


          {/* Modal Actions */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2.5">
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
                  <span>Simpan Panduan Resep</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
