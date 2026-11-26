"use client";

import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Database,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";

// ======================================================
// TYPES
// ======================================================

interface DepartmentHeaderProps {
  totalDepartments: number;
  filteredDepartments: number;
  isLoading?: boolean;
  hasError?: boolean;
  onRefresh: () => void;
  onAdd: () => void;
}

// ======================================================
// DEPARTMENT HEADER
// ======================================================

export default function DepartmentHeader({
  totalDepartments,
  filteredDepartments,
  isLoading = false,
  hasError = false,
  onRefresh,
  onAdd,
}: DepartmentHeaderProps) {
  return (
    <div className="space-y-5">
      {/* ================================================
          HERO HEADER
      ================================================= */}
      <section className="relative isolate overflow-hidden rounded-3xl border border-blue-300/20 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 shadow-xl shadow-blue-950/10 dark:border-blue-400/15 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        {/* BACKGROUND DECORATIONS */}
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

        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-6 right-6 hidden opacity-10 md:block"
        >
          <Building2 size={145} strokeWidth={0.8} />
        </div>

        {/* CONTENT */}
        <div className="relative z-10 flex flex-col gap-7 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:p-8">
          {/* LEFT SIDE */}
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-inner backdrop-blur-sm sm:h-16 sm:w-16">
              <Building2 size={29} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              {/* BADGES */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-cyan-100 sm:text-[11px]">
                  <Sparkles size={12} />
                  DEPARTMENT MANAGEMENT
                </span>

                {!isLoading && !hasError && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    <Database size={12} />
                    {totalDepartments.toLocaleString("th-TH")} หน่วยงาน
                  </span>
                )}
              </div>

              {/* TITLE */}
              <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl lg:text-3xl">
                จัดการข้อมูลหน่วยงาน
              </h1>

              {/* STATUS */}
              <div className="mt-4 inline-flex items-center gap-2 text-xs text-cyan-100/90">
                {hasError ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    ไม่สามารถโหลดข้อมูลหน่วยงานได้
                  </>
                ) : isLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    กำลังโหลดข้อมูลหน่วยงาน...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    ระบบบริหารจัดการข้อมูลหน่วยงาน
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row lg:justify-end">
            {/* REFRESH */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="รีเฟรชข้อมูลหน่วยงาน"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={isLoading ? "animate-spin" : ""}
              />
              รีเฟรช
            </button>

            {/* ADD DEPARTMENT */}
            <button
              type="button"
              onClick={onAdd}
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-800 shadow-lg shadow-blue-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-50 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-0"
            >
              <Plus size={19} strokeWidth={2.5} />
              เพิ่มหน่วย
              <ArrowUpRight
                size={16}
                className="opacity-60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </div>
        </div>

        {/* BOTTOM ACCENT */}
        <div className="relative z-10 h-1 w-full bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 opacity-70" />
      </section>

      {/* ================================================
          STATISTICS
      ================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="หน่วยงานทั้งหมด"
          subtitle="จำนวนหน่วยงานที่ลงทะเบียนในระบบ"
          value={totalDepartments}
          icon={<Building2 size={24} strokeWidth={1.8} />}
          variant="blue"
          loading={isLoading}
          hasError={hasError}
        />

        <StatCard
          title="ผลการค้นหา"
          subtitle="จำนวนหน่วยงานที่ตรงกับคำค้นหา"
          value={filteredDepartments}
          icon={<Search size={24} strokeWidth={1.8} />}
          variant="emerald"
          loading={isLoading}
          hasError={hasError}
        />
      </div>
    </div>
  );
}

// ======================================================
// STAT CARD
// ======================================================

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
      decoration: "bg-blue-200/30 dark:bg-blue-500/10",
    },
    emerald: {
      background:
        "from-emerald-50 via-white to-teal-50/70 dark:from-emerald-950/30 dark:via-gray-900 dark:to-teal-950/30",
      icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      accent: "from-emerald-500 to-teal-500",
      number: "text-emerald-700 dark:text-emerald-300",
      decoration: "bg-emerald-200/30 dark:bg-emerald-500/10",
    },
  }[variant];

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br ${styles.background} p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-6 dark:border-gray-800`}
    >
      {/* TOP ACCENT */}
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${styles.accent}`}
      />

      {/* DECORATION */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-12 -bottom-12 h-36 w-36 rounded-full ${styles.decoration} blur-2xl`}
      />

      {/* CONTENT */}
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {title}
          </p>

          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>

          {loading ? (
            <div
              role="status"
              aria-label={`กำลังโหลด${title}`}
              className="mt-4 h-10 w-24 animate-pulse rounded-lg bg-gray-200/70 dark:bg-gray-800"
            />
          ) : (
            <p
              className={`mt-3 text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl ${styles.number}`}
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
    </article>
  );
}
