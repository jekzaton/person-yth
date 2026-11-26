"use client";

import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Database,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";

interface PositionHeaderProps {
  totalPositions: number;
  filteredPositions: number;
  isLoading?: boolean;
  hasError?: boolean;
  onRefresh: () => void;
  onAdd: () => void;
}

export default function PositionHeader({
  totalPositions,
  filteredPositions,
  isLoading = false,
  hasError = false,
  onRefresh,
  onAdd,
}: PositionHeaderProps) {
  return (
    <div className="space-y-5">
      {/* GRADIENT HEADER */}
      <section className="relative isolate overflow-hidden rounded-3xl border border-blue-300/20 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 shadow-xl shadow-blue-950/10 dark:border-blue-400/15 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        {/* Decorative gradients */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-16 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-indigo-400/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
        />

        <div className="relative z-10 flex flex-col gap-7 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:p-8">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-inner backdrop-blur-sm">
              <BriefcaseBusiness size={27} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-cyan-100">
                  <Sparkles size={12} />
                  POSITION MANAGEMENT
                </span>

                {!isLoading && !hasError && (
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {totalPositions.toLocaleString("th-TH")} รายการ
                  </span>
                )}
              </div>

              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
                จัดการตำแหน่งบุคลากร
              </h1>

              {/* <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100/85">
                จัดการข้อมูลตำแหน่งการทำงานของบุคลากร โรงพยาบาลยางตลาด
                อย่างสะดวกและเป็นระบบ
              </p> */}

              <div className="mt-4 inline-flex items-center gap-2 text-xs text-cyan-100/90">
                <CheckCircle2 size={15} />
                ระบบบริหารจัดการข้อมูลตำแหน่ง
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row lg:justify-end">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={isLoading ? "animate-spin" : ""}
              />
              รีเฟรช
            </button>

            <button
              type="button"
              onClick={onAdd}
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-800 shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-cyan-50 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-0"
            >
              <Plus size={19} strokeWidth={2.5} />
              เพิ่มตำแหน่ง
              <ArrowUpRight
                size={16}
                className="opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="ตำแหน่งทั้งหมด"
          subtitle="ข้อมูลตำแหน่งในระบบ"
          value={totalPositions}
          icon={<Database size={23} strokeWidth={1.8} />}
          variant="blue"
          loading={isLoading}
          hasError={hasError}
        />

        <StatCard
          title="ผลการค้นหา"
          subtitle="รายการที่ตรงกับคำค้นหา"
          value={filteredPositions}
          icon={<Search size={23} strokeWidth={1.8} />}
          variant="emerald"
          loading={isLoading}
          hasError={hasError}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  subtitle: string;
  value: number;
  icon: ReactNode;
  variant: "blue" | "emerald";
  loading: boolean;
  hasError: boolean;
}

function StatCard({
  title,
  subtitle,
  value,
  icon,
  variant,
  loading,
  hasError,
}: StatCardProps) {
  const styles = {
    blue: {
      background:
        "from-blue-50 via-white to-indigo-50/70 dark:from-blue-950/40 dark:via-gray-900 dark:to-indigo-950/30",
      icon: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
      accent: "from-blue-500 to-indigo-500",
      number: "text-blue-700 dark:text-blue-300",
    },
    emerald: {
      background:
        "from-emerald-50 via-white to-teal-50/70 dark:from-emerald-950/30 dark:via-gray-900 dark:to-teal-950/30",
      icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      accent: "from-emerald-500 to-teal-500",
      number: "text-emerald-700 dark:text-emerald-300",
    },
  }[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br ${styles.background} p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-6 dark:border-gray-800`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${styles.accent}`}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            {title}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>

          {loading ? (
            <div className="mt-4 h-10 w-24 animate-pulse rounded-lg bg-gray-200/70 dark:bg-gray-800" />
          ) : (
            <p
              className={`mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl ${styles.number}`}
            >
              {hasError ? "—" : value.toLocaleString("th-TH")}
            </p>
          )}
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${styles.icon}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
