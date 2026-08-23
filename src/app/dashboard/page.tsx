"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { SalesTrendChart, TrendDataPoint } from "@/components/dashboard/SalesTrendChart";
import { ExpenseComparisonChart } from "@/components/dashboard/ExpenseComparisonChart";
import { TopProductsList, TopProductItem } from "@/components/dashboard/TopProductsList";
import {
  TrendingUp,
  DollarSign,
  Receipt,
  CreditCard,
  ShoppingBag,
  Package,
  Users,
  Printer,
  Layers,
  Percent,
} from "lucide-react";


type TimeRange = "today" | "week" | "month" | "all";

interface RawTransaction {
  id: string;
  tanggal: string;
  total: number;
  metode_bayar: string;
  transaksi_item?: {
    id: string;
    qty: number;
    harga_saat_jual: number;
    hpp_saat_jual?: number;
    subtotal: number;
    produk_id: string;
    produk?: {
      id: string;
      nama: string;
      kategori: string;
      harga_modal: number;
      hpp_terkini?: number;
      harga_jual: number;
      foto_url: string | null;
    };
  }[];
}

interface RawExpense {
  id: string;
  kategori: string;
  jumlah: number;
  tanggal: string;
}

export default function DashboardOverviewPage() {
  const supabase = createClient();

  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<RawTransaction[]>([]);
  const [expenses, setExpenses] = useState<RawExpense[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setLoading(true);
      try {
        // 1. Ambil seluruh transaksi beserta item (hpp_saat_jual) dan relasi produk
        const { data: trxData, error: trxErr } = await supabase
          .from("transaksi")
          .select(`
            id,
            tanggal,
            total,
            metode_bayar,
            transaksi_item (
              id,
              qty,
              harga_saat_jual,
              hpp_saat_jual,
              subtotal,
              produk_id,
              produk (
                id,
                nama,
                kategori,
                harga_modal,
                hpp_terkini,
                harga_jual,
                foto_url
              )
            )
          `)
          .order("tanggal", { ascending: true });


        if (trxErr) throw trxErr;

        // 2. Ambil seluruh data pengeluaran
        const { data: expData, error: expErr } = await supabase
          .from("pengeluaran")
          .select("id, kategori, jumlah, tanggal")
          .order("tanggal", { ascending: true });

        if (expErr) throw expErr;

        if (isMounted) {
          setTransactions((trxData as unknown as RawTransaction[]) || []);
          setExpenses((expData as unknown as RawExpense[]) || []);
        }
      } catch (err: unknown) {
        console.error("Error loading dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // Filter Data berdasarkan Rentang Waktu yang Dipilih
  const { filteredTransactions, filteredExpenses, periodLabel } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let label = "Hari Ini";

    if (timeRange === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      label = "Hari Ini";
    } else if (timeRange === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = "7 Hari Terakhir";
    } else if (timeRange === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      label = "Bulan Ini";
    } else {
      startDate = new Date(0); // All time
      label = "Semua Waktu";
    }

    const filteredTrx = transactions.filter((t) => new Date(t.tanggal) >= startDate);
    const filteredExp = expenses.filter((e) => new Date(e.tanggal) >= startDate);

    return {
      filteredTransactions: filteredTrx,
      filteredExpenses: filteredExp,
      periodLabel: label,
    };
  }, [transactions, expenses, timeRange]);

  // Perhitungan Metrik Finansial
  const {
    totalOmzet,
    totalModalTerjual,
    labaKotor,
    totalPengeluaran,
    labaBersih,
    totalOrders,
    averageOrderValue,
    grossMarginPercent,
    topProducts,
    totalSoldQuantity,
    trendData,
  } = useMemo(() => {
    let omzet = 0;
    let modal = 0;
    const productStatsMap = new Map<
      string,
      {
        id: string;
        nama: string;
        kategori: string;
        foto_url?: string | null;
        totalQty: number;
        totalOmzet: number;
      }
    >();

    const dailyTrendMap = new Map<string, { omzet: number; laba: number }>();

    filteredTransactions.forEach((trx) => {
      omzet += trx.total;

      const dateKey = new Date(trx.tanggal).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });

      if (!dailyTrendMap.has(dateKey)) {
        dailyTrendMap.set(dateKey, { omzet: 0, laba: 0 });
      }
      const dayData = dailyTrendMap.get(dateKey)!;
      dayData.omzet += trx.total;

      let trxLaba = 0;

      if (trx.transaksi_item && Array.isArray(trx.transaksi_item)) {
        trx.transaksi_item.forEach((item) => {
          // Prioritaskan hpp_saat_jual (snapshot saat transaksi dibuat)
          const itemModal =
            item.hpp_saat_jual ??
            item.produk?.hpp_terkini ??
            item.produk?.harga_modal ??
            0;
          const itemCost = itemModal * item.qty;
          modal += itemCost;
          const itemGrossProfit = (item.harga_saat_jual - itemModal) * item.qty;
          trxLaba += itemGrossProfit;


          // Aggregasi Produk Terlaris
          const prodId = item.produk_id || item.produk?.id || item.id;
          const prodName = item.produk?.nama || "Produk Jajanan";
          const prodKategori = item.produk?.kategori || "Jajanan";
          const prodFoto = item.produk?.foto_url;

          if (!productStatsMap.has(prodId)) {
            productStatsMap.set(prodId, {
              id: prodId,
              nama: prodName,
              kategori: prodKategori,
              foto_url: prodFoto,
              totalQty: 0,
              totalOmzet: 0,
            });
          }

          const pStat = productStatsMap.get(prodId)!;
          pStat.totalQty += item.qty;
          pStat.totalOmzet += item.subtotal || item.harga_saat_jual * item.qty;
        });
      }

      dayData.laba += trxLaba;
    });

    const exp = filteredExpenses.reduce((sum, e) => sum + e.jumlah, 0);
    const grossProfit = omzet - modal;
    const netProfit = grossProfit - exp;

    const ordersCount = filteredTransactions.length;
    const aov = ordersCount > 0 ? Math.round(omzet / ordersCount) : 0;
    const grossMargin = omzet > 0 ? ((grossProfit / omzet) * 100).toFixed(1) : "0";

    // Sort Top Products
    const sortedProducts: TopProductItem[] = Array.from(productStatsMap.values())
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);

    const totalQtySold = sortedProducts.reduce((sum, p) => sum + p.totalQty, 0);

    // Format Trend Data for Chart
    const trendList: TrendDataPoint[] = Array.from(dailyTrendMap.entries()).map(
      ([label, vals]) => ({
        label,
        omzet: vals.omzet,
        laba: vals.laba,
      })
    );

    return {
      totalOmzet: omzet,
      totalModalTerjual: modal,
      labaKotor: grossProfit,
      totalPengeluaran: exp,
      labaBersih: netProfit,
      totalOrders: ordersCount,
      averageOrderValue: aov,
      grossMarginPercent: grossMargin,
      topProducts: sortedProducts,
      totalSoldQuantity: totalQtySold,
      trendData: trendList,
    };
  }, [filteredTransactions, filteredExpenses]);

  return (
    <div className="min-h-screen bg-[#fdfbfb] flex flex-col">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {/* Page Header & Period Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#81181f] tracking-tight">
              Ringkasan Performa & Laporan
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
              Analisis omzet, laba kotor, biaya operasional, dan laba bersih toko jajanan Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period Switcher Pills */}
            <div className="bg-white p-1 rounded-2xl border border-[#d59a9e]/30 shadow-xs flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTimeRange("today")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === "today"
                    ? "bg-[#81181f] text-white shadow-xs"
                    : "text-zinc-600 hover:bg-[#efe6e6]"
                }`}
              >
                Hari Ini
              </button>

              <button
                type="button"
                onClick={() => setTimeRange("week")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === "week"
                    ? "bg-[#81181f] text-white shadow-xs"
                    : "text-zinc-600 hover:bg-[#efe6e6]"
                }`}
              >
                Minggu Ini
              </button>

              <button
                type="button"
                onClick={() => setTimeRange("month")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === "month"
                    ? "bg-[#81181f] text-white shadow-xs"
                    : "text-zinc-600 hover:bg-[#efe6e6]"
                }`}
              >
                Bulan Ini
              </button>

              <button
                type="button"
                onClick={() => setTimeRange("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === "all"
                    ? "bg-[#81181f] text-white shadow-xs"
                    : "text-zinc-600 hover:bg-[#efe6e6]"
                }`}
              >
                Semua
              </button>
            </div>

            {/* Print / Report Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-[#d59a9e]/40 hover:bg-[#efe6e6] text-xs font-bold text-[#81181f] shadow-2xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* 1. Total Omzet */}
          <div className="p-5 rounded-3xl bg-linear-to-br from-[#81181f] to-[#d62934] text-white shadow-md shadow-[#81181f]/15 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                Total Omzet ({periodLabel})
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {formatRupiah(totalOmzet)}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-white/80 mt-2">
              <span className="flex items-center gap-1">
                <Receipt className="w-3 h-3 text-[#47d1b5]" />
                {totalOrders} transaksi
              </span>
              <span>•</span>
              <span>Rata-rata: {formatRupiah(averageOrderValue)}</span>
            </div>
          </div>

          {/* 2. Estimasi Laba Kotor */}
          <div className="p-5 rounded-3xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Laba Kotor Produk
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#efe6e6] text-[#0c6b57] flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0c6b57] tracking-tight">
              {formatRupiah(labaKotor)}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-2">
              <span className="font-semibold text-[#0c6b57]">
                Marjin Kotor: {grossMarginPercent}%
              </span>
              <span>•</span>
              <span>Modal: {formatRupiah(totalModalTerjual)}</span>
            </div>
          </div>

          {/* 3. Pengeluaran Operasional */}
          <div className="p-5 rounded-3xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Pengeluaran Toko
              </span>
              <div className="w-8 h-8 rounded-xl bg-red-100 text-[#d62934] flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#d62934] tracking-tight">
              {formatRupiah(totalPengeluaran)}
            </p>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2">
              <span>{filteredExpenses.length} catatan pengeluaran</span>
              <Link
                href="/dashboard/pengeluaran"
                className="font-bold text-[#81181f] hover:underline"
              >
                + Kelola
              </Link>
            </div>
          </div>

          {/* 4. Laba Bersih Akhir */}
          <div
            className={`p-5 rounded-3xl border shadow-2xs ${
              labaBersih >= 0
                ? "bg-[#47d1b5]/10 border-[#47d1b5]/40 text-[#0c6b57]"
                : "bg-red-50 border-red-200 text-[#d62934]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Laba Bersih Toko
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  labaBersih >= 0
                    ? "bg-[#47d1b5]/20 text-[#0c6b57]"
                    : "bg-red-200 text-[#d62934]"
                }`}
              >
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {formatRupiah(labaBersih)}
            </p>
            <p className="text-[11px] font-semibold mt-2">
              (Laba Kotor - Pengeluaran Operasional)
            </p>
          </div>
        </div>

        {/* Content Layout: 2 Columns */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-4 border-[#d62934] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-[#81181f]">Menghitung data laporan toko...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Charts */}
            <div className="lg:col-span-2 space-y-6">
              <SalesTrendChart data={trendData} periodLabel={periodLabel} />
              <ExpenseComparisonChart
                totalOmzet={totalOmzet}
                totalModalTerjual={totalModalTerjual}
                totalPengeluaran={totalPengeluaran}
                labaKotor={labaKotor}
                labaBersih={labaBersih}
              />
            </div>

            {/* Right 1 Col: Top Products & Quick Links */}
            <div className="space-y-6">
              <TopProductsList
                products={topProducts}
                totalSoldQuantity={totalSoldQuantity}
              />

              {/* Quick Navigation Cards */}
              <div className="bg-white rounded-3xl border border-[#d59a9e]/30 p-5 sm:p-6 shadow-sm space-y-3">
                <h3 className="font-extrabold text-sm text-[#81181f] tracking-tight flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#d62934]" />
                  <span>Pintasan Cepat Owner</span>
                </h3>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  <Link
                    href="/kasir"
                    className="p-3 rounded-2xl bg-[#efe6e6]/50 hover:bg-[#efe6e6] border border-[#d59a9e]/30 flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#47d1b5] text-[#0c4a3c] flex items-center justify-center font-bold">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-zinc-900 group-hover:text-[#81181f]">
                          Buka Kasir POS
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          Catat transaksi langsung
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/produk"
                    className="p-3 rounded-2xl bg-[#efe6e6]/50 hover:bg-[#efe6e6] border border-[#d59a9e]/30 flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#81181f] text-white flex items-center justify-center font-bold">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-zinc-900 group-hover:text-[#81181f]">
                          Katalog & Stok Jajanan
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          Tambah produk, edit harga & stok
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/pegawai"
                    className="p-3 rounded-2xl bg-[#efe6e6]/50 hover:bg-[#efe6e6] border border-[#d59a9e]/30 flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#d62934] text-white flex items-center justify-center font-bold">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-zinc-900 group-hover:text-[#81181f]">
                          Kelola Akun Pegawai
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          Daftar kasir & atur status aktif
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
