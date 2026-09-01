"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Produk, BahanBaku, SatuanTerkecil } from "@/types/database";

export interface ResepDetailItem {
  id: string;
  bahan_baku_id: string;
  jumlah_terpakai: number;
  bahan_baku?: {
    id: string;
    nama: string;
    satuan_terkecil: SatuanTerkecil;
    harga_per_satuan_terkecil: number;
  };
}

export interface ProdukWithRecipeDetails extends Produk {
  resep_details?: ResepDetailItem[];
}

export interface UpdateRecipePayload {
  langkah_pembuatan?: string | null;
  catatan_resep?: string | null;
  porsi_standar?: number;
  durasi_menit?: number;
}

// Validasi otentikasi role owner
async function verifyOwnerSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sesi login berakhir. Silakan login kembali.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status_aktif")
    .eq("id", user.id)
    .single();

  const profileData = profile as { role?: string; status_aktif?: boolean } | null;

  if (!profileData || profileData.role !== "owner" || !profileData.status_aktif) {
    throw new Error("Akses ditolak. Fitur ini hanya dapat diakses oleh Owner.");
  }

  return { supabase, user };
}

/**
 * Mengambil seluruh daftar produk beserta rincian resep dan bahan bakunya
 */
export async function getProductsWithRecipesAction(): Promise<{
  success: boolean;
  data?: ProdukWithRecipeDetails[];
  error?: string;
}> {
  try {
    const { supabase } = await verifyOwnerSession();

    const { data: productsData, error: prodErr } = await supabase
      .from("produk")
      .select(`
        *,
        resep (
          id,
          bahan_baku_id,
          jumlah_terpakai,
          bahan_baku (
            id,
            nama,
            satuan_terkecil,
            harga_per_satuan_terkecil
          )
        )
      `)
      .order("nama", { ascending: true });

    if (prodErr) {
      throw new Error(`Gagal mengambil data resep: ${prodErr.message}`);
    }

    const formattedProducts: ProdukWithRecipeDetails[] = (productsData || []).map((p: any) => ({
      ...p,
      resep_details: p.resep || [],
    }));

    return { success: true, data: formattedProducts };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat resep.";
    return { success: false, error: message };
  }
}

/**
 * Memperbarui instruksi langkah pembuatan, catatan bumbu, porsi standar, dan durasi memasak
 */
export async function updateRecipeNotesAction(
  productId: string,
  payload: UpdateRecipePayload
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { supabase } = await verifyOwnerSession();

    const { error: updateErr } = await supabase
      .from("produk")
      .update({
        langkah_pembuatan: payload.langkah_pembuatan ?? null,
        catatan_resep: payload.catatan_resep ?? null,
        porsi_standar: Math.max(1, payload.porsi_standar || 1),
        durasi_menit: Math.max(0, payload.durasi_menit || 30),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", productId);

    if (updateErr) {
      throw new Error(`Gagal menyimpan catatan resep: ${updateErr.message}`);
    }

    revalidatePath("/dashboard/resep");
    revalidatePath("/dashboard/produk");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan resep.";
    return { success: false, error: message };
  }
}
