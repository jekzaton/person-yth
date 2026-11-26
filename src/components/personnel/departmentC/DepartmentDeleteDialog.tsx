"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Hash,
  LoaderCircle,
  Phone,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";

import { toast } from "react-toastify";

import { api, ApiError } from "@/lib/api";
import type { DepartmentItem } from "@/types/departmentType";

// ======================================================
// TYPES
// ======================================================

interface DepartmentDeleteDialogProps {
  department: DepartmentItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ======================================================
// FOCUS HELPERS
// ======================================================

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

// ======================================================
// COMPONENT
// ======================================================

export default function DepartmentDeleteDialog({
  department,
  onClose,
  onSuccess,
}: DepartmentDeleteDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const deletingRef = useRef(false);
  const closeRef = useRef(onClose);

  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the latest close callback.
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // ====================================================
  // CLOSE
  // ====================================================

  const requestClose = useCallback(() => {
    if (deletingRef.current) return;

    closeRef.current();
  }, []);

  // ====================================================
  // RESET WHEN TARGET CHANGES
  // ====================================================

  useEffect(() => {
    setError(null);
  }, [department?.dep_id]);

  // ====================================================
  // KEYBOARD / FOCUS / BODY SCROLL
  // ====================================================

  useEffect(() => {
    if (!department) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;

    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        requestClose();
        return;
      }

      if (event.key !== "Tab") return;

      const container = dialogRef.current;

      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.getClientRects().length > 0);

      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!container.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown, true);

      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [department?.dep_id, requestClose]);

  // ====================================================
  // DELETE
  // ====================================================

  const handleDelete = async () => {
    if (!department || deletingRef.current) return;

    deletingRef.current = true;
    setIsDeleting(true);
    setError(null);

    try {
      await api.delete(`/auth/person/department/${department.dep_id}`);

      toast.success("ลบข้อมูลหน่วยงานสำเร็จ");

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        switch (err.status) {
          case 400:
            setError("รหัสหน่วยงานไม่ถูกต้อง");
            break;

          case 401:
            setError("กรุณาเข้าสู่ระบบก่อนดำเนินการ");
            break;

          case 403:
            setError("คุณไม่มีสิทธิ์ลบข้อมูลหน่วยงาน");
            break;

          case 404:
            setError("ไม่พบข้อมูลหน่วยงานนี้ในระบบ อาจถูกลบไปแล้ว");
            break;

          case 409:
            setError(
              err.message ||
                "ไม่สามารถลบหน่วยงานได้ เนื่องจากมีบุคลากรสังกัดอยู่",
            );
            break;

          default:
            setError(err.message || "เกิดข้อผิดพลาดในการลบข้อมูลหน่วยงาน");
        }
      } else {
        setError("ไม่สามารถลบข้อมูลหน่วยงานได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      deletingRef.current = false;
      setIsDeleting(false);
    }
  };

  // ====================================================
  // RENDER
  // ====================================================

  if (!department) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          requestClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-slate-950/30 dark:border-gray-700 dark:bg-gray-900"
      >
        {/* ============================================
            HEADER
        ============================================ */}
        <div className="relative isolate overflow-hidden bg-gradient-to-br from-slate-900 via-rose-950 to-red-950 px-5 py-6 sm:px-7">
          {/* BACKGROUND DECORATIONS */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-red-500/20 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/4 h-48 w-48 rounded-full bg-rose-400/20 blur-3xl"
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-300/20 bg-red-400/15 text-red-100 shadow-inner backdrop-blur-sm">
                <AlertTriangle size={27} strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300/20 bg-red-300/10 px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-red-100">
                  <ShieldAlert size={12} />
                  DELETE DEPARTMENT
                </span>

                <h2
                  id={titleId}
                  className="mt-3 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
                >
                  ยืนยันการลบหน่วยงาน
                </h2>

                <p
                  id={descriptionId}
                  className="mt-2 text-xs leading-relaxed text-red-100/80 sm:text-sm"
                >
                  กรุณาตรวจสอบข้อมูลหน่วยงานก่อนยืนยันการลบ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={requestClose}
              disabled={isDeleting}
              aria-label="ปิดหน้าต่าง"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* ============================================
            CONTENT
        ============================================ */}
        <div className="space-y-5 px-5 py-6 sm:px-7">
          {/* WARNING */}
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/70 p-4 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-orange-500/5">
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            />

            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                การลบข้อมูลไม่สามารถย้อนกลับได้
              </p>

              <p className="mt-1 text-xs leading-relaxed text-amber-800/80 dark:text-amber-200/80">
                เมื่อยืนยัน ระบบจะลบข้อมูลหน่วยงานนี้ออกจากฐานข้อมูล
                กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ
              </p>
            </div>
          </div>

          {/* DEPARTMENT CARD */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 via-white to-red-50/40 dark:border-gray-700 dark:from-gray-800/70 dark:via-gray-900 dark:to-red-950/10">
            <div className="flex items-start gap-3 p-4 sm:p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                <Building2 size={23} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[11px] font-semibold tracking-wide text-gray-400 dark:text-gray-500">
                  DEPARTMENT
                </p>

                <h3 className="text-base leading-relaxed font-bold break-words text-gray-900 dark:text-white">
                  {department.dep_name}
                </h3>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                    <Hash size={13} />
                    {department.dep_id}
                  </span>

                  {department.dep_phone?.trim() && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      <Phone size={13} />
                      {department.dep_phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="h-1 bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />
          </div>

          {/* DELETE RESTRICTION NOTICE */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-500/15 dark:bg-blue-500/5">
            <ShieldAlert
              size={18}
              className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
            />

            <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300">
              ระบบจะไม่อนุญาตให้ลบหน่วยงานที่ยังมีบุคลากรสังกัดอยู่
              กรุณาย้ายบุคลากรไปหน่วยงานอื่นก่อนลบข้อมูล
            </p>
          </div>

          {/* API ERROR */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10"
            >
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
              />

              <div className="min-w-0">
                <p className="text-sm font-bold text-red-700 dark:text-red-300">
                  ไม่สามารถลบหน่วยงานได้
                </p>

                <p className="mt-1 text-xs leading-relaxed break-words text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ============================================
            FOOTER BUTTONS
        ============================================ */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gradient-to-r from-gray-50 via-white to-red-50/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-red-950/10">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={requestClose}
            disabled={isDeleting}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-5 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:from-red-700 hover:via-rose-700 hover:to-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isDeleting ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                กำลังลบ...
              </>
            ) : (
              <>
                <Trash2 size={17} />
                ยืนยันลบหน่วยงาน
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
