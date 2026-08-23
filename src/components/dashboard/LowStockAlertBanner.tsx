"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Produk } from "@/types/database";
import {
  AlertTriangle,
  ArrowRight,
  PackageX,
  ChevronDown,
  ChevronUp,
  Boxes,
} from "lucide-react";

interface LowStockAlertBannerProps {
  products: Produk[];
}

export function LowStockAlertBanner({ products }: LowStockAlertBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter products at or below minimum stock
  const lowStockItems = products.filter((p) => {
    const minThreshold = p.stok_minimum !== undefined ? p.stok_minimum : 5;
    return p.stok <= minThreshold;
  });

  if (lowStockItems.length === 0) return null;

  const outOfStockCount = lowStockItems.filter((p) => p.stok === 0).length;
  const criticalCount = lowStockItems.filter((p) => p.stok > 0).length;

  return (
    <div className="mb-6 rounded-3xl bg-linear-to-r from-amber-500/15 via-red-500/10 to-amber-500/15 border-2 border-amber-500/40 p-4 sm:p-5 shadow-lg shadow-amber-500/5 animate-slideInDown">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Icon & Alert Title */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-amber-950 tracking-tight">
                Peringatan: {lowStockItems.length} Produk di Bawah Stok Minimum!
              </h3>
              {outOfStockCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#d62934] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                  {outOfStockCount} Habis
                </span>
              )}
              {criticalCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                  {criticalCount} Menipis
                </span>
              )}
            </div>
            <p className="text-xs text-amber-900/80 mt-0.5 font-medium">
              Segera lakukan restok agar penjualan di kasir POS tidak terganggu.
            </p>
          </div>
        </div>

        {/* Right: Quick Restock Button & Expand Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-amber-950 text-xs font-bold border border-amber-300 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>{isExpanded ? "Sembunyikan" : "Rincian"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <Link
            href="/dashboard/produk?filter=low_stock"
            className="px-4 py-2 rounded-xl bg-linear-to-r from-[#d62934] to-[#81181f] hover:opacity-95 active:scale-98 text-white font-extrabold text-xs shadow-md shadow-[#d62934]/25 transition-all flex items-center gap-1.5 touch-btn cursor-pointer"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Restok Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Expanded List of Critical Items */}
      {isExpanded && (
        <div className="mt-4 pt-3.5 border-t border-amber-500/20">
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => {
              const isOut = item.stok === 0;
              const minThreshold = item.stok_minimum ?? 5;

              return (
                <div
                  key={item.id}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-bold border shadow-2xs ${
                    isOut
                      ? "bg-red-100 text-red-950 border-red-300"
                      : "bg-white/90 text-amber-950 border-amber-300"
                  }`}
                >
                  <PackageX
                    className={`w-3.5 h-3.5 ${
                      isOut ? "text-[#d62934]" : "text-amber-600"
                    }`}
                  />
                  <span>{item.nama}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                      isOut
                        ? "bg-[#d62934] text-white"
                        : "bg-amber-500/20 text-amber-900"
                    }`}
                  >
                    {isOut
                      ? "Habis (0)"
                      : `Sisa ${item.stok} (Batas min: ${minThreshold})`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
