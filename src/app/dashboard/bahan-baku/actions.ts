"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { BahanBaku, SatuanTerkecil } from "@/types/database";

export interface BahanBakuWithUsage extends BahanBaku {
  resep_count?: number;
}

export interface BahanBakuActionResult {
  success: boolean;
  error?: string;
  data?: BahanBaku;
}

/**
 * Helper: Verifikasi sesi pengguna sebagai Owner aktif
 */
async function verifyOwnerSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sesi login berakhir. Silakan login kembali.");
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role, status_aktif")
    .eq("id", user.id)
    .single();

  const userProfile = profile as unknown as { role: string; status_aktif: boolean } | null;

  if (profileErr || !userProfile || userProfile.role !== "owner" || !userProfile.status_aktif) {
    throw new Error("Akses ditolak. Hanya Owner aktif yang dapat mengelola bahan baku.");
  }

  const admin = createAdminClient();
  return { ownerId: user.id, supabase, admin };
}

/**
 * Action: Ambil semua data bahan baku beserta jumlah penggunaan resep
 */
export async function getBahanBakuListAction(): Promise<{
  success: boolean;
  error?: string;
  data?: BahanBakuWithUsage[];
}> {
  try {
    const { supabase } = await verifyOwnerSession();

    const { data: bahanData, error: bahanErr } = await supabase
      .from("bahan_baku")
      .select(`
        id,
        nama,
        satuan_terkecil,
        harga_per_satuan_terkecil,
        created_at,
        updated_at,
        resep ( id )
      `)
      .order("nama", { ascending: true });

    if (bahanErr) throw bahanErr;

    const list: BahanBakuWithUsage[] = ((bahanData as unknown as (BahanBaku & { resep?: { id: string }[] })[]) || []).map(
      (b) => ({
        id: b.id,
        nama: b.nama,
        satuan_terkecil: b.satuan_terkecil,
        harga_per_satuan_terkecil: Number(b.harga_per_satuan_terkecil),
        created_at: b.created_at,
        updated_at: b.updated_at,
        resep_count: b.resep?.length || 0,
      })
    );

    return { success: true, data: list };
  } catch (err: unknown) {
    console.error("Error in getBahanBakuListAction:", err);
    const message = err instanceof Error ? err.message : "Gagal memuat data bahan baku.";
    return { success: false, error: message };
  }
}

/**
 * Action: Tambah bahan baku baru
 */
export async function createBahanBakuAction(payload: {
  nama: string;
  satuan_terkecil: SatuanTerkecil;
  harga_per_satuan_terkecil: number;
}): Promise<BahanBakuActionResult> {
  try {
    const { supabase } = await verifyOwnerSession();

    const nama = payload.nama?.trim();
    const satuan = payload.satuan_terkecil;
    const harga = Math.max(0, Number(payload.harga_per_satuan_terkecil) || 0);

    if (!nama) {
      return { success: false, error: "Nama bahan baku wajib diisi." };
    }

    if (!["gram", "ml", "pcs"].includes(satuan)) {
      return { success: false, error: "Satuan terkecil tidak valid (harus gram, ml, atau pcs)." };
    }

    const { data: newBahan, error: insertErr } = await supabase
      .from("bahan_baku")
      .insert({
        nama,
        satuan_terkecil: satuan,
        harga_per_satuan_terkecil: harga,
      } as never)
      .select()
      .single();

    if (insertErr) throw insertErr;

    revalidatePath("/dashboard/bahan-baku");
    revalidatePath("/dashboard/produk");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: newBahan as unknown as BahanBaku,
    };
  } catch (err: unknown) {
    console.error("Error in createBahanBakuAction:", err);
    const message = err instanceof Error ? err.message : "Gagal menambahkan bahan baku.";
    return { success: false, error: message };
  }
}

/**
 * Action: Update data bahan baku (nama & harga)
 */
export async function updateBahanBakuAction(
  id: string,
  payload: {
    nama: string;
    satuan_terkecil: SatuanTerkecil;
    harga_per_satuan_terkecil: number;
  }
): Promise<BahanBakuActionResult> {
  try {
    const { supabase } = await verifyOwnerSession();

    const nama = payload.nama?.trim();
    const satuan = payload.satuan_terkecil;
    const harga = Math.max(0, Number(payload.harga_per_satuan_terkecil) || 0);

    if (!nama) {
      return { success: false, error: "Nama bahan baku wajib diisi." };
    }

    const { data: updatedBahan, error: updateErr } = await supabase
      .from("bahan_baku")
      .update({
        nama,
        satuan_terkecil: satuan,
        harga_per_satuan_terkecil: harga,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    revalidatePath("/dashboard/bahan-baku");
    revalidatePath("/dashboard/produk");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: updatedBahan as unknown as BahanBaku,
    };
  } catch (err: unknown) {
    console.error("Error in updateBahanBakuAction:", err);
    const message = err instanceof Error ? err.message : "Gagal memperbarui bahan baku.";
    return { success: false, error: message };
  }
}

/**
 * Action: Hapus bahan baku
 */
export async function deleteBahanBakuAction(id: string): Promise<BahanBakuActionResult> {
  try {
    const { supabase } = await verifyOwnerSession();

    // Cek apakah bahan baku dipakai di resep
    const { count, error: countErr } = await supabase
      .from("resep")
      .select("*", { count: "exact", head: true })
      .eq("bahan_baku_id", id);

    if (countErr) throw countErr;

    if ((count ?? 0) > 0) {
      return {
        success: false,
        error: `Bahan baku ini sedang digunakan pada ${count} resep produk jajanan. Hapus dari resep terlebih dahulu sebelum menghapus bahan baku ini.`,
      };
    }

    const { error: deleteErr } = await supabase.from("bahan_baku").delete().eq("id", id);

    if (deleteErr) throw deleteErr;

    revalidatePath("/dashboard/bahan-baku");
    revalidatePath("/dashboard/produk");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Error in deleteBahanBakuAction:", err);
    const message = err instanceof Error ? err.message : "Gagal menghapus bahan baku.";
    return { success: false, error: message };
  }
}
