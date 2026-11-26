"use client";

import { useRef, useState, type ChangeEvent } from "react";

import {
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRoundPlus,
  Users,
  UsersRound,
  X,
} from "lucide-react";

import { toast } from "react-toastify";

import { BASE_PATH } from "@/lib/api";
import type { PersonStats } from "@/types/personType";

// ======================================================
// TYPES
// ======================================================

interface PersonnelHeaderProps {
  isLoading?: boolean;
  stats: PersonStats;
  onRefresh: () => void;
  onAddUser: () => void;
}

type StatVariant = "blue" | "emerald" | "amber";

interface StatCardProps {
  title: string;
  subtitle: string;
  value: number;
  icon: typeof Users;
  variant: StatVariant;
  isLoading: boolean;
}

interface ImportResponse {
  success: boolean;
  message?: string;
  data?: {
    total: number;
    imported: number;
    skipped: number;
    invalid: number;
    duplicateInFile: number;
    duplicateInDatabase: number;
    errors: {
      row: number;
      field: string;
      message: string;
    }[];
    errorsTruncated: boolean;
  };
  errors?: string[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const EXCEL_API = `${BASE_PATH}/api/auth/person/excel`;

// ======================================================
// STYLES
// ======================================================

const statStyles = {
  blue: {
    background:
      "from-blue-50 via-white to-indigo-50/80 dark:from-blue-950/40 dark:via-gray-900 dark:to-indigo-950/30",
    icon: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
    number: "text-blue-700 dark:text-blue-300",
    accent: "from-blue-500 via-indigo-500 to-cyan-400",
  },
  emerald: {
    background:
      "from-emerald-50 via-white to-teal-50/80 dark:from-emerald-950/30 dark:via-gray-900 dark:to-teal-950/20",
    icon: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
    number: "text-emerald-700 dark:text-emerald-300",
    accent: "from-emerald-500 via-teal-500 to-cyan-400",
  },
  amber: {
    background:
      "from-amber-50 via-white to-orange-50/80 dark:from-amber-950/30 dark:via-gray-900 dark:to-orange-950/20",
    icon: "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
    number: "text-amber-700 dark:text-amber-300",
    accent: "from-amber-500 via-orange-500 to-yellow-400",
  },
} satisfies Record<
  StatVariant,
  {
    background: string;
    icon: string;
    number: string;
    accent: string;
  }
>;

function StatCard({
  title,
  subtitle,
  value,
  icon: Icon,
  variant,
  isLoading,
}: StatCardProps) {
  const styles = statStyles[variant];

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br ${styles.background} p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-6 dark:border-gray-800`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${styles.accent}`}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
            {title}
          </p>

          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>

          {isLoading ? (
            <div className="mt-5 h-10 w-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
          ) : (
            <div className="mt-4 flex items-end gap-2">
              <span
                className={`text-3xl font-extrabold tabular-nums sm:text-4xl ${styles.number}`}
              >
                {value.toLocaleString("th-TH")}
              </span>

              <span className="pb-1 text-xs text-gray-400">คน</span>
            </div>
          )}
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-blue-950/10 ${styles.icon}`}
        >
          <Icon size={24} />
        </div>
      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-gray-200/60 dark:bg-gray-800">
        <div className={`h-full w-full bg-gradient-to-r ${styles.accent}`} />
      </div>
    </article>
  );
}

export default function PersonnelHeader({
  isLoading = false,
  stats,
  onRefresh,
  onAddUser,
}: PersonnelHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workingRef = useRef(false);

  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importCompleted, setImportCompleted] = useState(false);

  const isBusy = isExporting || isDownloadingTemplate || isImporting;

  // ====================================================
  // DOWNLOAD EXCEL
  // ====================================================

  async function handleDownload(mode: "export" | "template") {
    if (workingRef.current) return;

    workingRef.current = true;

    const setLoading =
      mode === "export" ? setIsExporting : setIsDownloadingTemplate;

    setLoading(true);

    try {
      const response = await fetch(`${EXCEL_API}?mode=${mode}`, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
        }

        if (response.status === 403) {
          throw new Error("คุณไม่มีสิทธิ์ดาวน์โหลดข้อมูลบุคลากร");
        }

        throw new Error(
          mode === "template"
            ? "ไม่สามารถดาวน์โหลดไฟล์ตัวอย่างได้ กรุณาตรวจสอบ API"
            : "ไม่สามารถส่งออก Excel ได้",
        );
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("ไฟล์ Excel ไม่มีข้อมูล");
      }

      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");

      const today = new Date()
        .toLocaleDateString("en-CA", {
          timeZone: "Asia/Bangkok",
        })
        .replace(/\//g, "-");

      link.href = downloadUrl;

      link.download =
        mode === "template"
          ? "personnel-import-template.xlsx"
          : `personnel-${today}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 1000);

      toast.success(
        mode === "template"
          ? "ดาวน์โหลดไฟล์ตัวอย่างสำเร็จ"
          : "ส่งออก Excel สำเร็จ",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดาวน์โหลด",
      );
    } finally {
      workingRef.current = false;
      setLoading(false);
    }
  }

  // ====================================================
  // SELECT EXCEL FILE
  // ====================================================

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("รองรับเฉพาะไฟล์ .xlsx");
      return;
    }

    if (file.size === 0) {
      toast.error("ไฟล์ Excel ต้องไม่เป็นไฟล์ว่าง");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("ไฟล์ Excel ต้องมีขนาดไม่เกิน 10 MB");
      return;
    }

    setImportError(null);
    setSelectedFile(file);
    setImportCompleted(false);
  }

  async function handleImport() {
    if (!selectedFile || workingRef.current) return;

    workingRef.current = true;
    setIsImporting(true);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${EXCEL_API}/import`, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });

      let result: ImportResponse;

      try {
        result = (await response.json()) as ImportResponse;
      } catch {
        throw new Error("ไม่สามารถอ่านผลการนำเข้าจาก API ได้");
      }

      if (!response.ok || !result.success) {
        const details = result.errors?.slice(0, 5).join("\n");

        throw new Error(details || result.message || "นำเข้า Excel ไม่สำเร็จ");
      }

      const summary = result.data;

      if (!summary) {
        throw new Error("ไม่พบข้อมูลสรุปผลการนำเข้า");
      }

      // -----------------------------------------
      // SHOW SUMMARY
      // -----------------------------------------

      const imported = summary.imported ?? 0;
      const skipped = summary.skipped ?? 0;
      const invalid = summary.invalid ?? 0;

      if (imported > 0) {
        toast.success(
          `นำเข้าใหม่ ${imported.toLocaleString("th-TH")} คนสำเร็จ`,
          { autoClose: 6000 },
        );

        onRefresh();
      }

      if (skipped > 0) {
        toast.info(
          `ข้ามข้อมูลซ้ำ ${skipped.toLocaleString("th-TH")} คน โดยไม่ได้แก้ไขข้อมูลเดิม`,
          { autoClose: 6000 },
        );
      }

      // -----------------------------------------
      // INVALID ROWS
      // -----------------------------------------

      if (invalid > 0) {
        const lines = (summary.errors ?? [])
          .slice(0, 20)
          .map((item) => `แถวที่ ${item.row}: ${item.field} - ${item.message}`);

        const message = [
          `นำเข้าข้อมูลเสร็จสิ้น`,
          `ตรวจสอบทั้งหมด ${summary.total.toLocaleString("th-TH")} รายการ`,
          `เพิ่มใหม่ ${imported.toLocaleString("th-TH")} รายการ`,
          `ข้ามซ้ำ ${skipped.toLocaleString("th-TH")} รายการ`,
          `ข้อมูลผิด ${invalid.toLocaleString("th-TH")} รายการ`,
          "",
          "รายการที่ต้องตรวจสอบ:",
          ...lines,
          ...(summary.errorsTruncated
            ? ["ยังมีรายการที่ผิดพลาดเพิ่มเติม"]
            : []),
        ].join("\n");

        setImportError(message);

        toast.warning(
          `พบข้อมูลไม่ถูกต้อง ${invalid.toLocaleString("th-TH")} รายการ กรุณาตรวจสอบรายละเอียด`,
          { autoClose: 8000 },
        );

        // Keep modal open for reviewing errors.
        return;
      }

      // No invalid rows -> close modal.
      setImportError(null);
      setSelectedFile(null);
      setImportCompleted(true);

      if (imported === 0 && skipped === 0) {
        toast.info("ไม่พบข้อมูลสำหรับนำเข้า");
      }
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดระหว่างนำเข้า Excel",
      );

      toast.error("นำเข้า Excel ไม่สำเร็จ");
    } finally {
      workingRef.current = false;
      setIsImporting(false);
    }
  }

  // ====================================================
  // STATISTICS
  // ====================================================

  const statistics: {
    title: string;
    subtitle: string;
    value: number;
    icon: typeof Users;
    variant: StatVariant;
  }[] = [
    {
      title: "บุคลากรทั้งหมด",
      subtitle: "จำนวนบุคลากรในระบบ",
      value: stats.total,
      icon: Users,
      variant: "blue",
    },
    {
      title: "เปิดใช้งาน",
      subtitle: "บัญชีบุคลากรที่เปิดใช้งาน",
      value: stats.active,
      icon: BadgeCheck,
      variant: "emerald",
    },
    {
      title: "ปิดใช้งาน",
      subtitle: "บัญชีบุคลากรที่ปิดใช้งาน",
      value: stats.inactive,
      icon: ShieldCheck,
      variant: "amber",
    },
  ];

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="space-y-5">
      {/* HERO */}
      <section className="relative isolate overflow-hidden rounded-3xl border border-blue-300/20 bg-gradient-to-br from-[#071A3A] via-[#17449A] to-[#4B42B2] shadow-xl shadow-blue-950/15 dark:border-blue-400/15">
        {/* BACKGROUND */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-20 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-indigo-300/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-cyan-300/[0.06]"
        />

        <UsersRound
          size={175}
          strokeWidth={0.7}
          aria-hidden="true"
          className="pointer-events-none absolute top-8 right-10 hidden text-white/10 xl:block"
        />

        <div className="relative z-10 p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* LEFT HEADER */}
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-inner backdrop-blur-md sm:h-16 sm:w-16">
                <UsersRound size={29} strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/15 px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-cyan-100">
                    <Sparkles size={12} />
                    PERSONNEL MANAGEMENT
                  </span>

                  {!isLoading && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                      <Users size={12} />
                      {stats.total.toLocaleString("th-TH")} คน
                    </span>
                  )}
                </div>

                <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl lg:text-3xl">
                  จัดการข้อมูลบุคลากร
                </h1>

                <p className="mt-2 text-sm text-blue-100/85">
                  โรงพยาบาลยางตลาด
                </p>

                <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-cyan-100/90">
                  {isLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      กำลังโหลดข้อมูลบุคลากร...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      ระบบบริหารจัดการข้อมูลบุคลากร
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================
                RIGHT ACTION PANEL
            ======================================== */}
            <div className="flex w-full shrink-0 flex-col gap-2.5 lg:w-[270px]">
              {/* ADD PERSONNEL */}
              <button
                type="button"
                onClick={onAddUser}
                disabled={isImporting}
                className="group inline-flex min-h-13 w-full items-center justify-center gap-2.5 rounded-2xl border border-white/80 bg-gradient-to-r from-white via-blue-50 to-cyan-50 px-5 py-3 text-sm font-bold text-blue-800 shadow-lg shadow-blue-950/20 transition-all hover:-translate-y-0.5 hover:from-cyan-50 hover:to-blue-100 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                  <UserRoundPlus size={18} />
                </span>
                เพิ่มบุคลากร
                <ArrowUpRight
                  size={16}
                  className="text-blue-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </button>

              {/* FIRST ACTION ROW */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isLoading || isImporting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-2 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={isLoading ? "animate-spin" : ""}
                  />
                  {isLoading ? "กำลังโหลด" : "รีเฟรช"}
                </button>

                <button
                  type="button"
                  onClick={() => void handleDownload("export")}
                  disabled={isLoading || isBusy}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-gradient-to-r from-emerald-500/25 to-teal-500/25 px-2 py-2.5 text-xs font-bold text-white transition hover:from-emerald-500/40 hover:to-teal-500/40 disabled:opacity-50"
                >
                  {isExporting ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <FileSpreadsheet size={16} />
                  )}
                  {isExporting ? "กำลังส่งออก" : "ส่งออก Excel"}
                </button>
              </div>

              {/* SECOND ACTION ROW */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* TEMPLATE */}
                <button
                  type="button"
                  onClick={() => void handleDownload("template")}
                  disabled={isBusy}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-2 py-2.5 text-xs font-semibold text-white transition hover:border-cyan-300/50 hover:bg-cyan-400/20 disabled:opacity-50"
                >
                  {isDownloadingTemplate ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  ไฟล์ตัวอย่าง
                </button>

                {/* IMPORT */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-gradient-to-r from-cyan-500/25 to-blue-500/25 px-2 py-2.5 text-xs font-bold text-white transition hover:from-cyan-500/40 hover:to-blue-500/40 disabled:opacity-50"
                >
                  <FileUp size={16} />
                  นำเข้า Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 h-1 w-full bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400" />
      </section>

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statistics.map((item) => (
          <StatCard
            key={item.title}
            title={item.title}
            subtitle={item.subtitle}
            value={item.value}
            icon={item.icon}
            variant={item.variant}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* HIDDEN FILE INPUT */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        className="sr-only"
        tabIndex={-1}
        aria-label="เลือกไฟล์ Excel เพื่อนำเข้าบุคลากร"
      />

      {/* ================================================
          IMPORT CONFIRMATION MODAL
      ================================================= */}
      {selectedFile && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="personnel-import-title"
            className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          >
            {/* MODAL HEADER */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-5 text-white sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-white/20 bg-white/15 p-3">
                    <FileSpreadsheet size={23} />
                  </div>

                  <div>
                    <h2
                      id="personnel-import-title"
                      className="text-lg font-bold"
                    >
                      ยืนยันนำเข้า Excel
                    </h2>

                    <p className="mt-1 text-xs text-blue-100">
                      Import Personnel Data
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  disabled={isImporting}
                  aria-label="ปิดหน้าต่าง"
                  className="rounded-lg p-2 text-white/80 hover:bg-white/15 disabled:opacity-50"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* MODAL CONTENT */}
            <div className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:border-blue-500/20 dark:from-blue-950/30 dark:to-indigo-950/20">
                <FileSpreadsheet
                  size={23}
                  className="shrink-0 text-blue-600 dark:text-blue-300"
                />

                <div className="min-w-0">
                  <p className="text-sm font-bold break-all text-gray-900 dark:text-white">
                    {selectedFile.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                ระบบจะตรวจสอบข้อมูลในไฟล์ก่อนบันทึก
                กรุณาตรวจสอบรายชื่อและเลขบัตรประชาชนให้ถูกต้อง
                บัญชีที่นำเข้าควรเริ่มต้นเป็นสถานะปิดใช้งาน
                และต้องผ่านขั้นตอนตั้งรหัสผ่านก่อนเปิดใช้งาน
              </div>

              {importError && (
                <div
                  role="alert"
                  className="max-h-64 overflow-y-auto rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-xs leading-relaxed text-amber-900 shadow-sm dark:border-amber-500/20 dark:from-amber-950/30 dark:to-orange-950/20 dark:text-amber-200"
                >
                  <div className="mb-3 flex items-center gap-2 border-b border-amber-200 pb-3 font-bold dark:border-amber-500/20">
                    <CheckCircle2 size={17} />
                    รายงานผลการนำเข้าและรายการที่ต้องตรวจสอบ
                  </div>

                  <p className="break-words whitespace-pre-line">
                    {importError}
                  </p>
                </div>
              )}
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 p-5 sm:flex-row sm:justify-end dark:border-gray-800 dark:bg-gray-950/40">
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                disabled={isImporting}
                className="min-h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={() => void handleImport()}
                disabled={isImporting || importCompleted}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isImporting ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : importCompleted ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <FileUp size={17} />
                )}

                {isImporting
                  ? "กำลังนำเข้าข้อมูล..."
                  : importCompleted
                    ? "นำเข้าเรียบร้อยแล้ว"
                    : "ยืนยันนำเข้า Excel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
