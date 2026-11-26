"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Hash,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import type { DepartmentItem } from "@/types/departmentType";

// ======================================================
// TYPES
// ======================================================

interface DepartmentTableProps {
  departments: DepartmentItem[];
  isLoading: boolean;
  error: string | null;

  onRefresh: () => void;
  onEdit: (item: DepartmentItem) => void;
  onDelete: (item: DepartmentItem) => void;
  onFilteredCountChange?: (count: number) => void;
}

// ======================================================
// CONSTANTS
// ======================================================

const PAGE_SIZES = [10, 20, 50] as const;

const actionBase =
  "inline-flex min-h-9 items-center justify-center gap-2 " +
  "rounded-xl border px-3 py-2 text-xs font-semibold " +
  "transition-all duration-200 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "active:scale-[0.98]";

const editClass =
  `${actionBase} border-blue-200 bg-gradient-to-r ` +
  "from-blue-50 to-indigo-50 text-blue-700 " +
  "hover:border-blue-300 hover:from-blue-100 hover:to-indigo-100 " +
  "focus-visible:outline-blue-500 " +
  "dark:border-blue-500/20 dark:from-blue-500/10 " +
  "dark:to-indigo-500/10 dark:text-blue-300 " +
  "dark:hover:border-blue-400/40";

const deleteClass =
  `${actionBase} border-red-200 bg-gradient-to-r ` +
  "from-red-50 to-rose-50 text-red-600 " +
  "hover:border-red-300 hover:from-red-100 hover:to-rose-100 " +
  "focus-visible:outline-red-500 " +
  "dark:border-red-500/20 dark:from-red-500/10 " +
  "dark:to-rose-500/10 dark:text-red-400 " +
  "dark:hover:border-red-400/40";

const formatNumber = (value: number) => value.toLocaleString("th-TH");

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function DepartmentTable({
  departments,
  isLoading,
  error,
  onRefresh,
  onEdit,
  onDelete,
  onFilteredCountChange,
}: DepartmentTableProps) {
  // ====================================================
  // STATE
  // ====================================================

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ====================================================
  // FILTER / SEARCH
  // ====================================================

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();

    if (!keyword) return departments;

    return departments.filter((item) => {
      const name = item.dep_name.toLocaleLowerCase();
      const id = String(item.dep_id);
      const phone = item.dep_phone ?? "";

      return (
        name.includes(keyword) ||
        id.includes(keyword) ||
        phone.toLocaleLowerCase().includes(keyword)
      );
    });
  }, [departments, search]);

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  // ====================================================
  // PAGINATION
  // ====================================================

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const startIndex = (currentPage - 1) * pageSize;

  const items = filtered.slice(startIndex, startIndex + pageSize);

  const first = total === 0 ? 0 : startIndex + 1;
  const last = Math.min(startIndex + pageSize, total);

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const changePageSize = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm shadow-slate-200/40 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
      {/* ================================================
          HEADER + SEARCH
      ================================================= */}
      <div className="relative isolate overflow-hidden border-b border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50/70 to-cyan-50 p-5 sm:p-6 dark:border-gray-800 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/30">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 h-52 w-52 rounded-full bg-cyan-300/30 blur-3xl dark:bg-blue-500/10"
        />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* TITLE */}
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-600 text-white shadow-md shadow-blue-500/20">
              <Building2 size={21} strokeWidth={1.9} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 sm:text-lg dark:text-white">
                  รายการหน่วยงานภายในโรงพยาบาล
                </h2>

                {!isLoading && !error && (
                  <span className="inline-flex items-center rounded-full border border-blue-200/70 bg-white/80 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                    {formatNumber(total)} รายการ
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm dark:text-gray-400">
                ค้นหาจัดการข้อมูลหน่วยงาน
              </p>
            </div>
          </div>

          {/* SEARCH */}
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-blue-500 dark:text-blue-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="ค้นหารหัส ชื่อหน่วยงาน หรือเบอร์โทรศัพท์..."
              aria-label="ค้นหาข้อมูลหน่วยงาน"
              className="min-h-12 w-full rounded-2xl border border-blue-100 bg-white/95 py-3 pr-11 pl-11 text-sm font-medium text-gray-800 shadow-sm shadow-blue-500/5 transition-all duration-200 outline-none placeholder:font-normal placeholder:text-gray-400 hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:hover:border-blue-500/40 dark:focus:border-blue-500"
            />

            {search && (
              <button
                type="button"
                onClick={() => updateSearch("")}
                aria-label="ล้างคำค้นหา"
                className="absolute top-1/2 right-3 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:bg-gray-800 dark:hover:bg-red-500/10"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================================================
          LOADING STATE
      ================================================= */}
      {isLoading && (
        <div
          className="space-y-3 p-5 sm:p-6"
          role="status"
          aria-label="กำลังโหลดข้อมูลหน่วยงาน"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="flex animate-pulse items-center gap-4 rounded-2xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4 dark:border-gray-800 dark:from-gray-800/50 dark:to-gray-900"
            >
              <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-200/70 dark:bg-gray-700" />

              <div className="flex-1 space-y-2.5">
                <div className="h-3.5 w-2/5 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-1/5 rounded-full bg-gray-100 dark:bg-gray-800" />
              </div>

              <div className="hidden h-8 w-24 rounded-xl bg-gray-100 sm:block dark:bg-gray-800" />
            </div>
          ))}
        </div>
      )}

      {/* ================================================
          ERROR STATE
      ================================================= */}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 text-red-600 dark:from-red-500/15 dark:to-rose-500/10 dark:text-red-400">
            <AlertCircle size={29} />
          </div>

          <h3 className="mt-5 text-base font-bold text-gray-900 dark:text-white">
            โหลดข้อมูลหน่วยงานไม่สำเร็จ
          </h3>

          <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {error}
          </p>

          <button
            type="button"
            onClick={onRefresh}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white transition hover:from-blue-700 hover:to-indigo-700"
          >
            <RefreshCw size={17} />
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {/* ================================================
          EMPTY STATE
      ================================================= */}
      {!isLoading && !error && total === 0 && (
        <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 text-blue-500 dark:border-blue-500/10 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-cyan-500/10 dark:text-blue-400">
            {search ? (
              <CircleHelp size={34} strokeWidth={1.6} />
            ) : (
              <Building2 size={34} strokeWidth={1.6} />
            )}
          </div>

          <h3 className="mt-5 text-lg font-bold text-gray-900 dark:text-white">
            {search ? "ไม่พบหน่วยงานที่ค้นหา" : "ยังไม่มีข้อมูลหน่วยงาน"}
          </h3>

          <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {search
              ? "ลองค้นหาด้วยรหัส ชื่อหน่วยงาน หรือเบอร์โทรศัพท์อื่น"
              : "เพิ่มหน่วยงานใหม่เพื่อเริ่มต้นจัดการข้อมูลหน่วยงาน"}
          </p>

          {search && (
            <button
              type="button"
              onClick={() => updateSearch("")}
              className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400"
            >
              <X size={16} />
              ล้างคำค้นหา
            </button>
          )}
        </div>
      )}

      {/* ================================================
          DATA
      ================================================= */}
      {!isLoading && !error && total > 0 && (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1050px] table-auto text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/40 text-xs font-semibold tracking-wide text-gray-500 dark:border-gray-800 dark:from-gray-800/80 dark:via-blue-950/20 dark:to-indigo-950/20 dark:text-gray-400">
                  <th scope="col" className="w-[70px] px-4 py-4">
                    ลำดับ
                  </th>

                  <th scope="col" className="w-[120px] px-4 py-4">
                    รหัสหน่วยงาน
                  </th>

                  <th scope="col" className="w-auto min-w-[380px] px-5 py-4">
                    ชื่อหน่วยงาน
                  </th>

                  <th scope="col" className="w-[180px] px-4 py-4">
                    เบอร์โทรศัพท์
                  </th>

                  <th scope="col" className="w-[190px] px-4 py-4 text-right">
                    จัดการ
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item, index) => (
                  <tr
                    key={item.dep_id}
                    className="group transition-colors duration-200 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-indigo-50/40 dark:hover:from-blue-500/5 dark:hover:to-indigo-500/5"
                  >
                    {/* ROW NUMBER */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-400 tabular-nums dark:text-gray-500">
                        {String(startIndex + index + 1).padStart(2, "0")}
                      </span>
                    </td>

                    {/* DEPARTMENT ID */}
                    <td className="px-6 py-4">
                      <span className="inline-flex min-w-12 items-center justify-center rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 text-xs font-bold text-blue-700 tabular-nums dark:border-blue-500/20 dark:from-blue-500/10 dark:to-indigo-500/10 dark:text-blue-300">
                        {item.dep_id}
                      </span>
                    </td>

                    {/* DEPARTMENT NAME */}
                    <td className="min-w-[380px] px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 transition-colors group-hover:from-blue-100 group-hover:to-indigo-200 dark:border-blue-500/10 dark:from-blue-500/10 dark:to-indigo-500/15 dark:text-blue-400">
                          <Building2 size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-relaxed font-semibold break-words whitespace-normal text-gray-900 dark:text-white">
                            {item.dep_name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* PHONE */}
                    <td className="px-6 py-4">
                      {item.dep_phone?.trim() ? (
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <Phone
                            size={15}
                            className="text-cyan-600 dark:text-cyan-400"
                          />
                          {item.dep_phone}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          ไม่ระบุ
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          title={`แก้ไข ${item.dep_name}`}
                          className={editClass}
                        >
                          <Pencil size={15} />
                          แก้ไข
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          title={`ลบ ${item.dep_name}`}
                          className={deleteClass}
                        >
                          <Trash2 size={15} />
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="divide-y divide-gray-100 md:hidden dark:divide-gray-800">
            {items.map((item, index) => (
              <article
                key={item.dep_id}
                className="relative overflow-hidden p-4 transition-colors hover:bg-blue-50/30 sm:p-5 dark:hover:bg-blue-500/5"
              >
                <div className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-gradient-to-b from-blue-500 via-indigo-500 to-cyan-500" />

                <div className="flex items-start gap-3 pl-2">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 dark:border-blue-500/10 dark:from-blue-500/10 dark:to-indigo-500/15 dark:text-blue-400">
                    <Building2 size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm leading-relaxed font-bold break-words text-gray-900 dark:text-white">
                      {item.dep_name}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                        <Hash size={12} />
                        {item.dep_id}
                      </span>

                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ลำดับ {startIndex + index + 1}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Phone size={14} className="text-cyan-600" />
                      {item.dep_phone?.trim() || "ไม่ระบุเบอร์โทรศัพท์"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 pl-2">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className={editClass}
                  >
                    <Pencil size={15} />
                    แก้ไข
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className={deleteClass}
                  >
                    <Trash2 size={15} />
                    ลบ
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col gap-4 border-t border-gray-100 bg-gradient-to-r from-slate-50/80 via-white to-blue-50/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950/20">
            {/* PAGE SIZE */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                แสดง{" "}
                <strong className="font-bold text-gray-800 dark:text-gray-200">
                  {formatNumber(first)}–{formatNumber(last)}
                </strong>{" "}
                จาก{" "}
                <strong className="font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(total)}
                </strong>{" "}
                รายการ
              </span>

              <select
                value={pageSize}
                onChange={(event) => changePageSize(Number(event.target.value))}
                aria-label="จำนวนรายการต่อหน้า"
                className="min-h-9 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} / หน้า
                  </option>
                ))}
              </select>
            </div>

            {/* PAGE NAVIGATION */}
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                หน้า{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatNumber(currentPage)}
                </span>
                {" / "}
                {formatNumber(totalPages)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  aria-label="หน้าก่อนหน้า"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-blue-500/10"
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  aria-label="หน้าถัดไป"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-blue-500/10"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
