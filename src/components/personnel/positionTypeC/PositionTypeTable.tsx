"use client";

import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  FilePenLine,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

// ======================================================
// TYPES
// ======================================================

export interface PositionTypeItem {
  ps_type_id: number;
  ps_name_type: string;
}

interface PositionTypeTableProps {
  items: PositionTypeItem[];
  total: number;
  isLoading: boolean;

  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;

  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;

  onEdit: (item: PositionTypeItem) => void;
  onDelete: (item: PositionTypeItem) => void;

  canManage?: boolean;
}

const PAGE_SIZES = [10, 20, 50, 100];

const actionButton =
  "inline-flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

// ======================================================
// COMPONENT
// ======================================================

export default function PositionTypeTable({
  items,
  total,
  isLoading,
  search,
  onSearchChange,
  onRefresh,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  canManage = false,
}: PositionTypeTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const currentPage = Math.min(Math.max(1, page), totalPages);

  const range = {
    start: total === 0 ? 0 : (currentPage - 1) * pageSize + 1,
    end: Math.min(currentPage * pageSize, total),
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-gray-900">
      {/* ====================================================
          TABLE HEADER / SEARCH
      ==================================================== */}
      <div className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50/70 to-cyan-50 p-4 sm:p-6 dark:border-slate-800 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-cyan-950/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 right-8 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl"
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
              <ShieldCheck size={23} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                รายการประเภทตำแหน่ง
              </h2>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-blue-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                  {total.toLocaleString("th-TH")} รายการ
                </span>

                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ข้อมูลประเภทตำแหน่งบุคลากร
                </span>
              </div>
            </div>
          </div>

          {/* SEARCH + REFRESH */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-72">
              <Search
                size={18}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-blue-500"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="ค้นหาประเภทตำแหน่ง..."
                aria-label="ค้นหาประเภทตำแหน่ง"
                className="h-11 w-full rounded-xl border border-blue-100 bg-white pr-3 pl-11 text-sm text-slate-800 shadow-sm transition outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-500/10"
              />
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={onRefresh}
              aria-label="รีเฟรชข้อมูล"
              title="รีเฟรชข้อมูล"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300"
            >
              <RefreshCw
                size={17}
                className={isLoading ? "animate-spin" : ""}
              />
              <span className="sm:hidden">รีเฟรชข้อมูล</span>
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================
          DESKTOP TABLE
      ==================================================== */}
      <div className="overflow-x-auto" aria-busy={isLoading}>
        <table className="w-full min-w-[620px] text-left">
          <thead className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 text-xs font-bold text-slate-600 dark:from-slate-800 dark:via-blue-950/30 dark:to-indigo-950/20 dark:text-slate-300">
            <tr>
              <th scope="col" className="w-28 px-5 py-4">
                รหัส
              </th>

              <th scope="col" className="px-5 py-4">
                ชื่อประเภทตำแหน่ง
              </th>

              {canManage && (
                <th scope="col" className="w-48 px-5 py-4 text-center">
                  จัดการ
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* LOADING */}
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  {Array.from({
                    length: canManage ? 3 : 2,
                  }).map((_, col) => (
                    <td key={col} className="px-5 py-5">
                      <div className="h-7 animate-pulse rounded-lg bg-blue-100/70 dark:bg-slate-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              /* EMPTY STATE */
              <tr>
                <td
                  colSpan={canManage ? 3 : 2}
                  className="px-5 py-16 text-center"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-500 dark:from-blue-500/10 dark:to-indigo-500/10">
                    <Search size={28} />
                  </div>

                  <p className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    ไม่พบประเภทตำแหน่ง
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    {search.trim()
                      ? "ลองเปลี่ยนคำค้นหาเพื่อค้นหาข้อมูล"
                      : "ยังไม่มีข้อมูลประเภทตำแหน่งในระบบ"}
                  </p>
                </td>
              </tr>
            ) : (
              /* DATA */
              items.map((item, index) => (
                <tr
                  key={item.ps_type_id}
                  className={`group transition-colors duration-150 hover:bg-blue-50/70 dark:hover:bg-blue-950/20 ${
                    index % 2
                      ? "bg-slate-50/50 dark:bg-slate-900/60"
                      : "bg-white dark:bg-gray-900"
                  }`}
                >
                  {/* ID */}
                  <td className="px-5 py-4">
                    <span className="font-mono inline-flex rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                      #{index + 1}
                    </span>
                  </td>

                  {/* POSITION TYPE NAME */}
                  <td className="px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-sm shadow-indigo-500/20">
                        <BriefcaseBusiness size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold break-words text-slate-900 dark:text-white">
                          {item.ps_name_type}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* ADMIN ACTIONS */}
                  {canManage && (
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          title="แก้ไขประเภทตำแหน่ง"
                          aria-label={`แก้ไข ${item.ps_name_type}`}
                          className={`${actionButton} border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-500 hover:bg-amber-500 hover:text-white dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300`}
                        >
                          <FilePenLine size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          title="ลบประเภทตำแหน่ง"
                          aria-label={`ลบ ${item.ps_name_type}`}
                          className={`${actionButton} border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-500 hover:bg-rose-600 hover:text-white dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ====================================================
          PAGINATION
      ==================================================== */}
      <div className="flex flex-col gap-4 border-t border-blue-100 bg-gradient-to-r from-slate-50 via-blue-50/60 to-indigo-50/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:from-slate-900 dark:via-blue-950/20 dark:to-indigo-950/10">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <span>
            แสดง{" "}
            <strong className="font-bold text-blue-700 dark:text-blue-300">
              {range.start.toLocaleString("th-TH")}–
              {range.end.toLocaleString("th-TH")}
            </strong>{" "}
            จาก{" "}
            <strong className="font-bold text-blue-700 dark:text-blue-300">
              {total.toLocaleString("th-TH")}
            </strong>{" "}
            รายการ
          </span>

          <span className="hidden h-5 w-px bg-slate-200 sm:block dark:bg-slate-700" />

          <label className="flex items-center gap-2">
            แสดงต่อหน้า
            <select
              value={pageSize}
              disabled={isLoading}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-blue-700 outline-none focus:border-blue-400 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} รายการ
                </option>
              ))}
            </select>
          </label>
        </div>

        <nav
          aria-label="แบ่งหน้ารายการประเภทตำแหน่ง"
          className="flex items-center justify-center gap-2 sm:justify-end"
        >
          <button
            type="button"
            disabled={isLoading || currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="หน้าก่อนหน้า"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300"
          >
            <ChevronLeft size={19} />
          </button>

          <span className="flex min-w-24 items-center justify-center rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <span className="text-blue-600 dark:text-blue-400">
              {currentPage}
            </span>
            <span className="mx-2 text-slate-400">/</span>
            {totalPages}
          </span>

          <button
            type="button"
            disabled={isLoading || currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="หน้าถัดไป"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300"
          >
            <ChevronRight size={19} />
          </button>
        </nav>
      </div>
    </section>
  );
}
