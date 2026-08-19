"use client";

import React, { useState } from "react";
import { resetStaffPasswordAction } from "@/app/dashboard/pegawai/actions";
import { Profile } from "@/types/database";
import {
  X,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Profile | null;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  staff,
}: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !staff) return null;

  const username = staff.email.split("@")[0];

  const handleGeneratePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let rand = "";
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(rand);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newPassword.trim() || newPassword.length < 6) {
      setErrorMsg("Password baru minimal 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      const result = await resetStaffPasswordAction(staff.id, newPassword);

      if (!result.success) {
        setErrorMsg(result.error || "Gagal mengubah password.");
        return;
      }

      setSuccessMsg("Kata sandi berhasil diperbarui!");
      setTimeout(() => {
        setNewPassword("");
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat mereset password.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-[#d59a9e]/40 shadow-2xl max-w-sm w-full overflow-hidden my-8">
        {/* Header */}
        <div className="bg-linear-to-r from-[#81181f] to-[#d62934] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight leading-tight">
                Reset Kata Sandi
              </h3>
              <p className="text-[10px] text-white/80">
                {staff.nama} (@{username})
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-[#d62934]/10 border border-[#d62934]/30 flex items-start gap-2 text-xs text-[#81181f]">
              <AlertCircle className="w-4 h-4 text-[#d62934] shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-[#47d1b5]/15 border border-[#47d1b5]/40 flex items-start gap-2 text-xs text-[#0c6b57]">
              <CheckCircle2 className="w-4 h-4 text-[#47d1b5] shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider">
                Kata Sandi Baru *
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] text-[#81181f] hover:text-[#d62934] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-[#d62934]" />
                <span>Sandi Acak</span>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

          <div className="pt-2 border-t border-[#efe6e6] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading || Boolean(successMsg)}
              className="px-4 py-2 rounded-xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white text-xs font-bold shadow-md shadow-[#d62934]/25 hover:opacity-95 active:scale-98 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Sandi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
