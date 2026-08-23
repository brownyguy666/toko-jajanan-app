"use client";

import { PaymentMethod } from "@/types/database";
import { TransactionPayload, processTransactionAction } from "@/app/kasir/actions";

export interface OfflineTransactionItem {
  produk_id: string;
  nama: string;
  qty: number;
  harga_jual: number;
  subtotal: number;
}

export interface OfflineTransaction {
  client_id: string;
  created_at: string;
  total: number;
  metode_bayar: PaymentMethod;
  uang_diterima?: number;
  kembalian?: number;
  kasir_nama?: string;
  items: OfflineTransactionItem[];
  status: "pending" | "syncing" | "failed";
  retry_count: number;
  last_error?: string;
}

const STORAGE_KEY = "toko_offline_queue";
const PROCESSED_IDS_KEY = "toko_processed_offline_ids";

// Mutex lock to prevent duplicate concurrent sync processes
let isSyncInProgress = false;

/**
 * Mendapatkan seluruh transaksi offline yang belum tersinkron
 */
export function getOfflineQueue(): OfflineTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Gagal membaca offline queue dari localStorage:", err);
    return [];
  }
}

/**
 * Menyimpan transaksi baru ke antrian offline
 */
export function saveToOfflineQueue(
  tx: Omit<OfflineTransaction, "status" | "retry_count">
): OfflineTransaction {
  if (typeof window === "undefined") {
    return { ...tx, status: "pending", retry_count: 0 };
  }

  const newTx: OfflineTransaction = {
    ...tx,
    status: "pending",
    retry_count: 0,
  };

  try {
    const currentQueue = getOfflineQueue();
    // Hindari duplikasi ID
    const exists = currentQueue.some((item) => item.client_id === newTx.client_id);
    if (!exists) {
      const updatedQueue = [...currentQueue, newTx];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueue));
      window.dispatchEvent(new CustomEvent("offline-queue-changed", { detail: updatedQueue }));
    }
  } catch (err) {
    console.error("Gagal menyimpan transaksi ke offline queue:", err);
  }

  return newTx;
}

/**
 * Menghapus transaksi tertentu dari antrian offline setelah berhasil disinkron
 */
export function removeFromOfflineQueue(clientId: string): void {
  if (typeof window === "undefined") return;
  try {
    const currentQueue = getOfflineQueue();
    const updatedQueue = currentQueue.filter((item) => item.client_id !== clientId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueue));

    // Catat ID yang sudah sukses diproses (idempotency safety cache)
    markClientIdAsProcessed(clientId);

    window.dispatchEvent(new CustomEvent("offline-queue-changed", { detail: updatedQueue }));
  } catch (err) {
    console.error("Gagal menghapus transaksi dari offline queue:", err);
  }
}

/**
 * Menandai ID transaksi lokal yang sudah pernah sukses diproses
 */
function markClientIdAsProcessed(clientId: string): void {
  try {
    const raw = localStorage.getItem(PROCESSED_IDS_KEY);
    const processedList: string[] = raw ? JSON.parse(raw) : [];
    if (!processedList.includes(clientId)) {
      processedList.push(clientId);
      // Simpan maksimal 200 riwayat ID terakhir
      if (processedList.length > 200) {
        processedList.splice(0, processedList.length - 200);
      }
      localStorage.setItem(PROCESSED_IDS_KEY, JSON.stringify(processedList));
    }
  } catch (err) {
    console.error("Gagal mencatat processed offline ID:", err);
  }
}

/**
 * Memeriksa apakah client_id sudah pernah tersinkron
 */
export function isClientIdAlreadyProcessed(clientId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(PROCESSED_IDS_KEY);
    const processedList: string[] = raw ? JSON.parse(raw) : [];
    return processedList.includes(clientId);
  } catch {
    return false;
  }
}

/**
 * Menjalankan proses sinkronisasi antrian offline ke Supabase.
 * Dilengkapi concurrency mutex lock agar tidak terjadi double-insert
 * saat event online terpanggil berulang kali.
 */
export async function syncOfflineQueue(): Promise<{
  totalSynced: number;
  failedCount: number;
  remaining: number;
}> {
  if (typeof window === "undefined") {
    return { totalSynced: 0, failedCount: 0, remaining: 0 };
  }

  // Jika sedang berjalan atau offline, batalkan
  if (isSyncInProgress || !navigator.onLine) {
    const queue = getOfflineQueue();
    return { totalSynced: 0, failedCount: 0, remaining: queue.length };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { totalSynced: 0, failedCount: 0, remaining: 0 };
  }

  isSyncInProgress = true;
  window.dispatchEvent(new CustomEvent("offline-sync-started"));

  let totalSynced = 0;
  let failedCount = 0;

  try {
    for (const tx of queue) {
      // 1. Double check apakah ID ini sudah pernah diproses sebelumnya
      if (isClientIdAlreadyProcessed(tx.client_id)) {
        removeFromOfflineQueue(tx.client_id);
        continue;
      }

      // 2. Persiapkan payload server action
      const payload: TransactionPayload = {
        items: tx.items.map((i) => ({
          produk_id: i.produk_id,
          nama: i.nama,
          qty: i.qty,
          harga_jual: i.harga_jual,
        })),
        metode_bayar: tx.metode_bayar,
        uang_diterima: tx.uang_diterima,
      };

      try {
        const res = await processTransactionAction(payload);
        if (res.success) {
          totalSynced += 1;
          removeFromOfflineQueue(tx.client_id);
        } else {
          failedCount += 1;
          console.warn(`Sinkronisasi transaksi ${tx.client_id} gagal:`, res.error);
        }
      } catch (err) {
        failedCount += 1;
        console.error(`Network error saat sinkron transaksi ${tx.client_id}:`, err);
        // Jika koneksi terputus di tengah jalan, hentikan loop
        if (!navigator.onLine) {
          break;
        }
      }
    }
  } finally {
    isSyncInProgress = false;
    const remaining = getOfflineQueue().length;
    window.dispatchEvent(
      new CustomEvent("offline-sync-finished", {
        detail: { totalSynced, failedCount, remaining },
      })
    );
  }

  return { totalSynced, failedCount, remaining: getOfflineQueue().length };
}
