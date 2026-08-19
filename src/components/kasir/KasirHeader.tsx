"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  UtensilsCrossed,
  ShoppingBag,
  History,
  LayoutDashboard,
  LogOut,
  UserCheck,
} from "lucide-react";

interface KasirHeaderProps {
  activeTab: "menu" | "history";
  onTabChange: (tab: "menu" | "history") => void;
  cartCount: number;
  onOpenCart: () => void;
}

export function KasirHeader({
  activeTab,
  onTabChange,
  cartCount,
  onOpenCart,
}: KasirHeaderProps) {
  const { profile, signOut } = useAuth();
  const isOwner = profile?.role === "owner";

  return (
    <header className="sticky top-0 z-40 bg-linear-to-r from-[#81181f] via-primary-hover to-[#d62934] text-white shadow-md shadow-[#81181f]/10">

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
            <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="hidden min-[380px]:block">
            <span className="font-extrabold text-sm sm:text-base tracking-tight leading-none block text-white">
              Toko Jajanan
            </span>
            <span className="text-[10px] text-[#47d1b5] font-bold tracking-wider uppercase block">
              POS Kasir
            </span>
          </div>
        </div>

        {/* Tab Switcher: Menu POS vs Riwayat Hari Ini */}
        <div className="flex items-center bg-black/20 p-1 rounded-2xl border border-white/15 backdrop-blur-xs">
          <button
            type="button"
            onClick={() => onTabChange("menu")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "menu"
                ? "bg-white text-[#81181f] shadow-xs"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Katalog</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("history")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-white text-[#81181f] shadow-xs"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Hari Ini</span>
          </button>
        </div>

        {/* Right Actions: Cart & Profile */}
        <div className="flex items-center gap-2">
          {/* Cart Trigger Button */}
          {activeTab === "menu" && (
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#47d1b5] hover:bg-[#3ec4a9] text-[#0c4a3c] font-extrabold text-xs shadow-sm active:scale-95 transition-all touch-btn cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Pesanan</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#d62934] text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs animate-scaleIn">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* If Owner: shortcut to Dashboard */}
          {isOwner && (
            <Link
              href="/dashboard/produk"
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all"
              title="Dashboard Owner"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          )}

          {/* Cashier Name & Logout */}
          <div className="flex items-center gap-1.5 pl-1">
            <div className="hidden lg:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-white leading-tight truncate max-w-25">
                {profile?.nama || "Kasir"}
              </span>

              <span className="text-[10px] text-white/70 flex items-center gap-0.5">
                <UserCheck className="w-3 h-3 text-[#47d1b5]" />
                {isOwner ? "Owner (Kasir)" : "Kasir"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => signOut()}
              title="Keluar Akun"
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
