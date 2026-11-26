"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Save, X, LoaderCircle } from "lucide-react";
import { toast } from "react-toastify";

import { api, ApiError } from "@/lib/api";
import type { PositionItem } from "./PositionTable";

const schema = z.object({
  ps_name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อตำแหน่ง")
    .max(255, "ชื่อตำแหน่งต้องไม่เกิน 255 ตัวอักษร"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  position: PositionItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PositionEditDialog({
  position,
  onClose,
  onSuccess,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ps_name: "" },
  });

  useEffect(() => {
    reset({ ps_name: position?.ps_name ?? "" });
  }, [position, reset]);

  if (!position) return null;

  const onSubmit = async (values: FormValues) => {
    try {
      await api.put(`/auth/person/position/${position.ps_id}`, values);

      toast.success("แก้ไขตำแหน่งสำเร็จ");
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          const details = error.details as Record<string, string[]> | undefined;

          setError("ps_name", {
            type: "server",
            message: details?.ps_name?.[0] ?? "ชื่อตำแหน่งนี้มีอยู่ในระบบแล้ว",
          });
          return;
        }

        toast.error(error.message);
      } else {
        toast.error("ไม่สามารถแก้ไขตำแหน่งได้");
      }
    }
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="position-edit-title"
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Pencil size={21} />
            </div>
            <div>
              <h2
                id="position-edit-title"
                className="text-lg font-bold text-gray-900 dark:text-white"
              >
                แก้ไขตำแหน่ง
              </h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                รหัสตำแหน่ง #{position.ps_id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="ปิด"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="p-5 sm:p-6">
            <label
              htmlFor="edit-ps-name"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              ชื่อตำแหน่ง <span className="text-red-500">*</span>
            </label>

            <input
              id="edit-ps-name"
              {...register("ps_name")}
              maxLength={255}
              autoFocus
              aria-invalid={!!errors.ps_name}
              placeholder="กรอกชื่อตำแหน่ง"
              className={`min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-gray-800 transition outline-none focus:ring-4 focus:ring-blue-500/10 dark:bg-gray-950 dark:text-white ${
                errors.ps_name
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-blue-500 dark:border-gray-700"
              }`}
            />

            {errors.ps_name?.message && (
              <p role="alert" className="mt-2 text-xs text-red-500">
                {errors.ps_name.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 p-5 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-11 rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
