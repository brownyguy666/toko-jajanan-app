"use client";

import React, { useState } from "react";
import { BahanBaku, SatuanTerkecil } from "@/types/database";
import { formatRupiah, parseRupiah } from "@/lib/utils";
import {
  X,
  Calculator,
  Check,
  Wheat,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

interface BahanBakuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bahanToEdit?: BahanBaku | null;
  onSubmitAction: (payload: {
    nama: string;
    satuan_terkecil: SatuanTerkecil;
    harga_per_satuan_terkecil: number;
  }) => Promise<{ success: boolean; error?: string }>;
}

const UNIT_CONVERSION_PRESETS: Record<
  SatuanTerkecil,
  { label: string; factor: number; desc: string }[]
> = {
  gram: [
    { label: "Kilogram (kg)", factor: 1000, desc: "1 kg = 1.000 gram" },
    { label: "Karung 25 kg", factor: 25000, desc: "1 karung = 25.000 gram" },
    { label: "Karung 50 kg", factor: 50000, desc: "1 karung = 50.000 gram" },
    { label: "Bungkus 500 gram", factor: 500, desc: "1 bungkus = 500 gram" },
    { label: "Bungkus 250 gram", factor: 250, desc: "1 bungkus = 250 gram" },
    { label: "Gram langsung", factor: 1, desc: "1 gram" },
  ],
  ml: [
    { label: "Liter (L)", factor: 1000, desc: "1 Liter = 1.000 ml" },
    { label: "Jerigen 5 Liter", factor: 5000, desc: "1 jerigen = 5.000 ml" },
    { label: "Pouch 2 Liter", factor: 2000, desc: "1 pouch = 2.000 ml" },
    { label: "Botol 1 Liter", factor: 1000, desc: "1 botol = 1.000 ml" },
    { label: "Botol 500 ml", factor: 500, desc: "1 botol = 500 ml" },
    { label: "Mililiter langsung", factor: 1, desc: "1 ml" },
  ],
  pcs: [
    { label: "Pcs / Butir / Buah", factor: 1, desc: "1 pcs" },
    { label: "Dus isi 100 pcs", factor: 100, desc: "1 dus = 100 pcs" },
    { label: "Dus isi 50 pcs", factor: 50, desc: "1 dus = 50 pcs" },
    { label: "Pak isi 24 pcs", factor: 24, desc: "1 pak = 24 pcs" },
    { label: "Lusin (12 pcs)", factor: 12, desc: "1 lusin = 12 pcs" },
    { label: "Ikat isi 10 pcs", factor: 10, desc: "1 ikat = 10 pcs" },
  ],
};

export function BahanBakuModal({
  isOpen,
  onClose,
  onSuccess,
  bahanToEdit,
  onSubmitAction,
}: BahanBakuModalProps) {
  if (!isOpen) return null;

  const isEditing = Boolean(bahanToEdit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-[#d59a9e]/40 shadow-2xl max-w-lg w-full overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-[#81181f] to-[#d62934] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Wheat className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-extrabold text-base tracking-tight">
              {isEditing ? "Edit Data Bahan Baku" : "Tambah Bahan Baku Baru"}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <BahanBakuFormContent
          key={bahanToEdit?.id || "new-bahan"}
          bahanToEdit={bahanToEdit}
          onClose={onClose}
          onSuccess={onSuccess}
          onSubmitAction={onSubmitAction}
        />
      </div>
    </div>
  );
}

function BahanBakuFormContent({
  bahanToEdit,
  onClose,
  onSuccess,
  onSubmitAction,
}: {
  bahanToEdit?: BahanBaku | null;
  onClose: () => void;
  onSuccess: () => void;
  onSubmitAction: BahanBakuModalProps["onSubmitAction"];
}) {
  const isEditing = Boolean(bahanToEdit);
  const [nama, setNama] = useState(() => bahanToEdit?.nama || "");
  const [satuan, setSatuan] = useState<SatuanTerkecil>(
    () => bahanToEdit?.satuan_terkecil || "gram"
  );

  const [hargaSatuan, setHargaSatuan] = useState<number>(() =>
    bahanToEdit ? Number(bahanToEdit.harga_per_satuan_terkecil) : 0
  );
  const [hargaInputStr, setHargaInputStr] = useState<string>(() =>
    bahanToEdit ? Number(bahanToEdit.harga_per_satuan_terkecil).toString() : ""
  );

  // Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcPresetIndex, setCalcPresetIndex] = useState(0);
  const [calcQtyStr, setCalcQtyStr] = useState("1");
  const [calcPriceStr, setCalcPriceStr] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Unit conversion presets for current base unit
  const currentPresets = UNIT_CONVERSION_PRESETS[satuan];
  const selectedPreset = currentPresets[calcPresetIndex] || currentPresets[0];

  const calcQty = Math.max(1, parseFloat(calcQtyStr) || 1);
  const calcPrice = parseRupiah(calcPriceStr);
  const totalBaseUnits = calcQty * (selectedPreset?.factor || 1);
  const calculatedUnitPrice = totalBaseUnits > 0 ? calcPrice / totalBaseUnits : 0;

  const handleApplyConversion = () => {
    if (calculatedUnitPrice <= 0) return;
    const rounded = Math.round(calculatedUnitPrice * 100) / 100;
    setHargaSatuan(rounded);
    setHargaInputStr(rounded.toString());
    setShowCalculator(false);
  };

  const handleManualPriceChange = (val: string) => {
    setHargaInputStr(val);
    const parsed = parseRupiah(val);
    setHargaSatuan(parsed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nama.trim()) {
      setErrorMsg("Nama bahan baku wajib diisi.");
      return;
    }

    if (hargaSatuan <= 0) {
      setErrorMsg("Harga per satuan terkecil harus lebih dari Rp 0.");
      return;
    }

    setLoading(true);
    try {
      const res = await onSubmitAction({
        nama: nama.trim(),
        satuan_terkecil: satuan,
        harga_per_satuan_terkecil: hargaSatuan,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal menyimpan bahan baku.");
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
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

      {/* 1. Nama Bahan Baku */}
      <div>
        <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
          Nama Bahan Baku *
        </label>
        <input
          type="text"
          required
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Contoh: Tepung Terigu, Minyak Goreng, Telur Ayam"
          className="input-field"
        />
      </div>

      {/* 2. Satuan Terkecil */}
      <div>
        <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
          Satuan Terkecil (Porsi Resep) *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["gram", "ml", "pcs"] as SatuanTerkecil[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSatuan(s);
                setCalcPresetIndex(0);
              }}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                satuan === s
                  ? "bg-[#d62934] text-white border-[#d62934] shadow-xs"
                  : "bg-[#efe6e6]/60 text-[#81181f] border-[#d59a9e]/40 hover:bg-[#efe6e6]"
              }`}
            >
              <span className="capitalize">{s}</span>
              <span className={`text-[10px] font-normal ${satuan === s ? "text-white/80" : "text-zinc-500"}`}>
                {s === "gram" ? "Berat" : s === "ml" ? "Volume" : "Satuan Biji"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Harga per Satuan Terkecil */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-[#81181f] uppercase tracking-wider">
            Harga per 1 {satuan.toUpperCase()} (Rp) *
          </label>

          <button
            type="button"
            onClick={() => setShowCalculator(!showCalculator)}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#d62934] hover:underline cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{showCalculator ? "Tutup Kalkulator" : "Kalkulator Konversi"}</span>
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            required
            value={hargaInputStr ? (isNaN(Number(hargaInputStr)) ? hargaInputStr : formatRupiah(Number(hargaInputStr))) : ""}
            onChange={(e) => handleManualPriceChange(e.target.value)}
            placeholder={`Contoh: Rp 12 / ${satuan}`}
            className="input-field"
          />
        </div>
        <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
          <HelpCircle className="w-3 h-3" />
          <span>Contoh: Jika beli tepung Rp 12.000 per 1 kg (1.000g), maka harga = <strong>Rp 12 / gram</strong>.</span>
        </p>
      </div>

      {/* 4. Interactive Unit Conversion Calculator */}
      {showCalculator && (
        <div className="p-4 rounded-3xl bg-[#efe6e6]/70 border-2 border-dashed border-[#d59a9e]/60 space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#81181f]">
            <Sparkles className="w-4 h-4 text-[#d62934]" />
            <span>Kalkulator Bantu Konversi Pembelian Bahan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {/* Kemasan Pembelian */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                Kemasan Beli
              </label>
              <select
                value={calcPresetIndex}
                onChange={(e) => setCalcPresetIndex(parseInt(e.target.value, 10))}
                className="input-field text-xs py-2"
              >
                {currentPresets.map((p, idx) => (
                  <option key={idx} value={idx}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Jumlah Kemasan */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                Jumlah Kemasan Beli
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={calcQtyStr}
                onChange={(e) => setCalcQtyStr(e.target.value)}
                placeholder="1"
                className="input-field text-xs py-2"
              />
            </div>
          </div>

          {/* Total Harga Beli */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 mb-1">
              Total Harga Beli Kemasan (Rp)
            </label>
            <input
              type="text"
              value={calcPriceStr ? formatRupiah(calcPrice) : ""}
              onChange={(e) => setCalcPriceStr(e.target.value)}
              placeholder="Contoh: Rp 300.000"
              className="input-field text-xs py-2"
            />
          </div>

          {/* Hasil Kalkulasi Konversi */}
          {calcPrice > 0 && (
            <div className="p-3 rounded-2xl bg-white border border-[#d59a9e]/40 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xs">
              <div>
                <span className="text-[10px] text-zinc-500 block">Hasil Konversi Satuan:</span>
                <span className="text-sm font-extrabold text-[#0c6b57]">
                  {formatRupiah(calculatedUnitPrice)} / {satuan}
                </span>
                <span className="text-[10px] text-zinc-400 block">
                  ({formatRupiah(calcPrice)} ÷ {totalBaseUnits.toLocaleString("id-ID")} {satuan})
                </span>
              </div>

              <button
                type="button"
                onClick={handleApplyConversion}
                className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-[#47d1b5] hover:bg-[#3ec4a9] text-[#0c4a3c] font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Gunakan Hasil Ini</span>
              </button>
            </div>
          )}
        </div>
      )}

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
              <span>{isEditing ? "Simpan Perubahan" : "Tambah Bahan"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
