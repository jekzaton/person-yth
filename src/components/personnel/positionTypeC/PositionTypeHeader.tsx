"use client";

import {
  ArrowUpRight,
  BriefcaseBusiness,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface PositionTypeHeaderProps {
  onAdd: () => void;
  canManage?: boolean;
  total?: number;
  isLoading?: boolean;
}

export default function PositionTypeHeader({
  onAdd,
  canManage = false,
  total,
  isLoading = false,
}: PositionTypeHeaderProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-blue-400/20 bg-gradient-to-br from-[#071A3A] via-[#17449A] to-[#4B42B2] text-white shadow-xl shadow-blue-950/15">
      {/* BACKGROUND DECORATIONS */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -right-16 h-80 w-80 rounded-full bg-cyan-300/25 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-indigo-300/25 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-cyan-300/[0.06]"
      />

      <BriefcaseBusiness
        size={185}
        strokeWidth={0.7}
        aria-hidden="true"
        className="pointer-events-none absolute top-6 right-28 hidden text-white/[0.07] xl:block"
      />

      {/* MAIN CONTENT */}
      <div className="relative z-10 p-5 sm:p-7 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* LEFT */}
          <div className="flex min-w-0 items-start gap-4">
            {/* ICON */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-inner backdrop-blur-md sm:h-16 sm:w-16">
              <BriefcaseBusiness size={30} strokeWidth={1.8} />
            </div>

            {/* TEXT */}
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/15 px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-cyan-100">
                  <Sparkles size={12} />
                  POSITION TYPE MANAGEMENT
                </span>

                {typeof total === "number" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                    <BriefcaseBusiness size={13} />
                    {isLoading
                      ? "กำลังโหลด..."
                      : `${total.toLocaleString("th-TH")} รายการ`}
                  </span>
                )}
              </div>

              <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl lg:text-3xl">
                จัดการประเภทตำแหน่ง
              </h1>

              {/* STATUS */}
              <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-cyan-100/90">
                <ShieldCheck size={15} />
                ระบบจัดการข้อมูลประเภทตำแหน่งบุคลากร
              </div>
            </div>
          </div>

          {canManage && (
            <div className="flex w-full shrink-0 lg:w-auto">
              <button
                type="button"
                onClick={onAdd}
                disabled={isLoading}
                className="group inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/80 bg-gradient-to-r from-white via-blue-50 to-cyan-50 px-5 py-3 text-sm font-bold text-blue-800 shadow-lg shadow-blue-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-cyan-50 hover:to-blue-100 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                  <Plus size={19} strokeWidth={2.5} />
                </span>

                <span>เพิ่มประเภทตำแหน่ง</span>

                <ArrowUpRight
                  size={17}
                  className="text-blue-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ACCENT */}
      <div className="relative z-10 h-1 w-full bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400" />
    </section>
  );
}
