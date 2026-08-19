"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { formatRupiah } from "@/lib/utils";
import { Scale, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";

interface ExpenseComparisonProps {
  totalOmzet: number;
  totalModalTerjual: number;
  totalPengeluaran: number;
  labaKotor: number;
  labaBersih: number;
}

export function ExpenseComparisonChart({
  totalOmzet,
  totalModalTerjual,
  totalPengeluaran,
  labaBersih,
}: ExpenseComparisonProps) {
  const chartData = [
    {
      name: "Omzet",
      value: totalOmzet,
      color: "#81181f",
      description: "Total Pemasukan",
    },
    {
      name: "Modal Snack",
      value: totalModalTerjual,
      color: "#d59a9e",
      description: "Harga Pokok Terjual",
    },
    {
      name: "Operasional",
      value: totalPengeluaran,
      color: "#d62934",
      description: "Bahan, Gas, Sewa, dll.",
    },
    {
      name: "Laba Bersih",
      value: Math.max(0, labaBersih),
      color: "#0c6b57",
      description: "Keuntungan Bersih",
    },
  ];

  const marginPersen =
    totalOmzet > 0 ? ((labaBersih / totalOmzet) * 100).toFixed(1) : "0";

  return (
    <div className="bg-white rounded-3xl border border-[#d59a9e]/30 p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-extrabold text-base text-[#81181f] tracking-tight flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#0c6b57]" />
            <span>Perbandingan Omzet vs Pengeluaran & Laba Bersih</span>
          </h3>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Analisis arus kas keluar-masuk dan marjin profit toko
          </p>
        </div>

        {/* Net Margin Badge */}
        <div
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-extrabold border ${
            labaBersih >= 0
              ? "bg-[#47d1b5]/15 text-[#0c6b57] border-[#47d1b5]/40"
              : "bg-red-100 text-[#d62934] border-red-200"
          }`}
        >
          {labaBersih >= 0 ? (
            <ArrowUpRight className="w-3.5 h-3.5" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5" />
          )}
          <span>Marjin Bersih: {marginPersen}%</span>
        </div>
      </div>

      {/* Bar Chart Visual */}
      <div className="w-full h-56 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0e4e4" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#666666", fontSize: 11, fontWeight: "bold" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fill: "#888888", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
                return value;
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const dataItem = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-[#d59a9e]/40 text-xs space-y-1">
                      <p className="font-bold text-zinc-900">{dataItem.name}</p>
                      <p className="text-[11px] text-zinc-500">{dataItem.description}</p>
                      <p className="font-extrabold text-sm text-[#81181f] pt-1 border-t border-zinc-100">
                        {formatRupiah(Number(dataItem.value) || 0)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#efe6e6]">
        <div className="p-2.5 rounded-xl bg-[#efe6e6]/40 border border-[#d59a9e]/20">
          <span className="text-[10px] font-bold text-zinc-500 uppercase block">
            Omzet
          </span>
          <p className="font-extrabold text-xs sm:text-sm text-[#81181f] truncate">
            {formatRupiah(totalOmzet)}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-[#efe6e6]/40 border border-[#d59a9e]/20">
          <span className="text-[10px] font-bold text-zinc-500 uppercase block">
            Modal Terjual
          </span>
          <p className="font-extrabold text-xs sm:text-sm text-zinc-700 truncate">
            {formatRupiah(totalModalTerjual)}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-[#efe6e6]/40 border border-[#d59a9e]/20">
          <span className="text-[10px] font-bold text-zinc-500 uppercase block">
            Pengeluaran
          </span>
          <p className="font-extrabold text-xs sm:text-sm text-[#d62934] truncate">
            {formatRupiah(totalPengeluaran)}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-[#47d1b5]/15 border border-[#47d1b5]/30">
          <span className="text-[10px] font-bold text-[#0c6b57] uppercase block flex items-center gap-0.5">
            <DollarSign className="w-3 h-3" />
            Laba Bersih
          </span>
          <p className="font-extrabold text-xs sm:text-sm text-[#0c6b57] truncate">
            {formatRupiah(labaBersih)}
          </p>
        </div>
      </div>
    </div>
  );
}
