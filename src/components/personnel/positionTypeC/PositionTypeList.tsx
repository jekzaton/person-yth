"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  CheckCircle2,
  CircleAlert,
  FilePenLine,
  LoaderCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import { api, type ApiResponse } from "@/lib/api";
import type { PositionTypeItem } from "@/types/positionType";
import PositionTypeHeader from "./PositionTypeHeader";
import PositionTypeTable from "./PositionTypeTable";

const ENDPOINT = "/auth/person/position-type";
const MAX_NAME_LENGTH = 255;

type DialogState =
  { mode: "create" } | { mode: "edit"; item: PositionTypeItem } | null;

type PositionTypeListResponse = ApiResponse<PositionTypeItem[]> & {
  total?: number;
  canManage?: boolean;
};

export default function PositionTypeList() {
  const [items, setItems] = useState<PositionTypeItem[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PositionTypeItem | null>(
    null,
  );

  const refresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  // GET route currently returns *all* rows under data, and total/canManage
  // at the top level. Search and pagination are therefore client-side.
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setIsLoading(true);
      try {
        const result = (await api.get<PositionTypeItem[]>(ENDPOINT, {
          cache: "no-store",
          signal: controller.signal,
        })) as PositionTypeListResponse;
        if (controller.signal.aborted) return;
        setItems(Array.isArray(result.data) ? result.data : []);
        setCanManage(result.canManage === true);
      } catch (error) {
        if (controller.signal.aborted) return;
        setItems([]);
        setCanManage(false);
        toast.error(
          error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [refreshKey]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("th-TH");
    if (!term) return items;
    return items.filter(
      (item) =>
        item.ps_name_type.toLocaleLowerCase("th-TH").includes(term) ||
        String(item.ps_type_id).includes(term),
    );
  }, [items, search]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleItems = useMemo(
    () => filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredItems, safePage, pageSize],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!dialog && !deleteTarget) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving && !isDeleting) {
        setDialog(null);
        setDeleteTarget(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dialog, deleteTarget, isSaving, isDeleting]);

  const openCreate = () => {
    if (!canManage) return;
    setName("");
    setFormError("");
    setDialog({ mode: "create" });
  };

  const openEdit = (item: PositionTypeItem) => {
    if (!canManage) return;
    setName(item.ps_name_type);
    setFormError("");
    setDialog({ mode: "edit", item });
  };

  const openDelete = (item: PositionTypeItem) => {
    if (!canManage) return;
    setDeleteTarget(item);
  };

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog || !canManage || isSaving) return;

    const cleaned = name.trim().replace(/\s+/g, " ");
    if (!cleaned) {
      setFormError("กรุณาระบุชื่อประเภทตำแหน่ง");
      return;
    }
    if (cleaned.length > MAX_NAME_LENGTH) {
      setFormError(`ชื่อประเภทตำแหน่งต้องไม่เกิน ${MAX_NAME_LENGTH} ตัวอักษร`);
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      const isEdit = dialog.mode === "edit";
      const result = isEdit
        ? await api.put<PositionTypeItem>(
            `${ENDPOINT}/${dialog.item.ps_type_id}`,
            {
              ps_name_type: cleaned,
            },
          )
        : await api.post<PositionTypeItem>(ENDPOINT, { ps_name_type: cleaned });

      toast.success(
        result.message || (isEdit ? "แก้ไขข้อมูลสำเร็จ" : "เพิ่มข้อมูลสำเร็จ"),
      );
      setDialog(null);
      if (!isEdit) setPage(1);
      refresh();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "บันทึกข้อมูลไม่สำเร็จ",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || !canManage || isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await api.delete(`${ENDPOINT}/${deleteTarget.ps_type_id}`);
      toast.success(result.message || "ลบประเภทตำแหน่งสำเร็จ");
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ลบข้อมูลไม่สำเร็จ");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PositionTypeHeader onAdd={openCreate} canManage={canManage} />

      <PositionTypeTable
        items={visibleItems}
        total={total}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onRefresh={refresh}
        page={safePage}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onEdit={openEdit}
        onDelete={openDelete}
        canManage={canManage}
      />

      {dialog && canManage && (
        <div
          className="fixed inset-0 z-[1400] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSaving)
              setDialog(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="position-type-form-title"
            className="my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-slate-950 via-blue-900 to-indigo-700 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-white/20 bg-white/10 p-2.5">
                  {dialog.mode === "create" ? (
                    <Plus size={22} />
                  ) : (
                    <FilePenLine size={22} />
                  )}
                </div>
                <div>
                  <h3
                    id="position-type-form-title"
                    className="text-lg font-extrabold"
                  >
                    {dialog.mode === "create"
                      ? "เพิ่มประเภทตำแหน่ง"
                      : "แก้ไขประเภทตำแหน่ง"}
                  </h3>
                  <p className="text-xs text-blue-100">
                    ข้อมูลประเภทตำแหน่งบุคลากร
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setDialog(null)}
                aria-label="ปิด"
                className="rounded-lg p-2 hover:bg-white/15 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(event) => void submitForm(event)}>
              <div className="space-y-4 p-6">
                {dialog.mode === "edit" && (
                  <div className="rounded-xl bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800 dark:bg-blue-500/10 dark:text-blue-300">
                    รหัสประเภทตำแหน่ง: #{dialog.item.ps_type_id}
                  </div>
                )}
                <div>
                  <label
                    htmlFor="position-type-name"
                    className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    ชื่อประเภทตำแหน่ง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="position-type-name"
                    autoFocus
                    required
                    maxLength={MAX_NAME_LENGTH}
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setFormError("");
                    }}
                    placeholder="เช่น ข้าราชการ, พนักงานราชการ..."
                    aria-invalid={Boolean(formError)}
                    aria-describedby={
                      formError ? "position-type-form-error" : undefined
                    }
                    className="h-12 w-full rounded-xl border border-blue-100 bg-white px-4 text-sm text-slate-900 transition outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-400">
                    {name.length}/{MAX_NAME_LENGTH}
                  </p>
                </div>
                {formError && (
                  <p
                    id="position-type-form-error"
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                  >
                    <CircleAlert size={16} className="shrink-0" /> {formError}
                  </p>
                )}
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:justify-end dark:border-slate-800 dark:bg-slate-950/40">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setDialog(null)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:brightness-110 disabled:opacity-50"
                >
                  {isSaving ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}
                  {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && canManage && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="position-type-delete-title"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-2xl dark:border-rose-500/20 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-slate-950 via-rose-950 to-red-900 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/10 p-3">
                  <CircleAlert size={24} />
                </div>
                <div>
                  <h3
                    id="position-type-delete-title"
                    className="text-lg font-extrabold"
                  >
                    ยืนยันการลบ
                  </h3>
                  <p className="text-xs text-rose-100">
                    ตรวจสอบรายการก่อนดำเนินการ
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                aria-label="ปิด"
                className="rounded-lg p-2 hover:bg-white/15 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 p-6">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                ต้องการลบประเภทตำแหน่งนี้หรือไม่?
              </p>
              <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 p-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
                <p className="font-extrabold break-words text-slate-900 dark:text-white">
                  {deleteTarget.ps_name_type}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  รหัส #{deleteTarget.ps_type_id}
                </p>
              </div>
              <p className="text-xs leading-relaxed text-rose-600 dark:text-rose-300">
                หากประเภทตำแหน่งนี้ถูกใช้งานโดยบุคลากร
                ระบบจะปฏิเสธการลบเพื่อป้องกันข้อมูลอ้างอิงเสียหาย
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:justify-end dark:border-slate-800 dark:bg-slate-950/40">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void confirmDelete()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 text-sm font-extrabold text-white hover:brightness-110 disabled:opacity-50"
              >
                {isDeleting ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Trash2 size={17} />
                )}
                {isDeleting ? "กำลังลบ..." : "ยืนยันลบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
