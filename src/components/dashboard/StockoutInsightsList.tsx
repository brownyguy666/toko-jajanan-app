"use client";

import React from "react";
import Link from "next/link";
import { Produk } from "@/types/database";
import {
  Flame,
  AlertCircle,
  PackageX,
  TrendingUp,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export interface RestockInsightItem {
  id: string;
  nama: string;
  kategori: string;
  stok: number;
  stok_minimum: number;
  terjual7Hari: number;
  rataRataHarian: number;
  status: "habis" | "kritis" | "cepat_habis" | "aman";
  rekomendasi: string;
}

interface StockoutInsightsListProps {
  insights: RestockInsightItem[];
}

export function StockoutInsightsList({ insights }: StockoutInsightsListProps) {
  // Hanya ambil produk yang butuh perhatian restok (habis, kritis, atau cepat habis)
  const alertItems = insights.filter((item) => item.status !== "aman").slice(0, 5);

  return (
    <div className="bg-white rounded-3xl border border-[#d59a9e]/30 p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-100 text-[#d62934] flex items-center justify-center font-bold">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-[#81181f] tracking-tight">
              Insight Kebutuhan Restok (7 Hari Terakhir)
            </h3>
            <p className="text-[11px] text-zinc-500">
              Produk terlaris yang paling sering menipis / butuh restok lebih sering.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/produk"
          className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#d62934] hover:underline"
        >
          <span>Kelola Stok</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List Content */}
      {alertItems.length === 0 ? (
        <div className="p-6 rounded-2xl bg-[#47d1b5]/10 border border-[#47d1b5]/30 text-center flex flex-col items-center justify-center space-y-1.5">
          <CheckCircle2 className="w-8 h-8 text-[#0c6b57]" />
          <h4 className="font-bold text-xs text-[#0c6b57]">
            Semua Stok Produk dalam Kondisi Aman
          </h4>
          <p className="text-[11px] text-zinc-500 max-w-xs">
            Tidak ada produk yang kehabisan stok atau di bawah batas minimum dalam 7 hari terakhir.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {alertItems.map((item, idx) => {
            const isHabis = item.status === "habis";
            const isKritis = item.status === "kritis";

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isHabis
                    ? "bg-red-50/70 border-red-200"
                    : isKritis
                    ? "bg-amber-50/70 border-amber-200"
                    : "bg-[#efe6e6]/40 border-[#d59a9e]/30"
                }`}
              >
                {/* Left: Nama & Badge */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs sm:text-sm text-zinc-900">
                      {idx + 1}. {item.nama}
                    </span>

                    {isHabis && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#d62934] text-white text-[10px] font-extrabold uppercase tracking-wider">
                        <PackageX className="w-3 h-3" />
                        Habis Total
                      </span>
                    )}

                    {isKritis && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wider">
                        <AlertCircle className="w-3 h-3" />
                        Stok Kritis
                      </span>
                    )}

                    {item.status === "cepat_habis" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                        <TrendingUp className="w-3 h-3" />
                        Cepat Habis
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#d62934] shrink-0" />
                    <span>{item.rekomendasi}</span>
                  </p>
                </div>

                {/* Right: Numbers */}
                <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-auto shrink-0 text-right">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">7 Hari Terjual</span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#81181f]">
                      {item.terjual7Hari} porsi
                    </span>
                  </div>

                  <div className="h-6 w-px bg-zinc-200" />

                  <div>
                    <span className="text-[10px] text-zinc-400 block">Sisa Stok</span>
                    <span
                      className={`text-xs sm:text-sm font-extrabold ${
                        item.stok === 0
                          ? "text-[#d62934]"
                          : item.stok <= item.stok_minimum
                          ? "text-amber-600"
                          : "text-[#0c6b57]"
                      }`}
                    >
                      {item.stok} porsi
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
