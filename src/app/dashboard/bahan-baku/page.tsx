"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { BahanBakuModal } from "@/components/bahan-baku/BahanBakuModal";
import {
  getBahanBakuListAction,
  createBahanBakuAction,
  updateBahanBakuAction,
  deleteBahanBakuAction,
  BahanBakuWithUsage,
} from "@/app/dashboard/bahan-baku/actions";
import { BahanBaku, SatuanTerkecil } from "@/types/database";
import { formatRupiah } from "@/lib/utils";
import {
  Wheat,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Sparkles,
  Scale,
  Droplet,
  Boxes,
  X,
} from "lucide-react";


export default function BahanBakuDashboardPage() {
  const [bahanList, setBahanList] = useState<BahanBakuWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSatuan, setFilterSatuan] = useState<"all" | SatuanTerkecil>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBahan, setSelectedBahan] = useState<BahanBaku | null>(null);

  // Delete Confirm Modal
  const [bahanToDelete, setBahanToDelete] = useState<BahanBakuWithUsage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Alert Notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const fetchBahan = useCallback(async () => {
    setLoading(true);
    const res = await getBahanBakuListAction();
    if (res.success && res.data) {
      setBahanList(res.data);
    } else if (res.error) {
      setFeedback({ type: "error", message: res.error });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBahan();
  }, [fetchBahan]);

  // Filtered List
  const filteredList = useMemo(() => {
    return bahanList.filter((b) => {
      const matchSearch = b.nama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSatuan = filterSatuan === "all" || b.satuan_terkecil === filterSatuan;
      return matchSearch && matchSatuan;
    });
  }, [bahanList, searchQuery, filterSatuan]);

  // Statistics
  const stats = useMemo(() => {
    const total = bahanList.length;
    const gramCount = bahanList.filter((b) => b.satuan_terkecil === "gram").length;
    const mlCount = bahanList.filter((b) => b.satuan_terkecil === "ml").length;
    const pcsCount = bahanList.filter((b) => b.satuan_terkecil === "pcs").length;
    return { total, gramCount, mlCount, pcsCount };
  }, [bahanList]);

  // Handlers
  const handleOpenAdd = () => {
    setSelectedBahan(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BahanBaku) => {
    setSelectedBahan(b);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (payload: {
    nama: string;
    satuan_terkecil: SatuanTerkecil;
    harga_per_satuan_terkecil: number;
  }) => {
    if (selectedBahan) {
      const res = await updateBahanBakuAction(selectedBahan.id, payload);
      if (res.success) {
        setFeedback({
          type: "success",
          message: `Bahan baku "${payload.nama}" berhasil diperbarui. HPP resep terkait otomatis disesuaikan!`,
        });
      }
      return res;
    } else {
      const res = await createBahanBakuAction(payload);
      if (res.success) {
        setFeedback({
          type: "success",
          message: `Bahan baku "${payload.nama}" berhasil ditambahkan ke inventaris.`,
        });
      }
      return res;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!bahanToDelete) return;
    setIsDeleting(true);
    const res = await deleteBahanBakuAction(bahanToDelete.id);
    setIsDeleting(false);

    if (res.success) {
      setFeedback({
        type: "success",
        message: `Bahan baku "${bahanToDelete.nama}" berhasil dihapus.`,
      });
      setBahanToDelete(null);
      fetchBahan();
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Gagal menghapus bahan baku.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbfb] flex flex-col">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#81181f] tracking-tight flex items-center gap-2.5">
              <Wheat className="w-7 h-7 text-[#d62934]" />
              <span>Kelola Bahan Baku & HPP</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
              Daftar harga satuan bahan baku untuk kalkulasi HPP resep otomatis.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-[#d62934]/30 hover:opacity-95 active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bahan Baku</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-3xl border flex items-start justify-between gap-3 animate-fadeIn ${
              feedback.type === "success"
                ? "bg-[#47d1b5]/15 border-[#47d1b5]/40 text-[#0c6b57]"
                : "bg-red-50 border-red-200 text-[#d62934]"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-[#47d1b5] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[#d62934] shrink-0 mt-0.5" />
              )}
              <span className="text-xs sm:text-sm font-semibold leading-relaxed">
                {feedback.message}
              </span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* KPI Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="p-4 rounded-3xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Total Bahan</span>
              <Wheat className="w-4 h-4 text-[#81181f]" />
            </div>
            <p className="text-2xl font-extrabold text-[#81181f]">{stats.total}</p>
            <span className="text-[10px] text-zinc-400">Bahan aktif di inventaris</span>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Satuan Berat (Gram)</span>
              <Scale className="w-4 h-4 text-[#0c6b57]" />
            </div>
            <p className="text-2xl font-extrabold text-[#0c6b57]">{stats.gramCount}</p>
            <span className="text-[10px] text-zinc-400">Tepung, gula, bumbu, dll</span>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Satuan Volume (ML)</span>
              <Droplet className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl font-extrabold text-sky-600">{stats.mlCount}</p>
            <span className="text-[10px] text-zinc-400">Minyak, susu, sirup, dll</span>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Satuan Biji (Pcs)</span>
              <Boxes className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-extrabold text-amber-600">{stats.pcsCount}</p>
            <span className="text-[10px] text-zinc-400">Telur, sosis, kulit lumpia, dll</span>
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
                placeholder="Cari nama bahan baku..."
                className="input-field pl-10 py-2.5 text-xs sm:text-sm"
              />
            </div>

            {/* Filter Unit Pills */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 no-scrollbar">
              {(
                [
                  { id: "all", label: "Semua Satuan" },
                  { id: "gram", label: "Gram" },
                  { id: "ml", label: "Mililiter (ml)" },
                  { id: "pcs", label: "Pcs / Biji" },
                ] as { id: "all" | SatuanTerkecil; label: string }[]
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterSatuan(f.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    filterSatuan === f.id
                      ? "bg-[#81181f] text-white shadow-2xs"
                      : "bg-[#efe6e6]/60 text-[#81181f] border border-[#d59a9e]/30 hover:bg-[#efe6e6]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bahan Baku Table / Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-4 border-[#d62934] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-[#81181f]">Memuat daftar bahan baku...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-[#d59a9e]/40 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#efe6e6] text-[#d62934] flex items-center justify-center mb-3">
              <Wheat className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#81181f]">Belum Ada Bahan Baku</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              {searchQuery
                ? "Tidak ada bahan baku yang cocok dengan kata kunci pencarian Anda."
                : "Tambahkan bahan baku pertama Anda dengan kalkulator konversi harga beli satuan."}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-4 px-4 py-2 rounded-xl bg-[#81181f] text-white font-bold text-xs"
              >
                + Tambah Bahan Baku Sekarang
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#d59a9e]/30 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#efe6e6]/60 border-b border-[#d59a9e]/30 text-[11px] font-extrabold text-[#81181f] uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Nama Bahan Baku</th>
                    <th className="py-3.5 px-4">Satuan Resep</th>
                    <th className="py-3.5 px-4">Harga Satuan Terkecil</th>
                    <th className="py-3.5 px-4 text-center">Dipakai di Resep</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs sm:text-sm">
                  {filteredList.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-[#efe6e6]/30 transition-colors group"
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-zinc-900">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#d62934]" />
                          <span>{b.nama}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                            b.satuan_terkecil === "gram"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : b.satuan_terkecil === "ml"
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {b.satuan_terkecil}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-[#81181f]">
                        {formatRupiah(b.harga_per_satuan_terkecil)} / {b.satuan_terkecil}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-semibold">
                          <Layers className="w-3 h-3 text-[#d62934]" />
                          <span>{b.resep_count || 0} produk</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(b)}
                            className="p-1.5 sm:p-2 rounded-xl bg-zinc-100 hover:bg-[#efe6e6] text-zinc-700 hover:text-[#81181f] transition-all cursor-pointer"
                            title="Edit Bahan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setBahanToDelete(b)}
                            className="p-1.5 sm:p-2 rounded-xl bg-zinc-100 hover:bg-red-100 text-zinc-700 hover:text-red-600 transition-all cursor-pointer"
                            title="Hapus Bahan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal Add / Edit Bahan Baku */}
      <BahanBakuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchBahan();
        }}
        bahanToEdit={selectedBahan}
        onSubmitAction={handleFormSubmit}
      />

      {/* Delete Confirmation Modal */}
      {bahanToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#d59a9e]/40 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#d62934] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-[#81181f]">Hapus Bahan Baku?</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Apakah Anda yakin ingin menghapus bahan baku{" "}
                <strong>&quot;{bahanToDelete.nama}&quot;</strong>?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setBahanToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-[#d62934] hover:bg-[#81181f] text-white text-xs font-bold shadow-md shadow-[#d62934]/25 transition-all flex items-center gap-1.5 cursor-pointer"
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
