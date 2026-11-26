"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Building2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { api, ApiError } from "@/lib/api";
import type { DepartmentItem } from "@/types/departmentType";

import DepartmentHeader from "./DepartmentHeader";
import DepartmentTable from "./DepartmentTable";
import DepartmentEditDialog from "./DepartmentDialog";
import DepartmentDeleteDialog from "./DepartmentDeleteDialog";
import DepartmentCreateDialog from "./DepartmentCreateDialog";
import DepartmentDialog from "./DepartmentDialog";

export default function DepartmentList() {
  // ====================================================
  // STATE
  // ====================================================

  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filteredCount, setFilteredCount] = useState(0);

  const [editingDepartment, setEditingDepartment] =
    useState<DepartmentItem | null>(null);

  const [deletingDepartment, setDeletingDepartment] =
    useState<DepartmentItem | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const hasLoadedRef = useRef(false);

  // ====================================================
  // FETCH DEPARTMENTS
  // ====================================================

  const fetchDepartments = useCallback(async () => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!hasLoadedRef.current) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError(null);

    try {
      const response = await api.get<DepartmentItem[]>(
        "/auth/person/department",
        {
          signal: controller.signal,
          cache: "no-store",
        },
      );

      if (controller.signal.aborted) return;

      if (!Array.isArray(response.data)) {
        throw new Error("รูปแบบข้อมูลแผนกไม่ถูกต้อง");
      }

      setDepartments(response.data);
      hasLoadedRef.current = true;
    } catch (err) {
      if (
        controller.signal.aborted ||
        (err instanceof Error && err.name === "AbortError")
      ) {
        return;
      }

      if (err instanceof ApiError) {
        switch (err.status) {
          case 401:
            setError("กรุณาเข้าสู่ระบบก่อนใช้งาน");
            break;

          case 403:
            setError("คุณไม่มีสิทธิ์เข้าถึงข้อมูลแผนก");
            break;

          case 404:
            setError("ไม่พบ API สำหรับจัดการข้อมูลแผนก");
            break;

          case 500:
            setError("เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่อีกครั้ง");
            break;

          default:
            setError(err.message || "ไม่สามารถโหลดข้อมูลแผนกได้");
        }
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการโหลดข้อมูลแผนก",
        );
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;

        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }
  }, []);

  // ====================================================
  // INITIAL FETCH / CLEANUP
  // ====================================================

  useEffect(() => {
    void fetchDepartments();

    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, [fetchDepartments]);

  // ====================================================
  // CALLBACKS
  // ====================================================

  const handleFilteredCountChange = useCallback((count: number) => {
    setFilteredCount(count);
  }, []);

  const handleEdit = useCallback((department: DepartmentItem) => {
    setEditingDepartment(department);
  }, []);

  const handleDelete = useCallback((department: DepartmentItem) => {
    setDeletingDepartment(department);
  }, []);

  const handleSuccess = useCallback(() => {
    void fetchDepartments();
  }, [fetchDepartments]);

  const handleRefresh = useCallback(() => {
    void fetchDepartments();
  }, [fetchDepartments]);

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
      {/* HEADER / STATISTICS / ADD BUTTON */}
      <DepartmentHeader
        totalDepartments={departments.length}
        filteredDepartments={filteredCount}
        isLoading={isLoading}
        hasError={!!error}
        onRefresh={() => void fetchDepartments()}
        onAdd={() => setIsCreateOpen(true)}
      />

      {/* REFRESH INDICATOR */}
      {isRefreshing && !isLoading && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
        >
          <RefreshCw className="h-4 w-4 animate-spin" />
          กำลังอัปเดตข้อมูลแผนกล่าสุด...
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div
          role="alert"
          className="overflow-hidden rounded-2xl border border-red-200 bg-red-50/80 dark:border-red-500/20 dark:bg-red-500/10"
        >
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                  ไม่สามารถโหลดข้อมูลได้
                </p>

                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-gray-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      )}

      {/* DEPARTMENT TABLE */}
      <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm shadow-gray-200/40 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
        <DepartmentTable
          departments={departments}
          isLoading={isLoading}
          error={error}
          onRefresh={() => void fetchDepartments()}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onFilteredCountChange={handleFilteredCountChange}
        />
      </div>

      {/* FOOTER */}
      <div className="flex flex-col items-start justify-between gap-2 border-t border-gray-100 pt-4 text-xs text-gray-400 sm:flex-row sm:items-center dark:border-gray-800">
        <span>ระบบจัดการข้อมูลแผนก · โรงพยาบาลยางตลาด</span>

        <span>Department Management</span>
      </div>

      {/* CREATE DIALOG */}
      {isCreateOpen && (
        <DepartmentCreateDialog
          onClose={() => setIsCreateOpen(false)}
          onSuccess={handleSuccess}
        />
      )}

      {/* EDIT DIALOG */}
      {editingDepartment && (
        <DepartmentDialog
          department={editingDepartment}
          onClose={() => setEditingDepartment(null)}
          onSuccess={handleSuccess}
        />
      )}

      {/* DELETE DIALOG */}
      {deletingDepartment && (
        <DepartmentDeleteDialog
          department={deletingDepartment}
          onClose={() => setDeletingDepartment(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
