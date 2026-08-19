"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Profile } from "@/types/database";
import { formatStaffEmail } from "@/lib/utils";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  role?: "owner" | "pegawai";
  redirectTo?: string;
}


/**
 * Server Action: Login dengan Email (Owner) atau Username (Kasir/Pegawai)
 */
export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const identifier = (formData.get("email") as string || formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { success: false, error: "Email/Username dan password wajib diisi." };
  }

  // Jika user memasukkan username tanpa '@', format ke internal staff email
  const finalEmail = identifier.includes("@")
    ? identifier
    : formatStaffEmail(identifier);

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: finalEmail,
    password,
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: "Username/Email atau password salah. Silakan periksa kembali.",
    };
  }

  // Ambil profil pengguna
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    return {
      success: false,
      error: "Profil pengguna tidak ditemukan. Hubungi administrator.",
    };
  }

  const userProfile = profile as unknown as Profile;

  if (!userProfile.status_aktif) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Akun Anda berstatus non-aktif. Silakan hubungi Owner.",
    };
  }

  const role = userProfile.role;
  const redirectTo = role === "owner" ? "/dashboard/produk" : "/kasir";

  return {
    success: true,
    role,
    redirectTo,
  };
}

/**
 * Server Action: Sign Out
 */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { success: true };
}

/**
 * Server Action: Cek apakah sudah ada akun Owner yang terdaftar
 */
export async function checkHasOwner(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "owner");

    if (error) return true; // default aman
    return (count ?? 0) > 0;
  } catch {
    return true; // default aman
  }
}


/**
 * Server Action: Registrasi Akun Owner Pertama (Setup Awal Toko)
 */
export async function registerFirstOwnerAction(formData: FormData): Promise<AuthActionResult> {
  const nama = (formData.get("nama") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!nama || !email || !password) {
    return { success: false, error: "Semua kolom pendaftaran wajib diisi." };
  }

  if (password.length < 6) {
    return { success: false, error: "Password minimal 6 karakter." };
  }

  try {
    const admin = createAdminClient();

    // Verifikasi apakah sudah pernah ada owner
    const { count } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "owner");

    if ((count ?? 0) > 0) {
      return {
        success: false,
        error: "Owner sudah terdaftar. Registrasi akun baru hanya dapat dilakukan oleh Owner melalui menu Kelola Pegawai.",
      };
    }

    // Buat akun user
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nama, role: "owner" },
    });

    if (createError || !newUser.user) {
      return {
        success: false,
        error: createError?.message || "Gagal membuat akun owner.",
      };
    }

    // Pastikan row profiles terisi dengan role 'owner'
    await admin.from("profiles").upsert({
      id: newUser.user.id,
      nama,
      email,
      role: "owner",
      status_aktif: true,
    } as never);

    // Otomatis login dengan client
    const supabase = await createClient();
    await supabase.auth.signInWithPassword({ email, password });

    return {
      success: true,
      role: "owner",
      redirectTo: "/dashboard/produk",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan pada server saat registrasi.";
    return {
      success: false,
      error: message,
    };
  }
}
