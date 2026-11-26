"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Check,
  ChevronDown,
  CircleHelp,
  LoaderCircle,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { toast } from "react-toastify";
import { Modal } from "@/components/ui/modal";
import { BASE_PATH } from "@/lib/api";

import type {
  CarRow,
  CarLookups,
  CarFormData,
  CarFormValues,
  LookupOption,
} from "@/types/carType";

import { INITIAL_CAR_FORM, INITIAL_CAR_LOOKUPS } from "@/types/carType";

import CarsHeader from "./CarsHeader";
import CarsStats from "./CarsStats";
import CarsTable from "./CarsTable";

// ================================================
// CONSTANTS
// ================================================

const API_URL = `${BASE_PATH}/api/cars`;

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

// ================================================
// API TYPES
// ================================================

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

// ================================================
// HELPERS
// ================================================

function normalizeLicense(value: string): string {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
  }

  let result: ApiResponse<T>;

  try {
    result = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiRequestError(
      `เซิร์ฟเวอร์ส่งข้อมูลไม่ถูกต้อง (${response.status})`,
      response.status,
    );
  }

  if (!response.ok || result.success === false) {
    throw new ApiRequestError(
      result.message || `เกิดข้อผิดพลาด (${response.status})`,
      response.status,
    );
  }

  if (result.data === undefined) {
    throw new Error("API ไม่ส่งข้อมูล data กลับมา");
  }

  return result.data;
}

// ================================================
// SEARCHABLE SELECT
// ================================================

interface SearchableSelectProps {
  label: string;
  items: LookupOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

function SearchableSelect({
  label,
  items,
  value,
  onChange,
  placeholder,
  disabled = false,
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selected = items.find((item) => String(item.id) === value);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("th-TH");

    return items.filter((item) => {
      return (
        !term ||
        item.name.toLocaleLowerCase("th-TH").includes(term) ||
        String(item.id).includes(term)
      );
    });
  }, [items, query]);

  const selectItem = (item: LookupOption) => {
    onChange(String(item.id));
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="relative min-w-0">
      <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
        {label}
        <span className="ml-1 text-rose-500">*</span>
      </label>

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          role="combobox"
          aria-expanded={isOpen && !disabled}
          aria-autocomplete="list"
          aria-label={label}
          disabled={disabled}
          autoComplete="off"
          value={isOpen ? query : (selected?.name ?? "")}
          placeholder={placeholder}
          onFocus={() => {
            setQuery("");
            setIsOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onBlur={() => setIsOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
              setQuery("");
            }

            if (event.key === "Enter" && isOpen && filtered.length === 1) {
              event.preventDefault();
              selectItem(filtered[0]);
            }
          }}
          className={`${inputClass} pr-10 pl-10`}
        />

        {value !== "" ? (
          <button
            type="button"
            aria-label={`ล้าง${label}`}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange("");
              setQuery("");
              setIsOpen(true);
            }}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X size={15} />
          </button>
        ) : (
          <ChevronDown
            size={16}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
          />
        )}
      </div>

      {isOpen && !disabled && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-5 text-center text-xs text-slate-400">
              ไม่พบข้อมูลที่ค้นหา
            </div>
          ) : (
            filtered.slice(0, 100).map((item) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={value === String(item.id)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectItem(item)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-blue-950/40"
              >
                <span className="min-w-0 truncate">{item.name}</span>

                {value === String(item.id) && (
                  <Check size={16} className="shrink-0 text-blue-600" />
                )}
              </button>
            ))
          )}

          {filtered.length > 100 && (
            <p className="px-3 py-2 text-xs text-slate-400">
              แสดง 100 รายการแรก กรุณาพิมพ์ค้นหาเพิ่ม
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ================================================
// MAIN COMPONENT
// ================================================

export default function Cars() {
  // DATA
  const [cars, setCars] = useState<CarRow[]>([]);

  const [lookups, setLookups] = useState<CarLookups>(INITIAL_CAR_LOOKUPS);

  // LOADING
  const [loading, setLoading] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(true);

  // ERRORS
  const [error, setError] = useState<string | null>(null);

  const [lookupError, setLookupError] = useState<string | null>(null);

  const [accessDenied, setAccessDenied] = useState(false);

  // SEARCH / PAGINATION
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // FORM
  const [formOpen, setFormOpen] = useState(false);

  const [editing, setEditing] = useState<CarRow | null>(null);

  const [form, setForm] = useState<CarFormValues>({
    ...INITIAL_CAR_FORM,
  });

  const [saving, setSaving] = useState(false);

  // DELETE
  const [deleteTarget, setDeleteTarget] = useState<CarRow | null>(null);

  const [deleting, setDeleting] = useState(false);

  // ================================================
  // LOAD CARS
  // ================================================

  const loadCars = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await requestJson<CarRow[]>(API_URL);

      setCars(Array.isArray(data) ? data : []);
      setAccessDenied(false);
    } catch (err) {
      const message = getErrorMessage(err);

      setError(message);
      setCars([]);

      setAccessDenied(
        err instanceof ApiRequestError && [401, 403].includes(err.status),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ================================================
  // LOAD LOOKUPS
  // ================================================

  const loadLookups = useCallback(async () => {
    setLookupLoading(true);
    setLookupError(null);

    try {
      const data = await requestJson<CarLookups>(`${API_URL}/options`);

      setLookups({
        brands: Array.isArray(data.brands) ? data.brands : [],
        types: Array.isArray(data.types) ? data.types : [],
        accounts: Array.isArray(data.accounts) ? data.accounts : [],
      });
    } catch (err) {
      const message = getErrorMessage(err);

      setLookupError(message);

      setLookups({
        brands: [],
        types: [],
        accounts: [],
      });

      toast.error(message);
    } finally {
      setLookupLoading(false);
    }
  }, []);

  // ================================================
  // INITIAL LOAD
  // ================================================

  useEffect(() => {
    void loadCars();
    void loadLookups();
  }, [loadCars, loadLookups]);

  // ================================================
  // FILTER CARS
  // ================================================

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("th-TH");

    if (!term) return cars;

    const findName = (items: LookupOption[], id: number) =>
      items.find((item) => item.id === id)?.name ?? "";

    return cars.filter((car) => {
      const values = [
        car.car_id,
        car.car_license,
        car.car_province,
        car.car_model,
        car.car_color,
        car.brand_name,
        car.type_name,
        car.account_name,
        findName(lookups.brands, car.c_brand_id),
        findName(lookups.types, car.car_type_id),
        findName(lookups.accounts, car.ac_id),
      ];

      return values.some((value) =>
        String(value ?? "")
          .toLocaleLowerCase("th-TH")
          .includes(term),
      );
    });
  }, [cars, lookups, search]);

  // ================================================
  // OPEN CREATE
  // ================================================

  const openCreate = () => {
    setEditing(null);

    setForm({
      ...INITIAL_CAR_FORM,
    });

    setFormOpen(true);
  };

  // ================================================
  // OPEN EDIT
  // ================================================

  const openEdit = (car: CarRow) => {
    setEditing(car);

    setForm({
      car_license: car.car_license,
      car_province: car.car_province,
      c_brand_id: String(car.c_brand_id),
      car_model: car.car_model,
      car_color: car.car_color,
      car_type_id: String(car.car_type_id),
      ac_id: String(car.ac_id),
    });

    setFormOpen(true);
  };

  // ================================================
  // UPDATE FORM FIELD
  // ================================================

  const updateField = <K extends keyof CarFormValues>(
    key: K,
    value: CarFormValues[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // ================================================
  // SAVE CAR
  // ================================================

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) return;

    const payload: CarFormData = {
      car_license: normalizeLicense(form.car_license),

      car_province: form.car_province.trim(),

      c_brand_id: Number(form.c_brand_id),

      car_model: form.car_model.trim(),

      car_color: form.car_color.trim(),

      car_type_id: Number(form.car_type_id),

      ac_id: Number(form.ac_id),
    };

    const validId = (value: number) => Number.isSafeInteger(value) && value > 0;

    // VALIDATE
    if (
      !payload.car_license ||
      !payload.car_province ||
      !payload.car_model ||
      !payload.car_color ||
      !validId(payload.c_brand_id) ||
      !validId(payload.car_type_id) ||
      !validId(payload.ac_id)
    ) {
      toast.warning("กรุณากรอกข้อมูลและเลือกตัวเลือกให้ครบถ้วน");
      return;
    }

    // DUPLICATE CHECK
    const duplicate = cars.some(
      (car) =>
        normalizeLicense(car.car_license) === payload.car_license &&
        car.car_id !== editing?.car_id,
    );

    if (duplicate) {
      toast.error("ทะเบียนรถนี้มีอยู่ในระบบแล้ว");
      return;
    }

    setSaving(true);

    try {
      const endpoint = editing ? `${API_URL}/${editing.car_id}` : API_URL;

      await requestJson<CarRow>(endpoint, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      toast.success(editing ? "แก้ไขทะเบียนรถสำเร็จ" : "เพิ่มทะเบียนรถสำเร็จ");

      setFormOpen(false);
      setEditing(null);

      await loadCars();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ================================================
  // DELETE CAR
  // ================================================

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;

    setDeleting(true);

    try {
      await requestJson<CarRow>(`${API_URL}/${deleteTarget.car_id}`, {
        method: "DELETE",
      });

      toast.success("ลบทะเบียนรถสำเร็จ");

      setDeleteTarget(null);

      await loadCars();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  // ================================================
  // ACCESS DENIED
  // ================================================

  if (accessDenied) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-10 text-center shadow-sm dark:border-rose-900 dark:bg-slate-900">
        <ShieldCheck className="mx-auto mb-4 text-rose-500" size={36} />

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          ไม่มีสิทธิ์จัดการทะเบียนรถ
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          เฉพาะผู้ใช้งานที่มี ac_role = admin เท่านั้น
        </p>
      </div>
    );
  }

  // ================================================
  // RENDER
  // ================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
      {/* HEADER */}
      <CarsHeader
        onAdd={openCreate}
        totalCars={cars.length}
        loading={loading}
        disabled={loading || lookupLoading || !!lookupError}
      />

      {/* STATS */}
      <CarsStats
        totalCars={cars.length}
        filteredCars={filtered.length}
        loading={loading}
      />

      {/* TABLE */}
      <CarsTable
        cars={filtered}
        lookups={lookups}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        loading={loading}
        error={error}
        onRefresh={() => Promise.all([loadCars(), loadLookups()])}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {/* ===========================================
          CREATE / EDIT MODAL
      =========================================== */}

      <Modal
        isOpen={formOpen}
        onClose={() => {
          if (!saving) setFormOpen(false);
        }}
        className="max-w-[760px] p-0"
        showCloseButton={false}
      >
        <div className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900">
          {/* MODAL HEADER */}
          <div className="flex items-center justify-between bg-gradient-to-r from-sky-600 via-blue-700 to-violet-700 px-6 py-5 text-white">
            <div>
              <p className="text-xs font-semibold tracking-widest text-blue-100">
                CAR REGISTRATION
              </p>

              <h3 className="mt-1 text-xl font-extrabold">
                {editing ? "แก้ไขข้อมูลทะเบียนรถ" : "เพิ่มทะเบียนรถยนต์"}
              </h3>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => setFormOpen(false)}
              aria-label="ปิดหน้าต่าง"
              className="rounded-xl bg-white/15 p-2 transition hover:bg-white/25 disabled:opacity-50"
            >
              <X size={19} />
            </button>
          </div>

          {/* FORM */}
          <form
            onSubmit={(event) => void handleSave(event)}
            className="space-y-5 p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {/* LICENSE */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  ทะเบียนรถ
                  <span className="ml-1 text-rose-500">*</span>
                </span>

                <input
                  required
                  maxLength={50}
                  disabled={saving}
                  value={form.car_license}
                  onChange={(event) =>
                    updateField("car_license", event.target.value)
                  }
                  placeholder="เช่น กข 1234"
                  className={inputClass}
                />

                <span className="mt-1 block text-[11px] text-slate-400">
                  ทะเบียนรถต้องไม่ซ้ำกับรายการอื่นในระบบ
                </span>
              </label>

              {/* PROVINCE */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  จังหวัด
                  <span className="ml-1 text-rose-500">*</span>
                </span>

                <input
                  required
                  maxLength={100}
                  disabled={saving}
                  value={form.car_province}
                  onChange={(event) =>
                    updateField("car_province", event.target.value)
                  }
                  placeholder="เช่น กาฬสินธุ์"
                  className={inputClass}
                />
              </label>

              {/* BRAND */}
              <SearchableSelect
                label="ยี่ห้อรถยนต์"
                items={lookups.brands}
                value={form.c_brand_id}
                onChange={(value) => updateField("c_brand_id", value)}
                placeholder="ค้นหาและเลือกยี่ห้อรถ"
                disabled={lookupLoading || saving}
              />

              {/* MODEL */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  รุ่นรถยนต์
                  <span className="ml-1 text-rose-500">*</span>
                </span>

                <input
                  required
                  maxLength={150}
                  disabled={saving}
                  value={form.car_model}
                  onChange={(event) =>
                    updateField("car_model", event.target.value)
                  }
                  placeholder="เช่น HR-V e:HEV"
                  className={inputClass}
                />
              </label>

              {/* COLOR */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  สีรถยนต์
                  <span className="ml-1 text-rose-500">*</span>
                </span>

                <input
                  required
                  maxLength={100}
                  disabled={saving}
                  value={form.car_color}
                  onChange={(event) =>
                    updateField("car_color", event.target.value)
                  }
                  placeholder="เช่น สีขาว"
                  className={inputClass}
                />
              </label>

              {/* TYPE */}
              <SearchableSelect
                label="ประเภทรถยนต์"
                items={lookups.types}
                value={form.car_type_id}
                onChange={(value) => updateField("car_type_id", value)}
                placeholder="ค้นหาและเลือกประเภทรถ"
                disabled={lookupLoading || saving}
              />

              {/* ACCOUNT */}
              <div className="sm:col-span-2">
                <SearchableSelect
                  label="บุคลากรผู้ถือครองรถ (ac_id)"
                  items={lookups.accounts}
                  value={form.ac_id}
                  onChange={(value) => updateField("ac_id", value)}
                  placeholder="ค้นหาชื่อบุคลากรหรือรหัสผู้ใช้"
                  disabled={lookupLoading || saving}
                />
              </div>
            </div>

            {/* LOOKUP ERROR */}
            {lookupError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
              >
                ไม่สามารถโหลดตัวเลือกได้: {lookupError}
                <button
                  type="button"
                  disabled={lookupLoading}
                  onClick={() => void loadLookups()}
                  className="ml-2 font-bold underline disabled:opacity-50"
                >
                  ลองใหม่
                </button>
              </div>
            )}

            {/* INFORMATION */}
            <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
              <CircleHelp size={16} className="shrink-0" />

              <span>
                ระบบตรวจสอบทะเบียนรถซ้ำก่อนบันทึก และต้องมี UNIQUE INDEX
                ในฐานข้อมูลเพื่อป้องกันข้อมูลซ้ำ
              </span>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
              <button
                type="button"
                disabled={saving}
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                disabled={saving || lookupLoading || !!lookupError}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Check size={17} />
                )}

                {editing ? "บันทึกการแก้ไข" : "เพิ่มทะเบียนรถ"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ===========================================
          DELETE MODAL
      =========================================== */}

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        className="max-w-[440px] p-0"
        showCloseButton={false}
      >
        <div className="rounded-3xl bg-white p-6 text-center dark:bg-slate-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40">
            <Trash2 size={30} />
          </div>

          <h3 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-white">
            ยืนยันการลบทะเบียนรถ?
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            คุณกำลังจะลบทะเบียน{" "}
            <strong className="text-rose-600">
              {deleteTarget?.car_license}
            </strong>{" "}
            จังหวัด {deleteTarget?.car_province}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            การลบรายการนี้ไม่สามารถย้อนกลับได้
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={() => void handleDelete()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:from-rose-700 hover:to-red-700 disabled:opacity-50"
            >
              {deleting && <LoaderCircle size={16} className="animate-spin" />}
              ยืนยันลบ
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
