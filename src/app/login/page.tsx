"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction, registerFirstOwnerAction, checkHasOwner } from "@/app/auth/actions";
import { useAuth } from "@/context/AuthContext";
import {
  UtensilsCrossed,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Store,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [hasOwner, setHasOwner] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");

  // Pesan error jika akun dinonaktifkan (diturunkan langsung dari query param)
  const isDeactivated = searchParams.get("error") === "deactivated";
  const displayError =
    errorMessage ||
    (isDeactivated
      ? "Akun Anda berstatus non-aktif. Silakan hubungi Owner."
      : null);

  // Cek apakah sudah ada owner terdaftar di database
  useEffect(() => {
    let isMounted = true;
    async function checkOwnerStatus() {
      const exists = await checkHasOwner();
      if (isMounted) {
        setHasOwner(exists);
        if (!exists) {
          setActiveTab("register");
        }
      }
    }
    checkOwnerStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  // Jika sudah login, redirect otomatis
  useEffect(() => {
    if (!authLoading && user && role) {
      if (role === "owner") {
        router.replace("/admin");
      } else {
        router.replace("/kasir");
      }
    }
  }, [user, role, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const res = await loginAction(formData);

    if (!res.success) {
      setErrorMessage(res.error || "Gagal masuk. Periksa kembali email dan password.");
      setIsLoading(false);
    } else {
      setSuccessMessage("Berhasil masuk! Mengalihkan halaman...");
      setTimeout(() => {
        router.push(res.redirectTo || (res.role === "owner" ? "/admin" : "/kasir"));
        router.refresh();
      }, 500);
    }
  };

  const handleRegisterOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("nama", nama);
    formData.append("email", email);
    formData.append("password", password);

    const res = await registerFirstOwnerAction(formData);

    if (!res.success) {
      setErrorMessage(res.error || "Gagal mendaftarkan akun owner.");
      setIsLoading(false);
    } else {
      setSuccessMessage("Akun Owner berhasil dibuat! Mengalihkan ke Dashboard...");
      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 600);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-linear-to-br from-[#efe6e6] via-[#fdfbfb] to-[#efe6e6]/60 relative overflow-hidden">
      {/* Background ambient elements */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#d59a9e]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#d62934]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-48 h-48 bg-[#47d1b5]/15 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-tr from-[#81181f] to-[#d62934] text-white shadow-lg shadow-[#d62934]/25 mb-3">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#81181f] tracking-tight">
            Toko Jajanan
          </h1>
          <p className="text-sm text-[#81181f]/80 mt-1 font-medium">
            Sistem Kasir & Manajemen Penjualan
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-[#d59a9e]/40 shadow-xl shadow-[#81181f]/5 p-6 sm:p-8">
          {/* Tabs */}
          <div className="flex rounded-2xl bg-[#efe6e6]/70 p-1 mb-6 border border-[#d59a9e]/30">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeTab === "login"
                  ? "bg-white text-[#81181f] shadow-sm"
                  : "text-[#81181f]/70 hover:text-[#81181f]"
              }`}
            >
              Masuk Akun
            </button>
            {!hasOwner && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  activeTab === "register"
                    ? "bg-[#d62934] text-white shadow-sm"
                    : "text-[#81181f]/70 hover:text-[#81181f]"
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#47d1b5]" />
                Setup Owner
              </button>
            )}
          </div>

          {/* Banner Pesan Error / Sukses */}
          {displayError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#d62934]/10 border border-[#d62934]/30 flex items-start gap-3 text-xs sm:text-sm text-[#81181f]">
              <AlertCircle className="w-5 h-5 text-[#d62934] shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{displayError}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#47d1b5]/15 border border-[#47d1b5]/40 flex items-start gap-3 text-xs sm:text-sm text-[#0c6b57]">
              <CheckCircle2 className="w-5 h-5 text-[#47d1b5] shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* FORM LOGIN */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
                  Email Akun
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#d59a9e]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@tokojajanan.com"
                    className="input-field pl-11"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#d59a9e]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-11 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#81181f]/60 hover:text-[#81181f]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-linear-to-r from-[#d62934] to-[#81181f] text-white font-bold text-sm shadow-md shadow-[#d62934]/30 hover:shadow-lg hover:shadow-[#d62934]/40 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 touch-btn cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk Aplikasi</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORM SETUP OWNER PERTAMA */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterOwner} className="space-y-4">
              <div className="p-3 bg-[#47d1b5]/10 border border-[#47d1b5]/30 rounded-2xl mb-4">
                <p className="text-xs text-[#0c6b57] font-medium leading-relaxed">
                  <strong>Setup Awal Toko:</strong> Belum ada akun Owner terdaftar. Daftarkan akun Owner utama untuk mengelola bisnis jajanan ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
                  Nama Lengkap Owner
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#d59a9e]">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Ibu Rina (Owner)"
                    className="input-field pl-11"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
                  Email Owner
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#d59a9e]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@tokojajanan.com"
                    className="input-field pl-11"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
                  Kata Sandi (Min. 6 Karakter)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#d59a9e]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-11 pr-12"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#81181f]/60 hover:text-[#81181f]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-linear-to-r from-[#81181f] to-[#d62934] text-white font-bold text-sm shadow-md shadow-[#d62934]/30 hover:shadow-lg hover:shadow-[#d62934]/40 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 touch-btn cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#47d1b5]" />
                    <span>Daftarkan Akun Owner Utama</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Info Role Badges */}
          <div className="mt-8 pt-6 border-t border-[#efe6e6] grid grid-cols-2 gap-3 text-center">
            <div className="p-2.5 rounded-2xl bg-[#efe6e6]/40 border border-[#d59a9e]/20 flex flex-col items-center justify-center">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#81181f] uppercase tracking-wider">
                <Store className="w-3.5 h-3.5 text-[#d62934]" />
                Owner
              </span>
              <span className="text-[11px] text-zinc-500 mt-0.5">
                Akses Penuh Bisnis
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#efe6e6]/40 border border-[#d59a9e]/20 flex flex-col items-center justify-center">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0c6b57] uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#47d1b5]" />
                Pegawai
              </span>
              <span className="text-[11px] text-zinc-500 mt-0.5">
                Kasir & Transaksi POS
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-[#81181f]/60 mt-6 font-medium">
          Aplikasi Manajemen Penjualan Toko Jajanan &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#efe6e6]">
          <div className="w-8 h-8 border-4 border-[#d62934] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

