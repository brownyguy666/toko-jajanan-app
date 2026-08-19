"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { ReceiptModal } from "@/components/kasir/ReceiptModal";
import { TransactionResult, cancelTransactionAction } from "@/app/kasir/actions";
import { PaymentMethod } from "@/types/database";
import {
  History,
  TrendingUp,
  Receipt,
  Eye,
  Calendar,
  CreditCard,
  QrCode,
  Banknote,
  Search,
  RotateCcw,
  AlertTriangle,
  Clock,
} from "lucide-react";

interface TransaksiWithItems {
  id: string;
  kasir_id: string;
  tanggal: string;
  total: number;
  metode_bayar: PaymentMethod;
  transaksi_item?: {
    id: string;
    qty: number;
    harga_saat_jual: number;
    subtotal: number;
    produk?: {
      nama: string;
    } | null;
  }[];
}

export function TodayHistoryView() {
  const supabase = createClient();

  const [transactions, setTransactions] = useState<TransaksiWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionResult | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Cancellation State
  const [trxToCancel, setTrxToCancel] = useState<TransaksiWithItems | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  const refetch = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Update current time every 30s to refresh 5-minute countdowns
  useEffect(() => {
    setCurrentTime(Date.now());
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadTodayHistory() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
          .from("transaksi")
          .select(`
            id,
            kasir_id,
            tanggal,
            total,
            metode_bayar,
            transaksi_item (
              id,
              qty,
              harga_saat_jual,
              subtotal,
              produk (
                nama
              )
            )
          `)
          .eq("kasir_id", user.id)
          .gte("tanggal", todayStart.toISOString())
          .order("tanggal", { ascending: false });

        if (error) throw error;
        if (isMounted) {
          setTransactions((data as unknown as TransaksiWithItems[]) || []);
        }
      } catch (err: unknown) {
        console.error("Error loading today's cashier history:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTodayHistory();

    return () => {
      isMounted = false;
    };
  }, [supabase, refreshTrigger]);

  // Handle Confirm Cancel
  const handleConfirmCancel = async () => {
    if (!trxToCancel) return;
    setIsCancelling(true);

    try {
      const res = await cancelTransactionAction(trxToCancel.id);
      if (!res.success) {
        alert(res.error || "Gagal membatalkan transaksi.");
        return;
      }

      alert("Transaksi berhasil dibatalkan dan stok produk telah dikembalikan ke etalase.");
      setTransactions((prev) => prev.filter((t) => t.id !== trxToCancel.id));
      setTrxToCancel(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      alert(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  // Helper cek sisa menit pembatalan
  const getCancelTimeLeftMinutes = (tanggal: string) => {
    if (!currentTime) return 0;
    const diffMs = currentTime - new Date(tanggal).getTime();
    const remainingMs = 5 * 60 * 1000 - diffMs;
    if (remainingMs <= 0) return 0;
    return Math.ceil(remainingMs / 60000);
  };

  // Calculations for today's summary
  const totalOmzet = transactions.reduce((acc, t) => acc + (t.total || 0), 0);
  const totalTrxCount = transactions.length;

  const filteredTransactions = transactions.filter((t) => {
    const matchesId = t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesItem = t.transaksi_item?.some((i) =>
      i.produk?.nama?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesMethod = t.metode_bayar.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesId || matchesItem || matchesMethod;
  });

  const handleOpenReceipt = (t: TransaksiWithItems) => {
    setSelectedReceipt({
      success: true,
      transaksiId: t.id,
      tanggal: t.tanggal,
      total: t.total,
      metode_bayar: t.metode_bayar,
      items: t.transaksi_item?.map((item) => ({
        nama: item.produk?.nama || "Jajanan",
        qty: item.qty,
        harga: item.harga_saat_jual,
        subtotal: item.subtotal,
      })),
    });
  };

  const renderPaymentIcon = (method: PaymentMethod) => {
    if (method === "qris") return <QrCode className="w-3.5 h-3.5" />;
    if (method === "transfer") return <CreditCard className="w-3.5 h-3.5" />;
    return <Banknote className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="p-5 rounded-3xl bg-linear-to-br from-[#81181f] to-primary-hover text-white shadow-md shadow-[#81181f]/15 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider block mb-1">
              Omzet Saya Hari Ini
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {formatRupiah(totalOmzet)}
            </p>
            <span className="text-[11px] text-[#47d1b5] font-semibold flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" />
              {formatTanggal(new Date().toISOString()).split(" ")[0]}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
            <TrendingUp className="w-6 h-6 text-[#47d1b5]" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#d59a9e]/40 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Total Transaksi Selesai
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#81181f]">
              {totalTrxCount} <span className="text-sm font-normal text-zinc-400">transaksi</span>
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Tercatat otomatis di akun kasir Anda
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#efe6e6] text-[#d62934] flex items-center justify-center border border-[#d59a9e]/30">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Toolbar Search */}
      <div className="bg-white rounded-2xl border border-[#d59a9e]/30 p-3.5 shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID transaksi, nama jajanan, atau metode bayar..."
            className="input-field pl-9 py-2 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-4 border-[#d62934] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#81181f]">Memuat riwayat transaksi hari ini...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-[#d59a9e]/40 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#efe6e6] text-[#d62934] flex items-center justify-center mb-3">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#81181f]">
            {transactions.length === 0
              ? "Belum Ada Transaksi Hari Ini"
              : "Tidak Ditemukan Transaksi yang Cocok"}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            {transactions.length === 0
              ? "Buka tab Katalog POS dan selesaikan pesanan pertama Anda untuk melihat riwayatnya di sini."
              : "Coba ganti kata kunci pencarian Anda."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((t) => {
            const cancelMinutesLeft = getCancelTimeLeftMinutes(t.tanggal);
            const canCancel = cancelMinutesLeft > 0;

            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-[#d59a9e]/30 p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-900">
                      ID: #{t.id.substring(0, 8)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#efe6e6] text-[#81181f] text-[10px] font-bold uppercase border border-[#d59a9e]/30">
                      {renderPaymentIcon(t.metode_bayar)}
                      {t.metode_bayar}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {formatTanggal(t.tanggal)}
                    </span>

                    {/* Badge Sisa Waktu Pembatalan */}
                    {canCancel && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold animate-pulse">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Bisa batal ({cancelMinutesLeft}m)</span>
                      </span>
                    )}
                  </div>

                  {/* Items Summary preview */}
                  <div className="text-xs text-zinc-600 flex flex-wrap gap-1">
                    {t.transaksi_item?.map((item, idx) => (
                      <span
                        key={item.id || idx}
                        className="inline-block bg-zinc-50 px-2 py-0.5 rounded-lg border border-zinc-200 text-[11px]"
                      >
                        {item.produk?.nama || "Jajanan"} ({item.qty}x)
                      </span>
                    ))}
                  </div>
                </div>

                {/* Total & Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                  <div className="text-right mr-1">
                    <span className="text-[10px] text-zinc-400 block leading-tight">
                      Total
                    </span>
                    <span className="font-extrabold text-sm sm:text-base text-[#81181f]">
                      {formatRupiah(t.total)}
                    </span>
                  </div>

                  {/* Cancel Button (5 Menit Terakhir) */}
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => setTrxToCancel(t)}
                      title="Batalkan transaksi ini dan kembalikan stok produk"
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-[#d62934] text-xs font-bold border border-red-200 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Batalkan</span>
                    </button>
                  )}

                  {/* View Receipt Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenReceipt(t)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#efe6e6] hover:bg-[#d59a9e]/30 text-[#81181f] text-xs font-bold border border-[#d59a9e]/40 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#d62934]" />
                    <span>Struk</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Digital Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        data={selectedReceipt}
        onTransactionCancelled={refetch}
      />

      {/* Modal Konfirmasi Pembatalan Transaksi */}
      {trxToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#d62934] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#81181f]">
              Batalkan Transaksi #{trxToCancel.id.substring(0, 8)}?
            </h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed">
              Transaksi sebesar <strong>{formatRupiah(trxToCancel.total)}</strong> akan dihapus dan stok produk akan <strong>dikembalikan secara otomatis ke etalase</strong>.
            </p>

            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-left text-xs mb-5 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                Stok yang akan dikembalikan:
              </span>
              {trxToCancel.transaksi_item?.map((item, idx) => (
                <div key={idx} className="flex justify-between font-semibold text-zinc-700">
                  <span>{item.produk?.nama || "Produk"}</span>
                  <span className="text-[#0c6b57]">+{item.qty} porsi</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTrxToCancel(null)}
                disabled={isCancelling}
                className="py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="py-2.5 px-4 rounded-xl bg-[#d62934] hover:bg-[#81181f] text-white text-xs font-bold shadow-md shadow-[#d62934]/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isCancelling ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
