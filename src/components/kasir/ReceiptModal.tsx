"use client";

import React, { useState } from "react";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { TransactionResult, cancelTransactionAction } from "@/app/kasir/actions";
import {
  CheckCircle2,
  Printer,
  ShoppingBag,
  UtensilsCrossed,
  Share2,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TransactionResult | null;
  onTransactionCancelled?: () => void;
}

export function ReceiptModal({
  isOpen,
  onClose,
  data,
  onTransactionCancelled,
}: ReceiptModalProps) {
  const [copied, setCopied] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (!isOpen || !data) return null;

  // Format Text Receipt for WhatsApp & Clipboard
  const generateReceiptText = () => {
    const lines: string[] = [
      "🧾 *STRUK PEMBELIAN - TOKO JAJANAN*",
      `No. Transaksi : #${data.transaksiId?.substring(0, 10) || "-"}`,
      `Waktu : ${data.tanggal ? formatTanggal(data.tanggal) : "-"}`,
      `Kasir : ${data.kasir_nama || "Kasir"}`,
      `Metode Bayar : ${data.metode_bayar?.toUpperCase() || "TUNAI"}`,
      "--------------------------------",
    ];

    data.items?.forEach((item) => {
      lines.push(`• ${item.nama} (${item.qty}x) : ${formatRupiah(item.subtotal)}`);
    });

    lines.push("--------------------------------");
    lines.push(`*TOTAL BELANJA : ${formatRupiah(data.total || 0)}*`);

    if (data.metode_bayar === "tunai") {
      lines.push(`Uang Diterima : ${formatRupiah(data.uang_diterima || 0)}`);
      lines.push(`*Kembalian : ${formatRupiah(data.kembalian || 0)}*`);
    }

    lines.push("");
    lines.push("Terima kasih telah berbelanja di Toko Jajanan! 🙏");
    lines.push("Selamat menikmati sajian jajanan kami.");

    return lines.join("\n");
  };

  const handleShareWhatsApp = () => {
    const text = generateReceiptText();
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  const handleCopyText = async () => {
    const text = generateReceiptText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Gagal menyalin struk.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Cek apakah transaksi dalam rentang 5 menit (300 detik)
  const isWithin5Minutes = () => {
    if (!data.tanggal) return false;
    const diffMs = Date.now() - new Date(data.tanggal).getTime();
    return diffMs <= 5 * 60 * 1000 + 15000;
  };

  const handleCancelTransaction = async () => {
    if (!data.transaksiId) return;
    setCancelling(true);

    try {
      const res = await cancelTransactionAction(data.transaksiId);
      if (!res.success) {
        alert(res.error || "Gagal membatalkan transaksi.");
        return;
      }

      alert("Transaksi berhasil dibatalkan dan stok produk telah dikembalikan.");
      setShowCancelConfirm(false);
      onClose();
      if (onTransactionCancelled) {
        onTransactionCancelled();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      alert(msg);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-[#d59a9e]/40 shadow-2xl max-w-sm w-full overflow-hidden my-6 flex flex-col">
        {/* Success Banner */}
        <div className="bg-linear-to-r from-[#0c6b57] to-[#47d1b5] text-white px-5 py-3.5 text-center">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-1.5">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-extrabold text-base tracking-tight leading-tight">
            Transaksi Berhasil!
          </h3>
          <p className="text-[11px] text-white/90">
            Stok produk telah terpotong otomatis
          </p>
        </div>

        {/* Thermal Receipt Box */}
        <div
          className="p-5 overflow-y-auto space-y-3.5 font-mono text-xs text-zinc-700 bg-[#fdfbfb]"
          id="printable-receipt"
        >
          {/* Brand Struk */}
          <div className="text-center space-y-0.5 pb-2.5 border-b border-dashed border-zinc-300">
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
              <span className="text-zinc-500">No. Transaksi:</span>
              <span className="font-bold text-zinc-900 truncate max-w-37.5">
                #{data.transaksiId?.substring(0, 10) || "-"}
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
          <div className="space-y-1 pt-0.5">
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

          <div className="text-center pt-2.5 text-[10px] text-zinc-400 font-sans border-t border-dashed border-zinc-300">
            Terima kasih atas kunjungan Anda!
          </div>
        </div>

        {/* Quick Sharing & Copy Action Bar */}
        <div className="px-4 py-2.5 bg-[#efe6e6]/60 border-t border-b border-[#d59a9e]/30 flex items-center justify-between gap-2">
          {/* Share WhatsApp */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
            title="Kirim Struk via WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          {/* Salin Teks */}
          <button
            type="button"
            onClick={handleCopyText}
            className="py-1.5 px-3 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
            title="Salin Rincian Struk"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#0c6b57]" />
                <span className="text-[#0c6b57]">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                <span>Salin</span>
              </>
            )}
          </button>

          {/* Cetak Struk */}
          <button
            type="button"
            onClick={handlePrint}
            className="py-1.5 px-3 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
            title="Cetak Struk Thermal"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-500" />
            <span>Cetak</span>
          </button>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-zinc-50 space-y-2">
          {/* Cancel within 5 minutes */}
          {isWithin5Minutes() && (
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-red-50 text-[#d62934] text-xs font-bold border border-red-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Batalkan Transaksi Ini (Salah Input)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white text-xs font-bold shadow-md shadow-[#d62934]/25 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Selesai & Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Transaction Cancellation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl max-w-xs w-full p-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#d62934] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-[#81181f]">
              Batalkan Transaksi?
            </h4>
            <p className="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed">
              Transaksi sebesar <strong>{formatRupiah(data.total || 0)}</strong> akan dihapus dan stok produk akan dikembalikan ke etalase toko.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className="py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleCancelTransaction}
                disabled={cancelling}
                className="py-2 px-3 rounded-xl bg-[#d62934] hover:bg-[#81181f] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1 cursor-pointer"
              >
                {cancelling ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Ya, Batalkan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
