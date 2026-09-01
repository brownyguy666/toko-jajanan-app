"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import {
  getProductsWithRecipesAction,
  ProdukWithRecipeDetails,
} from "@/app/dashboard/resep/actions";
import { RecipeDetailModal } from "@/components/resep/RecipeDetailModal";
import { RecipeEditorModal } from "@/components/resep/RecipeEditorModal";
import { formatRupiah } from "@/lib/utils";
import {
  ChefHat,
  Search,
  BookOpen,
  Clock,
  Layers,
  Sparkles,
  Edit3,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  Image as ImageIcon,
  Plus,
  ArrowRight,
} from "lucide-react";

export default function ResepDashboardPage() {
  const [products, setProducts] = useState<ProdukWithRecipeDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // Modals state
  const [detailProduct, setDetailProduct] = useState<ProdukWithRecipeDetails | null>(null);
  const [editProduct, setEditProduct] = useState<ProdukWithRecipeDetails | null>(null);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const res = await getProductsWithRecipesAction();
    if (res.success && res.data) {
      setProducts(res.data);
      // Jika sedang melihat detail, update referensinya
      if (detailProduct) {
        const updated = res.data.find((p) => p.id === detailProduct.id);
        if (updated) setDetailProduct(updated);
      }
    }
    setLoading(false);
  }, [detailProduct]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Categories list
  const categories = useMemo(() => {
    return [
      "Semua",
      ...Array.from(new Set(products.map((p) => p.kategori).filter(Boolean))),
    ];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === "Semua" || p.kategori === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = products.length;
    const withSteps = products.filter(
      (p) => p.langkah_pembuatan && p.langkah_pembuatan.trim().length > 0
    ).length;
    const withIngredients = products.filter(
      (p) => p.resep_details && p.resep_details.length > 0
    ).length;
    return { total, withSteps, withIngredients };
  }, [products]);

  const handleOpenDetail = (p: ProdukWithRecipeDetails) => {
    setDetailProduct(p);
  };

  const handleOpenEdit = (p: ProdukWithRecipeDetails) => {
    setEditProduct(p);
  };

  return (
    <div className="min-h-screen bg-[#fdfbfb] flex flex-col">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#81181f] tracking-tight flex items-center gap-2.5">
              <ChefHat className="w-7 h-7 text-[#d62934]" />
              <span>Buku Resep & Rahasia Dapur</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
              Kumpulan takaran bahan, bumbu rahasia, dan langkah memasak setiap menu jajanan.
            </p>
          </div>

          <Link
            href="/dashboard/bahan-baku"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#efe6e6] text-[#81181f] text-xs font-bold border border-[#d59a9e]/40 shadow-xs active:scale-98 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Layers className="w-4 h-4 text-[#d62934]" />
            <span>Kelola Harga Bahan Baku</span>
          </Link>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="p-4 rounded-3xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Total Menu Jajanan</span>
              <BookOpen className="w-4 h-4 text-[#81181f]" />
            </div>
            <p className="text-2xl font-extrabold text-[#81181f]">{stats.total}</p>
            <span className="text-[10px] text-zinc-400">Tercatat di katalog dapur</span>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Panduan Masak Lengkap</span>
              <UtensilsCrossed className="w-4 h-4 text-[#0c6b57]" />
            </div>
            <p className="text-2xl font-extrabold text-[#0c6b57]">
              {stats.withSteps}{" "}
              <span className="text-xs text-zinc-400 font-normal">/ {stats.total} menu</span>
            </p>
            <span className="text-[10px] text-zinc-400">Sudah memiliki langkah cara membuat</span>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Resep Bahan Baku</span>
              <Layers className="w-4 h-4 text-[#d62934]" />
            </div>
            <p className="text-2xl font-extrabold text-[#d62934]">
              {stats.withIngredients}{" "}
              <span className="text-xs text-zinc-400 font-normal">/ {stats.total} menu</span>
            </p>
            <span className="text-[10px] text-zinc-400">Tersambung dengan kalkulasi HPP</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-3xl border border-[#d59a9e]/30 p-3 sm:p-4 shadow-sm space-y-3 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama resep jajanan..."
                className="input-field pl-10 py-2.5 text-xs sm:text-sm"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#81181f] text-white shadow-2xs"
                      : "bg-[#efe6e6]/60 text-[#81181f] border border-[#d59a9e]/30 hover:bg-[#efe6e6]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recipe Cards Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-4 border-[#d62934] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-[#81181f]">Membuka buku resep...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-[#d59a9e]/40 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#efe6e6] text-[#d62934] flex items-center justify-center mb-3">
              <ChefHat className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#81181f]">Belum Ada Resep</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              {searchQuery
                ? "Tidak ada resep yang sesuai dengan kata kunci pencarian Anda."
                : "Tambahkan produk di menu Katalog Produk untuk mulai mencatat resep."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredProducts.map((p) => {
              const hasSteps = Boolean(p.langkah_pembuatan?.trim());
              const ingredientCount = p.resep_details?.length || 0;
              const effectiveHpp = p.hpp_terkini || p.harga_modal || 0;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border border-[#d59a9e]/30 shadow-sm hover:shadow-md hover:border-[#d62934]/40 transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Image & Category */}
                    <div className="relative h-44 w-full bg-[#efe6e6]/60 flex items-center justify-center overflow-hidden">
                      {p.foto_url ? (
                        <Image
                          src={p.foto_url}
                          alt={p.nama}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-[#d59a9e]" />
                      )}

                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-md text-[#81181f] text-[11px] font-extrabold shadow-2xs">
                          {p.kategori}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3">
                        {hasSteps ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-extrabold shadow-2xs">
                            <CheckCircle2 className="w-3 h-3" />
                            Resep Lengkap
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-extrabold shadow-2xs">
                            <AlertCircle className="w-3 h-3" />
                            Belum Ada Cara Masak
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 sm:p-5 space-y-3">
                      <div>
                        <h3 className="font-extrabold text-base text-zinc-900 leading-tight group-hover:text-[#81181f] transition-colors">
                          {p.nama}
                        </h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Harga Jual: <strong className="text-zinc-700">{formatRupiah(p.harga_jual)}</strong>
                        </p>
                      </div>

                      {/* Recipe Badges */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-2xl bg-[#efe6e6]/50 border border-[#d59a9e]/20 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#d62934] shrink-0" />
                          <div className="truncate">
                            <span className="text-[10px] text-zinc-400 block">Durasi</span>
                            <span className="font-extrabold text-[#81181f] text-xs">
                              ~{p.durasi_menit || 30} Menit
                            </span>
                          </div>
                        </div>

                        <div className="p-2 rounded-2xl bg-[#efe6e6]/50 border border-[#d59a9e]/20 flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-[#0c6b57] shrink-0" />
                          <div className="truncate">
                            <span className="text-[10px] text-zinc-400 block">Komposisi</span>
                            <span className="font-extrabold text-[#0c6b57] text-xs">
                              {ingredientCount} Bahan
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* HPP Preview */}
                      <div className="p-2.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between text-xs">
                        <span className="text-zinc-500 font-semibold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-[#47d1b5]" />
                          <span>HPP Modal / Porsi:</span>
                        </span>
                        <span className="font-extrabold text-[#0c6b57]">
                          {formatRupiah(effectiveHpp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-[#efe6e6] text-zinc-700 hover:text-[#81181f] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{hasSteps ? "Edit Catatan" : "+ Tulis Cara"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDetail(p)}
                      className="px-4 py-2 rounded-xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white text-xs font-extrabold shadow-md shadow-[#d62934]/20 hover:opacity-95 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Buka Resep</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Recipe Detail Modal (View, Batch Multiplier, Print) */}
      <RecipeDetailModal
        isOpen={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        product={detailProduct}
        onEditClick={(p) => {
          setDetailProduct(null);
          setEditProduct(p);
        }}
      />

      {/* Recipe Editor Modal */}
      <RecipeEditorModal
        isOpen={Boolean(editProduct)}
        onClose={() => setEditProduct(null)}
        onSuccess={() => {
          fetchRecipes();
        }}
        product={editProduct}
      />
    </div>
  );
}
