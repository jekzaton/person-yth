"use client";

import { ArrowUpRight, CheckCircle2, Search, Tags } from "lucide-react";

interface CarTypeStatsProps {
  totalBrands: number;
  filteredBrands: number;
  loading?: boolean;
}

export default function CarTypeStats({
  totalBrands,
  filteredBrands,
  loading = false,
}: CarTypeStatsProps) {
  const stats = [
    {
      title: "ประเภทรถทั้งหมด",
      subtitle: "จำนวนประเภทรถยนต์ในระบบ",
      value: totalBrands,
      icon: Tags,
      accent: "blue",
    },
    {
      title: "ผลการค้นหา",
      subtitle: "รายการที่ตรงกับคำค้นหา",
      value: filteredBrands,
      icon: Search,
      accent: "violet",
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isBlue = stat.accent === "blue";

        return (
          <div
            key={stat.title}
            className={`group relative isolate overflow-hidden rounded-[24px] border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6 ${
              isBlue
                ? "border-blue-100 bg-gradient-to-br from-white via-sky-50/70 to-blue-100/70 hover:shadow-blue-500/10 dark:border-blue-900/50 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40"
                : "border-violet-100 bg-gradient-to-br from-white via-violet-50/60 to-fuchsia-100/60 hover:shadow-violet-500/10 dark:border-violet-900/50 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/40"
            }`}
          >
            {/* Decorative glow */}
            <div
              className={`pointer-events-none absolute -top-14 -right-12 h-36 w-36 rounded-full blur-3xl ${
                isBlue ? "bg-blue-400/15" : "bg-violet-400/15"
              }`}
            />

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {stat.title}
                </p>

                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {stat.subtitle}
                </p>

                <div className="mt-4 flex items-end gap-2">
                  {loading ? (
                    <div className="h-10 w-20 animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-700/50" />
                  ) : (
                    <span
                      className={`text-4xl font-black tracking-tight tabular-nums ${
                        isBlue
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-violet-700 dark:text-violet-300"
                      }`}
                    >
                      {stat.value.toLocaleString("th-TH")}
                    </span>
                  )}

                  <span className="mb-1 text-xs font-medium text-slate-400">
                    ประเภท
                  </span>
                </div>
              </div>

              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                  isBlue
                    ? "bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 shadow-blue-500/20"
                    : "bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 shadow-violet-500/20"
                }`}
              >
                <Icon size={25} strokeWidth={1.8} />
              </div>
            </div>

            <div className="relative mt-5 flex items-center gap-2 border-t border-slate-200/60 pt-3 dark:border-slate-700/50">
              <CheckCircle2
                size={14}
                className={
                  isBlue
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-violet-600 dark:text-violet-400"
                }
              />

              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isBlue
                  ? "ข้อมูลประเภทรถทั้งหมดที่บันทึกไว้"
                  : "แสดงผลตามตัวกรองการค้นหา"}
              </span>

              <ArrowUpRight
                size={14}
                className="ml-auto text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
