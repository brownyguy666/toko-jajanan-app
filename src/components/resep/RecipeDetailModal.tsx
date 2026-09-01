"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ProdukWithRecipeDetails } from "@/app/dashboard/resep/actions";
import { formatRupiah } from "@/lib/utils";
import {
  X,

  Printer,
  Edit3,
  Clock,
  UtensilsCrossed,
  Sparkles,
  Layers,
  Scale,
  CheckSquare,
  Square,
  ChefHat,
  Image as ImageIcon,
} from "lucide-react";


interface RecipeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProdukWithRecipeDetails | null;
  onEditClick: (product: ProdukWithRecipeDetails) => void;
}

export function RecipeDetailModal({
  isOpen,
  onClose,
  product,
  onEditClick,
}: RecipeDetailModalProps) {
  // Batch portion scaling state
  const standardYield = Math.max(1, product?.porsi_standar || 1);
  const [targetPortion, setTargetPortion] = useState<number>(() => standardYield);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  if (!isOpen || !product) return null;

  // Multiplier for scaling batch
  const multiplier = Math.max(0.1, targetPortion / standardYield);
  const effectiveHpp = product.hpp_terkini || product.harga_modal || 0;
  const totalBatchCost = effectiveHpp * targetPortion;

  // Parse cooking steps (split by newline or bullet numbers)
  const stepsList = product.langkah_pembuatan
    ? product.langkah_pembuatan
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

  const handleToggleIngredient = (id: string) => {
    setCheckedIngredients((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleStep = (index: number) => {
    setCheckedSteps((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handlePrintRecipe = () => {
    window.print();
  };

  // Helper formatting for smart unit display (e.g. 1500 gram -> 1.5 kg / 1.500 g)
  const formatScaledUnit = (amount: number, unit: string) => {
    if (unit === "gram" && amount >= 1000) {
      const kg = (amount / 1000).toLocaleString("id-ID", {
        maximumFractionDigits: 2,
      });
      return `${kg} kg (${amount.toLocaleString("id-ID")} gram)`;
    }
    if (unit === "ml" && amount >= 1000) {
      const liter = (amount / 1000).toLocaleString("id-ID", {
        maximumFractionDigits: 2,
      });
      return `${liter} Liter (${amount.toLocaleString("id-ID")} ml)`;
    }
    return `${amount.toLocaleString("id-ID", { maximumFractionDigits: 2 })} ${unit}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-[#d59a9e]/40 shadow-2xl max-w-2xl w-full overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-[#81181f] via-primary-hover to-[#d62934] text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight leading-tight">
                {product.nama}
              </h3>
              <p className="text-[11px] text-white/80">
                Kategori: {product.kategori} • Buku Resep Digital
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrintRecipe}
              title="Cetak Kartu Resep"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onEditClick(product)}
              title="Edit Resep"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/15 hover:bg-black/25 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-zinc-800" id="printable-recipe-card">
          {/* Top Banner & Quick Metrics */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-3xl bg-[#efe6e6]/60 border border-[#d59a9e]/30">
            {/* Foto Produk */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border border-[#d59a9e]/40 overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
              {product.foto_url ? (
                <Image
                  src={product.foto_url}
                  alt={product.nama}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-[#d59a9e]" />
              )}
            </div>

            {/* Quick Metrics */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full text-xs">
              <div className="p-2.5 rounded-2xl bg-white border border-[#d59a9e]/20 shadow-2xs">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                  Durasi Memasak
                </span>
                <span className="font-extrabold text-[#81181f] flex items-center gap-1 text-sm mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-[#d62934]" />
                  ~{product.durasi_menit || 30} Menit
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-white border border-[#d59a9e]/20 shadow-2xs">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                  HPP / 1 Porsi
                </span>
                <span className="font-extrabold text-[#0c6b57] flex items-center gap-1 text-sm mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#47d1b5]" />
                  {formatRupiah(effectiveHpp)}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-white border border-[#d59a9e]/20 shadow-2xs col-span-2 sm:col-span-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                  Harga Jual
                </span>
                <span className="font-extrabold text-[#81181f] text-sm mt-0.5 block">
                  {formatRupiah(product.harga_jual)}
                </span>
              </div>
            </div>
          </div>

          {/* 1. KALKULATOR PENGALI PORSI DAPUR (BATCH SCALER) */}
          <div className="p-4 rounded-3xl bg-linear-to-r from-amber-500/10 via-red-500/5 to-amber-500/10 border-2 border-amber-400/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-700" />
                <h4 className="font-extrabold text-xs sm:text-sm text-amber-950 uppercase tracking-wider">
                  Kalkulator Takaran Produksi Dapur
                </h4>
              </div>
              <span className="text-[11px] text-amber-900/80 font-medium">
                Porsi Acuan Resep: <strong>{standardYield} porsi</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-amber-300 shadow-2xs">
              <span className="text-xs font-bold text-zinc-700">Rencana Produksi:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={targetPortion}
                  onChange={(e) => setTargetPortion(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-20 px-3 py-1.5 rounded-xl border-2 border-amber-400 font-extrabold text-sm text-center text-[#81181f] focus:outline-none"
                />
                <span className="text-xs font-bold text-zinc-600">Porsi Jajanan</span>
              </div>

              {/* Preset Quick Buttons */}
              <div className="flex items-center gap-1.5 ml-auto">
                {[10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetPortion(preset)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      targetPortion === preset
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    {preset}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-amber-900 font-semibold px-1">
              <span>Pengali Takaran: ×{multiplier.toFixed(2)} dari resep standar</span>
              <span>Estimasi Biaya Bahan: {formatRupiah(totalBatchCost)}</span>
            </div>
          </div>

          {/* 2. DAFTAR BAHAN BAKU & TAKARAN */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-[#81181f] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#d62934]" />
                <span>Bahan Baku & Takaran ({targetPortion} Porsi)</span>
              </h4>
              <span className="text-[11px] text-zinc-400">Centang saat menimbang bahan</span>
            </div>

            {!product.resep_details || product.resep_details.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#efe6e6]/40 border border-dashed border-[#d59a9e] text-center text-xs text-zinc-500">
                Belum ada komposisi bahan baku yang dicatat. Anda bisa menambahkan bahan baku di menu Edit Resep atau Katalog Produk.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 rounded-2xl overflow-hidden bg-white shadow-2xs border">
                {product.resep_details.map((item) => {
                  const isChecked = Boolean(checkedIngredients[item.id]);

                  const scaledQty = item.jumlah_terpakai * multiplier;
                  const unit = item.bahan_baku?.satuan_terkecil || "gram";

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleIngredient(item.id)}
                      className={`p-3 sm:px-4 flex items-center justify-between gap-3 text-xs sm:text-sm cursor-pointer transition-colors ${
                        isChecked ? "bg-emerald-50/60 text-zinc-400 line-through" : "hover:bg-[#efe6e6]/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-[#47d1b5] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-300 shrink-0" />
                        )}
                        <span className="font-bold text-zinc-900">
                          {item.bahan_baku?.nama || "Bahan Baku"}
                        </span>
                      </div>

                      <div className="text-right font-extrabold text-[#81181f]">
                        {formatScaledUnit(scaledQty, unit)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. LANGKAH-LANGKAH PEMBUATAN / CARA MEMASAK */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-[#81181f] flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-[#d62934]" />
              <span>Cara Membuat & Langkah Memasak</span>
            </h4>

            {stepsList.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#efe6e6]/30 border border-dashed border-[#d59a9e] text-center space-y-2">
                <p className="text-xs text-zinc-500">
                  Belum ada catatan cara memasak untuk menu jajanan ini.
                </p>
                <button
                  type="button"
                  onClick={() => onEditClick(product)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#81181f] text-white text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer"
                >
                  + Tulis Langkah Memasak
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {stepsList.map((step, idx) => {
                  const isChecked = Boolean(checkedSteps[idx]);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleStep(idx)}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 text-xs sm:text-sm cursor-pointer ${
                        isChecked
                          ? "bg-emerald-50/50 border-emerald-200 text-zinc-400"
                          : "bg-white border-[#d59a9e]/30 shadow-2xs hover:border-[#d62934]/40"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#81181f] text-white flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>

                      <div className="flex-1 leading-relaxed font-medium">
                        <span className={isChecked ? "line-through text-zinc-400" : "text-zinc-800"}>
                          {step}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. CATATAN RAHASIA DAPUR & BUMBU KHUSUS */}
          {product.catatan_resep && (
            <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Tips & Rahasia Dapur (Catatan Khusus)</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed whitespace-pre-line font-medium pl-6">
                {product.catatan_resep}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintRecipe}
              className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-[#81181f] text-xs font-bold border border-[#d59a9e]/40 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#d62934]" />
              <span>Cetak Resep</span>
            </button>

            <button
              type="button"
              onClick={() => onEditClick(product)}
              className="px-5 py-2 rounded-xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white text-xs font-bold shadow-md shadow-[#d62934]/25 hover:opacity-95 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Resep & Catatan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
