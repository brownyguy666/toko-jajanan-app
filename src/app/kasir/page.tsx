"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import {
  UtensilsCrossed,
  LogOut,
  ShoppingBag,
  History,
  Shield,
  Layers,
} from "lucide-react";
import Link from "next/link";

export default function KasirPage() {
  const { profile, role, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#efe6e6]">
        <div className="w-8 h-8 border-4 border-[#d62934] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbfb] flex flex-col">
      {/* Mobile-first Header */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-[#81181f] to-[#d62934] text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between gap-2 max-w-5xl mx-auto">
          {/* Logo & Kasir identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shrink-0">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm sm:text-base leading-tight truncate">
                Kasir Jajanan
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-white/90">
                <span className="truncate font-semibold">{profile?.nama || "Kasir"}</span>
                <span className="w-1 h-1 rounded-full bg-[#47d1b5]" />
                <span className="text-[#47d1b5] font-bold text-[10px] uppercase">
                  {role === "owner" ? "Owner" : "Pegawai"}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {role === "owner" && (
              <Link
                href="/admin"
                className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1 touch-btn"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Panel Owner</span>
              </Link>
            )}

            <button
              onClick={() => signOut()}
              title="Keluar Akun"
              className="px-2.5 py-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white text-xs font-bold border border-white/10 transition-all flex items-center gap-1 touch-btn cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 flex flex-col">
        {/* Quick Info Card */}
        <div className="bg-gradient-to-br from-[#efe6e6] via-white to-[#efe6e6]/60 rounded-3xl border border-[#d59a9e]/40 p-5 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#47d1b5]/15 border border-[#47d1b5]/30 text-[#0c6b57] text-[11px] font-bold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#47d1b5]" />
              Kasir Siap Melayani
            </div>
            <h2 className="text-xl font-extrabold text-[#81181f]">
              Selamat Bertugas, {profile?.nama || "Kasir"}!
            </h2>
            <p className="text-xs text-zinc-600 mt-1 font-medium">
              Sistem kasir siap digunakan untuk mencatat pesanan pelanggan secara cepat dan akurat.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white border border-[#d59a9e]/40 text-[#81181f] text-xs font-bold shadow-sm hover:bg-[#efe6e6]/50 transition-all touch-btn"
            >
              <History className="w-4 h-4 text-[#d62934]" />
              <span>Riwayat Transaksi Saya</span>
            </button>
          </div>
        </div>

        {/* Placeholder for POS Grid */}
        <div className="flex-1 rounded-3xl border-2 border-dashed border-[#d59a9e]/40 bg-[#efe6e6]/20 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
          <div className="w-16 h-16 rounded-2xl bg-[#efe6e6] text-[#d62934] flex items-center justify-center mb-3 shadow-inner">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-[#81181f]">
            Grid Katalog Menu & Keranjang Kasir POS
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1 leading-relaxed">
            Halaman ini terproteksi dengan aman. Hanya kasir aktif yang dapat membuat transaksi penjualan baru.
          </p>
        </div>
      </main>
    </div>
  );
}
