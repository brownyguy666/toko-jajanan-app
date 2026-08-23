"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getOfflineQueue,
  syncOfflineQueue,
  OfflineTransaction,
} from "@/lib/offlineQueue";
import {
  WifiOff,
  Wifi,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  CloudUpload,
} from "lucide-react";

interface OfflineQueueBarProps {
  onSyncComplete?: () => void;
}

export function OfflineQueueBar({ onSyncComplete }: OfflineQueueBarProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queue, setQueue] = useState<OfflineTransaction[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const updateQueueState = useCallback(() => {
    setQueue(getOfflineQueue());
  }, []);

  const handleTriggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    setSyncFeedback(null);

    const result = await syncOfflineQueue();
    setIsSyncing(false);
    updateQueueState();

    if (result.totalSynced > 0) {
      setSyncFeedback({
        type: "success",
        message: `Berhasil menyinkronkan ${result.totalSynced} transaksi offline ke database!`,
      });
      if (onSyncComplete) onSyncComplete();
      setTimeout(() => setSyncFeedback(null), 5000);
    } else if (result.failedCount > 0) {
      setSyncFeedback({
        type: "error",
        message: `${result.failedCount} transaksi gagal disinkronkan. Akan dicoba lagi saat koneksi stabil.`,
      });
    }
  }, [isSyncing, updateQueueState, onSyncComplete]);

  useEffect(() => {
    // Initial State Check
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      updateQueueState();

      // Auto-sync jika online dan ada antrian tertunda
      if (navigator.onLine && getOfflineQueue().length > 0) {
        handleTriggerSync();
      }
    }

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync langsung begitu koneksi internet kembali online
      handleTriggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChange = (e: Event) => {
      const customEvent = e as CustomEvent<OfflineTransaction[]>;
      if (customEvent.detail) {
        setQueue(customEvent.detail);
      } else {
        updateQueueState();
      }
    };

    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncEnd = (e: Event) => {
      setIsSyncing(false);
      updateQueueState();
      const customEvent = e as CustomEvent<{ totalSynced: number }>;
      if (customEvent.detail?.totalSynced > 0 && onSyncComplete) {
        onSyncComplete();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("offline-queue-changed", handleQueueChange);
    window.addEventListener("offline-sync-started", handleSyncStart);
    window.addEventListener("offline-sync-finished", handleSyncEnd);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("offline-queue-changed", handleQueueChange);
      window.removeEventListener("offline-sync-started", handleSyncStart);
      window.removeEventListener("offline-sync-finished", handleSyncEnd);
    };
  }, [handleTriggerSync, updateQueueState, onSyncComplete]);

  const queueCount = queue.length;

  // Jika online dan tidak ada antrian dan tidak ada feedback, jangan tampilkan banner
  if (isOnline && queueCount === 0 && !syncFeedback && !isSyncing) {
    return null;
  }

  return (
    <div className="w-full mb-4 animate-fadeIn">
      {/* 1. Mode Offline Bar */}
      {!isOnline && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="font-extrabold text-xs sm:text-sm text-amber-950 flex items-center gap-1.5">
                <span>Mode Offline Aktif</span>
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
              </p>
              <p className="text-[11px] text-amber-900/80 font-medium">
                {queueCount > 0
                  ? `${queueCount} transaksi tersimpan lokal di browser. Otomatis dikirim saat internet terhubung.`
                  : "Koneksi internet terputus. Transaksi baru akan disimpan lokal sementara di browser."}
              </p>
            </div>
          </div>

          {queueCount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-950 text-xs font-extrabold self-start sm:self-center">
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              <span>{queueCount} Antrian Lokal</span>
            </div>
          )}
        </div>
      )}

      {/* 2. Online dengan Antrian Tertunda Bar */}
      {isOnline && queueCount > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-sky-50 border-2 border-sky-300 text-sky-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
              <CloudUpload className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-xs sm:text-sm text-sky-950">
                {queueCount} Transaksi Offline Menunggu Sinkronisasi
              </p>
              <p className="text-[11px] text-sky-800 font-medium">
                Koneksi internet kembali aktif. Sistem sedang/siap mengirim transaksi lokal ke server Supabase.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-extrabold text-xs shadow-md shadow-sky-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer self-start sm:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}</span>
          </button>
        </div>
      )}

      {/* 3. Feedback Banner Sukses Sinkronisasi */}
      {syncFeedback && (
        <div
          className={`mt-2 p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-bold animate-fadeIn ${
            syncFeedback.type === "success"
              ? "bg-[#47d1b5]/15 border-[#47d1b5]/40 text-[#0c6b57]"
              : "bg-red-50 border-red-200 text-[#d62934]"
          }`}
        >
          <div className="flex items-center gap-2">
            {syncFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#0c6b57] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#d62934] shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-zinc-400 hover:text-zinc-700 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
