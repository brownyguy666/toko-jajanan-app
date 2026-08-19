"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/database";
import { formatTanggal } from "@/lib/utils";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { AddStaffModal } from "@/components/pegawai/AddStaffModal";
import { ResetPasswordModal } from "@/components/pegawai/ResetPasswordModal";
import {
  toggleStaffStatusAction,
  deleteStaffAction,
} from "@/app/dashboard/pegawai/actions";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  KeyRound,
  Trash2,
  AlertTriangle,
  Power,
  ShieldAlert,
} from "lucide-react";


export default function PegawaiManagementPage() {
  const supabase = createClient();

  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [staffToReset, setStaffToReset] = useState<Profile | null>(null);

  // Confirmation Modals
  const [staffToToggle, setStaffToToggle] = useState<{
    staff: Profile;
    targetStatus: boolean;
  } | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const [staffToDelete, setStaffToDelete] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const refetch = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadStaff() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "pegawai")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (isMounted) {
          setStaffList((data as Profile[]) || []);
        }
      } catch (err: unknown) {
        console.error("Error loading staff:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStaff();

    return () => {
      isMounted = false;
    };
  }, [supabase, refreshTrigger]);

  // Handle Toggle Status (Aktif / Nonaktif)
  const handleConfirmToggleStatus = async () => {
    if (!staffToToggle) return;
    setIsToggling(true);

    try {
      const result = await toggleStaffStatusAction(
        staffToToggle.staff.id,
        staffToToggle.targetStatus
      );

      if (!result.success) {
        alert(result.error || "Gagal memperbarui status pegawai.");
        return;
      }

      setStaffList((prev) =>
        prev.map((s) =>
          s.id === staffToToggle.staff.id
            ? { ...s, status_aktif: staffToToggle.targetStatus }
            : s
        )
      );
      setStaffToToggle(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      alert(msg);
    } finally {
      setIsToggling(false);
    }
  };

  // Handle Delete Staff
  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;
    setIsDeleting(true);

    try {
      const result = await deleteStaffAction(staffToDelete.id);

      if (!result.success) {
        alert(result.error || "Gagal menghapus pegawai.");
        return;
      }

      setStaffList((prev) => prev.filter((s) => s.id !== staffToDelete.id));
      setStaffToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter staff list
  const filteredStaff = staffList.filter((s) => {
    const username = s.email.split("@")[0];
    const matchesSearch =
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && s.status_aktif) ||
      (statusFilter === "inactive" && !s.status_aktif);

    return matchesSearch && matchesStatus;
  });

  // KPI Metrics
  const totalStaff = staffList.length;
  const activeStaffCount = staffList.filter((s) => s.status_aktif).length;
  const inactiveStaffCount = staffList.filter((s) => !s.status_aktif).length;

  return (
    <div className="min-h-screen bg-[#fdfbfb] flex flex-col">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#81181f] tracking-tight">
              Kelola Akun Pegawai
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
              Daftarkan akun kasir baru, atur status aktif, dan kelola kata sandi pegawai.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white text-xs font-bold shadow-md shadow-[#d62934]/25 hover:opacity-95 active:scale-98 transition-all touch-btn cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pegawai Baru</span>
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
              <Users className="w-4 h-4 text-[#81181f]" />
              <span>Total Pegawai</span>
            </div>
            <p className="text-2xl font-extrabold text-[#81181f]">
              {totalStaff}{" "}
              <span className="text-xs text-zinc-400 font-normal">orang</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
              <UserCheck className="w-4 h-4 text-[#0c6b57]" />
              <span>Pegawai Aktif</span>
            </div>
            <p className="text-2xl font-extrabold text-[#0c6b57]">
              {activeStaffCount}{" "}
              <span className="text-xs text-zinc-400 font-normal">bisa login</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#d59a9e]/30 shadow-2xs">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
              <UserX className="w-4 h-4 text-[#d62934]" />
              <span>Non-Aktif</span>
            </div>
            <p className="text-2xl font-extrabold text-[#d62934]">
              {inactiveStaffCount}{" "}
              <span className="text-xs text-zinc-400 font-normal">dinonaktifkan</span>
            </p>
          </div>
        </div>

        {/* Search & Filters */}
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
                placeholder="Cari nama atau username pegawai..."
                className="input-field pl-10 py-2.5 text-xs sm:text-sm"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-[#81181f] text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                Semua ({staffList.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === "active"
                    ? "bg-[#0c6b57] text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                Aktif ({activeStaffCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("inactive")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === "inactive"
                    ? "bg-[#d62934] text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                Non-Aktif ({inactiveStaffCount})
              </button>
            </div>
          </div>
        </div>

        {/* Staff Table / List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-4 border-[#d62934] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-[#81181f]">Memuat daftar pegawai kasir...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-[#d59a9e]/40 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#efe6e6] text-[#d62934] flex items-center justify-center mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#81181f]">
              {staffList.length === 0
                ? "Belum Ada Akun Pegawai"
                : "Tidak Ditemukan Pegawai yang Cocok"}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-6">
              {staffList.length === 0
                ? "Daftarkan akun kasir pertama Anda agar pegawai dapat login dan melayani penjualan di POS."
                : "Coba ganti kata kunci pencarian atau bersihkan filter status."}
            </p>

            {staffList.length === 0 && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white text-xs font-bold shadow-md shadow-[#d62934]/25 hover:opacity-95 cursor-pointer"
              >
                + Daftarkan Pegawai Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#d59a9e]/30 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#efe6e6]/60 text-[#81181f] border-b border-[#d59a9e]/30 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Pegawai</th>
                    <th className="py-3.5 px-4">Username Login</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Terdaftar</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efe6e6]">
                  {filteredStaff.map((staff) => {
                    const username = staff.email.split("@")[0];
                    const initials = staff.nama
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <tr
                        key={staff.id}
                        className={`hover:bg-[#efe6e6]/20 transition-colors ${
                          !staff.status_aktif ? "bg-red-50/20 opacity-75" : ""
                        }`}
                      >
                        {/* Avatar & Nama */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#81181f] to-[#d62934] text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900 leading-tight">
                                {staff.nama}
                              </p>
                              <span className="inline-block px-2 py-0.5 rounded-md bg-[#47d1b5]/15 text-[#0c6b57] text-[10px] font-bold mt-0.5">
                                Kasir POS
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Username */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-bold text-[#81181f] bg-[#efe6e6]/60 px-2.5 py-1 rounded-lg border border-[#d59a9e]/30">
                            @{username}
                          </span>
                        </td>

                        {/* Status Aktif */}
                        <td className="py-3.5 px-4 text-center">
                          {staff.status_aktif ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#47d1b5]/15 text-[#0c6b57] text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#47d1b5]" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-[#d62934] text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#d62934]" />
                              Non-Aktif
                            </span>
                          )}
                        </td>

                        {/* Tanggal Terdaftar */}
                        <td className="py-3.5 px-4 text-xs text-zinc-500">
                          {formatTanggal(staff.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Toggle Aktif / Nonaktif */}
                            <button
                              type="button"
                              onClick={() =>
                                setStaffToToggle({
                                  staff,
                                  targetStatus: !staff.status_aktif,
                                })
                              }
                              title={
                                staff.status_aktif
                                  ? "Nonaktifkan Akun (Tolak Login)"
                                  : "Aktifkan Akun (Izinkan Login)"
                              }
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                staff.status_aktif
                                  ? "text-zinc-500 hover:text-amber-600 hover:bg-amber-50 border-zinc-200"
                                  : "text-[#0c6b57] bg-[#47d1b5]/10 border-[#47d1b5]/30 hover:bg-[#47d1b5]/20"
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            {/* Reset Password */}
                            <button
                              type="button"
                              onClick={() => setStaffToReset(staff)}
                              title="Reset Kata Sandi"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-[#81181f] hover:bg-[#efe6e6] border border-zinc-200 transition-all cursor-pointer"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {/* Hapus */}
                            <button
                              type="button"
                              onClick={() => setStaffToDelete(staff)}
                              title="Hapus Akun Pegawai"
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

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={refetch}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={Boolean(staffToReset)}
        onClose={() => setStaffToReset(null)}
        staff={staffToReset}
      />

      {/* Modal Konfirmasi Toggle Status */}
      {staffToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#d59a9e]/40 shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#81181f]">
              {staffToToggle.targetStatus ? "Aktifkan Akun?" : "Nonaktifkan Akun?"}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 mb-6">
              Pegawai <strong>&quot;{staffToToggle.staff.nama}&quot;</strong>{" "}
              {staffToToggle.targetStatus
                ? "akan dapat login kembali dan melayani transaksi di kasir."
                : "tidak akan bisa login ke halaman kasir hingga diaktifkan kembali."}
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setStaffToToggle(null)}
                disabled={isToggling}
                className="py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                disabled={isToggling}
                className={`py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  staffToToggle.targetStatus
                    ? "bg-[#0c6b57] hover:bg-[#095243]"
                    : "bg-[#d62934] hover:bg-[#81181f]"
                }`}
              >
                {isToggling ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Ya, {staffToToggle.targetStatus ? "Aktifkan" : "Nonaktifkan"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Pegawai */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#d59a9e]/40 shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#d62934] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#81181f]">
              Hapus Akun Pegawai?
            </h3>
            <p className="text-xs text-zinc-500 mt-1 mb-6">
              Akun pegawai <strong>&quot;{staffToDelete.nama}&quot;</strong> akan dihapus permanen dari sistem.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
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
