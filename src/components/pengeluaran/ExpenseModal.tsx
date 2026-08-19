"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Pengeluaran, ExpenseCategory } from "@/types/database";
import { formatRupiah, parseRupiah } from "@/lib/utils";
import {
  X,
  PlusCircle,
  Receipt,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle2,
  UtensilsCrossed,
  Flame,
  Package,
  Store,
  Tag,
} from "lucide-react";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseToEdit?: Pengeluaran | null;
}

const CATEGORIES: {
  id: ExpenseCategory;
  name: string;
  desc: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    id: "bahan baku",
    name: "Bahan Baku",
    desc: "Tepung, telur, minyak, keju, sosis, dll.",
    icon: UtensilsCrossed,
    color: "#81181f",
  },
  {
    id: "gas",
    name: "Gas Elpiji",
    desc: "Isi ulang tabung gas 3kg / 12kg",
    icon: Flame,
    color: "#d62934",
  },
  {
    id: "kemasan",
    name: "Kemasan",
    desc: "Mika, plastik, kantong kresek, paper bag",
    icon: Package,
    color: "#0c6b57",
  },
  {
    id: "sewa",
    name: "Sewa Tempat",
    desc: "Sewa lapak / stan jualan",
    icon: Store,
    color: "#47d1b5",
  },
  {
    id: "lainnya",
    name: "Lain-lain",
    desc: "Listrik, air, kebersihan, transportasi",
    icon: Tag,
    color: "#6b7280",
  },
];

function ExpenseForm({
  onClose,
  onSuccess,
  expenseToEdit,
}: {
  onClose: () => void;
  onSuccess: () => void;
  expenseToEdit?: Pengeluaran | null;
}) {
  const supabase = createClient();

  // Inisialisasi tanggal lokal format YYYY-MM-DDTHH:mm
  const getInitialDate = () => {
    if (expenseToEdit?.tanggal) {
      const d = new Date(expenseToEdit.tanggal);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    }
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [kategori, setKategori] = useState<ExpenseCategory>(
    expenseToEdit?.kategori || "bahan baku"
  );
  const [jumlahStr, setJumlahStr] = useState<string>(
    expenseToEdit ? formatRupiah(expenseToEdit.jumlah) : ""
  );
  const [tanggal, setTanggal] = useState<string>(getInitialDate());
  const [keterangan, setKeterangan] = useState<string>(
    expenseToEdit?.keterangan || ""
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const jumlahNum = parseRupiah(jumlahStr);

  const handleQuickAdd = (nominal: number) => {
    const current = parseRupiah(jumlahStr);
    const updated = current + nominal;
    setJumlahStr(formatRupiah(updated));
  };

  const handleSetExact = (nominal: number) => {
    setJumlahStr(formatRupiah(nominal));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (jumlahNum <= 0) {
      setErrorMsg("Nominal pengeluaran harus lebih besar dari Rp 0.");
      return;
    }

    if (!keterangan.trim()) {
      setErrorMsg("Keterangan atau rincian pengeluaran wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        kategori,
        jumlah: jumlahNum,
        tanggal: new Date(tanggal).toISOString(),
        keterangan: keterangan.trim(),
      };

      if (expenseToEdit) {
        const { error } = await supabase
          .from("pengeluaran")
          .update(payload as never)
          .eq("id", expenseToEdit.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pengeluaran")
          .insert([payload] as never);
        if (error) throw error;
      }


      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Error saving expense:", err);
      const msg = err instanceof Error ? err.message : "Gagal menyimpan pengeluaran.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-[#d62934]/10 border border-[#d62934]/30 flex items-start gap-2.5 text-xs text-[#81181f] animate-shake">
          <AlertCircle className="w-4 h-4 text-[#d62934] shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Pilih Kategori */}
      <div>
        <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-2">
          Kategori Pengeluaran *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = kategori === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setKategori(cat.id)}
                className={`p-2.5 rounded-2xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#81181f] text-white border-[#81181f] shadow-xs"
                    : "bg-white text-zinc-700 border-zinc-200 hover:bg-[#efe6e6]/50"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-[#efe6e6] text-[#81181f]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs leading-tight truncate">
                    {cat.name}
                  </p>
                  <p
                    className={`text-[9px] truncate mt-0.5 ${
                      isSelected ? "text-white/80" : "text-zinc-400"
                    }`}
                  >
                    {cat.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Jumlah Nominal */}
      <div>
        <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
          Jumlah Biaya (Rp) *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#81181f] font-extrabold text-sm">
            <DollarSign className="w-4 h-4 text-[#d59a9e]" />
          </div>
          <input
            type="text"
            required
            value={jumlahStr}
            onChange={(e) => setJumlahStr(e.target.value ? formatRupiah(parseRupiah(e.target.value)) : "")}
            placeholder="Rp 0"
            className="input-field pl-10 py-2.5 font-extrabold text-base text-[#81181f]"
          />
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[10px] text-zinc-400 font-semibold">Pecahan:</span>
          {[10000, 20000, 50000, 100000, 500000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => (jumlahNum === 0 ? handleSetExact(amt) : handleQuickAdd(amt))}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-[#efe6e6] text-[11px] font-semibold text-zinc-700 transition-all cursor-pointer border border-zinc-200"
            >
              +{formatRupiah(amt).replace("Rp ", "")}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Tanggal & Waktu */}
      <div>
        <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
          Tanggal & Waktu Pengeluaran *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Calendar className="w-4 h-4" />
          </div>
          <input
            type="datetime-local"
            required
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="input-field pl-10 py-2 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* 4. Keterangan / Deskripsi */}
      <div>
        <label className="block text-xs font-bold text-[#81181f] uppercase tracking-wider mb-1.5">
          Keterangan / Rincian Biaya *
        </label>
        <div className="relative">
          <div className="absolute top-3 left-3.5 pointer-events-none text-zinc-400">
            <FileText className="w-4 h-4" />
          </div>
          <textarea
            required
            rows={2}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Contoh: Beli telur 2kg, tepung terigu 5kg, dan minyak goreng 2L"
            className="input-field pl-10 pt-2.5 text-xs sm:text-sm resize-none"
          />
        </div>
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
              <span>{expenseToEdit ? "Simpan Perubahan" : "Simpan Pengeluaran"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function ExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  expenseToEdit,
}: ExpenseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-[#d59a9e]/40 shadow-2xl max-w-lg w-full overflow-hidden my-8">
        {/* Header */}
        <div className="bg-linear-to-r from-[#81181f] to-[#d62934] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              {expenseToEdit ? (
                <Receipt className="w-4 h-4 text-white" />
              ) : (
                <PlusCircle className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight leading-tight">
                {expenseToEdit ? "Edit Catatan Pengeluaran" : "Catat Pengeluaran Baru"}
              </h3>
              <p className="text-[11px] text-white/80">
                Otomatis memotong dan memperbarui laba bersih di dashboard
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

        {/* Subcomponent Form with Key Reset Pattern */}
        <ExpenseForm
          key={expenseToEdit?.id || "new-expense"}
          onClose={onClose}
          onSuccess={onSuccess}
          expenseToEdit={expenseToEdit}
        />
      </div>
    </div>
  );
}
