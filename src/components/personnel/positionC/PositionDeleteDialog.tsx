"use client";

import { useState } from "react";
import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";

import { api, ApiError } from "@/lib/api";
import type { PositionItem } from "./PositionTable";

interface Props {
  position: PositionItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PositionDeleteDialog({
  position,
  onClose,
  onSuccess,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!position) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await api.delete(`/auth/person/position/${position.ps_id}`);

      toast.success("ลบตำแหน่งสำเร็จ");
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("ไม่สามารถลบตำแหน่งได้");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="position-delete-title"
        aria-describedby="position-delete-description"
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="flex justify-between p-5">
          <div className="rounded-2xl bg-red-50 p-3 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <AlertTriangle size={26} />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="ปิด"
            className="self-start rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-5">
          <h2
            id="position-delete-title"
            className="text-lg font-bold text-gray-900 dark:text-white"
          >
            ยืนยันการลบตำแหน่ง
          </h2>

          <p
            id="position-delete-description"
            className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400"
          >
            คุณต้องการลบตำแหน่งนี้ใช่หรือไม่? การลบข้อมูลนี้ไม่สามารถย้อนกลับได้
          </p>

          <div className="mt-4 rounded-xl border border-red-100 bg-red-50/60 p-4 dark:border-red-500/20 dark:bg-red-500/5">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {position.ps_name}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              รหัสตำแหน่ง: {position.ps_id}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
            >
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 p-5 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="min-h-11 rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {isDeleting ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Trash2 size={17} />
            )}
            ยืนยันลบ
          </button>
        </div>
      </div>
    </div>
  );
}
