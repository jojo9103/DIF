"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ClinicalTableProps {
  title?: string;
  subtitle?: string;
  data?: { columns: string[]; rows: Record<string, string>[] } | null;
  className?: string;
  onRowClick?: (sampleName: string) => void;
}

export default function ClinicalTable({
  title = "Clinical Data",
  subtitle,
  data,
  className,
  onRowClick,
}: ClinicalTableProps) {
  const [q, setQ] = React.useState("");
  const lower = q.trim().toLowerCase();

  if (!data || data.rows.length === 0 || data.columns.length === 0) return null;

  return (
    <div
      className={cn(
        "mt-6 w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-white",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-white/50">{title}</div>
          {subtitle && <div className="mt-1 text-sm text-white/70">{subtitle}</div>}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          className="w-full max-w-xs rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
        />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[720px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/10 text-white/70">
              {data.columns.map((col) => (
                <th key={col} className="p-3 text-left font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, idx) => {
              const hit =
                !lower ||
                Object.values(row).some((v) => String(v).toLowerCase().includes(lower));
              const sampleName = row.__sampleName || "";
              const clickable = Boolean(onRowClick && sampleName);
              return (
                <tr
                  key={`${row.Image_name || idx}`}
                  className={cn(
                    "transition",
                    clickable && "cursor-pointer hover:bg-white/5",
                    hit ? "opacity-100" : "opacity-20"
                  )}
                  onClick={() => {
                    if (clickable) onRowClick?.(sampleName);
                  }}
                >
                  {data.columns.map((col) => {
                    const value = row[col] ?? "";
                    const isStatus = col.toLowerCase() === "status";
                    return (
                      <td key={col} className="p-3 text-white/80">
                        {isStatus ? (
                          <span
                            className={cn(
                              "rounded-full px-2 py-1 text-[10px]",
                              value === "Ready"
                                ? "bg-green-500/20 text-green-300"
                                : "bg-gray-500/20 text-gray-300"
                            )}
                          >
                            {value || "-"}
                          </span>
                        ) : (
                          value || "-"
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
