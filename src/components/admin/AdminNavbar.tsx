"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  UtensilsCrossed,
  Package,
  Users,
  LayoutDashboard,
  Receipt,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  Shield,
  ExternalLink,
  Wheat,
  ChefHat,
} from "lucide-react";

export function AdminNavbar() {
  const pathname = usePathname();
  const { profile, user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const displayName = profile?.nama || user?.user_metadata?.nama || "Hidayatul Fitri";

  const navItems = [
    {
      name: "Ringkasan & Laporan",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard" || pathname === "/admin",
    },
    {
      name: "Katalog Produk",
      href: "/dashboard/produk",
      icon: Package,
      active: pathname.startsWith("/dashboard/produk"),
    },
    {
      name: "Bahan Baku & HPP",
      href: "/dashboard/bahan-baku",
      icon: Wheat,
      active: pathname.startsWith("/dashboard/bahan-baku"),
    },
    {
      name: "Buku Resep",
      href: "/dashboard/resep",
      icon: ChefHat,
      active: pathname.startsWith("/dashboard/resep"),
    },
    {
      name: "Kelola Pegawai",
      href: "/dashboard/pegawai",
      icon: Users,
      active: pathname.startsWith("/dashboard/pegawai"),
    },
    {
      name: "Pengeluaran",
      href: "/dashboard/pengeluaran",
      icon: Receipt,
      active: pathname.startsWith("/dashboard/pengeluaran"),
    },
  ];



  return (
    <header className="sticky top-0 z-40 bg-linear-to-r from-[#81181f] via-primary-hover to-[#d62934] text-white shadow-lg shadow-[#81181f]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand / Logo */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 group active:scale-98 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner group-hover:bg-white/25 transition-all">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg tracking-tight leading-none block">
                  Toko Jajanan
                </span>
                <span className="text-[10px] text-[#47d1b5] font-bold tracking-wider uppercase block">
                  Owner Dashboard
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-black/15 p-1 rounded-2xl border border-white/10 backdrop-blur-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    item.active
                      ? "bg-white text-[#81181f] shadow-sm"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: POS Quick Launch & Profile */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/kasir"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#47d1b5] hover:bg-[#3ec4a9] text-[#0c4a3c] font-bold text-xs shadow-sm hover:shadow transition-all active:scale-98 touch-btn cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buka POS Kasir</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>

            <div className="h-6 w-px bg-white/20" />

            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs font-bold text-white leading-tight truncate max-w-30">
                  {displayName}
                </p>
                <span className="text-[10px] text-white/70">Pemilik Bisnis</span>
              </div>


              <button
                onClick={() => signOut()}
                title="Keluar Akun"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/kasir"
              className="p-2 rounded-xl bg-[#47d1b5] text-[#0c4a3c] font-bold text-xs flex items-center justify-center"
              title="Buka Kasir"
            >
              <ShoppingBag className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/15 text-white border border-white/20 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/15 bg-[#81181f] px-4 py-3 space-y-1.5 animate-fadeIn">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  item.active
                    ? "bg-white text-[#81181f]"
                    : "text-white/90 hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-2 mt-2 border-t border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#47d1b5]" />
              <span className="text-xs font-bold text-white">
                {profile?.nama || "Owner"}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1 text-xs font-bold text-rose-200 hover:text-white px-2 py-1 rounded-lg bg-black/20 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
