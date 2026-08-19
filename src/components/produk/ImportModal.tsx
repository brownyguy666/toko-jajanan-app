"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  ArrowRight,
} from "lucide-react";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedProduct {
  nama: string;
  kategori: string;
  harga_jual: number;
  harga_modal: number;
  stok: number;
  isValid: boolean;
  errorReason?: string;
}

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const supabase = createClient();

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent =
      "nama,kategori,harga_jual,harga_modal,stok\n" +
      "Risoles Mayo Spesial,Gorengan,3500,2000,30\n" +
      "Pastel Telur Sayur,Gorengan,4000,2500,25\n" +
      "Lemper Ayam Bakar,Kue Basah,5000,3000,20\n" +
      "Keripik Singkong Balado,Keripik & Kerupuk,10000,6000,15\n" +
      "Es Teh Manis Solo,Minuman,4000,1500,50\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template-produk-jajanan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const normalizeRow = (rawRow: any): ParsedProduct => {
    // Normalisasi kunci objek (lowercase tanpa spasi atau underscore berlebih)
    const normalizedKeys: { [key: string]: any } = {};
    Object.keys(rawRow).forEach((k) => {
      const cleanKey = k.toLowerCase().trim().replace(/\s+/g, "_");
      normalizedKeys[cleanKey] = rawRow[k];
    });

    const nama = (
      normalizedKeys["nama"] ||
      normalizedKeys["nama_produk"] ||
      normalizedKeys["produk"] ||
      ""
    ).toString().trim();

    const kategori = (
      normalizedKeys["kategori"] ||
      normalizedKeys["category"] ||
      "Lainnya"
    ).toString().trim() || "Lainnya";

    const rawJual = normalizedKeys["harga_jual"] ?? normalizedKeys["hargajual"] ?? normalizedKeys["harga"] ?? 0;
    const rawModal = normalizedKeys["harga_modal"] ?? normalizedKeys["hargamodal"] ?? normalizedKeys["modal"] ?? 0;
    const rawStok = normalizedKeys["stok"] ?? normalizedKeys["stock"] ?? normalizedKeys["qty"] ?? 0;

    const harga_jual = Math.round(Number(String(rawJual).replace(/[^0-9.-]+/g, ""))) || 0;
    const harga_modal = Math.round(Number(String(rawModal).replace(/[^0-9.-]+/g, ""))) || 0;
    const stok = Math.round(Number(String(rawStok).replace(/[^0-9.-]+/g, ""))) || 0;

    let isValid = true;
    let errorReason = "";

    if (!nama) {
      isValid = false;
      errorReason = "Nama produk kosong";
    } else if (harga_jual <= 0) {
      isValid = false;
      errorReason = "Harga jual harus > 0";
    } else if (harga_modal < 0) {
      isValid = false;
      errorReason = "Harga modal tidak valid";
    }

    return {
      nama,
      kategori,
      harga_jual,
      harga_modal,
      stok: Math.max(0, stok),
      isValid,
      errorReason,
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessCount(null);

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (f: File) => {
    const fileName = f.name.toLowerCase();

    if (fileName.endsWith(".csv")) {
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const parsed = results.data.map(normalizeRow);
            setParsedData(parsed);
          } else {
            setErrorMsg("File CSV kosong atau tidak memiliki format header yang valid.");
          }
        },
        error: (err) => {
          setErrorMsg(`Gagal membaca file CSV: ${err.message}`);
        },
      });
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const firstSheetName = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheetName];
          const data = XLSX.utils.sheet_to_json(ws);

          if (data && data.length > 0) {
            const parsed = data.map(normalizeRow);
            setParsedData(parsed);
          } else {
            setErrorMsg("File Excel kosong atau sheet pertama tidak berisi data.");
          }
        } catch (err: any) {
          setErrorMsg(`Gagal memproses file Excel: ${err.message}`);
        }
      };
      reader.readAsBinaryString(f);
    } else {
      setErrorMsg("Format file harus berupa .csv atau .xlsx / .xls");
    }
  };

  const handleImportSubmit = async () => {
    const validRows = parsedData.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg("Tidak ada baris data produk yang valid untuk diimpor.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const rowsToInsert = validRows.map((r) => ({
        nama: r.nama,
        kategori: r.kategori,
        harga_jual: r.harga_jual,
        harga_modal: r.harga_modal,
        stok: r.stok,
        foto_url: null,
      }));

      const { error } = await (supabase.from("produk") as any).insert(rowsToInsert);

      if (error) throw error;

      setSuccessCount(validRows.length);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Error bulk inserting products:", err);
      setErrorMsg(err.message || "Gagal mengimpor produk ke database.");
    } finally {
      setLoading(false);
    }
  };

  const validCount = parsedData.filter((r) => r.isValid).length;
  const invalidCount = parsedData.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-[#d59a9e]/40 shadow-2xl max-w-2xl w-full overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#81181f] to-[#d62934] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight leading-tight">
                Import Produk dari CSV / Excel
              </h3>
              <p className="text-[11px] text-white/80">
                Tambah banyak produk jajanan sekaligus secara cepat
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

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Petunjuk & Download Template */}
          <div className="p-4 rounded-2xl bg-[#efe6e6]/60 border border-[#d59a9e]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-[#81181f] uppercase tracking-wider">
                Format Kolom Wajib
              </h4>
              <p className="text-xs text-zinc-600 mt-0.5">
                Pastikan spreadsheet memiliki header: <code>nama, kategori, harga_jual, harga_modal, stok</code>
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#efe6e6] text-[#81181f] text-xs font-bold border border-[#d59a9e]/50 shadow-2xs transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#d62934]" />
              <span>Download Template CSV</span>
            </button>
          </div>

          {/* File Upload Dropzone */}
          {!file && (
            <label className="border-2 border-dashed border-[#d59a9e] hover:border-[#d62934] rounded-3xl p-8 bg-[#efe6e6]/20 hover:bg-[#efe6e6]/40 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#d62934] shadow-sm flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#81181f]">
                Klik untuk memilih file CSV atau Excel (.xlsx, .xls)
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Tarik dan lepaskan file dokumen Anda di sini
              </p>
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}

          {/* File Selected & Preview */}
          {file && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#efe6e6]/40 border border-[#d59a9e]/30">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-[#d62934]" />
                  <div>
                    <p className="text-xs font-bold text-[#81181f]">{file.name}</p>
                    <p className="text-[11px] text-zinc-500">
                      {(file.size / 1024).toFixed(1)} KB &bull; {parsedData.length} baris terdeteksi
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setParsedData([]);
                    setErrorMsg(null);
                    setSuccessCount(null);
                  }}
                  className="text-zinc-400 hover:text-[#d62934] p-1 rounded-lg"
                  title="Ganti File"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Status Bar */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1 text-[#0c6b57]">
                  <CheckCircle2 className="w-4 h-4 text-[#47d1b5]" />
                  {validCount} Siap Diimpor
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1 text-[#d62934]">
                    <AlertCircle className="w-4 h-4" />
                    {invalidCount} Baris Tidak Valid
                  </span>
                )}
              </div>

              {/* Preview Table */}
              <div className="border border-[#d59a9e]/30 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#efe6e6] text-[#81181f] font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">Nama Produk</th>
                      <th className="p-2.5">Kategori</th>
                      <th className="p-2.5 text-right">Harga Jual</th>
                      <th className="p-2.5 text-right">Harga Modal</th>
                      <th className="p-2.5 text-center">Stok</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efe6e6]">
                    {parsedData.map((row, idx) => (
                      <tr
                        key={idx}
                        className={row.isValid ? "hover:bg-zinc-50" : "bg-red-50/50"}
                      >
                        <td className="p-2.5 font-medium text-zinc-900">
                          {row.nama || <span className="text-red-500 italic">(Kosong)</span>}
                        </td>
                        <td className="p-2.5 text-zinc-600">{row.kategori}</td>
                        <td className="p-2.5 text-right font-semibold text-[#81181f]">
                          {formatRupiah(row.harga_jual)}
                        </td>
                        <td className="p-2.5 text-right text-zinc-600">
                          {formatRupiah(row.harga_modal)}
                        </td>
                        <td className="p-2.5 text-center font-bold text-zinc-800">
                          {row.stok}
                        </td>
                        <td className="p-2.5 text-center">
                          {row.isValid ? (
                            <span className="inline-block w-2 h-2 rounded-full bg-[#47d1b5]" />
                          ) : (
                            <span className="text-[10px] text-[#d62934] font-bold">
                              {row.errorReason}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[#d62934]/10 border border-[#d62934]/30 flex items-start gap-2.5 text-xs text-[#81181f]">
              <AlertCircle className="w-4 h-4 text-[#d62934] shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {successCount !== null && (
            <div className="p-3.5 rounded-2xl bg-[#47d1b5]/15 border border-[#47d1b5]/40 flex items-start gap-2.5 text-xs text-[#0c6b57]">
              <CheckCircle2 className="w-4 h-4 text-[#47d1b5] shrink-0 mt-0.5" />
              <span className="font-bold">
                Berhasil mengimpor {successCount} produk jajanan ke database!
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-50 border-t border-[#efe6e6] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>

          {file && validCount > 0 && (
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={loading || successCount !== null}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d62934] to-[#81181f] text-white text-xs font-bold shadow-md shadow-[#d62934]/25 hover:opacity-95 active:scale-98 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#47d1b5]" />
                  <span>Proses Import ({validCount} Produk)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
