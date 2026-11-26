"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  AlertTriangle,
  CarFront,
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tags,
  Trash2,
} from "lucide-react";

import { toast } from "react-toastify";
import { Modal } from "@/components/ui/modal";
import CarBrandHeader from "./CarBrandHeader";
import CarBrandStats from "./CarBrandStats";
import CarBrandTable from "./CarBrandTable";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/person-yth";

const API_PATH = `${BASE_PATH}/api/cars/brand`;
const PAGE_SIZE = 8;

type CarBrandItem = {
  c_brand_id: number;
  c_brand_name: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

function extractBrands(payload: unknown): CarBrandItem[] {
  let items: unknown = payload;

  if (!Array.isArray(items) && items && typeof items === "object") {
    const result = items as ApiResponse;
    items = result.data;

    if (!Array.isArray(items) && items && typeof items === "object") {
      const nested = items as {
        brands?: unknown;
        items?: unknown;
        data?: unknown;
      };

      items = nested.brands ?? nested.items ?? nested.data;
    }
  }

  if (!Array.isArray(items)) return [];

  return items.filter((item): item is CarBrandItem => {
    if (!item || typeof item !== "object") return false;

    const value = item as Partial<CarBrandItem>;

    return (
      typeof value.c_brand_id === "number" &&
      typeof value.c_brand_name === "string"
    );
  });
}

async function requestJson(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const data: unknown = await response.json().catch(() => null);

  const json = data && typeof data === "object" ? (data as ApiResponse) : null;

  if (!response.ok || json?.success === false) {
    throw new Error(json?.message || `ดำเนินการไม่สำเร็จ (${response.status})`);
  }

  return data;
}

export default function CarBrand() {
  const [brands, setBrands] = useState<CarBrandItem[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<"create" | "edit" | null>(null);

  const [editing, setEditing] = useState<CarBrandItem | null>(null);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<CarBrandItem | null>(null);

  const loadBrands = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await requestJson(API_PATH);
      setBrands(extractBrands(result));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "โหลดข้อมูลยี่ห้อรถไม่สำเร็จ";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBrands();
  }, [loadBrands]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();

    return brands
      .filter((brand) => {
        if (!keyword) return true;

        return `${brand.c_brand_id} ${brand.c_brand_name}`
          .toLocaleLowerCase()
          .includes(keyword);
      })
      .sort((a, b) => a.c_brand_id - b.c_brand_id);
  }, [brands, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const safePage = Math.min(pageSize, totalPages);

  const visible = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const openCreate = () => {
    setEditing(null);
    setName("");
    setNameError("");
    setModal("create");
  };

  const openEdit = (item: CarBrandItem) => {
    setEditing(item);
    setName(item.c_brand_name);
    setNameError("");
    setModal("edit");
  };

  const saveBrand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleaned = name.trim().replace(/\s+/g, " ");

    if (!cleaned) {
      setNameError("กรุณาระบุชื่อยี่ห้อรถ");
      return;
    }

    if (cleaned.length > 255) {
      setNameError("ชื่อยี่ห้อรถยาวเกิน 255 ตัวอักษร");
      return;
    }

    const duplicate = brands.some(
      (item) =>
        item.c_brand_id !== editing?.c_brand_id &&
        item.c_brand_name.trim().toLocaleLowerCase() ===
          cleaned.toLocaleLowerCase(),
    );

    if (duplicate) {
      setNameError("ชื่อยี่ห้อรถนี้มีอยู่ในระบบแล้ว");
      return;
    }

    setSaving(true);
    setNameError("");

    try {
      const isEdit = modal === "edit" && editing;

      await requestJson(
        isEdit ? `${API_PATH}/${editing.c_brand_id}` : API_PATH,
        {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify({
            c_brand_name: cleaned,
          }),
        },
      );

      toast.success(isEdit ? "แก้ไขยี่ห้อรถสำเร็จ" : "เพิ่มยี่ห้อรถสำเร็จ");

      setModal(null);
      await loadBrands();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลได้";

      setNameError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteBrand = async () => {
    if (!deleteTarget) return;

    setSaving(true);

    try {
      await requestJson(`${API_PATH}/${deleteTarget.c_brand_id}`, {
        method: "DELETE",
      });

      toast.success("ลบยี่ห้อรถสำเร็จ");
      setDeleteTarget(null);
      await loadBrands();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถลบข้อมูลได้");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10 text-slate-800 dark:text-slate-100">
      <CarBrandHeader
        onAdd={openCreate}
        totalBrands={brands.length}
        loading={loading}
      />

      <CarBrandStats
        totalBrands={brands.length}
        filteredBrands={filtered.length}
        loading={loading}
      />

      <CarBrandTable
        brands={filtered}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageSize(1);
        }}
        loading={loading}
        error={error}
        onRefresh={loadBrands}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        page={pageSize}
        onPageChange={setPageSize}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* ================= CREATE / EDIT MODAL ================= */}

      <Modal
        isOpen={modal !== null}
        onClose={() => {
          if (!saving) setModal(null);
        }}
        showCloseButton={!saving}
        className="mx-3 w-full max-w-[520px] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="overflow-hidden">
          <div className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-blue-700 to-violet-700 px-6 py-7 text-white sm:px-8">
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
                <Tags size={25} />
              </div>

              <div>
                <h2 className="text-xl font-extrabold">
                  {modal === "edit" ? "แก้ไขยี่ห้อรถยนต์" : "เพิ่มยี่ห้อรถยนต์"}
                </h2>

                <p className="mt-1 text-xs text-sky-100">
                  จัดการข้อมูลยี่ห้อรถอย่างเป็นระเบียบ
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={(event) => void saveBrand(event)}
            className="space-y-6 px-6 py-6 sm:px-8"
          >
            <div>
              <label
                htmlFor="brand-name"
                className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
              >
                ชื่อยี่ห้อรถ <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <CarFront
                  size={18}
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-blue-500"
                />

                <input
                  id="brand-name"
                  autoFocus
                  maxLength={255}
                  value={name}
                  disabled={saving}
                  onChange={(event) => {
                    setName(event.target.value);
                    setNameError("");
                  }}
                  placeholder="เช่น Toyota, Honda, Isuzu"
                  className={`w-full rounded-xl border bg-slate-50 py-3.5 pr-4 pl-12 text-sm font-semibold text-slate-900 transition outline-none focus:ring-4 dark:bg-slate-800 dark:text-white ${
                    nameError
                      ? "border-rose-400 focus:ring-rose-500/10"
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 dark:border-slate-700"
                  }`}
                />
              </div>

              {nameError && (
                <p className="mt-2 text-xs font-semibold text-rose-600">
                  {nameError}
                </p>
              )}

              <p className="mt-2 text-xs text-slate-400">
                ชื่อยี่ห้อต้องไม่ซ้ำกัน และยาวไม่เกิน 255 ตัวอักษร
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => setModal(null)}
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Check size={17} />
                )}

                {saving
                  ? "กำลังบันทึก..."
                  : modal === "edit"
                    ? "บันทึกการแก้ไข"
                    : "เพิ่มยี่ห้อรถ"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ================= DELETE MODAL ================= */}

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => {
          if (!saving) setDeleteTarget(null);
        }}
        showCloseButton={!saving}
        className="mx-3 w-full max-w-[460px] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="px-7 py-8">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 via-orange-50 to-amber-100 text-rose-600 dark:from-rose-950 dark:via-slate-900 dark:to-orange-950">
            <AlertTriangle size={30} />
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            ยืนยันการลบยี่ห้อรถ?
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
            ต้องการลบ{" "}
            <strong className="text-slate-900 dark:text-white">
              {deleteTarget?.c_brand_name}
            </strong>{" "}
            ใช่หรือไม่?
          </p>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-200"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              disabled={saving || !deleteTarget}
              onClick={() => void deleteBrand()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-rose-500/20 transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Trash2 size={17} />
              )}

              {saving ? "กำลังลบ..." : "ยืนยันลบข้อมูล"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
