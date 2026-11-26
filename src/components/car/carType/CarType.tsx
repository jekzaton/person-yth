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

import CarTypeTable from "./CarTypeTable";
import { CarTypeItem } from "@/types/carType";
import CarTypeStats from "./CarTypeStats";
import CarTypeHeader from "./CarTypeHeader";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/person-yth";

const API_PATH = `${BASE_PATH}/api/cars/type`;
const PAGE_SIZE = 8;

type ApiResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

function extractType(payload: unknown): CarTypeItem[] {
  let items: unknown = payload;

  if (!Array.isArray(items) && items && typeof items === "object") {
    const result = items as ApiResponse;
    items = result.data;

    if (!Array.isArray(items) && items && typeof items === "object") {
      const nested = items as {
        types?: unknown;
        items?: unknown;
        data?: unknown;
      };

      items = nested.types ?? nested.items ?? nested.data;
    }
  }

  if (!Array.isArray(items)) return [];

  return items.filter((item): item is CarTypeItem => {
    if (!item || typeof item !== "object") return false;

    const value = item as Partial<CarTypeItem>;

    return (
      typeof value.car_type_id === "number" &&
      typeof value.car_type_name === "string"
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

export default function CarType() {
  const [types, setTypes] = useState<CarTypeItem[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<"create" | "edit" | null>(null);

  const [editing, setEditing] = useState<CarTypeItem | null>(null);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<CarTypeItem | null>(null);

  const loadTypes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await requestJson(API_PATH);
      setTypes(extractType(result));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "โหลดข้อมูลประเภทรถไม่สำเร็จ";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();

    return types
      .filter((carType) => {
        if (!keyword) return true;

        return `${carType.car_type_id} ${carType.car_type_name}`
          .toLocaleLowerCase()
          .includes(keyword);
      })
      .sort((a, b) => a.car_type_id - b.car_type_id);
  }, [types, search]);

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

  const openEdit = (item: CarTypeItem) => {
    setEditing(item);
    setName(item.car_type_name);
    setNameError("");
    setModal("edit");
  };

  const saveType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleaned = name.trim().replace(/\s+/g, " ");

    if (!cleaned) {
      setNameError("กรุณาระบุชื่อประเภทรถ");
      return;
    }

    if (cleaned.length > 255) {
      setNameError("ชื่อประเภทรถยาวเกิน 255 ตัวอักษร");
      return;
    }

    const duplicate = types.some(
      (item) =>
        item.car_type_id !== editing?.car_type_id &&
        item.car_type_name.trim().toLocaleLowerCase() ===
          cleaned.toLocaleLowerCase(),
    );

    if (duplicate) {
      setNameError("ชื่อประเภทรถนี้มีอยู่ในระบบแล้ว");
      return;
    }

    setSaving(true);
    setNameError("");

    try {
      const isEdit = modal === "edit" && editing;

      await requestJson(
        isEdit ? `${API_PATH}/${editing.car_type_id}` : API_PATH,
        {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify({
            car_type_name: cleaned,
          }),
        },
      );

      toast.success(isEdit ? "แก้ไขประเภทรถสำเร็จ" : "เพิ่มประเภทรถสำเร็จ");

      setModal(null);
      await loadTypes();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลได้";

      setNameError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteType = async () => {
    if (!deleteTarget) return;

    setSaving(true);

    try {
      await requestJson(`${API_PATH}/${deleteTarget.car_type_id}`, {
        method: "DELETE",
      });

      toast.success("ลบประเภทรถสำเร็จ");
      setDeleteTarget(null);
      await loadTypes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถลบข้อมูลได้");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10 text-slate-800 dark:text-slate-100">
      <CarTypeHeader
        onAdd={openCreate}
        totalBrands={types.length}
        loading={loading}
      />

      <CarTypeStats
        totalBrands={types.length}
        filteredBrands={filtered.length}
        loading={loading}
      />

      <CarTypeTable
        types={filtered}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageSize(1);
        }}
        loading={loading}
        error={error}
        onRefresh={loadTypes}
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
                  {modal === "edit" ? "แก้ไขประเภทรถยนต์" : "เพิ่มประเภทรถยนต์"}
                </h2>

                <p className="mt-1 text-xs text-sky-100">
                  จัดการข้อมูลประเภทรถอย่างเป็นระเบียบ
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={(event) => void saveType(event)}
            className="space-y-6 px-6 py-6 sm:px-8"
          >
            <div>
              <label
                htmlFor="brand-name"
                className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
              >
                ชื่อประเภทรถ <span className="text-rose-500">*</span>
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
                  placeholder="เช่น จักรยานยนต์ ..."
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
                ชื่อประเภทต้องไม่ซ้ำกัน และยาวไม่เกิน 255 ตัวอักษร
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
                    : "เพิ่มประเภทรถ"}
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
            ยืนยันการลบประเภทรถ?
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
            ต้องการลบ{" "}
            <strong className="text-slate-900 dark:text-white">
              {deleteTarget?.car_type_name}
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
              onClick={() => void deleteType()}
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
