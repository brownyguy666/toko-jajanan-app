"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { formatStaffEmail } from "@/lib/utils";

import { Profile } from "@/types/database";

export interface StaffActionResult {
  success: boolean;
  error?: string;
  staff?: Profile;
}

/**
 * Helper: Verifikasi apakah pemanggil action adalah Owner yang aktif
 */
async function verifyOwnerSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sesi login berakhir. Silakan login kembali.");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, status_aktif")
    .eq("id", user.id)
    .single();

  const userProfile = profile as unknown as { role: string; status_aktif: boolean } | null;

  if (!userProfile || userProfile.role !== "owner" || !userProfile.status_aktif) {
    throw new Error("Akses ditolak. Hanya Owner aktif yang dapat mengelola pegawai.");
  }

  return { ownerId: user.id, admin };
}

/**
 * Action: Tambah Akun Pegawai Baru (Hanya Nama & Username)
 */
export async function createStaffAction(
  namaInput: string,
  usernameInput: string,
  passwordInput: string
): Promise<StaffActionResult> {
  try {
    const { admin } = await verifyOwnerSession();

    const nama = namaInput.trim();
    const cleanUsername = usernameInput.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
    const password = passwordInput.trim();

    if (!nama) {
      return { success: false, error: "Nama lengkap pegawai wajib diisi." };
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: "Username minimal 3 karakter (huruf, angka, atau underscore)." };
    }

    if (!password || password.length < 6) {
      return { success: false, error: "Password akun minimal 6 karakter." };
    }

    const internalEmail = formatStaffEmail(cleanUsername);

    // Cek apakah username/email sudah digunakan
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", internalEmail)
      .maybeSingle();

    if (existingProfile) {
      return {
        success: false,
        error: `Username "${cleanUsername}" sudah digunakan oleh pegawai lain. Silakan pilih username lain.`,
      };
    }

    // 1. Buat User di Supabase Auth via Admin Service Role
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: internalEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        nama: nama,
        username: cleanUsername,
        role: "pegawai",
      },
    });

    if (authError || !authUser?.user) {
      throw new Error(authError?.message || "Gagal membuat akun autentikasi pegawai.");
    }

    // 2. Pastikan row profiles terisi
    const { data: newProfile, error: profileErr } = await admin
      .from("profiles")
      .upsert({
        id: authUser.user.id,
        nama: nama,
        email: internalEmail,
        role: "pegawai",
        status_aktif: true,
        updated_at: new Date().toISOString(),
      } as never)
      .select()
      .single();

    if (profileErr) {
      throw new Error(`Gagal menyimpan profil pegawai: ${profileErr.message}`);
    }

    revalidatePath("/dashboard/pegawai");
    return {
      success: true,
      staff: newProfile as unknown as Profile,
    };
  } catch (err: unknown) {
    console.error("Error in createStaffAction:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan sistem saat membuat akun pegawai.";
    return { success: false, error: message };
  }
}

/**
 * Action: Nonaktifkan atau Aktifkan Akun Pegawai
 */
export async function toggleStaffStatusAction(
  profileId: string,
  newStatus: boolean
): Promise<StaffActionResult> {
  try {
    const { admin, ownerId } = await verifyOwnerSession();

    if (profileId === ownerId) {
      return { success: false, error: "Tidak dapat mengubah status akun Owner sendiri." };
    }

    // Verifikasi bahwa user adalah pegawai
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("role, nama")
      .eq("id", profileId)
      .single();

    const target = targetProfile as unknown as { role: string; nama: string } | null;

    if (!target || target.role !== "pegawai") {
      return { success: false, error: "Data pegawai tidak ditemukan atau bukan akun pegawai." };
    }

    const { error: updateErr } = await admin
      .from("profiles")
      .update({
        status_aktif: newStatus,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", profileId);

    if (updateErr) throw updateErr;

    revalidatePath("/dashboard/pegawai");
    return { success: true };
  } catch (err: unknown) {
    console.error("Error in toggleStaffStatusAction:", err);
    const message = err instanceof Error ? err.message : "Gagal memperbarui status pegawai.";
    return { success: false, error: message };
  }
}

/**
 * Action: Reset Password Pegawai oleh Owner
 */
export async function resetStaffPasswordAction(
  profileId: string,
  newPasswordInput: string
): Promise<StaffActionResult> {
  try {
    const { admin } = await verifyOwnerSession();

    const newPassword = newPasswordInput.trim();
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Password baru minimal 6 karakter." };
    }

    // Update password di Supabase Auth via Admin client
    const { error: updateErr } = await admin.auth.admin.updateUserById(profileId, {
      password: newPassword,
    });

    if (updateErr) {
      throw new Error(`Gagal mengubah password: ${updateErr.message}`);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Error in resetStaffPasswordAction:", err);
    const message = err instanceof Error ? err.message : "Gagal mereset password pegawai.";
    return { success: false, error: message };
  }
}

/**
 * Action: Hapus Akun Pegawai
 */
export async function deleteStaffAction(profileId: string): Promise<StaffActionResult> {
  try {
    const { admin, ownerId } = await verifyOwnerSession();

    if (profileId === ownerId) {
      return { success: false, error: "Tidak dapat menghapus akun Owner." };
    }

    // Hapus dari auth.users
    const { error: deleteAuthErr } = await admin.auth.admin.deleteUser(profileId);
    if (deleteAuthErr) {
      console.warn("Auth user deletion warning:", deleteAuthErr.message);
    }

    // Hapus dari profiles
    const { error: deleteProfileErr } = await admin
      .from("profiles")
      .delete()
      .eq("id", profileId);

    if (deleteProfileErr) throw deleteProfileErr;

    revalidatePath("/dashboard/pegawai");
    return { success: true };
  } catch (err: unknown) {
    console.error("Error in deleteStaffAction:", err);
    const message = err instanceof Error ? err.message : "Gagal menghapus pegawai.";
    return { success: false, error: message };
  }
}
