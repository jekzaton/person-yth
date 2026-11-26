"use client";

import {
  CarItem,
  CarLookups,
  CARS_PAGE_SIZES,
  LookupOption,
} from "@/types/carType";
import {
  AlertCircle,
  CarFront,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MapPin,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

interface CarsTableProps {
  cars: CarItem[];
  lookups: CarLookups;

  search: string;
  onSearchChange: (value: string) => void;

  loading: boolean;
  error: string | null;
  onRefresh: () => void | Promise<unknown>;

  onEdit: (car: CarItem) => void;
  onDelete: (car: CarItem) => void;

  page: number;
  onPageChange: (page: number) => void;

  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

const lookupName = (
  items: LookupOption[],
  id: number,
  fallback?: string | null,
) => {
  return items.find((item) => item.id === id)?.name || fallback || `รหัส ${id}`;
};

export default function CarsTable({
  cars,
  lookups,
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
}: CarsTableProps) {
  // cars ต้องเป็นรายการที่กรองด้วยคำค้นหาแล้ว
  const effectivePageSize = CARS_PAGE_SIZES.includes(
    pageSize as (typeof CARS_PAGE_SIZES)[number],
  )
    ? pageSize
    : 10;

  const totalPages = Math.max(1, Math.ceil(cars.length / effectivePageSize));

  const currentPage = Math.max(1, Math.min(page, totalPages));

  const firstRow =
    cars.length === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1;

  const lastRow = Math.min(currentPage * effectivePageSize, cars.length);

  const visibleCars = cars.slice(firstRow === 0 ? 0 : firstRow - 1, lastRow);

  const handlePageSizeChange = (size: number) => {
    onPageSizeChange(size);
    onPageChange(1);
  };

  return (
    <section className="relative isolate overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      {/* ================= HEADER ================= */}
      <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-white via-sky-50/40 to-indigo-50/50 px-5 py-5 sm:px-6 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
        <div className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <CarFront size={24} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                รายชื่อทะเบียนรถยนต์
              </h2>

              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                ค้นหาและจัดการทะเบียนรถยนต์ของบุคลากร
              </p>
            </div>
          </div>

          {/* SEARCH AND REFRESH */}
          <div className="flex w-full items-center gap-2 lg:w-auto">
            <div className="relative min-w-0 flex-1 lg:w-80 lg:flex-none">
              <Search
                size={18}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                aria-label="ค้นหาข้อมูลทะเบียนรถยนต์"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="ค้นหาทะเบียน จังหวัด ยี่ห้อ บุคลากร..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pr-9 pl-10 text-sm text-slate-900 shadow-sm transition outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />

              {search && (
                <button
                  type="button"
                  aria-label="ล้างคำค้นหา"
                  onClick={() => onSearchChange("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-700"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              title="รีเฟรชข้อมูล"
              aria-label="รีเฟรชข้อมูล"
              disabled={loading}
              onClick={() => void onRefresh()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* ================= ERROR ================= */}
      {error && (
        <div
          role="alert"
          className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
        >
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ================= TABLE ================= */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-blue-100 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 text-xs font-bold text-slate-600 dark:border-slate-800 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 dark:text-slate-300">
              <th scope="col" className="px-5 py-4">
                ทะเบียนรถ / จังหวัด
              </th>

              <th scope="col" className="px-5 py-4">
                ยี่ห้อ / รุ่นรถ
              </th>

              <th scope="col" className="px-5 py-4">
                สี / ประเภทรถ
              </th>

              <th scope="col" className="px-5 py-4">
                บุคลากร
              </th>

              <th scope="col" className="px-5 py-4 text-right">
                จัดการ
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* LOADING */}
            {loading ? (
              <tr>
                <td colSpan={5} className="p-0">
                  <div className="flex h-[300px] flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-violet-100 dark:from-blue-950 dark:to-violet-950">
                      <LoaderCircle
                        size={30}
                        className="animate-spin text-blue-600"
                      />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      กำลังโหลดข้อมูลทะเบียนรถยนต์...
                    </p>
                  </div>
                </td>
              </tr>
            ) : visibleCars.length === 0 ? (
              /* EMPTY STATE */
              <tr>
                <td colSpan={5} className="p-0">
                  <div className="flex h-[300px] flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 via-blue-50 to-violet-100 text-blue-600 dark:from-blue-950 dark:to-violet-950 dark:text-blue-300">
                      {error ? (
                        <AlertCircle size={30} />
                      ) : search.trim() ? (
                        <Search size={30} />
                      ) : (
                        <CarFront size={32} />
                      )}
                    </div>

                    <p className="mt-4 text-sm font-extrabold text-slate-800 dark:text-white">
                      {error
                        ? "ไม่สามารถแสดงข้อมูลได้"
                        : search.trim()
                          ? "ไม่พบทะเบียนรถที่ค้นหา"
                          : "ยังไม่มีข้อมูลทะเบียนรถยนต์"}
                    </p>

                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {error
                        ? "ลองกดรีเฟรชข้อมูลอีกครั้ง"
                        : search.trim()
                          ? "ลองเปลี่ยนคำค้นหา หรือล้างคำค้นหา"
                          : "เริ่มต้นลงทะเบียนรถยนต์ผ่านปุ่มด้านบน"}
                    </p>

                    {search.trim() && !error && (
                      <button
                        type="button"
                        onClick={() => onSearchChange("")}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                      >
                        <X size={14} />
                        ล้างคำค้นหา
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              /* DATA ROWS */
              visibleCars.map((car) => (
                <tr
                  key={car.car_id}
                  className="group transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                >
                  {/* LICENSE */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
                        <CarFront size={21} />
                      </div>

                      <div className="min-w-0">
                        <p className="font-extrabold text-blue-700 dark:text-blue-300">
                          {car.car_license}
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin size={12} />
                          {car.car_province}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* BRAND / MODEL */}
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {lookupName(
                        lookups.brands,
                        car.c_brand_id,
                        car.brand_name,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {car.car_model}
                    </p>
                  </td>

                  {/* COLOR / TYPE */}
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {car.car_color}
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {lookupName(
                        lookups.types,
                        car.car_type_id,
                        car.type_name,
                      )}
                    </p>
                  </td>

                  {/* ACCOUNT */}
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {lookupName(
                        lookups.accounts,
                        car.ac_id,
                        car.account_name,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      ID: {car.ac_id}
                    </p>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(car)}
                        aria-label={`แก้ไขทะเบียน ${car.car_license}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:border-blue-300 hover:from-blue-100 hover:to-indigo-100 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none dark:border-blue-900 dark:from-blue-950/40 dark:to-indigo-950/40 dark:text-blue-300"
                      >
                        <Pencil size={15} />
                        แก้ไข
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(car)}
                        aria-label={`ลบทะเบียน ${car.car_license}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-gradient-to-r from-rose-50 to-red-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:border-rose-300 hover:from-rose-100 hover:to-red-100 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none dark:border-rose-900 dark:from-rose-950/40 dark:to-red-950/40 dark:text-rose-300"
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
      <div className="relative border-t border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/60 px-5 py-4 sm:px-6 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* LEFT: PAGE SIZE */}
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="cars-page-size"
              className="text-xs font-semibold text-slate-500 dark:text-slate-400"
            >
              แสดงต่อหน้า
            </label>

            <div className="relative">
              <select
                id="cars-page-size"
                value={effectivePageSize}
                disabled={loading}
                onChange={(event) =>
                  handlePageSizeChange(Number(event.target.value))
                }
                className="h-10 min-w-[120px] appearance-none rounded-xl border border-slate-200 bg-white py-2 pr-9 pl-4 text-xs font-bold text-slate-700 shadow-sm transition outline-none hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {CARS_PAGE_SIZES.map((size) => (
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

            <span className="text-xs text-slate-500 dark:text-slate-400">
              {firstRow.toLocaleString("th-TH")}–
              {lastRow.toLocaleString("th-TH")} จาก{" "}
              <strong className="text-blue-700 dark:text-blue-300">
                {cars.length.toLocaleString("th-TH")}
              </strong>
            </span>
          </div>

          {/* RIGHT: PAGE NAVIGATION */}
          <nav
            aria-label="แบ่งหน้าทะเบียนรถยนต์"
            className="flex items-center justify-end gap-2"
          >
            <button
              type="button"
              aria-label="หน้าก่อนหน้า"
              disabled={loading || currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex h-10 min-w-[94px] items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 text-xs font-bold text-blue-700 tabular-nums shadow-sm dark:border-blue-900/50 dark:from-blue-950/40 dark:to-indigo-950/40 dark:text-blue-300">
              {currentPage} / {totalPages}
            </div>

            <button
              type="button"
              aria-label="หน้าถัดไป"
              disabled={loading || currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        </div>
      </div>
    </section>
  );
}
