"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Pengeluaran, ExpenseCategory } from "@/types/database";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { ExpenseModal } from "@/components/pengeluaran/ExpenseModal";
import {
  Receipt,
  PlusCircle,
  Search,
  Calendar,
  Edit2,
  Trash2,
  AlertTriangle,
  UtensilsCrossed,
  Flame,
  Package,
  Store,
  Tag,
  PieChart,
  Layers,
} from "lucide-react";


export default function PengeluaranManagementPage() {
  const supabase = createClient();

  const [expenses, setExpenses] = useState<Pengeluaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<"all" | "month" | "today">("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Pengeluaran | null>(null);

  // Delete Confirmation
  const [expenseToDelete, setExpenseToDelete] = useState<Pengeluaran | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const refetch = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadExpenses() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("pengeluaran")
          .select("*")
          .order("tanggal", { ascending: false });

        if (error) throw error;
        if (isMounted) {
          setExpenses((data as Pengeluaran[]) || []);
        }
      } catch (err: unknown) {
        console.error("Error loading expenses:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadExpenses();

    return () => {
      isMounted = false;
    };
  }, [supabase, refreshTrigger]);

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("pengeluaran")
        .delete()
        .eq("id", expenseToDelete.id);

      if (error) throw error;

      setExpenses((prev) => prev.filter((e) => e.id !== expenseToDelete.id));
      setExpenseToDelete(null);
    } catch (err: unknown) {
      console.error("Error deleting expense:", err);
      alert("Gagal menghapus catatan pengeluaran.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper Ikon & Warna Kategori
  const getCategoryBadge = (kategori: ExpenseCategory) => {
    switch (kategori) {
      case "bahan baku":
        return {
          icon: UtensilsCrossed,
          label: "Bahan Baku",
          className: "bg-[#81181f]/10 text-[#81181f] border-[#81181f]/20",
        };
      case "gas":
        return {
          icon: Flame,
          label: "Gas Elpiji",
          className: "bg-red-100 text-[#d62934] border-red-200",
        };
      case "kemasan":
        return {
          icon: Package,
          label: "Kemasan",
          className: "bg-[#47d1b5]/15 text-[#0c6b57] border-[#47d1b5]/30",
        };
      case "sewa":
        return {
          icon: Store,
          label: "Sewa Tempat",
          className: "bg-blue-100 text-blue-700 border-blue-200",
        };
      default:
        return {
          icon: Tag,
          label: "Lain-lain",
          className: "bg-zinc-100 text-zinc-700 border-zinc-200",
        };
    }
  };

  // Filter List
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return expenses.filter((e) => {
      const expenseDate = new Date(e.tanggal);

      // Period filter
      if (periodFilter === "today" && expenseDate < todayStart) return false;
      if (periodFilter === "month" && expenseDate < monthStart) return false;

      // Category filter
      if (categoryFilter !== "all" && e.kategori !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesKet = e.keterangan?.toLowerCase().includes(q) || false;
        const matchesCat = e.kategori.toLowerCase().includes(q);
        if (!matchesKet && !matchesCat) return false;
      }

      return true;
    });
  }, [expenses, periodFilter, categoryFilter, searchQuery]);

  // KPI Metrics Calculation
  const { totalBulanIni, totalHariIni, totalOverall, topCategoryName } =
    useMemo(() => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let sumBulanIni = 0;
      let sumHariIni = 0;
      let sumAll = 0;
      const catTotals = new Map<string, number>();

      expenses.forEach((e) => {
        const d = new Date(e.tanggal);
        sumAll += e.jumlah;

        if (d >= monthStart) {
          sumBulanIni += e.jumlah;
        }
        if (d >= todayStart) {
          sumHariIni += e.jumlah;
        }

        const currentCatSum = catTotals.get(e.kategori) || 0;
        catTotals.set(e.kategori, currentCatSum + e.jumlah);
      });

      let topCat = "-";
      let topCatAmount = 0;
      catTotals.forEach((amt, cat) => {
        if (amt > topCatAmount) {
          topCatAmount = amt;
          topCat = cat;
        }
      });

      return {
        totalBulanIni: sumBulanIni,
        totalHariIni: sumHariIni,
        totalOverall: sumAll,
        topCategoryName: topCat,
      };
    }, [expenses]);

  return (
    <div className="min-h-screen bg-[#fdfbfb] flex flex-col">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#81181f] tracking-tight">
              Pengeluaran Operasional
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
              Catat biaya bahan baku, gas, kemasan, dan sewa untuk memotong laba bersih secara akurat.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setExpenseToEdit(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white text-xs font-bold shadow-md shadow-[#d62934]/25 hover:opacity-95 active:scale-98 transition-all touch-btn cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Pengeluaran Baru</span>
          </button>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* 1. Bulan Ini */}
          <div className="p-5 rounded-3xl bg-linear-to-br from-[#81181f] to-[#d62934] text-white shadow-md shadow-[#81181f]/15">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                Pengeluaran Bulan Ini
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                <Calendar className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {formatRupiah(totalBulanIni)}
            </p>
            <p className="text-[11px] text-white/80 mt-1.5">
              Otomatis memotong laba bersih bulan ini
            </p>
          </div>

          {/* 2. Hari Ini */}
          <div className="p-5 rounded-3xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Pengeluaran Hari Ini
              </span>
              <div className="w-8 h-8 rounded-xl bg-red-100 text-[#d62934] flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#d62934] tracking-tight">
              {formatRupiah(totalHariIni)}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Total biaya yang keluar hari ini
            </p>
          </div>

          {/* 3. Alokasi Terbesar */}
          <div className="p-5 rounded-3xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Kategori Terbesar
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#efe6e6] text-[#81181f] flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-[#81181f] tracking-tight capitalize">
              {topCategoryName}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Alokasi biaya tertinggi saat ini
            </p>
          </div>

          {/* 4. Total Transaksi */}
          <div className="p-5 rounded-3xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Total Catatan
              </span>
              <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-zinc-800 tracking-tight">
              {expenses.length}{" "}
              <span className="text-xs font-normal text-zinc-400">kali dicatat</span>
            </p>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Akumulasi: {formatRupiah(totalOverall)}
            </p>
          </div>
        </div>

        {/* Filter & Search Box */}
        <div className="bg-white rounded-3xl border border-[#d59a9e]/30 p-4 shadow-sm mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari rincian atau keterangan pengeluaran..."
                className="input-field pl-10 py-2 text-xs sm:text-sm"
              />
            </div>

            {/* Period Switcher */}
            <div className="flex items-center gap-1.5 bg-[#efe6e6]/60 p-1 rounded-2xl border border-[#d59a9e]/30 shrink-0">
              <button
                type="button"
                onClick={() => setPeriodFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodFilter === "all"
                    ? "bg-[#81181f] text-white shadow-xs"
                    : "text-zinc-600 hover:text-[#81181f]"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter("month")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodFilter === "month"
                    ? "bg-[#81181f] text-white shadow-xs"
                    : "text-zinc-600 hover:text-[#81181f]"
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter("today")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodFilter === "today"
                    ? "bg-[#81181f] text-white shadow-xs"
                    : "text-zinc-600 hover:text-[#81181f]"
                }`}
              >
                Hari Ini
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
            <span className="text-[11px] font-bold text-zinc-400 shrink-0 pr-1">
              Kategori:
            </span>
            {[
              { id: "all", label: "Semua Kategori" },
              { id: "bahan baku", label: "Bahan Baku" },
              { id: "gas", label: "Gas Elpiji" },
              { id: "kemasan", label: "Kemasan" },
              { id: "sewa", label: "Sewa Tempat" },
              { id: "lainnya", label: "Lain-lain" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === cat.id
                    ? "bg-[#81181f] text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Expenses List / Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-4 border-[#d62934] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-[#81181f]">Memuat catatan pengeluaran...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-[#d59a9e]/40 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#efe6e6] text-[#d62934] flex items-center justify-center mb-3">
              <Receipt className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#81181f]">
              {expenses.length === 0
                ? "Belum Ada Catatan Pengeluaran"
                : "Tidak Ada Pengeluaran yang Sesuai Filter"}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-6">
              {expenses.length === 0
                ? "Catat biaya bahan baku, gas, kemasan, atau sewa untuk memantau arus kas pengeluaran toko."
                : "Coba ganti filter kategori atau bersihkan kolom pencarian."}
            </p>

            {expenses.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  setExpenseToEdit(null);
                  setIsModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white text-xs font-bold shadow-md shadow-[#d62934]/25 hover:opacity-95 cursor-pointer"
              >
                + Catat Pengeluaran Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#d59a9e]/30 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#efe6e6]/60 text-[#81181f] border-b border-[#d59a9e]/30 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Tanggal & Waktu</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Rincian Keterangan</th>
                    <th className="py-3.5 px-4 text-right">Nominal</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efe6e6]">
                  {filteredExpenses.map((expense) => {
                    const badge = getCategoryBadge(expense.kategori);
                    const Icon = badge.icon;

                    return (
                      <tr
                        key={expense.id}
                        className="hover:bg-[#efe6e6]/20 transition-colors"
                      >
                        {/* Tanggal */}
                        <td className="py-3.5 px-4 text-xs text-zinc-600 whitespace-nowrap">
                          {formatTanggal(expense.tanggal)}
                        </td>

                        {/* Kategori */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${badge.className}`}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        {/* Keterangan */}
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-zinc-900 leading-tight">
                            {expense.keterangan || "-"}
                          </p>
                        </td>

                        {/* Nominal */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="font-extrabold text-[#d62934] text-sm">
                            {formatRupiah(expense.jumlah)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setExpenseToEdit(expense);
                                setIsModalOpen(true);
                              }}
                              title="Edit Catatan"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-[#81181f] hover:bg-[#efe6e6] border border-zinc-200 transition-all cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setExpenseToDelete(expense)}
                              title="Hapus Catatan"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-[#d62934] hover:bg-red-50 border border-zinc-200 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setExpenseToEdit(null);
        }}
        onSuccess={refetch}
        expenseToEdit={expenseToEdit}
      />

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#d59a9e]/40 shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#d62934] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#81181f]">
              Hapus Pengeluaran?
            </h3>
            <p className="text-xs text-zinc-500 mt-1 mb-6">
              Catatan pengeluaran &quot;{expenseToDelete.keterangan}&quot; sebesar{" "}
              <strong>{formatRupiah(expenseToDelete.jumlah)}</strong> akan dihapus.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                disabled={isDeleting}
                className="py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="py-2.5 px-4 rounded-xl bg-[#d62934] hover:bg-[#81181f] text-white text-xs font-bold shadow-md shadow-[#d62934]/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Ya, Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
