"use client";

import {
  ArrowUpRight,
  CarFront,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface CarTypeHeaderProps {
  onAdd: () => void;
  totalBrands: number;
  loading?: boolean;
}

export default function CarTypeHeader({
  onAdd,
  totalBrands,
  loading = false,
}: CarTypeHeaderProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-sky-600 via-blue-700 to-violet-800 px-5 py-7 text-white shadow-xl shadow-blue-700/15 sm:px-8 sm:py-9 lg:px-10">
      {/* Gradient background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <div className="absolute top-0 right-1/3 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

        <div className="absolute -top-28 -right-16 h-72 w-72 rounded-full border border-white/10" />

        <div className="absolute -top-20 -right-8 h-56 w-56 rounded-full border border-white/10" />

        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4 sm:gap-5">
          {/* Main icon */}
          <div className="relative shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-lg shadow-blue-950/10 backdrop-blur-md sm:h-16 sm:w-16">
              <CarFront
                size={30}
                strokeWidth={1.8}
                className="drop-shadow-sm"
              />
            </div>

            <div className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-lg border border-white/20 bg-cyan-400 shadow-md shadow-cyan-900/20">
              <Sparkles size={12} />
            </div>
          </div>

          {/* Heading */}
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-sky-100 uppercase backdrop-blur-sm">
                <Sparkles size={12} />
                Car Type Management
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-100">
                <ShieldCheck size={12} />
                Admin Panel
              </span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-[32px]">
              จัดการประเภทรถยนต์
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-blue-100/90">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-300 ring-4 ring-emerald-300/15" />
                ระบบจัดการประเภทรถ
              </span>

              <span className="hidden h-1 w-1 rounded-full bg-white/40 sm:block" />

              <span>
                จำนวนทั้งหมด{" "}
                <strong className="text-white">
                  {loading ? "..." : totalBrands.toLocaleString("th-TH")}
                </strong>{" "}
                ประเภท
              </span>
            </div>
          </div>
        </div>

        {/* Create button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onAdd}
            className="group inline-flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/80 bg-white px-5 py-3.5 text-sm font-extrabold text-blue-700 shadow-lg shadow-blue-950/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-xl focus-visible:ring-4 focus-visible:ring-white/40 focus-visible:outline-none sm:w-auto"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
              <Plus size={17} strokeWidth={2.5} />
            </span>
            เพิ่มประเภทรถยนต์
            <ArrowUpRight
              size={16}
              className="text-blue-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </button>
        </div>
      </div>
    </section>
  );
}
