"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { api, ApiError } from "@/lib/api";
import type { PositionItem } from "@/types/positionType";

import PositionHeader from "./PositionHeader";
import PositionTable from "./PositionTable";
import PositionEditDialog from "./PositionEditDialog";
import PositionDeleteDialog from "./PositionDeleteDialog";
import PositionCreateDialog from "./PositionCreateDialog";

export default function PositionList() {
  const [positions, setPositions] = useState<PositionItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filteredCount, setFilteredCount] = useState(0);

  const [editingPosition, setEditingPosition] = useState<PositionItem | null>(
    null,
  );

  const [deletingPosition, setDeletingPosition] = useState<PositionItem | null>(
    null,
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // ====================================================
  // FETCH POSITIONS
  // ====================================================

  const fetchPositions = useCallback(async () => {
    // ยกเลิก Request ก่อนหน้า
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.get<PositionItem[]>("/auth/person/position", {
        signal: controller.signal,
        cache: "no-store",
      });

      if (controller.signal.aborted) return;

      if (!Array.isArray(result.data)) {
        throw new Error("รูปแบบข้อมูลตำแหน่งไม่ถูกต้อง");
      }

      setPositions(result.data);
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
            setError("คุณไม่มีสิทธิ์เข้าถึงข้อมูลตำแหน่งบุคลากร");
            break;

          default:
            setError(err.message);
        }
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการโหลดข้อมูลตำแหน่ง",
        );
      }
    } finally {
      // Request เก่าห้ามปิด Loading ของ Request ใหม่
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;

        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }
  }, []);

  // ====================================================
  // INITIAL FETCH + CLEANUP
  // ====================================================

  useEffect(() => {
    void fetchPositions();

    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, [fetchPositions]);

  // ====================================================
  // CALLBACKS
  // ====================================================

  const handleFilteredCountChange = useCallback((count: number) => {
    setFilteredCount(count);
  }, []);

  const handleEdit = useCallback((position: PositionItem) => {
    setEditingPosition(position);
  }, []);

  const handleDelete = useCallback((position: PositionItem) => {
    setDeletingPosition(position);
  }, []);

  const handleSuccess = useCallback(() => {
    void fetchPositions();
  }, [fetchPositions]);

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="space-y-6 pb-8">
      {/* HEADER + STATS */}

      <PositionHeader
        totalPositions={positions.length}
        filteredPositions={filteredCount}
        isLoading={isLoading}
        hasError={!!error}
        onRefresh={() => void fetchPositions()}
        onAdd={() => setIsCreateOpen(true)}
      />

      {/* POSITION TABLE */}

      <PositionTable
        positions={positions}
        isLoading={isLoading}
        error={error}
        onRefresh={() => void fetchPositions()}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onFilteredCountChange={handleFilteredCountChange}
      />

      {/* EDIT MODAL */}

      {editingPosition && (
        <PositionEditDialog
          position={editingPosition}
          onClose={() => setEditingPosition(null)}
          onSuccess={handleSuccess}
        />
      )}

      {/* DELETE MODAL */}

      {deletingPosition && (
        <PositionDeleteDialog
          position={deletingPosition}
          onClose={() => setDeletingPosition(null)}
          onSuccess={handleSuccess}
        />
      )}
      {isCreateOpen && (
        <PositionCreateDialog
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => void fetchPositions()}
        />
      )}
    </div>
  );
}
