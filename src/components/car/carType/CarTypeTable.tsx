"use client";

import { CarTypeItem } from "@/types/carType";
import {
  AlertCircle,
  CarFront,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  PencilLine,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

export const CAR_TYPE_PAGE_SIZES = [5, 10, 50, 100] as const;

interface CarTypeTableProps {
  types: CarTypeItem[]; // รายการที่กรองด้วย search แล้ว
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  error: string | null;
  onRefresh: () => void | Promise<void>;
  onEdit: (brand: CarTypeItem) => void;
  onDelete: (brand: CarTypeItem) => void;
  page: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export default function CarTypeTable({
  types,
  search,
  onSearchChange,
  loading,
  error,
  onRefresh,
  onEdit,
  onDelete,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
}: CarTypeTableProps) {
  const effectivePageSize = CAR_TYPE_PAGE_SIZES.includes(
    pageSize as (typeof CAR_TYPE_PAGE_SIZES)[number],
  )
    ? pageSize
    : 10;
  const totalPages = Math.max(1, Math.ceil(types.length / effectivePageSize));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const from =
    types.length === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1;
  const to = Math.min(currentPage * effectivePageSize, types.length);
  const visibleBrands = types.slice(from === 0 ? 0 : from - 1, to);
  // Fix ความสูงเฉพาะตอน Loading หรือไม่มีข้อมูล
  const isEmptyTable = loading || visibleBrands.length === 0;

  const handlePageSizeChange = (value: number) => {
    onPageSizeChange(value);
    onPageChange(1);
  };

  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-200/90 bg-white shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="relative overflow-hidden border-b border-slate-100 px-5 py-5 sm:px-6 sm:py-6 dark:border-slate-800">
        <div className="pointer-events-none absolute -top-20 -right-14 h-44 w-44 rounded-full bg-blue-100/50 blur-3xl dark:bg-blue-600/10" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <CarFront size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg dark:text-white">
                รายชื่อประเภทรถยนต์
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                ค้นหาและจัดการข้อมูลประเภทรถยนต์ในระบบ
              </p>
            </div>
          </div>
          <div className="flex w-full items-center gap-2 lg:w-auto">
            <div className="relative min-w-0 flex-1 lg:w-72 lg:flex-none">
              <Search
                size={17}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                aria-label="ค้นหาชื่อหรือรหัสประเภทรถยนต์"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="ค้นหาชื่อหรือรหัสประเภทรถ..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pr-9 pl-10 text-sm text-slate-900 transition outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
              />
              {search && (
                <button
                  type="button"
                  aria-label="ล้างคำค้นหา"
                  onClick={() => onSearchChange("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <button
              type="button"
              title="รีเฟรชข้อมูล"
              aria-label="รีเฟรชข้อมูลประเภทรถ"
              onClick={() => void onRefresh()}
              disabled={loading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div
        className={`overflow-x-auto transition-all duration-300 ${
          isEmptyTable ? "min-h-[340px]" : "min-h-0"
        }`}
      >
        <table className="w-full min-w-[600px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-gradient-to-r from-sky-50/90 via-indigo-50/70 to-violet-50/80 text-xs font-bold text-slate-600 dark:border-slate-800 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 dark:text-slate-300">
              <th scope="col" className="w-36 px-6 py-4">
                #
              </th>
              <th scope="col" className="px-6 py-4">
                ชื่อประเภทรถยนต์
              </th>
              <th scope="col" className="w-48 px-6 py-4 text-right">
                จัดการ
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* ================= LOADING ================= */}
            {loading ? (
              <tr>
                <td colSpan={3} className="p-0">
                  <div className="flex h-[292px] flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-100 dark:from-blue-950 dark:via-indigo-950 dark:to-violet-950">
                      <LoaderCircle
                        size={30}
                        className="animate-spin text-blue-600 dark:text-blue-400"
                      />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      กำลังโหลดข้อมูลประเภทรถ...
                    </p>

                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      กำลังดึงข้อมูลจากระบบ
                    </p>
                  </div>
                </td>
              </tr>
            ) : visibleBrands.length === 0 ? (
              /* ================= EMPTY STATE ================= */
              <tr>
                <td colSpan={3} className="p-0">
                  <div className="flex h-[292px] flex-col items-center justify-center px-6 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl bg-blue-400/15 blur-xl" />

                      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-sky-50 via-blue-50 to-violet-100 text-blue-600 shadow-sm dark:border-blue-900 dark:from-blue-950 dark:via-indigo-950 dark:to-violet-950 dark:text-blue-300">
                        {error ? (
                          <AlertCircle size={30} strokeWidth={1.7} />
                        ) : search.trim() ? (
                          <Search size={30} strokeWidth={1.7} />
                        ) : (
                          <CarFront size={32} strokeWidth={1.7} />
                        )}
                      </div>
                    </div>

                    <h3 className="mt-5 text-sm font-extrabold text-slate-800 dark:text-white">
                      {error
                        ? "ไม่สามารถแสดงข้อมูลได้"
                        : search.trim()
                          ? "ไม่พบประเภทรถที่ค้นหา"
                          : "ยังไม่มีประเภทรถในระบบ"}
                    </h3>

                    <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {error
                        ? "เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง"
                        : search.trim()
                          ? "ลองใช้คำค้นหาอื่น หรือกดล้างคำค้นหาเพื่อดูรายการทั้งหมด"
                          : "ยังไม่มีรายการประเภทรถยนต์ เริ่มต้นเพิ่มข้อมูลได้จากปุ่มเพิ่มประเภทรถด้านบน"}
                    </p>

                    {error ? (
                      <button
                        type="button"
                        onClick={() => void onRefresh()}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                      >
                        <RefreshCw size={14} />
                        โหลดข้อมูลอีกครั้ง
                      </button>
                    ) : search.trim() ? (
                      <button
                        type="button"
                        onClick={() => onSearchChange("")}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                      >
                        <X size={14} />
                        ล้างคำค้นหา
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : (
              /* ================= DATA ROWS ================= */
              visibleBrands.map((item, index) => (
                <tr
                  key={item.car_type_id}
                  className="group transition-colors duration-150 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                >
                  {/* Brand ID */}
                  <td className="px-6 py-4">
                    <span className="font-mono inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {/* #{String(item.car_type_id).padStart(3, "0")} */}
                      {index + 1}
                    </span>
                  </td>

                  {/* Brand Name */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-violet-600 text-white shadow-sm shadow-blue-500/20 transition-transform duration-200 group-hover:scale-105">
                        <CarFront size={21} strokeWidth={1.8} />
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold break-words text-slate-900 dark:text-slate-100">
                          {item.car_type_name}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        aria-label={`แก้ไข ${item.car_type_name}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                      >
                        <PencilLine size={15} />
                        แก้ไข
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        aria-label={`ลบ ${item.car_type_name}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:border-rose-200 hover:bg-rose-100 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                      >
                        <Trash2 size={15} />
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= PAGINATION FOOTER ================= */}
      <div className="relative overflow-hidden border-t border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/60 px-5 py-4 sm:px-6 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
        <div className="pointer-events-none absolute -bottom-14 -left-14 h-32 w-32 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* LEFT: Page Size */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="car-brand-page-size"
              className="text-xs font-semibold whitespace-nowrap text-slate-500 dark:text-slate-400"
            >
              แสดงต่อหน้า
            </label>

            <div className="relative">
              <select
                id="car-brand-page-size"
                value={effectivePageSize}
                disabled={loading}
                onChange={(event) =>
                  handlePageSizeChange(Number(event.target.value))
                }
                className="h-10 min-w-[120px] appearance-none rounded-xl border border-slate-200 bg-white py-2 pr-9 pl-4 text-xs font-bold text-slate-700 shadow-sm transition-all outline-none hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {CAR_TYPE_PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} รายการ
                  </option>
                ))}
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          {/* RIGHT: Pagination */}
          <nav
            aria-label="การแบ่งหน้ารายชื่อประเภทรถยนต์"
            className="flex items-center justify-end gap-2"
          >
            <button
              type="button"
              title="หน้าก่อนหน้า"
              aria-label="หน้าก่อนหน้า"
              disabled={loading || currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex h-10 min-w-[96px] items-center justify-center gap-1 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 text-xs font-bold text-slate-600 shadow-sm dark:border-blue-900/40 dark:from-blue-950/40 dark:to-indigo-950/40 dark:text-slate-300">
              <span className="font-extrabold text-blue-700 tabular-nums dark:text-blue-300">
                {currentPage}
              </span>

              <span className="mx-1 text-slate-400">/</span>

              <span className="tabular-nums">{totalPages}</span>
            </div>

            <button
              type="button"
              title="หน้าถัดไป"
              aria-label="หน้าถัดไป"
              disabled={loading || currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        </div>
      </div>
    </section>
  );
}
