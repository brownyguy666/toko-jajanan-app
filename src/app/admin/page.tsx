"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import {
  Package,
  Users,
  TrendingUp,
  Receipt,
  ShoppingBag,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#efe6e6]">
        <div className="w-8 h-8 border-4 border-[#d62934] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbfb] flex flex-col">
      <AdminNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-8 flex-1">
        {/* Welcome Card */}
        <div className="bg-linear-to-br from-[#efe6e6] via-white to-[#efe6e6]/60 rounded-3xl border border-[#d59a9e]/40 p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d62934]/10 border border-[#d62934]/20 text-[#81181f] text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#d62934]" />
              Panel Kontrol Owner
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#81181f] tracking-tight">
              Halo, {profile?.nama || "Pemilik Toko"}!
            </h2>
            <p className="text-sm text-zinc-600 mt-2 font-medium leading-relaxed">
              Anda memiliki akses penuh untuk mengelola katalog produk, stok jajanan, akun pegawai kasir, memantau omzet, laba, serta pengeluaran operasional.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/produk"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white text-sm font-bold shadow-md shadow-[#d62934]/25 hover:opacity-95 active:scale-98 transition-all touch-btn"
            >
              <Package className="w-4 h-4" />
              <span>Buka Katalog & Stok Produk</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/kasir"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-[#efe6e6] text-[#81181f] text-sm font-bold border border-[#d59a9e]/40 shadow-2xs active:scale-98 transition-all touch-btn"
            >
              <ShoppingBag className="w-4 h-4 text-[#d62934]" />
              <span>Buka Halaman Kasir (POS)</span>
            </Link>
          </div>
        </div>

        {/* Feature Modules Grid */}
        <h3 className="text-base font-extrabold text-[#81181f] uppercase tracking-wider mb-4">
          Modul Pengelolaan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Produk */}
          <Link
            href="/dashboard/produk"
            className="p-5 rounded-2xl bg-white border border-[#d59a9e]/30 shadow-sm hover:shadow-md hover:border-[#d62934]/40 transition-all block group"
          >
            <div className="w-11 h-11 rounded-xl bg-[#d62934]/10 text-[#d62934] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-[#81181f] text-base group-hover:text-[#d62934] transition-colors">
              Kelola Produk
            </h4>
            <p className="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed">
              Atur harga jual, harga modal, update stok jajanan, upload foto, & import Excel.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#d62934]">
              Buka Katalog &rarr;
            </span>
          </Link>

          {/* Card 2: Pegawai */}
          <Link
            href="/dashboard/pegawai"
            className="p-5 rounded-2xl bg-white border border-[#d59a9e]/30 shadow-sm hover:shadow-md transition-all block group"
          >
            <div className="w-11 h-11 rounded-xl bg-[#47d1b5]/15 text-[#0c6b57] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-[#81181f] text-base group-hover:text-[#0c6b57] transition-colors">
              Kelola Pegawai
            </h4>
            <p className="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed">
              Daftarkan akun kasir pegawai, atur status aktif, dan pantau performa kasir.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0c6b57]">
              Kelola Pegawai &rarr;
            </span>
          </Link>

          {/* Card 3: Laporan & Laba */}
          <Link
            href="/dashboard/laporan"
            className="p-5 rounded-2xl bg-white border border-[#d59a9e]/30 shadow-sm hover:shadow-md transition-all block group"
          >
            <div className="w-11 h-11 rounded-xl bg-[#81181f]/10 text-[#81181f] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-[#81181f] text-base">Laporan & Omzet</h4>
            <p className="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed">
              Hitung omzet harian/bulanan, laba bersih, dan produk terlaris.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#81181f]">
              Lihat Laporan &rarr;
            </span>
          </Link>

          {/* Card 4: Pengeluaran */}
          <Link
            href="/dashboard/pengeluaran"
            className="p-5 rounded-2xl bg-white border border-[#d59a9e]/30 shadow-sm hover:shadow-md transition-all block group"
          >
            <div className="w-11 h-11 rounded-xl bg-[#d59a9e]/20 text-[#81181f] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-[#81181f] text-base">Pengeluaran</h4>
            <p className="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed">
              Catat biaya bahan baku, gas, kemasan, sewa tempat, dan operasional lainnya.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#81181f]">
              Catat Pengeluaran &rarr;
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}

