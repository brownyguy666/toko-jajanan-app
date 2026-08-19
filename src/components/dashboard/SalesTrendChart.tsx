"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatRupiah } from "@/lib/utils";
import { TrendingUp, Calendar } from "lucide-react";

export interface TrendDataPoint {
  label: string;
  omzet: number;
  laba: number;
}

interface SalesTrendChartProps {
  data: TrendDataPoint[];
  periodLabel: string;
}

export function SalesTrendChart({ data, periodLabel }: SalesTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#d59a9e]/30 p-6 shadow-sm flex flex-col items-center justify-center min-h-80 text-center">

        <div className="w-12 h-12 rounded-2xl bg-[#efe6e6] text-[#d62934] flex items-center justify-center mb-3">
          <TrendingUp className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-[#81181f]">Belum Ada Data Penjualan</p>
        <p className="text-xs text-zinc-400 max-w-xs mt-1">
          Grafik tren omzet & laba akan otomatis terbentuk seiring transaksi di kasir.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#d59a9e]/30 p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-extrabold text-base text-[#81181f] tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#d62934]" />
            <span>Tren Penjualan & Laba Penjualan</span>
          </h3>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Perbandingan omzet penjualan kotor dan laba produk
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#efe6e6]/60 border border-[#d59a9e]/30 text-xs font-bold text-[#81181f]">
          <Calendar className="w-3.5 h-3.5" />
          <span>{periodLabel}</span>
        </div>
      </div>

      {/* Chart container */}
      <div className="w-full h-72 sm:h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d62934" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#d62934" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorLaba" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#47d1b5" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#47d1b5" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f0e4e4" vertical={false} />

            <XAxis
              dataKey="label"
              tick={{ fill: "#888888", fontSize: 11 }}
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
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-[#d59a9e]/40 text-xs space-y-1.5 min-w-40">

                      <p className="font-bold text-zinc-900 border-b border-zinc-100 pb-1">
                        {label}
                      </p>
                      <div className="flex justify-between items-center text-[#81181f]">
                        <span className="font-medium flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#d62934]" />
                          Omzet:
                        </span>
                        <span className="font-extrabold">
                          {formatRupiah(Number(payload[0]?.value) || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[#0c6b57]">
                        <span className="font-medium flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#47d1b5]" />
                          Laba Kotor:
                        </span>
                        <span className="font-extrabold">
                          {formatRupiah(Number(payload[1]?.value) || 0)}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
            />

            <Area
              type="monotone"
              dataKey="omzet"
              name="Omzet Penjualan"
              stroke="#d62934"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorOmzet)"
            />

            <Area
              type="monotone"
              dataKey="laba"
              name="Laba Penjualan"
              stroke="#0c6b57"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorLaba)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
