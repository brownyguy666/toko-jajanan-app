"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { PaymentMethod } from "@/types/database";

export interface CartItemPayload {
  produk_id: string;
  nama: string;
  qty: number;
  harga_jual: number;
}

export interface TransactionPayload {
  items: CartItemPayload[];
  metode_bayar: PaymentMethod;
  uang_diterima?: number;
}

export interface TransactionResult {
  success: boolean;
  error?: string;
  message?: string;
  transaksiId?: string;
  tanggal?: string;
  total?: number;
  metode_bayar?: PaymentMethod;
  uang_diterima?: number;
  kembalian?: number;
  kasir_nama?: string;
  items?: {
    nama: string;
    qty: number;
    harga: number;
    subtotal: number;
  }[];
}

interface ProductDbRow {
  id: string;
  nama: string;
  harga_jual: number;
  stok: number;
}

interface ProfileDbRow {
  nama: string;
  role: string;
  status_aktif: boolean;
}

export async function processTransactionAction(
  payload: TransactionPayload
): Promise<TransactionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sesi login berakhir. Silakan login kembali." };
    }

    const { items, metode_bayar, uang_diterima } = payload;

    if (!items || items.length === 0) {
      return { success: false, error: "Keranjang belanja masih kosong." };
    }

    // 1. Ambil data kasir
    const { data: profileData } = await supabase
      .from("profiles")
      .select("nama, role, status_aktif")
      .eq("id", user.id)
      .single();

    const profile = profileData as unknown as ProfileDbRow | null;

    if (!profile || !profile.status_aktif) {
      return { success: false, error: "Akun kasir Anda tidak aktif atau tidak terdaftar." };
    }

    // 2. Validasi stok aktual semua produk di database
    const productIds = items.map((i) => i.produk_id);
    const { data: rawDbProducts, error: prodErr } = await supabase
      .from("produk")
      .select("id, nama, harga_jual, stok")
      .in("id", productIds);

    if (prodErr || !rawDbProducts) {
      return { success: false, error: "Gagal memverifikasi data produk di database." };
    }

    const dbProducts = rawDbProducts as unknown as ProductDbRow[];
    const productMap = new Map<string, ProductDbRow>(
      dbProducts.map((p) => [p.id, p])
    );

    let calculatedTotal = 0;
    const validatedItems: {
      produk_id: string;
      nama: string;
      qty: number;
      harga_saat_jual: number;
      subtotal: number;
      newStock: number;
    }[] = [];

    for (const item of items) {
      const dbProd = productMap.get(item.produk_id);
      if (!dbProd) {
        return {
          success: false,
          error: `Produk "${item.nama}" tidak ditemukan di database.`,
        };
      }

      if (dbProd.stok < item.qty) {
        return {
          success: false,
          error: `Stok "${dbProd.nama}" tidak mencukupi! Tersisa ${dbProd.stok} porsi, diminta ${item.qty} porsi.`,
        };
      }

      const itemPrice = dbProd.harga_jual;
      const subtotal = itemPrice * item.qty;
      calculatedTotal += subtotal;

      validatedItems.push({
        produk_id: dbProd.id,
        nama: dbProd.nama,
        qty: item.qty,
        harga_saat_jual: itemPrice,
        subtotal: subtotal,
        newStock: dbProd.stok - item.qty,
      });
    }

    // Validasi uang bayar jika tunai
    const cashReceived = uang_diterima ?? calculatedTotal;
    if (metode_bayar === "tunai" && cashReceived < calculatedTotal) {
      return {
        success: false,
        error: `Nominal uang diterima (Rp ${cashReceived.toLocaleString("id-ID")}) kurang dari total belanja (Rp ${calculatedTotal.toLocaleString("id-ID")}).`,
      };
    }

    const kembalian = metode_bayar === "tunai" ? Math.max(0, cashReceived - calculatedTotal) : 0;
    const transactionTime = new Date().toISOString();

    // 3. Simpan baris transaksi
    const { data: newTransaksi, error: trxErr } = await supabase
      .from("transaksi")
      .insert({
        kasir_id: user.id,
        tanggal: transactionTime,
        total: calculatedTotal,
        metode_bayar: metode_bayar,
      } as never)
      .select("id")
      .single();

    if (trxErr || !newTransaksi) {
      throw new Error(`Gagal menyimpan transaksi: ${trxErr?.message || "Error tidak diketahui"}`);
    }

    const transaksiId = (newTransaksi as { id: string }).id;

    // 4. Simpan baris transaksi_item
    const itemsToInsert = validatedItems.map((item) => ({
      transaksi_id: transaksiId,
      produk_id: item.produk_id,
      qty: item.qty,
      harga_saat_jual: item.harga_saat_jual,
      subtotal: item.subtotal,
    }));

    const { error: itemsErr } = await supabase
      .from("transaksi_item")
      .insert(itemsToInsert as never);

    if (itemsErr) {
      throw new Error(`Gagal menyimpan rincian item transaksi: ${itemsErr.message}`);
    }

    // 5. Potong stok produk secara otomatis
    for (const item of validatedItems) {
      await supabase
        .from("produk")
        .update({
          stok: item.newStock,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", item.produk_id);
    }

    revalidatePath("/kasir");
    revalidatePath("/dashboard/produk");
    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return {
      success: true,
      transaksiId: transaksiId,
      tanggal: transactionTime,
      total: calculatedTotal,
      metode_bayar: metode_bayar,
      uang_diterima: cashReceived,
      kembalian: kembalian,
      kasir_nama: profile.nama,
      items: validatedItems.map((i) => ({
        nama: i.nama,
        qty: i.qty,
        harga: i.harga_saat_jual,
        subtotal: i.subtotal,
      })),
    };
  } catch (err: unknown) {
    console.error("Error in processTransactionAction:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan sistem saat memproses transaksi.";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server Action: Batalkan transaksi dalam 5 menit terakhir & kembalikan stok
 */
export async function cancelTransactionAction(
  transaksiId: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sesi login berakhir. Silakan login kembali." };
    }

    // 1. Ambil data profil
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role, status_aktif")
      .eq("id", user.id)
      .single();

    const userProfile = profileData as unknown as ProfileDbRow | null;
    if (!userProfile || !userProfile.status_aktif) {
      return { success: false, error: "Akun Anda tidak aktif atau tidak memiliki izin." };
    }

    // 2. Ambil data transaksi
    const { data: trxData, error: trxErr } = await supabase
      .from("transaksi")
      .select("id, kasir_id, tanggal, total")
      .eq("id", transaksiId)
      .single();

    if (trxErr || !trxData) {
      return { success: false, error: "Transaksi tidak ditemukan di sistem." };
    }

    const trx = trxData as unknown as {
      id: string;
      kasir_id: string;
      tanggal: string;
      total: number;
    };

    // Validasi hak akses (Hanya kasir yang bersangkutan atau Owner yang boleh membatalkan)
    if (trx.kasir_id !== user.id && userProfile.role !== "owner") {
      return {
        success: false,
        error: "Anda hanya dapat membatalkan transaksi yang Anda buat sendiri.",
      };
    }

    // 3. Validasi batas waktu 5 menit (300 detik + 15 detik toleransi)
    const trxTime = new Date(trx.tanggal).getTime();
    const now = Date.now();
    const diffMs = now - trxTime;
    const maxAllowedMs = 5 * 60 * 1000 + 15000; // 5 menit 15 detik

    if (diffMs > maxAllowedMs) {
      const minutesAgo = Math.floor(diffMs / 60000);
      return {
        success: false,
        error: `Transaksi telah dibuat ${minutesAgo} menit yang lalu. Pembatalan hanya diizinkan dalam 5 menit pertama.`,
      };
    }

    // 4. Ambil item transaksi untuk mengembalikan stok
    const { data: itemsData, error: itemsErr } = await supabase
      .from("transaksi_item")
      .select("produk_id, qty")
      .eq("transaksi_id", transaksiId);

    if (itemsErr) {
      throw new Error(`Gagal membaca rincian item transaksi: ${itemsErr.message}`);
    }

    const items = (itemsData as unknown as { produk_id: string; qty: number }[]) || [];

    // 5. Kembalikan stok setiap produk di database
    for (const item of items) {
      const { data: pData } = await supabase
        .from("produk")
        .select("stok")
        .eq("id", item.produk_id)
        .single();

      const currentStock = (pData as unknown as { stok: number } | null)?.stok ?? 0;
      const restoredStock = currentStock + item.qty;

      await supabase
        .from("produk")
        .update({
          stok: restoredStock,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", item.produk_id);
    }

    // 6. Hapus baris transaksi_item dan transaksi
    await supabase.from("transaksi_item").delete().eq("transaksi_id", transaksiId);
    await supabase.from("transaksi").delete().eq("id", transaksiId);

    revalidatePath("/kasir");
    revalidatePath("/dashboard/produk");
    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return {
      success: true,
      message: "Transaksi berhasil dibatalkan dan seluruh stok produk telah dikembalikan ke etalase.",
    };
  } catch (err: unknown) {
    console.error("Error in cancelTransactionAction:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat membatalkan transaksi.";
    return {
      success: false,
      error: message,
    };
  }
}
