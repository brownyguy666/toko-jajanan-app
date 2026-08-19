"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import {
  UtensilsCrossed,
  Package,
  Users,
  TrendingUp,
  Receipt,
  LogOut,
  ShoppingBag,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { profile, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#efe6e6]">
        <div className="w-8 h-8 border-4 border-[#d62934] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbfb] flex flex-col">
      {/* Header Bar */}
      <header className="bg-gradient-to-r from-[#81181f] to-[#d62934] text-white px-4 sm:px-8 py-4 shadow-lg shadow-[#81181f]/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight leading-tight">
                Toko Jajanan Admin
              </h1>
              <p className="text-xs text-white/80 font-medium">
                Panel Kontrol & Manajemen Pemilik (Owner)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-white leading-tight">
                {profile?.nama || "Owner"}
              </span>
              <span className="text-[11px] text-[#47d1b5] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#47d1b5]" />
                Owner Aktif
              </span>
            </div>

            <button
              onClick={() => signOut()}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 touch-btn cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-8 flex-1">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-[#efe6e6] via-white to-[#efe6e6]/60 rounded-3xl border border-[#d59a9e]/40 p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d62934]/10 border border-[#d62934]/20 text-[#81181f] text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#d62934]" />
              Selamat Datang Kembali
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
              href="/kasir"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#d62934] to-[#81181f] text-white text-sm font-bold shadow-md shadow-[#d62934]/25 hover:opacity-95 active:scale-98 transition-all touch-btn"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buka Halaman Kasir (POS)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Feature Modules Grid */}
        <h3 className="text-base font-extrabold text-[#81181f] uppercase tracking-wider mb-4">
          Modul Pengelolaan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Produk */}
          <div className="p-5 rounded-2xl bg-white border border-[#d59a9e]/30 shadow-sm hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-[#d62934]/10 text-[#d62934] flex items-center justify-center mb-4">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-[#81181f] text-base">Kelola Produk</h4>
            <p className="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed">
              Atur harga jual, harga modal, update stok jajanan, dan upload foto produk.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#d62934]">
              Siap dikonfigurasi &rarr;
            </span>
          </div>

          {/* Card 2: Pegawai */}
          <div className="p-5 rounded-2xl bg-white border border-[#d59a9e]/30 shadow-sm hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-[#47d1b5]/15 text-[#0c6b57] flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-[#81181f] text-base">Kelola Pegawai</h4>
            <p className="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed">
              Daftarkan akun kasir pegawai, atur status aktif, dan pantau performa kasir.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0c6b57]">
              Siap dikonfigurasi &rarr;
            </span>
          </div>

          {/* Card 3: Laporan & Laba */}
          <div className="p-5 rounded-2xl bg-white border border-[#d59a9e]/30 shadow-sm hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-[#81181f]/10 text-[#81181f] flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-[#81181f] text-base">Laporan & Omzet</h4>
            <p className="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed">
              Hitung omzet harian/bulanan, laba bersih, dan produk terlaris.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#81181f]">
              Siap dikonfigurasi &rarr;
            </span>
          </div>

          {/* Card 4: Pengeluaran */}
          <div className="p-5 rounded-2xl bg-white border border-[#d59a9e]/30 shadow-sm hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-[#d59a9e]/20 text-[#81181f] flex items-center justify-center mb-4">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-[#81181f] text-base">Pengeluaran</h4>
            <p className="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed">
              Catat biaya bahan baku, gas, kemasan, sewa tempat, dan operasional lainnya.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#81181f]">
              Siap dikonfigurasi &rarr;
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
