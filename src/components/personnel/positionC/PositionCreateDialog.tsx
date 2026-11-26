"use client";

import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BriefcaseBusiness, LoaderCircle, Plus, X } from "lucide-react";
import { toast } from "react-toastify";

import { api, ApiError } from "@/lib/api";

const schema = z.object({
  ps_name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อตำแหน่ง")
    .max(255, "ชื่อตำแหน่งต้องไม่เกิน 255 ตัวอักษร"),
});

type FormValues = z.infer<typeof schema>;

interface PositionCreateDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PositionCreateDialog({
  onClose,
  onSuccess,
}: PositionCreateDialogProps) {
  const titleId = useId();
  const inputId = useId();

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ps_name: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    setFocus("ps_name");
  }, [setFocus]);

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post("/auth/person/position", {
        ps_name: values.ps_name.trim(),
      });

      toast.success("เพิ่มตำแหน่งสำเร็จ");
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        const details = error.details as Record<string, string[]> | undefined;

        const fieldMessage = details?.ps_name?.[0];

        if (fieldMessage || error.status === 409) {
          setError(
            "ps_name",
            {
              type: "server",
              message: fieldMessage ?? "ชื่อตำแหน่งนี้มีอยู่ในระบบแล้ว",
            },
            { shouldFocus: true },
          );
          return;
        }

        toast.error(error.message);
        return;
      }

      toast.error("ไม่สามารถเพิ่มตำแหน่งได้");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
      >
        {/* GRADIENT HEADING */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 p-6 text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-12 -right-10 h-36 w-36 rounded-full bg-white/15 blur-2xl"
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/15">
                <BriefcaseBusiness size={23} />
              </div>

              <div>
                <h2 id={titleId} className="text-lg font-bold">
                  เพิ่มตำแหน่งบุคลากร
                </h2>
                <p className="mt-1 text-xs text-blue-100">
                  เพิ่มข้อมูลตำแหน่งใหม่เข้าสู่ระบบ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="ปิดหน้าต่าง"
              className="rounded-lg p-2 text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="p-6">
            <label
              htmlFor={inputId}
              className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200"
            >
              ชื่อตำแหน่ง
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              {...register("ps_name")}
              id={inputId}
              type="text"
              maxLength={255}
              autoComplete="off"
              placeholder="เช่น พยาบาลวิชาชีพ"
              aria-invalid={!!errors.ps_name}
              aria-describedby={errors.ps_name ? `${inputId}-error` : undefined}
              className={`min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-gray-900 transition outline-none focus:ring-4 focus:ring-blue-500/10 dark:bg-gray-950 dark:text-white ${
                errors.ps_name
                  ? "border-red-400 focus:border-red-500 dark:border-red-500"
                  : "border-gray-200 focus:border-blue-500 dark:border-gray-700"
              }`}
            />

            {errors.ps_name?.message && (
              <p
                id={`${inputId}-error`}
                role="alert"
                className="mt-2 text-xs text-red-500"
              >
                {errors.ps_name.message}
              </p>
            )}

            <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              กรุณาระบุชื่อตำแหน่งที่ไม่ซ้ำกับข้อมูลเดิมในระบบ
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/60 p-5 sm:flex-row sm:justify-end dark:border-gray-800 dark:bg-gray-950/40">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Plus size={18} />
              )}
              {isSubmitting ? "กำลังบันทึก..." : "เพิ่มตำแหน่ง"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
