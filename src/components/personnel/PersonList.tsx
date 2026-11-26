"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AtSign,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Fingerprint,
  Hash,
  IdCard,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import { toast } from "react-toastify";

import { api, ApiError, BASE_PATH } from "@/lib/api";

import type {
  PersonItem,
  PersonListResponse,
  PersonPagination,
  PersonStats,
  PersonRoleFilter,
  PersonStatusFilter,
} from "@/types/personType";

import {
  DEFAULT_PERSON_PAGINATION,
  DEFAULT_PERSON_STATS,
} from "@/types/personType";

import PersonnelHeader from "./PersonnelHeader";
import PersonnelTable from "./PersonnelTable";
import { Modal } from "../ui/modal";
import {
  dateTextMysqlThai,
  formatCid,
  formatDate,
  formatPhone,
} from "@/utils/formatter";
import { useLocale } from "next-intl";
import { getProfileImageUrl } from "@/utils/getProfile";

interface PersonListProps {
  canManage?: boolean;
}

const roleLabel: Record<PersonItem["ac_role"], string> = {
  admin: "ผู้ดูแลระบบ",
  member: "สมาชิก",
  user: "ผู้ใช้งาน",
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

function StatusBadge({ active }: { active: number }) {
  const enabled = active === 1;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
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

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 border-b border-gray-100 py-3 last:border-0 sm:grid-cols-[160px_1fr] dark:border-gray-800">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </span>

      <div className="min-w-0 text-sm font-semibold break-words text-gray-800 dark:text-gray-200">
        {value}
      </div>
    </div>
  );
}

export default function PersonList({ canManage = false }: PersonListProps) {
  const router = useRouter();

  // ----------------------------------------------------
  // PERSONNEL
  // ----------------------------------------------------

  const [personnel, setPersonnel] = useState<PersonItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // ----------------------------------------------------
  // SEARCH & FILTERS
  // ----------------------------------------------------

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState<PersonStatusFilter>("all");

  const [role, setRole] = useState<PersonRoleFilter>("all");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [pagination, setPagination] = useState<PersonPagination>(
    DEFAULT_PERSON_PAGINATION,
  );

  const [stats, setStats] = useState<PersonStats>(DEFAULT_PERSON_STATS);

  const [selected, setSelected] = useState<PersonItem | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const refreshPersonnel = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const onStatusChange = useCallback((value: PersonStatusFilter) => {
    setStatus(value);
    setPage(1);
  }, []);

  const onRoleChange = useCallback((value: PersonRoleFilter) => {
    setRole(value);
    setPage(1);
  }, []);

  // ====================================================
  // PAGINATION HANDLERS
  // ====================================================

  const onPageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const onPageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  const handleView = useCallback((person: PersonItem) => {
    setSelected(person);
  }, []);

  const locale = useLocale();

  const handleEdit = useCallback(
    (person: PersonItem) => {
      if (!canManage) return;

      setSelected(null);

      router.push(`/${locale}/personnel/edit/${person.ac_id}`);
    },
    [router, canManage, locale],
  );

  const handleDelete = useCallback(
    async (person: PersonItem) => {
      if (!canManage) {
        throw new Error("คุณไม่มีสิทธิ์ลบข้อมูลบุคลากร");
      }

      try {
        // ต้องมี DELETE API นี้อยู่จริง
        // และตรวจสิทธิ์ Admin ฝั่ง Server
        await api.delete(`/auth/person/${person.ac_id}`);

        toast.success(`ลบบุคลากร ${fullName(person)} สำเร็จ`);

        setSelected(null);

        // โหลดข้อมูลใหม่
        refreshPersonnel();
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 401) {
            throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
          }

          if (error.status === 403) {
            throw new Error("คุณไม่มีสิทธิ์ลบข้อมูลบุคลากร");
          }

          throw new Error(error.message);
        }

        throw new Error(
          error instanceof Error
            ? error.message
            : "ไม่สามารถลบข้อมูลบุคลากรได้",
        );
      }
    },
    [canManage, refreshPersonnel],
  );

  // ====================================================
  // DEBOUNCE SEARCH
  // ====================================================

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  // ====================================================
  // FETCH PERSONNEL
  // ====================================================

  useEffect(() => {
    let cancelled = false;

    async function fetchPersonnel() {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
          search: debouncedSearch,
          status,
          role,
        });

        const response = await api.get<PersonItem[]>(
          `/auth/person?${params.toString()}`,
        );
        const result = response as typeof response &
          Pick<PersonListResponse, "pagination" | "stats">;

        if (cancelled) return;

        setPersonnel(result.data ?? []);

        setPagination(result.pagination ?? DEFAULT_PERSON_PAGINATION);

        setStats(result.stats ?? DEFAULT_PERSON_STATS);
      } catch (error) {
        if (cancelled) return;

        console.error("FETCH PERSONNEL ERROR:", error);

        setPersonnel([]);
        setPagination(DEFAULT_PERSON_PAGINATION);
        setStats(DEFAULT_PERSON_STATS);

        if (error instanceof ApiError) {
          if (error.status === 401) {
            toast.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");

            window.location.replace(`${BASE_PATH}/`);

            return;
          }

          toast.error(error.message);
        } else {
          toast.error("ไม่สามารถโหลดข้อมูลบุคลากรได้");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchPersonnel();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, debouncedSearch, status, role, refreshKey]);

  useEffect(() => {
    if (!selected) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selected]);

  return (
    <div className="space-y-6">
      <PersonnelHeader
        isLoading={isLoading}
        stats={stats}
        onRefresh={refreshPersonnel}
        onAddUser={() => router.push("/personnel/create")}
      />

      <PersonnelTable
        personnel={personnel}
        isLoading={isLoading}
        search={search}
        status={status}
        role={role}
        page={page}
        pageSize={pageSize}
        pagination={pagination}
        onSearchChange={onSearchChange}
        onStatusChange={onStatusChange}
        onRoleChange={onRoleChange}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canManage={canManage}
      />

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        showCloseButton={false}
        className="mx-3 w-full max-w-[820px] overflow-hidden rounded-[28px] border border-gray-200 bg-white p-0 shadow-2xl sm:mx-4 dark:border-gray-700 dark:bg-gray-900"
      >
        {selected && (
          <div className="flex max-h-[92dvh] flex-col overflow-hidden">
            {/* ================= HEADER ================= */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#071A3A] via-[#17449A] to-[#5041B7] px-5 py-5 text-white sm:px-7 sm:py-6">
              <div className="pointer-events-none absolute -top-16 -right-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />

              <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg">
                    <UserRound size={25} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold tracking-tight sm:text-xl">
                      รายละเอียดบุคลากร
                    </h2>
                    <p className="mt-1 text-xs text-blue-100">
                      Personnel Profile • ID #{selected.ac_id}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="ปิดหน้าต่าง"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 transition hover:bg-white/20"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* ================= BODY ================= */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain bg-slate-50/80 p-4 sm:p-6 dark:bg-gray-950/50">
              {/* =============== PROFILE CARD =============== */}
              <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm dark:border-blue-500/20 dark:bg-gray-900">
                <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400" />

                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                    {getProfileImageUrl(selected.img_profile) ? (
                      <img
                        key={selected.img_profile}
                        src={getProfileImageUrl(selected.img_profile)!}
                        alt={`รูปโปรไฟล์ ${fullName(selected)}`}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          // รูปโหลดไม่ได้ -> แสดงไอคอนแทน
                          event.currentTarget.style.display = "none";
                          const fallback =
                            event.currentTarget.nextElementSibling;
                          fallback?.classList.remove("hidden");
                        }}
                      />
                    ) : null}

                    <UserRound
                      size={36}
                      className={
                        getProfileImageUrl(selected.img_profile)
                          ? "hidden shrink-0"
                          : "shrink-0"
                      }
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-extrabold break-words text-gray-900 dark:text-white">
                      {fullName(selected)}
                    </h3>

                    <p className="mt-1 text-sm break-words text-gray-500 dark:text-gray-400">
                      {englishName(selected)}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge active={selected.ac_active} />

                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                        <AtSign size={12} />
                        {selected.ac_username || "-"}
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        <Hash size={12} />
                        {selected.ac_id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* POSITION SUMMARY */}
                <div className="grid gap-3 border-t border-blue-100 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 p-4 sm:grid-cols-2 sm:p-5 dark:border-blue-500/10 dark:from-indigo-500/10 dark:via-blue-500/5 dark:to-cyan-500/10">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <BriefcaseBusiness size={15} />
                      ประเภทตำแหน่ง
                    </div>
                    <p className="mt-1 text-sm font-bold break-words text-indigo-700 dark:text-indigo-300">
                      {selected.ps_name_type?.trim() ||
                        "ยังไม่ระบุประเภทตำแหน่ง"}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <Building2 size={15} />
                      หน่วยงาน
                    </div>
                    <p className="mt-1 text-sm font-bold break-words text-blue-700 dark:text-blue-300">
                      {selected.dep_name?.trim() || "ยังไม่ระบุหน่วยงาน"}
                    </p>
                  </div>
                </div>
              </div>

              {/* =============== PERSONAL DATA =============== */}
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                    <IdCard size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                      ข้อมูลประจำตัว
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Personal Information
                    </p>
                  </div>
                </div>

                <div className="px-5 py-2 sm:px-6">
                  <DetailRow
                    label="รหัสบุคลากร / ชื่อเล่น"
                    value={
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* รหัสบุคลากร */}
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-500/20 dark:from-blue-500/10 dark:to-cyan-500/10 dark:text-blue-300">
                          <IdCard size={14} className="shrink-0" />
                          ID #{selected.ac_id}
                        </span>

                        {/* ชื่อเล่น */}
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-3 py-1.5 text-xs font-bold text-violet-700 dark:border-violet-500/20 dark:from-violet-500/10 dark:to-fuchsia-500/10 dark:text-violet-300">
                          <UserRound size={14} className="shrink-0" />
                          ชื่อเล่น: {selected.ac_nickname?.trim() || "ไม่ระบุ"}
                        </span>
                      </div>
                    }
                  />

                  <DetailRow
                    label="เลขบัตรประชาชน / HN"
                    value={
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* เลขบัตรประชาชน */}
                        <span className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm dark:border-blue-500/20 dark:from-blue-500/10 dark:to-cyan-500/10 dark:text-blue-300">
                          <IdCard size={15} className="shrink-0" />

                          <span className="font-mono tracking-wide">
                            {formatCid(selected.ac_cid)}
                          </span>
                        </span>

                        {/* เลข HN */}
                        <span className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm dark:border-violet-500/20 dark:from-violet-500/10 dark:to-indigo-500/10 dark:text-violet-300">
                          <span className="font-extrabold">HN</span>

                          <span className="font-mono tracking-wide">
                            {display(selected.ac_hn)}
                          </span>
                        </span>
                      </div>
                    }
                  />

                  <DetailRow
                    label="ชื่อ-นามสกุล (ไทย)"
                    value={fullName(selected)}
                  />

                  <DetailRow
                    label="ชื่อ-นามสกุล (อังกฤษ)"
                    value={englishName(selected)}
                  />
                  <DetailRow
                    label="วันเดือนปีเกิด"
                    value={formatDate(selected.ac_birthday)}
                  />
                </div>
              </section>

              {/* =============== CONTACT DATA =============== */}
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                      ข้อมูลติดต่อ
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Contact Information
                    </p>
                  </div>
                </div>

                <div className="px-5 py-2 sm:px-6">
                  <DetailRow
                    label="หมายเลขโทรศัพท์"
                    value={formatPhone(selected.ac_phone_number)}
                  />

                  <DetailRow label="อีเมล" value={display(selected.ac_email)} />
                </div>
              </section>

              {/* =============== WORK DATA =============== */}
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <BriefcaseBusiness size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                      ข้อมูลการทำงาน
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Employment Information
                    </p>
                  </div>
                </div>

                <div className="px-5 py-2 sm:px-6">
                  <DetailRow
                    label="รหัสหน่วยงาน/หน่วยงาน"
                    value={
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                          {selected.dep_id ?? "-"}
                        </span>

                        <span className="text-gray-400">:</span>

                        <span className="font-semibold text-gray-900 dark:text-white">
                          {selected.dep_name?.trim() || "ยังไม่ระบุหน่วยงาน"}
                        </span>
                      </div>
                    }
                  />
                  <DetailRow
                    label="รหัสตำแหน่ง/ตำแหน่ง"
                    value={
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                          {selected.ps_id ?? "-"}
                        </span>

                        <span className="text-gray-400">:</span>

                        <span className="font-semibold text-gray-900 dark:text-white">
                          {selected.ps_name?.trim() || "ยังไม่ระบุตำแหน่ง"}
                        </span>
                      </div>
                    }
                  />

                  <DetailRow
                    label="ประเภทตำแหน่ง"
                    value={display(selected.ps_name_type)}
                  />
                </div>
              </section>

              {/* =============== ACCOUNT DATA =============== */}
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                      สิทธิ์และสถานะบัญชี
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Account & Permissions
                    </p>
                  </div>
                </div>

                <div className="px-5 py-2 sm:px-6">
                  <DetailRow
                    label="บทบาทผู้ใช้งาน"
                    value={roleLabel[selected.ac_role]}
                  />

                  <DetailRow label="ระดับสิทธิ์" value={selected.level} />

                  <DetailRow
                    label="สถานะบัญชี"
                    value={
                      selected.ac_active === 1 ? "เปิดใช้งาน" : "ปิดใช้งาน"
                    }
                  />
                </div>
              </section>

              {/* =============== SYSTEM DATA =============== */}
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                      ประวัติข้อมูลระบบ
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      System Information
                    </p>
                  </div>
                </div>

                <div className="px-5 py-2 sm:px-6">
                  <DetailRow
                    label="วันที่สร้างบัญชี"
                    value={`${selected.createdAt ? dateTextMysqlThai(selected.createdAt) : "-"} น.`}
                  />

                  <DetailRow
                    label="แก้ไขล่าสุด"
                    value={`${selected.updatedAt ? dateTextMysqlThai(selected.updatedAt) : "-"} น.`}
                  />
                </div>
              </section>
            </div>

            {/* ================= FOOTER ================= */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="hidden items-center gap-2 text-xs text-gray-400 sm:flex">
                <Fingerprint size={15} />
                Personnel ID: {selected.ac_id}
              </div>

              <div className="flex w-full items-center justify-end gap-2.5 sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  ปิดหน้าต่าง
                </button>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      const person = selected;
                      setSelected(null);
                      handleEdit(person);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:brightness-110"
                  >
                    <Pencil size={16} />
                    แก้ไขข้อมูล
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
