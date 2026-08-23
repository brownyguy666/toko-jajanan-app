"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Produk } from "@/types/database";
import { formatRupiah } from "@/lib/utils";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { ProductModal } from "@/components/produk/ProductModal";
import { ImportModal } from "@/components/produk/ImportModal";
import {
  Package,
  Plus,
  FileSpreadsheet,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Boxes,
  DollarSign,
  UtensilsCrossed,
  Image as ImageIcon,
  PowerOff,
} from "lucide-react";


export default function ProdukManagementPage() {
  const supabase = createClient();

  const [products, setProducts] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Produk | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Delete / Deactivate modal confirmation
  const [productToDelete, setProductToDelete] = useState<Produk | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const refetch = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("produk")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (isMounted) {
          setProducts((data as Produk[]) || []);
        }
      } catch (err: unknown) {
        console.error("Error loading products:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [supabase, refreshTrigger]);

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("produk")
        .delete()
        .eq("id", productToDelete.id);

      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setProductToDelete(null);
    } catch (err: unknown) {
      console.error("Error deleting product:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      alert(`Gagal menghapus produk: ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle nonaktifkan / kosongkan stok
  const handleToggleStockZero = async (product: Produk) => {
    try {
      const newStock = product.stok > 0 ? 0 : 20;
      const { error } = await supabase
        .from("produk")
        .update({ stok: newStock, updated_at: new Date().toISOString() } as never)
        .eq("id", product.id);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stok: newStock } : p))
      );
    } catch (err: unknown) {
      console.error("Error updating stock:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      alert(`Gagal mengubah stok: ${msg}`);
    }
  };

  // Distinct categories from existing products + defaults
  const categories = [
    "Semua",
    ...Array.from(
      new Set([
        "Gorengan",
        "Kue Basah",
        "Keripik & Kerupuk",
        "Minuman",
        "Dimsum & Frozen",
        "Roti & Bolu",
        ...products.map((p) => p.kategori).filter(Boolean),
      ])
    ),
  ];

  // Filtering products
  const filteredProducts = products.filter((item) => {
    const matchesSearch =
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kategori.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "Semua" || item.kategori === selectedCategory;

    let matchesStock = true;
    const minThreshold = item.stok_minimum ?? 5;
    if (stockFilter === "out_of_stock") {
      matchesStock = item.stok === 0;
    } else if (stockFilter === "low_stock") {
      matchesStock = item.stok > 0 && item.stok <= minThreshold;
    } else if (stockFilter === "in_stock") {
      matchesStock = item.stok > minThreshold;
    }


    return matchesSearch && matchesCategory && matchesStock;
  });

  // Calculate Metrics
  const totalProductsCount = products.length;
  const totalStockCount = products.reduce((acc, p) => acc + (p.stok || 0), 0);
  const totalInventoryValue = products.reduce(
    (acc, p) => acc + (p.harga_jual || 0) * (p.stok || 0),
    0
  );
  const totalPotentialProfit = products.reduce(
    (acc, p) => {
      const hpp = p.hpp_terkini ?? p.harga_modal ?? 0;
      return acc + ((p.harga_jual || 0) - hpp) * (p.stok || 0);
    },
    0
  );


  return (
    <div className="min-h-screen bg-[#fdfbfb] flex flex-col">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#81181f] tracking-tight">
              Katalog & Stok Jajanan
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
              Kelola menu produk, harga modal & jual, foto, dan sisa stok jajanan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#efe6e6] text-[#81181f] text-xs font-bold border border-[#d59a9e]/40 shadow-xs active:scale-98 transition-all touch-btn cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#d62934]" />
              <span>Import CSV / Excel</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setProductToEdit(null);
                setIsProductModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white text-xs font-bold shadow-md shadow-[#d62934]/25 hover:opacity-95 active:scale-98 transition-all touch-btn cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk Baru</span>
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
              <Package className="w-4 h-4 text-[#d62934]" />
              <span>Total Varian</span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#81181f]">
              {totalProductsCount}{" "}
              <span className="text-xs text-zinc-400 font-normal">menu</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
              <Boxes className="w-4 h-4 text-[#47d1b5]" />
              <span>Total Stok</span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#81181f]">
              {totalStockCount}{" "}
              <span className="text-xs text-zinc-400 font-normal">porsi</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
              <DollarSign className="w-4 h-4 text-[#81181f]" />
              <span>Nilai Aset Jual</span>
            </div>
            <p className="text-base sm:text-xl font-extrabold text-[#81181f] truncate">
              {formatRupiah(totalInventoryValue)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
              <TrendingUp className="w-4 h-4 text-[#0c6b57]" />
              <span>Potensi Laba Kotor</span>
            </div>
            <p className="text-base sm:text-xl font-extrabold text-[#0c6b57] truncate">
              {formatRupiah(totalPotentialProfit)}
            </p>
          </div>
        </div>

        {/* Toolbar: Search, Filters */}
        <div className="bg-white rounded-3xl border border-[#d59a9e]/30 p-4 sm:p-5 shadow-sm mb-6 space-y-4">
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
                placeholder="Cari nama atau kategori jajanan..."
                className="input-field pl-10 py-2.5 text-xs sm:text-sm"
              />
            </div>

            {/* Stock Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-zinc-400 mr-1 hidden sm:inline">
                Stok:
              </span>
              <button
                type="button"
                onClick={() => setStockFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  stockFilter === "all"
                    ? "bg-[#81181f] text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                Semua ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setStockFilter("in_stock")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  stockFilter === "in_stock"
                    ? "bg-[#0c6b57] text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                Tersedia
              </button>
              <button
                type="button"
                onClick={() => setStockFilter("low_stock")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  stockFilter === "low_stock"
                    ? "bg-amber-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                Menipis (&lt;10)
              </button>
              <button
                type="button"
                onClick={() => setStockFilter("out_of_stock")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  stockFilter === "out_of_stock"
                    ? "bg-[#d62934] text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                Habis (0)
              </button>
            </div>
          </div>

          {/* Category Filter Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-zinc-400 mr-1 hidden sm:inline">
              Kategori:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#d62934] text-white shadow-2xs"
                    : "bg-[#efe6e6]/60 text-[#81181f] border border-[#d59a9e]/30 hover:bg-[#efe6e6]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Table / Cards List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-[#d62934] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-[#81181f]">Memuat katalog jajanan...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border-2 border-dashed border-[#d59a9e]/40 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#efe6e6] text-[#d62934] flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#81181f]">
              {products.length === 0
                ? "Belum Ada Produk Jajanan"
                : "Tidak Ada Produk yang Cocok"}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-6">
              {products.length === 0
                ? "Mulai dengan menambahkan produk pertama Anda atau gunakan fitur import file CSV/Excel."
                : "Coba ubah kata kunci pencarian atau bersihkan filter kategori/stok."}
            </p>

            <div className="flex flex-wrap gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => {
                  setProductToEdit(null);
                  setIsProductModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white text-xs font-bold shadow-sm hover:opacity-95 cursor-pointer"
              >
                + Tambah Produk Manual
              </button>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#efe6e6] hover:bg-[#d59a9e]/30 text-[#81181f] text-xs font-bold border border-[#d59a9e]/40 cursor-pointer"
              >
                Import dari Excel / CSV
              </button>
            </div>
          </div>
        ) : (
          /* Product Grid & Table */
          <div className="bg-white rounded-3xl border border-[#d59a9e]/30 shadow-sm overflow-hidden">
            {/* Desktop Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#efe6e6]/60 text-[#81181f] border-b border-[#d59a9e]/30 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Produk</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4 text-right">Harga Jual</th>
                    <th className="py-3.5 px-4 text-right">HPP / Modal</th>
                    <th className="py-3.5 px-4 text-right">Margin / Porsi</th>
                    <th className="py-3.5 px-4 text-center">Stok</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efe6e6]">
                  {filteredProducts.map((p) => {
                    const effectiveHpp = p.hpp_terkini ?? p.harga_modal ?? 0;
                    const laba = p.harga_jual - effectiveHpp;
                    const margin =
                      p.harga_jual > 0
                        ? Math.round((laba / p.harga_jual) * 100)
                        : 0;

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-[#efe6e6]/20 transition-colors ${
                          p.stok === 0 ? "bg-red-50/20" : ""
                        }`}
                      >
                        {/* Foto & Nama */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-xl bg-[#efe6e6] border border-[#d59a9e]/30 overflow-hidden shrink-0 flex items-center justify-center">
                              {p.foto_url ? (
                                <Image
                                  src={p.foto_url}
                                  alt={p.nama}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-[#d59a9e]" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-[#1c1314] leading-tight">
                                {p.nama}
                              </p>
                              <span className="text-[11px] text-zinc-400">
                                ID: {p.id.substring(0, 8)}
                              </span>
                            </div>
                          </div>
                        </td>


                        {/* Kategori */}
                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-[#efe6e6]/70 border border-[#d59a9e]/30 text-[11px] font-semibold text-[#81181f]">
                            {p.kategori}
                          </span>
                        </td>

                        {/* Harga Jual */}
                        <td className="py-3 px-4 text-right font-extrabold text-[#81181f]">
                          {formatRupiah(p.harga_jual)}
                        </td>

                        {/* HPP / Modal */}
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-zinc-700 block">
                            {formatRupiah(effectiveHpp)}
                          </span>
                          {p.hpp_terkini !== undefined && p.hpp_terkini > 0 && (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              HPP Resep
                            </span>
                          )}
                        </td>

                        {/* Laba & Margin */}
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-[#0c6b57] block">
                            +{formatRupiah(laba)}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {margin}% laba
                          </span>
                        </td>


                        {/* Stok Badge */}
                        <td className="py-3 px-4 text-center">
                          {p.stok === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#d62934]/10 text-[#d62934] text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#d62934]" />
                              Habis (0)
                            </span>
                          ) : p.stok <= (p.stok_minimum ?? 5) ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 text-[11px] font-bold" title={`Stok minimum: ${p.stok_minimum ?? 5}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {p.stok} porsi (Min. {p.stok_minimum ?? 5})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#47d1b5]/15 text-[#0c6b57] text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#47d1b5]" />
                              {p.stok} porsi
                            </span>
                          )}
                        </td>


                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            {/* Toggle Stok 0 / Tersedia */}
                            <button
                              type="button"
                              onClick={() => handleToggleStockZero(p)}
                              title={p.stok > 0 ? "Set Stok Jadi 0 (Habis)" : "Set Stok Tersedia (20)"}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                p.stok > 0
                                  ? "text-zinc-400 hover:text-amber-600 hover:bg-amber-50 border-zinc-200"
                                  : "text-zinc-400 hover:text-[#0c6b57] hover:bg-[#47d1b5]/10 border-zinc-200"
                              }`}
                            >
                              <PowerOff className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => {
                                setProductToEdit(p);
                                setIsProductModalOpen(true);
                              }}
                              title="Edit Produk"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-[#81181f] hover:bg-[#efe6e6] border border-zinc-200 transition-all cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setProductToDelete(p)}
                              title="Hapus Produk"
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

      {/* Product Form Modal (Tambah/Edit) */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={refetch}
        productToEdit={productToEdit}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={refetch}
      />

      {/* Modal Konfirmasi Hapus Produk */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#d59a9e]/40 shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#d62934] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#81181f]">
              Hapus Produk Ini?
            </h3>
            <p className="text-xs text-zinc-500 mt-1 mb-6">
              Produk <strong>&quot;{productToDelete.nama}&quot;</strong> akan dihapus permanen dari katalog.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
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
