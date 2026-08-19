"use client";

import React, { useState } from "react";
import { createStaffAction } from "@/app/dashboard/pegawai/actions";
import {
  X,
  UserPlus,
  User,
  AtSign,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Sparkles,
} from "lucide-react";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddStaffModal({ isOpen, onClose, onSuccess }: AddStaffModalProps) {
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUsernameChange = (val: string) => {
    // Sanitasi: huruf kecil, angka, dan underscore
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(clean);
  };

  const handleGeneratePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let rand = "";
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(rand);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nama.trim()) {
      setErrorMsg("Nama lengkap pegawai wajib diisi.");
      return;
    }

    if (!username.trim() || username.length < 3) {
      setErrorMsg("Username minimal 3 karakter.");
      return;
    }

    if (!password.trim() || password.length < 6) {
      setErrorMsg("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      const result = await createStaffAction(nama, username, password);

      if (!result.success) {
        setErrorMsg(result.error || "Gagal membuat akun pegawai.");
        return;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat mendaftarkan pegawai.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-[#d59a9e]/40 shadow-2xl max-w-md w-full overflow-hidden my-8">
        {/* Header */}
        <div className="bg-linear-to-r from-[#81181f] to-[#d62934] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight leading-tight">
                Tambah Akun Pegawai
              </h3>
              <p className="text-[11px] text-white/80">
                Pendaftaran kasir praktis tanpa perlu email
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[#d62934]/10 border border-[#d62934]/30 flex items-start gap-2.5 text-xs text-[#81181f]">
              <AlertCircle className="w-4 h-4 text-[#d62934] shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
              Nama Lengkap Pegawai *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Siti Rahmawati"
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* 2. Username */}
          <div>
            <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
              Username Kasir (Untuk Login) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <AtSign className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="Contoh: siti01"
                className="input-field pl-10 lowercase"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Gunakan huruf kecil, angka, atau garis bawah tanpa spasi.
            </p>
          </div>

          {/* 3. Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider">
                Kata Sandi Awal *
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] text-[#81181f] hover:text-[#d62934] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-[#d62934]" />
                <span>Buat Sandi Acak</span>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="input-field pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-3.5 rounded-2xl bg-[#efe6e6]/60 border border-[#d59a9e]/40 text-xs text-zinc-600 space-y-1">
            <p className="font-bold text-[#81181f] flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Informasi Login Pegawai:</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Pegawai hanya perlu memasukkan <strong>Username ({username || "..."})</strong> dan <strong>Kata Sandi</strong> di halaman login kasir.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#efe6e6] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white text-xs font-bold shadow-md shadow-[#d62934]/25 hover:opacity-95 active:scale-98 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Daftarkan Pegawai</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
