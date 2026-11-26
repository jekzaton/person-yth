"use client";

import { useState } from "react";

import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Eye,
  Pencil,
  Trash2,
  TriangleAlert,
  LoaderCircle,
  X,
  Hash,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  Users,
  Building2,
  BriefcaseBusiness,
} from "lucide-react";

import { toast } from "react-toastify";

import type {
  PersonItem,
  PersonPagination,
  PersonRoleFilter,
  PersonStatusFilter,
} from "@/types/personType";
import Image from "next/image";

interface PersonnelTableProps {
  personnel: PersonItem[];
  isLoading: boolean;

  search: string;
  status: PersonStatusFilter;
  role: PersonRoleFilter;

  page: number;
  pageSize: number;
  pagination: PersonPagination;

  onSearchChange: (value: string) => void;
  onStatusChange: (value: PersonStatusFilter) => void;
  onRoleChange: (value: PersonRoleFilter) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;

  onView: (person: PersonItem) => void;
  onEdit?: (person: PersonItem) => void;
  onDelete?: (person: PersonItem) => void | Promise<void>;

  canManage?: boolean;
}

const PAGE_SIZES = [10, 20, 50, 100];

// ======================================================
// ROLE STYLES
// ======================================================

const roleLabel: Record<PersonItem["ac_role"], string> = {
  admin: "ผู้ดูแลระบบ",
  member: "สมาชิก",
  user: "ผู้ใช้งาน",
};

const roleColor: Record<PersonItem["ac_role"], string> = {
  admin:
    "border-purple-200 bg-gradient-to-r from-purple-50 to-fuchsia-50 text-purple-700 dark:border-purple-500/20 dark:from-purple-500/10 dark:to-fuchsia-500/10 dark:text-purple-300",
  member:
    "border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 dark:border-blue-500/20 dark:from-blue-500/10 dark:to-cyan-500/10 dark:text-blue-300",
  user: "border-slate-200 bg-gradient-to-r from-slate-50 to-gray-100 text-slate-600 dark:border-slate-700 dark:from-slate-800 dark:to-gray-800 dark:text-slate-300",
};

function fullName(person: PersonItem): string {
  return (
    [person.ac_pname, person.ac_fname, person.ac_lname]
      .filter(Boolean)
      .join(" ") || "-"
  );
}

function englishName(person: PersonItem): string {
  return (
    [person.ac_pname_eng, person.ac_fname_eng, person.ac_lname_eng]
      .filter(Boolean)
      .join(" ") || "-"
  );
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function RoleBadge({ role }: { role: PersonItem["ac_role"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${roleColor[role]}`}
    >
      <ShieldCheck size={13} strokeWidth={2} />
      {roleLabel[role]}
    </span>
  );
}

function StatusBadge({ active }: { active: number }) {
  const enabled = active === 1;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${
        enabled
          ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 dark:border-emerald-500/20 dark:from-emerald-500/10 dark:to-teal-500/10 dark:text-emerald-300"
          : "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-orange-500/10 dark:text-amber-300"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          enabled ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
    </span>
  );
}

function PersonAvatar({ person }: { person: PersonItem }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const initial = person.ac_fname?.trim().charAt(0) || "";

  const rawImage = person.img_profile?.trim() || "";

  // รองรับ URL ที่มี /person-yth อยู่แล้ว
  const imageUrl = !rawImage
    ? ""
    : /^https?:\/\//i.test(rawImage)
      ? rawImage
      : rawImage.startsWith("/person-yth/")
        ? rawImage
        : `/person-yth/${rawImage.replace(/^\/+/, "")}`;

  const showImage = Boolean(imageUrl && failedUrl !== imageUrl);
  const isActive = person.ac_active === 1;

  return (
    <div className="group/avatar relative h-12 w-12 shrink-0">
      {/* กรอบ Gradient */}
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 p-[2px] shadow-md shadow-blue-500/20 transition-all duration-300 group-hover/avatar:scale-105 group-hover/avatar:shadow-lg group-hover/avatar:shadow-blue-500/25">
        {/* พื้นหลัง Avatar */}
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[14px] bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950 dark:via-gray-900 dark:to-indigo-950">
          {showImage ? (
            <Image
              key={imageUrl}
              src={imageUrl}
              alt={`รูปโปรไฟล์ ${person.ac_fname || ""} ${person.ac_lname || ""}`}
              fill
              sizes="48px"
              unoptimized
              className="object-cover transition-transform duration-300 group-hover/avatar:scale-110"
              onError={() => setFailedUrl(imageUrl)}
            />
          ) : (
            <span className="text-lg font-extrabold text-blue-700 select-none dark:text-blue-300">
              {initial || <UserRound size={23} />}
            </span>
          )}
        </div>
      </div>

      {/* จุดแสดงสถานะบัญชี */}
      <span
        title={isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
        aria-label={isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
        className={`absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full border-[3px] border-white shadow-sm dark:border-gray-900 ${
          isActive ? "bg-emerald-500" : "bg-amber-400"
        }`}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          {Array.from({ length: 6 }).map((_, col) => (
            <td key={col} className="px-5 py-5">
              <div className="h-8 animate-pulse rounded-lg bg-blue-100/60 dark:bg-gray-800" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function MobileSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-44 animate-pulse rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white dark:border-gray-800 dark:from-gray-800 dark:to-gray-900"
        />
      ))}
    </div>
  );
}

function PersonMobileCard({
  person,
  onView,
  onEdit,
  onRequestDelete,
  canManage,
}: {
  person: PersonItem;
  onView: (person: PersonItem) => void;
  onEdit?: (person: PersonItem) => void;
  onRequestDelete: (person: PersonItem) => void;
  canManage: boolean;
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/60 p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/20">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

      <div className="flex items-start gap-3">
        <PersonAvatar person={person} />

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed font-bold break-words text-gray-900 dark:text-white">
            {fullName(person)}
          </p>

          <p className="mt-1 text-xs break-words text-gray-500 dark:text-gray-400">
            {person.ac_username || englishName(person)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <RoleBadge role={person.ac_role} />
        <StatusBadge active={person.ac_active} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-blue-100/70 bg-white/70 p-3 text-xs dark:border-gray-700 dark:bg-gray-800/40">
        <div className="flex items-center gap-2">
          <Hash size={15} className="shrink-0 text-blue-500" />
          <span className="text-gray-500 dark:text-gray-400">HN:</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {display(person.ac_hn)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Phone size={15} className="shrink-0 text-blue-500" />
          <span className="break-all text-gray-700 dark:text-gray-300">
            {display(person.ac_phone_number)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Mail size={15} className="shrink-0 text-blue-500" />
          <span className="min-w-0 break-all text-gray-700 dark:text-gray-300">
            {display(person.ac_email)}
          </span>
        </div>
      </div>

      {/* Position and department: inside the per-person mobile card */}
      <div className="mt-3 grid gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-cyan-50/70 p-3 dark:border-indigo-500/20 dark:from-indigo-950/25 dark:to-cyan-950/20">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-300">
            <BriefcaseBusiness size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              ตำแหน่ง
            </p>
            <p className="text-sm font-semibold break-words text-gray-900 dark:text-gray-100">
              {getPositionName(person)}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-sm dark:bg-gray-800 dark:text-cyan-300">
            <Building2 size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              หน่วยงาน
            </p>
            <p className="text-sm font-semibold break-words text-gray-900 dark:text-gray-100">
              {getDepartmentName(person)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onView(person)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <Eye size={16} /> ดูข้อมูล
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(person)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:from-amber-100 hover:to-orange-100 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-orange-500/10 dark:text-amber-300"
          >
            <Pencil size={16} /> แก้ไข
          </button>
        )}
        {canManage && (
          <button
            type="button"
            onClick={() => onRequestDelete(person)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:from-rose-100 hover:to-red-100 dark:border-rose-500/20 dark:from-rose-500/10 dark:to-red-500/10 dark:text-rose-300"
          >
            <Trash2 size={16} /> ลบ
          </button>
        )}
      </div>
    </article>
  );
}

type PersonnelWithOrganization = PersonItem & {
  ps_name?: string | null;
  dep_name?: string | null;
};

function getPositionName(person: PersonItem): string {
  const item = person as PersonnelWithOrganization;

  return item.ps_name?.trim() || "ยังไม่ระบุตำแหน่ง";
}

function getDepartmentName(person: PersonItem): string {
  const item = person as PersonnelWithOrganization;

  return item.dep_name?.trim() || "ยังไม่ระบุหน่วยงาน";
}

export default function PersonnelTable({
  personnel,
  isLoading,
  search,
  status,
  role,
  page,
  pageSize,
  pagination,
  onSearchChange,
  onStatusChange,
  onRoleChange,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
  canManage = false,
}: PersonnelTableProps) {
  const [showFilters, setShowFilters] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<PersonItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // UI permission only. Server-side API must independently authorize edits/deletes.
  const canEdit = canManage && typeof onEdit === "function";
  const canDelete = canManage && typeof onDelete === "function";

  async function confirmDelete() {
    if (!deleteTarget || !canDelete || !onDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "ลบบุคลากรไม่สำเร็จ",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const totalPages = Math.max(1, pagination.totalPages);

  const currentPage = Math.min(Math.max(1, page), totalPages);

  const start = pagination.total > 0 ? (currentPage - 1) * pageSize + 1 : 0;

  const end =
    pagination.total > 0
      ? Math.min(currentPage * pageSize, pagination.total)
      : 0;

  const hasFilters = search.trim() !== "" || status !== "all" || role !== "all";

  const clearFilters = () => {
    onSearchChange("");
    onStatusChange("all");
    onRoleChange("all");
    onPageChange(1);
  };

  const selectClass =
    "w-full appearance-none rounded-xl border border-blue-100 bg-white py-3 pl-4 pr-10 text-sm font-medium text-gray-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:focus:ring-blue-500/10";

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg shadow-slate-900/5 dark:border-gray-800 dark:bg-gray-900">
      {/* ================================================
          TITLE HEADER
      ================================================= */}
      <div className="relative isolate overflow-hidden border-b border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50/70 to-cyan-50 px-5 py-5 sm:px-6 dark:border-blue-500/15 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-cyan-950/20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl"
        />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
              <Users size={23} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold text-gray-900 sm:text-lg dark:text-white">
                  ตารางรายชื่อบุคลากร
                </h2>

                <span className="inline-flex rounded-full border border-blue-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                  {pagination.total.toLocaleString("th-TH")} รายการ
                </span>
              </div>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                ค้นหา ตรวจสอบ และจัดการข้อมูลบุคลากร
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            aria-expanded={showFilters}
            aria-controls="personnel-filters"
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
              showFilters
                ? "border-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/15 dark:border-blue-500/30"
                : "border-gray-200 bg-white text-gray-700 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            }`}
          >
            <SlidersHorizontal size={17} />
            ตัวกรอง
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* ================================================
          FILTERS
      ================================================= */}
      {showFilters && (
        <div
          id="personnel-filters"
          className="border-b border-blue-100 bg-gradient-to-r from-slate-50 via-blue-50/40 to-indigo-50/40 px-5 py-5 sm:px-6 dark:border-gray-800 dark:from-gray-900 dark:via-blue-950/10 dark:to-indigo-950/10"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            {/* SEARCH */}
            <div className="w-full min-w-0 lg:flex-1">
              <label
                htmlFor="personnel-search"
                className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-300"
              >
                ค้นหาบุคลากร
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-blue-500"
                />

                <input
                  id="personnel-search"
                  type="search"
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="ชื่อบุคลากร, HN, เบอร์โทรศัพท์..."
                  className="min-h-11 w-full rounded-xl border border-blue-100 bg-white py-3 pr-10 pl-11 text-sm text-gray-800 shadow-sm transition outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-500/10"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    aria-label="ล้างคำค้นหา"
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition hover:text-blue-600"
                  >
                    <CircleX size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* FILTER CONTROLS */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">
              <div className="min-w-0">
                <label
                  htmlFor="personnel-status"
                  className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-300"
                >
                  สถานะบัญชี
                </label>

                <div className="relative">
                  <select
                    id="personnel-status"
                    value={status}
                    onChange={(event) =>
                      onStatusChange(event.target.value as PersonStatusFilter)
                    }
                    className={selectClass}
                  >
                    <option value="all">ทุกสถานะ</option>
                    <option value="active">เปิดใช้งาน</option>
                    <option value="inactive">ปิดใช้งาน</option>
                  </select>

                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="personnel-role"
                  className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-300"
                >
                  บทบาท
                </label>

                <div className="relative">
                  <select
                    id="personnel-role"
                    value={role}
                    onChange={(event) =>
                      onRoleChange(event.target.value as PersonRoleFilter)
                    }
                    className={selectClass}
                  >
                    <option value="all">ทุกบทบาท</option>
                    <option value="admin">ผู้ดูแลระบบ</option>
                    <option value="member">สมาชิก</option>
                    <option value="user">ผู้ใช้งาน</option>
                  </select>

                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
              >
                <CircleX size={16} />
                ล้างตัวกรอง
              </button>
            )}
          </div>

          {hasFilters && (
            <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-300">
              <Sparkles size={14} />
              กำลังแสดงข้อมูลตามเงื่อนไขที่เลือก
            </div>
          )}
        </div>
      )}

      {/* ====================================================
    DESKTOP PERSONNEL TABLE
==================================================== */}
      <div className="hidden overflow-x-auto md:block" aria-busy={isLoading}>
        <table className="w-full min-w-[1280px] table-auto text-left">
          {/* TABLE HEADER */}
          <thead>
            <tr className="border-b border-blue-200/70 bg-gradient-to-r from-blue-100 via-indigo-100 to-cyan-100 text-xs font-bold text-blue-900 dark:border-blue-500/20 dark:from-blue-950/60 dark:via-indigo-950/50 dark:to-cyan-950/30 dark:text-blue-200">
              <th scope="col" className="min-w-[255px] px-5 py-4">
                บุคลากร
              </th>

              <th scope="col" className="w-[110px] px-4 py-4">
                เลข HN
              </th>

              <th scope="col" className="min-w-[210px] px-4 py-4">
                ติดต่อ
              </th>

              <th scope="col" className="min-w-[230px] px-4 py-4">
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness size={16} />
                  ตำแหน่ง / หน่วยงาน
                </div>
              </th>

              <th scope="col" className="min-w-[155px] px-4 py-4">
                สิทธิ์ / สถานะ
              </th>

              <th scope="col" className="w-[160px] px-4 py-4 text-center">
                จัดการ
              </th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {isLoading ? (
              <TableSkeleton />
            ) : personnel.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
                </td>
              </tr>
            ) : (
              personnel.map((person, index) => (
                <tr
                  key={person.ac_id}
                  className={`group transition-all duration-200 hover:bg-blue-50/70 dark:hover:bg-blue-950/20 ${
                    index % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-slate-50/60 dark:bg-gray-900/80"
                  }`}
                >
                  <td className="min-w-[300px] px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      {/* AVATAR */}
                      <PersonAvatar person={person} />

                      <div className="min-w-0 flex-1">
                        {/* ชื่อบุคลากร */}
                        <p className="text-sm leading-relaxed font-extrabold break-words text-gray-900 dark:text-white">
                          {fullName(person)}
                        </p>

                        {/* USERNAME + ID */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                            {person.ac_username || "-"}
                          </span>

                          <span className="text-[11px] font-medium text-gray-400">
                            ID #{person.ac_id}
                          </span>
                        </div>

                        {/* POSITION TYPE */}
                        <div className="mt-2.5">
                          <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-indigo-200 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 shadow-sm dark:border-indigo-500/20 dark:from-indigo-500/10 dark:via-blue-500/10 dark:to-cyan-500/10 dark:text-indigo-300">
                            <BriefcaseBusiness
                              size={13}
                              className="shrink-0 text-indigo-500 dark:text-indigo-300"
                            />

                            <span className="min-w-0 break-words">
                              {person.ps_name_type?.trim() ||
                                "ยังไม่ระบุประเภทตำแหน่ง"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="font-mono inline-flex rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                      {display(person.ac_hn)}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                          <Phone size={14} />
                        </span>

                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {display(person.ac_phone_number)}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300">
                          <Mail size={14} />
                        </span>

                        <span className="min-w-0 pt-1 text-xs break-all text-gray-500 dark:text-gray-400">
                          {display(person.ac_email)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* ========================================
                POSITION / DEPARTMENT
            ======================================== */}
                  <td className="px-4 py-4">
                    <div className="max-w-[250px] space-y-2">
                      {/* POSITION */}
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-600 dark:from-indigo-500/10 dark:to-blue-500/10 dark:text-indigo-300">
                          <BriefcaseBusiness size={16} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-gray-400">
                            ตำแหน่ง
                          </p>

                          <p className="text-xs leading-relaxed font-bold break-words text-gray-800 dark:text-gray-200">
                            {getPositionName(person)}
                          </p>
                        </div>
                      </div>

                      {/* DEPARTMENT */}
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-teal-100 text-cyan-700 dark:from-cyan-500/10 dark:to-teal-500/10 dark:text-cyan-300">
                          <Building2 size={16} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-gray-400">
                            หน่วยงาน
                          </p>

                          <p className="text-xs leading-relaxed font-semibold break-words text-gray-700 dark:text-gray-300">
                            {getDepartmentName(person)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ========================================
                ROLE / STATUS IN ONE COLUMN
            ======================================== */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-2">
                      <RoleBadge role={person.ac_role} />

                      <StatusBadge active={person.ac_active} />
                    </div>
                  </td>

                  {/* ========================================
                ACTIONS
            ======================================== */}
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* VIEW */}
                      <button
                        type="button"
                        onClick={() => onView(person)}
                        aria-label={`ดูรายละเอียด ${fullName(person)}`}
                        title="ดูรายละเอียด"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-sm transition-all hover:-translate-y-0.5 hover:from-blue-600 hover:to-indigo-600 hover:text-white hover:shadow-md dark:border-blue-500/20 dark:from-blue-500/10 dark:to-indigo-500/10 dark:text-blue-300"
                      >
                        <Eye size={17} />
                      </button>

                      {/* EDIT */}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit?.(person)}
                          aria-label={`แก้ไข ${fullName(person)}`}
                          title="แก้ไขข้อมูลบุคลากร"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700 shadow-sm transition-all hover:-translate-y-0.5 hover:from-amber-500 hover:to-orange-500 hover:text-white hover:shadow-md dark:border-amber-500/20 dark:from-amber-500/10 dark:to-orange-500/10 dark:text-amber-300"
                        >
                          <Pencil size={17} />
                        </button>
                      )}

                      {/* DELETE */}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!isDeleting) {
                              setDeleteTarget(person);
                            }
                          }}
                          aria-label={`ลบ ${fullName(person)}`}
                          title="ลบบุคลากร"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-red-50 text-rose-700 shadow-sm transition-all hover:-translate-y-0.5 hover:from-rose-600 hover:to-red-600 hover:text-white hover:shadow-md dark:border-rose-500/20 dark:from-rose-500/10 dark:to-red-500/10 dark:text-rose-300"
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards. Each card receives its own person prop. */}
      <div className="md:hidden" aria-busy={isLoading}>
        {isLoading ? (
          <MobileSkeleton />
        ) : personnel.length === 0 ? (
          <div className="px-5 py-14">
            <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {personnel.map((person) => (
              <PersonMobileCard
                key={person.ac_id}
                person={person}
                onView={onView}
                onEdit={canEdit ? onEdit : undefined}
                onRequestDelete={(item) => {
                  if (!isDeleting) setDeleteTarget(item);
                }}
                canManage={canDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================================================
          PAGINATION
      ================================================= */}
      <div className="border-t border-blue-100 bg-gradient-to-r from-slate-50 via-blue-50/60 to-indigo-50/50 px-5 py-4 sm:px-6 dark:border-gray-800 dark:from-gray-900 dark:via-blue-950/15 dark:to-indigo-950/15">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              แสดง{" "}
              <strong className="font-bold text-blue-700 dark:text-blue-300">
                {start.toLocaleString("th-TH")}–{end.toLocaleString("th-TH")}
              </strong>{" "}
              จาก{" "}
              <strong className="font-bold text-blue-700 dark:text-blue-300">
                {pagination.total.toLocaleString("th-TH")}
              </strong>{" "}
              รายการ
            </span>

            <span
              aria-hidden="true"
              className="hidden h-5 w-px bg-gray-200 sm:block dark:bg-gray-700"
            />

            <div className="flex items-center gap-2">
              <label
                htmlFor="personnel-page-size"
                className="text-xs text-gray-500 dark:text-gray-400"
              >
                แสดงต่อหน้า
              </label>

              <select
                id="personnel-page-size"
                value={pageSize}
                onChange={(event) =>
                  onPageSizeChange(Number(event.target.value))
                }
                disabled={isLoading}
                className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm outline-none focus:border-blue-400 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-blue-300"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} รายการ
                  </option>
                ))}
              </select>
            </div>
          </div>

          <nav
            aria-label="แบ่งหน้ารายชื่อบุคลากร"
            className="flex items-center justify-center gap-2 sm:justify-end"
          >
            <button
              type="button"
              disabled={isLoading || currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="หน้าก่อนหน้า"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-blue-300"
            >
              <ChevronLeft size={19} />
            </button>

            <div className="flex min-w-24 items-center justify-center rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <span className="text-blue-600 dark:text-blue-400">
                {currentPage}
              </span>
              <span className="mx-2 text-gray-400">/</span>
              {totalPages}
            </div>

            <button
              type="button"
              disabled={isLoading || currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="หน้าถัดไป"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-blue-300"
            >
              <ChevronRight size={19} />
            </button>
          </nav>
        </div>
      </div>

      {/* DELETE CONFIRMATION: no database write happens in this component */}
      {deleteTarget && canDelete && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="personnel-delete-title"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-2xl dark:border-rose-500/20 dark:bg-gray-900"
          >
            <div className="bg-gradient-to-r from-slate-950 via-rose-950 to-red-900 p-6 text-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
                    <TriangleAlert size={24} />
                  </div>
                  <div>
                    <h3
                      id="personnel-delete-title"
                      className="text-lg font-extrabold"
                    >
                      ยืนยันการลบบุคลากร
                    </h3>
                    <p className="mt-1 text-xs text-rose-100">
                      โปรดตรวจสอบข้อมูลก่อนดำเนินการ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteTarget(null)}
                  aria-label="ปิดหน้าต่าง"
                  className="rounded-lg p-1 text-white/80 hover:bg-white/15 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-blue-50 p-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  บุคลากรที่เลือก
                </p>
                <p className="mt-1 text-base font-bold break-words text-gray-900 dark:text-white">
                  {fullName(deleteTarget)}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  HN: {display(deleteTarget.ac_hn)} · ID: {deleteTarget.ac_id}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-rose-700 dark:text-rose-300">
                การลบอาจกระทบข้อมูลที่เชื่อมโยงกับบัญชีบุคลากร
                โปรดตรวจสอบสิทธิ์และความสัมพันธ์ของข้อมูลก่อนยืนยัน
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 p-5 sm:flex-row sm:justify-end dark:border-gray-800 dark:bg-gray-950/30">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="min-h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void confirmDelete()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 text-sm font-bold text-white shadow-md shadow-rose-500/20 hover:brightness-110 disabled:opacity-50"
              >
                {isDeleting ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Trash2 size={17} />
                )}
                {isDeleting ? "กำลังลบ..." : "ยืนยันลบบุคลากร"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ======================================================
// EMPTY STATE
// ======================================================

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 via-indigo-100 to-cyan-100 text-blue-600 shadow-sm dark:from-blue-500/15 dark:via-indigo-500/15 dark:to-cyan-500/15 dark:text-blue-300">
        <Users size={28} />
      </div>

      <h3 className="mt-4 text-sm font-bold text-gray-800 dark:text-gray-200">
        ไม่พบข้อมูลบุคลากร
      </h3>

      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {hasFilters
          ? "ลองเปลี่ยนคำค้นหาหรือเงื่อนไขตัวกรอง"
          : "ยังไม่มีข้อมูลบุคลากรในระบบ"}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
        >
          <CircleX size={16} />
          ล้างตัวกรองทั้งหมด
        </button>
      )}

      <div className="mt-5 flex items-center gap-2 text-xs text-gray-400">
        <BadgeCheck size={14} />
        Personnel Management System
      </div>
    </div>
  );
}
