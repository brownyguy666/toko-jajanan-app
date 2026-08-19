"use client";

import React from "react";
import Image from "next/image";
import { formatRupiah } from "@/lib/utils";
import { Award, Flame, Image as ImageIcon } from "lucide-react";

export interface TopProductItem {
  id: string;
  nama: string;
  kategori: string;
  foto_url?: string | null;
  totalQty: number;
  totalOmzet: number;
}

interface TopProductsListProps {
  products: TopProductItem[];
  totalSoldQuantity: number;
}

export function TopProductsList({
  products,
  totalSoldQuantity,
}: TopProductsListProps) {
  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 text-xs font-black flex items-center justify-center shadow-xs">
          1
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 text-xs font-black flex items-center justify-center shadow-xs">
          2
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
          3
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-full bg-[#efe6e6] text-[#81181f] text-xs font-bold flex items-center justify-center border border-[#d59a9e]/30">
        {index + 1}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-[#d59a9e]/30 p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base text-[#81181f] tracking-tight flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#d62934]" />
            <span>Produk Terlaris (Bestseller)</span>
          </h3>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Peringkat jajanan dengan penjualan terbanyak
          </p>
        </div>

        <div className="w-8 h-8 rounded-xl bg-[#efe6e6] text-[#d62934] flex items-center justify-center">
          <Award className="w-4 h-4" />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center justify-center text-zinc-400">
          <div className="w-12 h-12 rounded-2xl bg-[#efe6e6] text-[#d59a9e] flex items-center justify-center mb-2">
            <Flame className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-[#81181f]">Belum Ada Penjualan</p>
          <p className="text-xs text-zinc-400 max-w-xs mt-1">
            Produk terlaris akan otomatis terdata setelah ada transaksi kasir.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((item, idx) => {
            const percentage =
              totalSoldQuantity > 0
                ? Math.round((item.totalQty / totalSoldQuantity) * 100)
                : 0;

            return (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-[#efe6e6]/30 border border-[#d59a9e]/20 hover:bg-[#efe6e6]/50 transition-colors flex items-center gap-3"
              >
                {/* Rank Badge */}
                <div className="shrink-0">{getRankBadge(idx)}</div>

                {/* Product Photo */}
                <div className="w-11 h-11 rounded-xl bg-zinc-100 overflow-hidden relative border border-zinc-200 shrink-0">
                  {item.foto_url ? (
                    <Image
                      src={item.foto_url}
                      alt={item.nama}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-xs sm:text-sm text-zinc-900 truncate">
                      {item.nama}
                    </h4>
                    <span className="text-xs font-extrabold text-[#81181f] shrink-0">
                      {formatRupiah(item.totalOmzet)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-white border border-[#d59a9e]/30 text-[10px] font-semibold text-[#81181f]">
                      {item.kategori}
                    </span>
                    <span className="font-extrabold text-zinc-700">
                      {item.totalQty} terjual ({percentage}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-200/70 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-linear-to-r from-[#d62934] to-[#81181f] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, percentage))}%` }}
                    />
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
