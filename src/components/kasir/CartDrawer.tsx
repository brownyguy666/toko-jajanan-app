"use client";

import React, { useState } from "react";
import { formatRupiah, parseRupiah } from "@/lib/utils";
import { PaymentMethod } from "@/types/database";
import { CartItemPayload, processTransactionAction, TransactionResult } from "@/app/kasir/actions";

import { saveToOfflineQueue } from "@/lib/offlineQueue";
import { useAuth } from "@/context/AuthContext";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  X,
  CreditCard,
  QrCode,
  Banknote,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";



export interface CartItemWithStock extends CartItemPayload {
  maxStok: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItemWithStock[];
  onUpdateQty: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onTransactionSuccess: (result: TransactionResult) => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onTransactionSuccess,
}: CartDrawerProps) {
  const { profile } = useAuth();
  const [metodeBayar, setMetodeBayar] = useState<PaymentMethod>("tunai");
  const [uangDiterimaStr, setUangDiterimaStr] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalBelanja = cart.reduce(
    (sum, item) => sum + item.harga_jual * item.qty,
    0
  );

  const uangDiterima = parseRupiah(uangDiterimaStr);
  const kembalian = uangDiterima - totalBelanja;
  const isCashSufficient = metodeBayar !== "tunai" || (uangDiterima >= totalBelanja && totalBelanja > 0);

  const handleQuickCash = (nominal: number) => {
    setUangDiterimaStr(nominal.toString());
    setErrorMsg(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg("Keranjang belanja masih kosong.");
      return;
    }

    if (metodeBayar === "tunai" && uangDiterima < totalBelanja) {
      setErrorMsg("Nominal uang diterima belum mencukupi total belanja.");
      return;
    }

    const payloadItems = cart.map((i) => ({
      produk_id: i.produk_id,
      nama: i.nama,
      qty: i.qty,
      harga_jual: i.harga_jual,
    }));

    const finalUangDiterima = metodeBayar === "tunai" ? uangDiterima : totalBelanja;
    const finalKembalian = metodeBayar === "tunai" ? kembalian : 0;
    const kasirNama = profile?.nama || "Kasir";

    // Helper untuk menyimpan transaksi secara offline
    const executeOfflineFallback = () => {
      const clientId = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const nowIso = new Date().toISOString();

      saveToOfflineQueue({
        client_id: clientId,
        created_at: nowIso,
        total: totalBelanja,
        metode_bayar: metodeBayar,
        uang_diterima: finalUangDiterima,
        kembalian: finalKembalian,
        kasir_nama: kasirNama,
        items: payloadItems.map((i) => ({
          ...i,
          subtotal: i.harga_jual * i.qty,
        })),
      });

      const offlineResult: TransactionResult = {
        success: true,
        is_offline: true,
        transaksiId: clientId,
        tanggal: nowIso,
        total: totalBelanja,
        metode_bayar: metodeBayar,
        uang_diterima: finalUangDiterima,
        kembalian: finalKembalian,
        kasir_nama: kasirNama,
        items: payloadItems.map((i) => ({
          nama: i.nama,
          qty: i.qty,
          harga: i.harga_jual,
          subtotal: i.harga_jual * i.qty,
        })),
      };

      onClearCart();
      setUangDiterimaStr("");
      onClose();
      onTransactionSuccess(offlineResult);
    };

    // 1. Jika browser terdeteksi offline secara eksplisit
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      executeOfflineFallback();
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await processTransactionAction({
        items: payloadItems,
        metode_bayar: metodeBayar,
        uang_diterima: finalUangDiterima,
      });

      if (!result.success) {
        // Jika error bukan karena koneksi melainkan validasi bisnis (misal stok kurang)
        setErrorMsg(result.error || "Gagal memproses transaksi.");
        return;
      }

      onClearCart();
      setUangDiterimaStr("");
      onClose();
      onTransactionSuccess(result);
    } catch (err: unknown) {
      console.warn("Network error during transaction, falling back to offline queue:", err);
      // Fallback ke antrian offline jika gagal koneksi di tengah jalan
      executeOfflineFallback();
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slideInRight">
        {/* Drawer Header */}
        <div className="bg-linear-to-r from-[#81181f] to-[#d62934] text-white px-5 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight leading-none">
                Keranjang Pesanan
              </h3>
              <p className="text-[11px] text-white/80 mt-0.5">
                {cart.length} menu dipilih
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                title="Kosongkan Keranjang"
                className="text-[11px] font-bold text-white/80 hover:text-white bg-black/20 hover:bg-black/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/15 hover:bg-black/25 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Content: Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[#d62934]/10 border border-[#d62934]/30 flex items-start gap-2 text-xs text-[#81181f] animate-shake">
              <AlertCircle className="w-4 h-4 text-[#d62934] shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center text-zinc-400">
              <div className="w-16 h-16 rounded-2xl bg-[#efe6e6] text-[#d59a9e] flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-bold text-[#81181f] text-sm">Keranjang Masih Kosong</p>
              <p className="text-xs text-zinc-500 max-w-50 mt-1">
                Sentuh menu jajanan di katalog untuk menambahkan ke pesanan.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.produk_id}
                className="p-3.5 rounded-2xl bg-white border border-[#d59a9e]/30 shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-zinc-900 truncate">
                    {item.nama}
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                    {formatRupiah(item.harga_jual)} x {item.qty} ={" "}
                    <span className="font-bold text-[#81181f]">
                      {formatRupiah(item.harga_jual * item.qty)}
                    </span>
                  </p>
                  {item.qty >= item.maxStok && (
                    <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                      Stok maksimal ({item.maxStok})
                    </span>
                  )}
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-1 bg-[#efe6e6]/60 p-1 rounded-xl border border-[#d59a9e]/30 shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.produk_id, item.qty - 1)}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-zinc-100 text-zinc-700 flex items-center justify-center shadow-2xs active:scale-90 transition-all cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-7 text-center font-extrabold text-xs text-[#81181f]">
                    {item.qty}
                  </span>

                  <button
                    type="button"
                    disabled={item.qty >= item.maxStok}
                    onClick={() => onUpdateQty(item.produk_id, item.qty + 1)}
                    className={`w-7 h-7 rounded-lg text-white flex items-center justify-center shadow-2xs active:scale-90 transition-all ${
                      item.qty >= item.maxStok
                        ? "bg-zinc-300 cursor-not-allowed"
                        : "bg-[#d62934] cursor-pointer"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.produk_id)}
                  className="p-1.5 text-zinc-400 hover:text-[#d62934] rounded-lg transition-colors cursor-pointer"
                  title="Hapus item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer: Payment Details & Checkout */}
        {cart.length > 0 && (
          <div className="p-4 bg-zinc-50 border-t border-[#efe6e6] space-y-3.5">
            {/* Total Belanja */}
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Total Tagihan:
              </span>
              <span className="text-xl font-extrabold text-[#81181f]">
                {formatRupiah(totalBelanja)}
              </span>
            </div>

            {/* Metode Bayar Selector */}
            <div>
              <label className="block text-[11px] font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setMetodeBayar("tunai")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                    metodeBayar === "tunai"
                      ? "bg-[#81181f] text-white border-[#81181f] shadow-xs"
                      : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Tunai</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodeBayar("qris")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                    metodeBayar === "qris"
                      ? "bg-[#81181f] text-white border-[#81181f] shadow-xs"
                      : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>QRIS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodeBayar("transfer")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                    metodeBayar === "transfer"
                      ? "bg-[#81181f] text-white border-[#81181f] shadow-xs"
                      : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Transfer</span>
                </button>
              </div>
            </div>

            {/* Input Tunai & Shortcut Pecahan Uang */}
            {metodeBayar === "tunai" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#81181f] uppercase tracking-wider">
                    Uang Diterima (Rp)
                  </label>
                  {uangDiterima >= totalBelanja && (
                    <span className="text-[11px] font-extrabold text-[#0c6b57]">
                      Kembalian: {formatRupiah(kembalian)}
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  value={uangDiterimaStr ? formatRupiah(uangDiterima) : ""}
                  onChange={(e) => setUangDiterimaStr(e.target.value)}
                  placeholder={`Contoh: ${formatRupiah(totalBelanja)}`}
                  className="input-field py-2 text-sm font-extrabold text-[#81181f]"
                />

                {/* Quick Cash Buttons */}
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(totalBelanja)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-[11px] font-bold text-zinc-700 hover:bg-[#efe6e6] transition-all cursor-pointer"
                  >
                    Uang Pas
                  </button>
                  {[10000, 20000, 50000, 100000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => handleQuickCash(nominal)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-[11px] font-semibold text-zinc-700 hover:bg-[#efe6e6] transition-all cursor-pointer"
                    >
                      {formatRupiah(nominal)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Checkout Button */}
            <button
              type="button"
              disabled={loading || !isCashSufficient}
              onClick={handleCheckout}
              className="w-full py-3.5 px-4 rounded-2xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white text-sm font-extrabold shadow-lg shadow-[#d62934]/25 hover:opacity-95 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2 touch-btn cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#47d1b5]" />
                  <span>Bayar & Simpan Transaksi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
