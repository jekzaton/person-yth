"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Hash,
  LoaderCircle,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";

import { toast } from "react-toastify";

import { api, ApiError } from "@/lib/api";
import type { DepartmentItem } from "@/types/departmentType";

// ======================================================
// VALIDATION
// ======================================================

const departmentEditSchema = z.object({
  dep_name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อแผนก")
    .max(255, "ชื่อแผนกต้องไม่เกิน 255 ตัวอักษร"),

  dep_phone: z.string().trim().max(20, "เบอร์โทรศัพท์ต้องไม่เกิน 20 ตัวอักษร"),
});

type FormValues = z.infer<typeof departmentEditSchema>;

interface DepartmentDialogProps {
  department: DepartmentItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ======================================================
// SERVER FIELD ERRORS
// ======================================================

function getFieldError(details: unknown, field: string): string | undefined {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return undefined;
  }

  const record = details as Record<string, unknown>;

  const nested = record.errors;

  const errors: Record<string, unknown> =
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : record;

  const messages = errors[field];

  if (Array.isArray(messages) && typeof messages[0] === "string") {
    return messages[0];
  }

  return typeof messages === "string" ? messages : undefined;
}

// ======================================================
// FOCUSABLE ELEMENTS
// ======================================================

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function trapFocus(event: KeyboardEvent, container: HTMLElement | null) {
  if (!container) return;

  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => element.getClientRects().length > 0);

  if (elements.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const first = elements[0];
  const last = elements[elements.length - 1];
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
}

// ======================================================
// COMPONENT
// ======================================================

export default function DepartmentDialog({
  department,
  onClose,
  onSuccess,
}: DepartmentDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const nameId = useId();
  const phoneId = useId();
  const confirmTitleId = useId();

  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const confirmCancelRef = useRef<HTMLButtonElement>(null);

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // ====================================================
  // FORM
  // ====================================================

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(departmentEditSchema),
    defaultValues: {
      dep_name: department?.dep_name ?? "",
      dep_phone: department?.dep_phone ?? "",
    },
    mode: "onSubmit",
  });

  const nameRegistration = register("dep_name");

  const nameValue = useWatch({ control, name: "dep_name" }) ?? "";

  const phoneValue = useWatch({ control, name: "dep_phone" }) ?? "";

  // ====================================================
  // RESET WHEN DEPARTMENT CHANGES
  // ====================================================

  useEffect(() => {
    reset({
      dep_name: department?.dep_name ?? "",
      dep_phone: department?.dep_phone ?? "",
    });

    setShowDiscardConfirm(false);
  }, [department?.dep_id, department?.dep_name, department?.dep_phone, reset]);

  // ====================================================
  // CLOSE HANDLING
  // ====================================================

  const requestClose = useCallback(() => {
    if (isSubmitting) return;

    if (showDiscardConfirm) {
      setShowDiscardConfirm(false);
      return;
    }

    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }

    onClose();
  }, [isSubmitting, isDirty, showDiscardConfirm, onClose]);

  // ====================================================
  // KEYBOARD / FOCUS / SCROLL LOCK
  // ====================================================

  useEffect(() => {
    if (!department) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;

    document.body.style.overflow = "hidden";

    // Initial focus
    nameInputRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [department?.dep_id]);

  useEffect(() => {
    if (!department) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        requestClose();
        return;
      }

      if (event.key === "Tab") {
        trapFocus(
          event,
          showDiscardConfirm ? confirmRef.current : dialogRef.current,
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [department, requestClose, showDiscardConfirm]);

  useEffect(() => {
    if (showDiscardConfirm) {
      confirmCancelRef.current?.focus();
    } else if (department) {
      nameInputRef.current?.focus();
    }
  }, [showDiscardConfirm, department?.dep_id]);

  // ====================================================
  // SUBMIT
  // ====================================================

  const onSubmit = async (values: FormValues) => {
    if (!department) return;

    try {
      const payload = {
        dep_name: values.dep_name.trim(),
        dep_phone: values.dep_phone.trim() || null,
      };

      await api.put(`/auth/person/department/${department.dep_id}`, payload);

      toast.success("แก้ไขข้อมูลแผนกสำเร็จ");

      onSuccess();
      onClose();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setError(
            "dep_name",
            {
              type: "server",
              message:
                getFieldError(error.details, "dep_name") ??
                "ชื่อแผนกนี้มีอยู่ในระบบแล้ว",
            },
            { shouldFocus: true },
          );
          return;
        }

        if (error.status === 400) {
          const nameError = getFieldError(error.details, "dep_name");

          const phoneError = getFieldError(error.details, "dep_phone");

          if (nameError) {
            setError("dep_name", {
              type: "server",
              message: nameError,
            });
          }

          if (phoneError) {
            setError("dep_phone", {
              type: "server",
              message: phoneError,
            });
          }

          if (nameError || phoneError) return;
        }

        if (error.status === 401) {
          toast.error("กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
          return;
        }

        if (error.status === 403) {
          toast.error("คุณไม่มีสิทธิ์แก้ไขข้อมูลแผนก");
          return;
        }

        if (error.status === 404) {
          toast.error("ไม่พบข้อมูลแผนก กรุณารีเฟรชรายการ");
          return;
        }

        toast.error(error.message);
        return;
      }

      toast.error("ไม่สามารถแก้ไขข้อมูลแผนกได้");
    }
  };

  // ====================================================
  // RENDER
  // ====================================================

  if (!department) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          requestClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative my-auto w-full max-w-xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-slate-950/30 dark:border-gray-700 dark:bg-gray-900"
      >
        {/* ============================================
            HEADER
        ============================================ */}
        <div className="relative isolate overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 px-5 py-6 sm:px-7">
          {/* Decorative backgrounds */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/4 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl"
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-sm">
                <Pencil size={22} />
              </div>

              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-cyan-100">
                  <Building2 size={12} />
                  EDIT DEPARTMENT
                </span>

                <h2
                  id={titleId}
                  className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl"
                >
                  แก้ไขข้อมูลแผนก
                </h2>

                <p
                  id={descriptionId}
                  className="mt-1 text-xs leading-relaxed text-blue-100/80 sm:text-sm"
                >
                  ปรับปรุงชื่อแผนกและข้อมูลการติดต่อ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={requestClose}
              disabled={isSubmitting}
              aria-label="ปิดหน้าต่าง"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-white disabled:opacity-40"
            >
              <X size={19} />
            </button>
          </div>

          {/* Department ID */}
          <div className="relative mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-medium text-blue-100 backdrop-blur-sm">
            <Hash size={14} className="text-cyan-300" />

            <span>รหัสแผนก</span>

            <span className="font-bold text-white">#{department.dep_id}</span>
          </div>
        </div>

        {/* ============================================
            FORM
        ============================================ */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="max-h-[60vh] space-y-6 overflow-y-auto px-5 py-6 sm:px-7">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-cyan-500" />

              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                ข้อมูลทั่วไปของแผนก
              </h3>
            </div>

            {/* ========================================
                DEPARTMENT NAME
            ======================================== */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor={nameId}
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  ชื่อแผนก
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <span className="text-[11px] text-gray-400">
                  {nameValue.length}/255
                </span>
              </div>

              <div className="relative">
                <Building2
                  size={18}
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-blue-500 dark:text-blue-400"
                />

                <input
                  {...nameRegistration}
                  ref={(element) => {
                    nameRegistration.ref(element);
                    nameInputRef.current = element;
                  }}
                  id={nameId}
                  maxLength={255}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.dep_name}
                  aria-describedby={
                    errors.dep_name ? `${nameId}-error` : undefined
                  }
                  placeholder="เช่น กลุ่มงานเทคโนโลยีสารสนเทศ"
                  className={`min-h-12 w-full rounded-xl border bg-white py-3 pr-4 pl-12 text-sm font-medium text-gray-800 transition outline-none focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60 dark:bg-gray-950 dark:text-white ${
                    errors.dep_name
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500 dark:border-gray-700"
                  }`}
                />
              </div>

              {errors.dep_name?.message && (
                <p
                  id={`${nameId}-error`}
                  role="alert"
                  className="mt-2 flex items-center gap-1.5 text-xs text-red-500"
                >
                  <AlertCircle size={14} />
                  {errors.dep_name.message}
                </p>
              )}
            </div>

            {/* ========================================
                DEPARTMENT PHONE
            ======================================== */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor={phoneId}
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  เบอร์โทรศัพท์ / เบอร์ภายใน
                </label>

                <span className="text-[11px] text-gray-400">
                  {phoneValue.length}/20
                </span>
              </div>

              <div className="relative">
                <Phone
                  size={18}
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-cyan-600 dark:text-cyan-400"
                />

                <input
                  {...register("dep_phone")}
                  id={phoneId}
                  type="text"
                  inputMode="tel"
                  maxLength={20}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.dep_phone}
                  aria-describedby={
                    errors.dep_phone ? `${phoneId}-error` : undefined
                  }
                  placeholder="เช่น 043123456 หรือ ต่อ 102"
                  className={`min-h-12 w-full rounded-xl border bg-white py-3 pr-4 pl-12 text-sm font-medium text-gray-800 transition outline-none focus:ring-4 focus:ring-cyan-500/10 disabled:opacity-60 dark:bg-gray-950 dark:text-white ${
                    errors.dep_phone
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-200 focus:border-cyan-500 dark:border-gray-700"
                  }`}
                />
              </div>

              {errors.dep_phone?.message ? (
                <p
                  id={`${phoneId}-error`}
                  role="alert"
                  className="mt-2 flex items-center gap-1.5 text-xs text-red-500"
                >
                  <AlertCircle size={14} />
                  {errors.dep_phone.message}
                </p>
              ) : (
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  สามารถเว้นว่างได้ หากแผนกไม่มีเบอร์โทรศัพท์
                </p>
              )}
            </div>

            {/* ========================================
                NOTICE
            ======================================== */}
            <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50/70 p-4 dark:border-blue-500/15 dark:from-blue-500/10 dark:to-indigo-500/10">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
              />

              <div>
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  ข้อมูลแผนกภายในระบบ
                </p>

                <p className="mt-1 text-xs leading-relaxed text-blue-700/80 dark:text-blue-300/80">
                  การแก้ไขชื่อแผนกอาจส่งผลต่อชื่อที่แสดงในข้อมูลบุคลากร
                  กรุณาตรวจสอบความถูกต้องก่อนบันทึก
                </p>
              </div>
            </div>
          </div>

          {/* ============================================
              FOOTER
          ============================================ */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gradient-to-r from-gray-50 via-white to-blue-50/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950/20">
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              {isDirty ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  มีการแก้ไขที่ยังไม่ได้บันทึก
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  ข้อมูลยังไม่มีการเปลี่ยนแปลง
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={requestClose}
                disabled={isSubmitting}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:flex-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    บันทึกการแก้ไข
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ================================================
          DISCARD CONFIRMATION
      ================================================= */}
      {showDiscardConfirm && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <div
            ref={confirmRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={confirmTitleId}
            tabIndex={-1}
            className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <AlertCircle size={23} />
            </div>

            <h3
              id={confirmTitleId}
              className="text-lg font-bold text-gray-900 dark:text-white"
            >
              ยกเลิกการแก้ไข?
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              คุณมีข้อมูลที่ยังไม่ได้บันทึก หากปิดหน้าต่าง
              การเปลี่ยนแปลงทั้งหมดจะหายไป
            </p>

            <div className="mt-6 flex gap-3">
              <button
                ref={confirmCancelRef}
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="min-h-11 flex-1 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                กลับไปแก้ไข
              </button>

              <button
                type="button"
                onClick={onClose}
                className="min-h-11 flex-1 rounded-xl bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                ไม่บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
