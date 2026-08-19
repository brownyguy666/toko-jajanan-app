"use client";

import React from "react";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { TransactionResult } from "@/app/kasir/actions";
import {
  CheckCircle2,
  Printer,
  ShoppingBag,
  X,
  UtensilsCrossed,
} from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TransactionResult | null;
}

export function ReceiptModal({ isOpen, onClose, data }: ReceiptModalProps) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-[#d59a9e]/40 shadow-2xl max-w-sm w-full overflow-hidden my-6 flex flex-col">
        {/* Success Banner */}
        <div className="bg-linear-to-r from-[#0c6b57] to-[#47d1b5] text-white px-5 py-4 text-center">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-extrabold text-base tracking-tight leading-tight">
            Transaksi Berhasil!
          </h3>
          <p className="text-[11px] text-white/90">
            Stok produk telah terpotong otomatis
          </p>
        </div>

        {/* Thermal Receipt Box */}
        <div className="p-5 overflow-y-auto space-y-4 font-mono text-xs text-zinc-700 bg-[#fdfbfb]" id="printable-receipt">
          {/* Brand Struk */}
          <div className="text-center space-y-0.5 pb-3 border-b border-dashed border-zinc-300">
            <div className="inline-flex items-center justify-center gap-1 font-sans font-extrabold text-sm text-[#81181f]">
              <UtensilsCrossed className="w-4 h-4 text-[#d62934]" />
              <span>TOKO JAJANAN</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-sans">
              Snack & Makanan Ringan Berkualitas
            </p>
          </div>

          {/* Info Transaksi */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">ID Transaksi:</span>
              <span className="font-bold text-zinc-900 truncate max-w-[150px]">
                {data.transaksiId?.substring(0, 13) || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Waktu:</span>
              <span className="text-zinc-800">
                {data.tanggal ? formatTanggal(data.tanggal) : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Kasir:</span>
              <span className="font-bold text-zinc-800">{data.kasir_nama || "Kasir"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Metode Bayar:</span>
              <span className="font-bold uppercase text-[#81181f]">
                {data.metode_bayar}
              </span>
            </div>
          </div>

          {/* List Item */}
          <div className="py-2 border-t border-b border-dashed border-zinc-300 space-y-1.5">
            {data.items?.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-medium text-zinc-900">
                  <span>{item.nama}</span>
                  <span>{formatRupiah(item.subtotal)}</span>
                </div>
                <div className="text-[10px] text-zinc-500">
                  {item.qty} x {formatRupiah(item.harga)}
                </div>
              </div>
            ))}
          </div>

          {/* Total & Kembalian */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-bold text-zinc-900">
              <span>TOTAL</span>
              <span className="text-sm font-extrabold text-[#81181f]">
                {formatRupiah(data.total || 0)}
              </span>
            </div>

            {data.metode_bayar === "tunai" && (
              <>
                <div className="flex justify-between text-[11px] text-zinc-600">
                  <span>Uang Diterima</span>
                  <span>{formatRupiah(data.uang_diterima || 0)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-[#0c6b57]">
                  <span>Kembalian</span>
                  <span>{formatRupiah(data.kembalian || 0)}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center pt-3 text-[10px] text-zinc-400 font-sans border-t border-dashed border-zinc-300">
            Terima kasih atas kunjungan Anda! Selamat menikmati jajanan lezat.
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-zinc-50 border-t border-[#efe6e6] grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-zinc-500" />
            <span>Cetak Struk</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white text-xs font-bold shadow-md shadow-[#d62934]/25 hover:opacity-95 active:scale-98 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
}
