"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Produk } from "@/types/database";
import { formatRupiah } from "@/lib/utils";
import { KasirHeader } from "@/components/kasir/KasirHeader";
import { CartDrawer, CartItemWithStock } from "@/components/kasir/CartDrawer";
import { ReceiptModal } from "@/components/kasir/ReceiptModal";
import { TodayHistoryView } from "@/components/kasir/TodayHistoryView";
import { OfflineQueueBar } from "@/components/kasir/OfflineQueueBar";
import { TransactionResult } from "@/app/kasir/actions";

import {
  Search,
  Plus,
  ShoppingBag,
  Image as ImageIcon,
  Check,
  UtensilsCrossed,
} from "lucide-react";


export default function KasirPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"menu" | "history">("menu");
  const [products, setProducts] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [refreshKey, setRefreshKey] = useState(0);

  // Cart state
  const [cart, setCart] = useState<CartItemWithStock[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Transaction Receipt Modal
  const [receiptData, setReceiptData] = useState<TransactionResult | null>(null);

  // Fetch active products
  const refetchProducts = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("produk")
          .select("*")
          .order("nama", { ascending: true });

        if (error) throw error;
        if (isMounted) {
          setProducts((data as Produk[]) || []);
        }
      } catch (err: unknown) {
        console.error("Error loading products for cashier:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [supabase, refreshKey]);

  // Cart Operations
  const handleAddToCart = (product: Produk) => {
    if (product.stok <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.produk_id === product.id);
      if (existing) {
        if (existing.qty >= product.stok) return prev;
        return prev.map((item) =>
          item.produk_id === product.id
            ? { ...item, qty: item.qty + 1, maxStok: product.stok }
            : item
        );
      } else {
        return [
          ...prev,
          {
            produk_id: product.id,
            nama: product.nama,
            qty: 1,
            harga_jual: product.harga_jual,
            maxStok: product.stok,
          },
        ];
      }
    });
  };

  const handleUpdateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.produk_id === productId) {
          const clampedQty = Math.min(newQty, item.maxStok);
          return { ...item, qty: clampedQty };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.produk_id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleTransactionSuccess = (result: TransactionResult) => {
    setReceiptData(result);

    // Jika transaksi offline, potong stok di state lokal langsung agar kasir bisa lanjut jualan tanpa lag
    if (result.is_offline && result.items) {
      setProducts((prev) =>
        prev.map((p) => {
          const soldItem = result.items?.find((i) => i.nama === p.nama);
          if (soldItem) {
            return { ...p, stok: Math.max(0, p.stok - soldItem.qty) };
          }
          return p;
        })
      );
    } else {
      refetchProducts();
    }
  };

  // Categories list
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
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kategori.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Semua" || p.kategori === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalCartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalCartPrice = cart.reduce(
    (sum, item) => sum + item.harga_jual * item.qty,
    0
  );

  return (
    <div className="min-h-screen bg-[#fdfbfb] flex flex-col pb-24 sm:pb-8">
      {/* Kasir Header */}
      <KasirHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartCount={totalCartItemCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex-1">
        {/* Offline Queue Connection & Sync Bar */}
        <OfflineQueueBar onSyncComplete={refetchProducts} />

        {activeTab === "history" ? (
          <TodayHistoryView />
        ) : (
          <div className="space-y-4 sm:space-y-5">

            {/* Search & Categories Bar */}
            <div className="bg-white rounded-3xl border border-[#d59a9e]/30 p-3 sm:p-4 shadow-sm space-y-3">
              {/* Search input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari jajanan lezat..."
                  className="input-field pl-10 py-2.5 text-xs sm:text-sm"
                />
              </div>

              {/* Category Pills Horizontal Scroll */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
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

            {/* Product Grid */}
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-4 border-[#d62934] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-[#81181f]">Memuat katalog jajanan...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-[#d59a9e]/40 p-12 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-[#efe6e6] text-[#d62934] flex items-center justify-center mb-3">
                  <UtensilsCrossed className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-[#81181f]">
                  Tidak Ada Produk Ditemukan
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Coba ubah kata kunci pencarian atau pilih kategori lain.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stok <= 0;
                  const cartItem = cart.find((i) => i.produk_id === p.id);
                  const isCartMax = Boolean(cartItem && cartItem.qty >= p.stok);

                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOutOfStock && handleAddToCart(p)}
                      className={`group relative bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden cursor-pointer active:scale-97 select-none ${
                        isOutOfStock
                          ? "border-zinc-200 opacity-60 cursor-not-allowed"
                          : cartItem
                          ? "border-[#d62934] shadow-md ring-2 ring-[#d62934]/20"
                          : "border-[#d59a9e]/30 shadow-2xs hover:shadow-md hover:border-[#d62934]/50"
                      }`}
                    >
                      {/* Product Image */}
                      <div className="relative w-full aspect-4/3 bg-[#efe6e6] overflow-hidden flex items-center justify-center">
                        {p.foto_url ? (
                          <Image
                            src={p.foto_url}
                            alt={p.nama}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-[#d59a9e]" />
                        )}

                        {/* Category Badge Over Image */}
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider">
                            {p.kategori}
                          </span>
                        </div>

                        {/* In-cart count badge */}
                        {cartItem && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#d62934] text-white text-xs font-extrabold flex items-center justify-center shadow-md animate-scaleIn">
                            {cartItem.qty}
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-zinc-900 line-clamp-2 leading-tight">
                            {p.nama}
                          </h4>
                          <p className="text-sm sm:text-base font-extrabold text-[#81181f] mt-1">
                            {formatRupiah(p.harga_jual)}
                          </p>
                        </div>

                        {/* Stock & Quick Add */}
                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                          {isOutOfStock ? (
                            <span className="text-[11px] font-bold text-[#d62934]">
                              Habis (0)
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-zinc-500">
                              Stok: <strong className="text-zinc-800">{p.stok}</strong>
                            </span>
                          )}

                          <button
                            type="button"
                            disabled={isOutOfStock || isCartMax}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                              isOutOfStock
                                ? "bg-zinc-100 text-zinc-400"
                                : cartItem
                                ? "bg-[#47d1b5] text-[#0c4a3c] font-bold"
                                : "bg-[#efe6e6] text-[#81181f] group-hover:bg-[#d62934] group-hover:text-white"
                            }`}
                          >
                            {cartItem ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar for Touch Screen / Mobile */}
      {activeTab === "menu" && cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 bg-white/95 backdrop-blur-md border-t border-[#d59a9e]/30 shadow-2xl animate-slideInUp">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#81181f] text-white flex items-center justify-center font-extrabold shadow-sm shrink-0">
                {totalCartItemCount}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-zinc-500 block leading-tight">
                  Total Tagihan ({cart.length} menu)
                </span>
                <span className="text-base sm:text-lg font-extrabold text-[#81181f]">
                  {formatRupiah(totalCartPrice)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="py-2.5 sm:py-3 px-5 sm:px-6 rounded-2xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-[#d62934]/30 hover:opacity-95 active:scale-98 transition-all flex items-center gap-2 touch-btn cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Lihat Pesanan & Bayar</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onTransactionSuccess={handleTransactionSuccess}
      />

      {/* Digital Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(receiptData)}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </div>
  );
}
