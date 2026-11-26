"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ContactRound,
  Fingerprint,
  LoaderCircle,
  LockKeyhole,
  ImagePlus,
  UploadCloud,
  Trash2,
  Camera,
  Radio,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  XCircle,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "react-toastify";
import { api, ApiError } from "@/lib/api";
import { PersonDetail } from "@/types/personType";
import { editSchema } from "@/validations/personSchema";
import { formatPhone, formatPhoneInput } from "@/utils/formatter";
import PnameSelect from "../form/PnameSelect";
import PnameSelectEng from "../form/PnameSelectEng";
import DatePickerField from "../form/DatePickerField";
import SearchableSelect from "../form/SearchableSelect";
import AccountRoleSelect from "../form/AccountRoleSelect";
import ProfileImageCropper, {
  type ProfileImageCropperRef,
} from "@/components/form/ProfileImageCropper";

type PersonWithImage = PersonDetail & {
  img_profile?: string | null;
  rfid?: string | null;
};
const MAX_PROFILE_SIZE = 2 * 1024 * 1024;
const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function toProfileSrc(url: string): string {
  // Next.js app uses basePath /person-yth.
  if (/^https?:\/\//i.test(url) || url.startsWith("blob:")) return url;
  if (url.startsWith("/person-yth/")) return url;
  return `/person-yth/${url.replace(/^\/+/, "")}`;
}

type Option = { id: number; name: string };

// Keep default props stable across renders. `positionTypes = []` inline
// creates a new array on every render and previously retriggered the fetch effect.
const EMPTY_OPTIONS: Option[] = [];

// Share an in-flight request across React StrictMode effect remounts (dev).
// The promise is cleared after the request settles, so a later page visit can refresh.
let pendingPositionTypes: Promise<Option[]> | null = null;

function fetchPositionTypes(): Promise<Option[]> {
  if (!pendingPositionTypes) {
    pendingPositionTypes = api
      .get<Array<{ ps_type_id: number; ps_name_type: string }>>(
        "/auth/person/position-type",
      )
      .then((response) =>
        (response.data ?? []).map((item) => ({
          id: item.ps_type_id,
          name: item.ps_name_type,
        })),
      )
      .finally(() => {
        pendingPositionTypes = null;
      });
  }
  return pendingPositionTypes;
}

type PersonEditProps = {
  personId: number | string;
  /** Route within the Next.js app, without basePath. */
  backHref?: string;
  departments?: Option[];
  positions?: Option[];
  positionTypes?: Option[];
};

type FormData = {
  ac_pname: string;
  ac_fname: string;
  ac_lname: string;
  ac_nickname: string;
  ac_pname_eng: string;
  ac_fname_eng: string;
  ac_lname_eng: string;
  ac_birthday: string;
  ac_username: string;
  ac_email: string;
  ac_phone_number: string;
  ac_hn: string;
  rfid: string;
  ac_certificate_number: string;
  dep_id: string;
  ps_id: string;
  ps_type_id: string;
  ac_role: "admin" | "member" | "user";
  level: string;
  ac_active: "0" | "1";
};

const INITIAL_FORM: FormData = {
  ac_nickname: "",
  ac_pname: "",
  ac_fname: "",
  ac_lname: "",
  ac_pname_eng: "",
  ac_fname_eng: "",
  ac_lname_eng: "",
  ac_birthday: "",
  ac_username: "",
  ac_email: "",
  ac_phone_number: "",
  ac_hn: "",
  rfid: "",
  dep_id: "",
  ps_id: "",
  ps_type_id: "",
  ac_certificate_number: "",
  ac_role: "user",
  level: "1",
  ac_active: "1",
};

type FieldErrors = Partial<Record<keyof FormData, string>>;
const nullable = (value: string | null | undefined): string | null => {
  return value?.trim() || null;
};

const idOrNull = (value: string | null | undefined): number | null => {
  if (!value?.trim()) return null;

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

function toForm(item: PersonWithImage): FormData {
  return {
    ac_pname: item.ac_pname ?? "",
    ac_fname: item.ac_fname ?? "",
    ac_lname: item.ac_lname ?? "",
    ac_nickname: item.ac_nickname ?? "",
    ac_pname_eng: item.ac_pname_eng ?? "",
    ac_fname_eng: item.ac_fname_eng ?? "",
    ac_lname_eng: item.ac_lname_eng ?? "",
    ac_birthday: item.ac_birthday ? String(item.ac_birthday).slice(0, 10) : "",
    ac_username: item.ac_username ?? "",
    ac_email: item.ac_email ?? "",
    ac_phone_number: (item.ac_phone_number ?? "")
      .replace(/\D/g, "")
      .slice(0, 10),
    ac_hn: item.ac_hn ?? "",
    rfid: item.rfid ?? "",
    dep_id: item.dep_id == null ? "" : String(item.dep_id),
    ps_id: item.ps_id == null ? "" : String(item.ps_id),
    ps_type_id: item.ps_type_id == null ? "" : String(item.ps_type_id),
    ac_certificate_number: item.ac_certificate_number ?? "",
    ac_role: item.ac_role,
    level: String(item.level ?? 1),
    ac_active: item.ac_active === 1 ? "1" : "0",
  };
}

function Card({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-gray-900">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-cyan-50/60 px-5 py-4 dark:border-slate-800 dark:from-blue-900/20 dark:via-indigo-900/10 dark:to-cyan-900/10">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/15">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  error,
  required,
  children,
  wide,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label
      className={`block min-w-0 space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}
    >
      <span className="block text-xs font-bold text-slate-600 dark:text-slate-300">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      {children}
      {error && (
        <span className="block text-xs text-rose-600 dark:text-rose-400">
          {error}
        </span>
      )}
    </label>
  );
}

const control =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-indigo-500";

export default function PersonEdit({
  personId,
  backHref = "/personnel",
  departments = EMPTY_OPTIONS,
  positions = EMPTY_OPTIONS,
  positionTypes = EMPTY_OPTIONS,
}: PersonEditProps) {
  const router = useRouter();
  const [person, setPerson] = useState<PersonWithImage | null>(null);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [initialForm, setInitialForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [availableTypes, setAvailableTypes] = useState<Option[]>(positionTypes);

  // PROFILE IMAGE: keep existing unless a new file is chosen or removal is explicit.
  const cropperRef = useRef<ProfileImageCropperRef>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const originalImageUrl = person?.img_profile?.trim() || null;
  const imageChanged =
    profileFile !== null || (removeExistingImage && !!originalImageUrl);
  const dirty =
    JSON.stringify(form) !== JSON.stringify(initialForm) ||
    newPassword.length > 0 ||
    confirmPassword.length > 0 ||
    imageChanged;

  useEffect(() => {
    if (!profileFile) {
      return;
    }
    const url = URL.createObjectURL(profileFile);
    setProfilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profileFile]);

  const handleProfileFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selected = event.target.files?.[0];
    event.target.value = ""; // allow selecting the same file again
    if (!selected) return;
    if (!VALID_IMAGE_TYPES.includes(selected.type)) {
      setProfileError("รองรับเฉพาะภาพ JPG, PNG และ WebP");
      return;
    }
    if (selected.size > MAX_PROFILE_SIZE) {
      setProfileError("รูปภาพต้นฉบับต้องมีขนาดไม่เกิน 2 MB");
      return;
    }
    setProfileError("");
    setRemoveExistingImage(false);
    setProfileFile(selected);
  };

  const undoImageChange = () => {
    setProfileFile(null);
    setProfilePreview("");
    setRemoveExistingImage(false);
    setProfileError("");
  };

  const removeImage = () => {
    setProfileFile(null);
    setProfilePreview("");
    setRemoveExistingImage(Boolean(originalImageUrl));
    setProfileError("");
  };

  const set = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await api.get<PersonWithImage>(
          `/auth/person/${personId}`,
        );
        // This project's api.get returns an envelope containing `data`.
        const record = response.data;
        if (!record || !record.ac_id) throw new Error("ไม่พบข้อมูลบุคลากร");
        if (cancelled) return;
        const loaded = toForm(record);
        setPerson(record);
        setForm(loaded);
        setInitialForm(loaded);
        setProfileFile(null);
        setProfilePreview("");
        setRemoveExistingImage(false);
        setProfileError("");
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [personId]);

  useEffect(() => {
    // Parent-supplied options take precedence; avoid requesting the endpoint.
    if (positionTypes.length > 0) {
      setAvailableTypes(positionTypes);
      return;
    }

    let cancelled = false;

    void fetchPositionTypes()
      .then((options) => {
        if (!cancelled) setAvailableTypes(options);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("[PERSON_EDIT_POSITION_TYPES]", error);
          // Keep the numeric-ID fallback rather than fetching on each render.
        }
      });

    return () => {
      cancelled = true;
    };
  }, [positionTypes]);

  const goBack = () => {
    if (isSaving) return;
    if (
      dirty &&
      !window.confirm("มีข้อมูลที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่?")
    )
      return;
    router.push(backHref);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    // RFID is optional, but may not exceed the database column limit.
    // Validate here while keeping the existing shared editSchema unchanged.
    if (form.rfid.trim().length > 100) {
      setErrors((prev) => ({
        ...prev,
        rfid: "รหัส RFID ต้องไม่เกิน 100 ตัวอักษร",
      }));
      toast.error("กรุณาตรวจสอบรหัส RFID");
      return;
    }
    if (newPassword || confirmPassword) {
      if (newPassword.length < 12) {
        setPasswordError("รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร");
        return;
      }

      if (new TextEncoder().encode(newPassword).length > 72) {
        setPasswordError("รหัสผ่านต้องมีขนาดไม่เกิน 72 ไบต์");
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
        return;
      }
    }

    setPasswordError("");
    const validation = editSchema.safeParse(form);
    if (!validation.success) {
      const next: FieldErrors = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0] as keyof FormData;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("กรุณาตรวจสอบข้อมูลที่กรอก");
      return;
    }
    const value = validation.data;
    const payload: { img_profile?: string | null; [key: string]: unknown } = {
      ac_pname: nullable(value.ac_pname),
      ac_fname: value.ac_fname.trim(),
      ac_lname: value.ac_lname.trim(),
      ac_nickname: nullable(value.ac_nickname),
      ac_pname_eng: nullable(value.ac_pname_eng),
      ac_fname_eng: nullable(value.ac_fname_eng),
      ac_lname_eng: nullable(value.ac_lname_eng),
      ac_username: nullable(value.ac_username),
      ac_birthday: nullable(value.ac_birthday),
      ac_email: nullable(value.ac_email),
      ac_phone_number: nullable(value.ac_phone_number?.replace(/\D/g, "")),
      ac_hn: nullable(value.ac_hn),
      rfid: nullable(form.rfid),
      dep_id: idOrNull(value.dep_id),
      ps_id: idOrNull(value.ps_id),
      ps_type_id: idOrNull(value.ps_type_id),
      ac_certificate_number: nullable(value.ac_certificate_number),
      ac_role: value.ac_role,
      level: Number(value.level),
      ac_active: Number(value.ac_active) as 0 | 1,
      // Admin sets a password only when both fields have been filled and validated.
      ...(newPassword ? { ac_password: newPassword } : {}),
      // Undefined means "keep the stored image"; null means "remove it".
    };
    try {
      setIsSaving(true);

      if (removeExistingImage && !profileFile) {
        payload.img_profile = null;
      }

      if (profileFile) {
        const croppedFile = await cropperRef.current?.getCroppedFile();
        if (!croppedFile) {
          throw new Error("ไม่สามารถครอปรูปโปรไฟล์ได้ กรุณาเลือกรูปอีกครั้ง");
        }
        const uploadData = new FormData();
        uploadData.append("file", croppedFile);

        const uploadResponse = await fetch(
          "/person-yth/api/auth/person/upload-profile",
          { method: "POST", body: uploadData, credentials: "same-origin" },
        );
        let uploadResult: {
          success?: boolean;
          message?: string;
          data?: { url?: string };
        };
        try {
          uploadResult = await uploadResponse.json();
        } catch {
          throw new Error("เซิร์ฟเวอร์ส่งผลการอัปโหลดรูปภาพไม่ถูกต้อง");
        }
        if (
          !uploadResponse.ok ||
          !uploadResult.success ||
          !uploadResult.data?.url
        ) {
          throw new Error(uploadResult.message || "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ");
        }
        payload.img_profile = uploadResult.data.url;
      }

      const response = await api.patch(`/auth/person/${personId}`, payload);
      if (!response.success) {
        throw new Error(response.message || "ไม่สามารถบันทึกข้อมูลได้");
      }
      setNewPassword("");
      setConfirmPassword("");
      toast.success("บันทึกการแก้ไขข้อมูลบุคลากรสำเร็จ");
      setInitialForm({ ...form });
      setProfileFile(null);
      setRemoveExistingImage(false);
      router.push(backHref);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.details && typeof error.details === "object") {
          const next: FieldErrors = {};
          for (const [field, messages] of Object.entries(
            error.details as Record<string, unknown>,
          )) {
            if (
              field in INITIAL_FORM &&
              Array.isArray(messages) &&
              typeof messages[0] === "string"
            ) {
              next[field as keyof FormData] = messages[0];
            }
          }
          setErrors(next);
        }
        toast.error(error.message);
      } else {
        toast.error(
          error instanceof Error ? error.message : "ไม่สามารถบันทึกข้อมูลได้",
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const input = (key: keyof FormData, placeholder = "") => (
    <input
      className={control}
      value={form[key]}
      placeholder={placeholder}
      onChange={(event) => set(key, event.target.value as never)}
    />
  );

  if (isLoading)
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-gray-900">
        <LoaderCircle className="animate-spin text-indigo-600" size={32} />
        <p className="text-sm font-semibold text-slate-500">
          กำลังโหลดข้อมูลบุคลากร...
        </p>
      </div>
    );

  if (loadError || !person)
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center dark:border-rose-900 dark:bg-gray-900">
        <XCircle className="mx-auto text-rose-500" size={36} />
        <p className="mt-3 font-bold text-slate-900 dark:text-white">
          ไม่สามารถเปิดหน้าแก้ไขได้
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {loadError || "ไม่พบข้อมูลบุคลากร"}
        </p>
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          กลับหน้ารายชื่อ
        </button>
      </div>
    );

  return (
    <form onSubmit={(event) => void save(event)} className="space-y-5 pb-24">
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 p-6 shadow-sm sm:p-7 dark:border-blue-500/20 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-cyan-500/10">
        <div className="pointer-events-none absolute -top-16 -right-16 size-60 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-52 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
              <UserRound size={27} />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[.15em] text-indigo-600 uppercase dark:text-indigo-300">
                PERSONNEL MANAGEMENT
              </p>
              <h1 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl dark:text-white">
                แก้ไขข้อมูลบุคลากร
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {person.ac_fname} {person.ac_lname} • รหัส #{person.ac_id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={goBack}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-indigo-200 bg-white/70 px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-white dark:border-indigo-500/25 dark:bg-slate-900/50 dark:text-indigo-300"
          >
            <ArrowLeft size={17} /> กลับหน้ารายชื่อ
          </button>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white/70 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/20 dark:bg-slate-900/40 dark:text-indigo-300">
            <Fingerprint size={13} /> ID {person.ac_id}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white/70 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/20 dark:bg-slate-900/40 dark:text-indigo-300">
            <ShieldCheck size={13} /> {form.ac_role}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white/70 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/20 dark:bg-slate-900/40 dark:text-indigo-300">
            <BadgeCheck size={13} />{" "}
            {form.ac_active === "1" ? "เปิดใช้งาน" : "ปิดใช้งาน"}
          </span>
        </div>
      </div>

      <Card
        icon={<UserRound size={20} />}
        title="ข้อมูลส่วนบุคคล"
        subtitle="ข้อมูลชื่อ-นามสกุล วันเกิด และรายละเอียดบัญชีบุคลากร"
      >
        {/* ================= THAI NAME ================= */}
        <div className="min-w-0 space-y-3 sm:col-span-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-cyan-400" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              ชื่อ-นามสกุลภาษาไทย
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-[3fr_4.5fr_4.5fr]">
            <Field label="คำนำหน้าชื่อ" error={errors.ac_pname}>
              <PnameSelect
                value={form.ac_pname}
                onChange={(value) => set("ac_pname", value)}
                error={errors.ac_pname}
              />
            </Field>

            <Field label="ชื่อ (ภาษาไทย)" required error={errors.ac_fname}>
              {input("ac_fname", "ชื่อจริง")}
            </Field>

            <Field label="นามสกุล (ภาษาไทย)" required error={errors.ac_lname}>
              {input("ac_lname", "นามสกุล")}
            </Field>
          </div>
        </div>

        {/* ================= ENGLISH NAME ================= */}
        <div className="min-w-0 space-y-3 sm:col-span-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              ชื่อ-นามสกุลภาษาอังกฤษ
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-[3fr_4.5fr_4.5fr]">
            <Field label="คำนำหน้า (อังกฤษ)" error={errors.ac_pname_eng}>
              <PnameSelectEng
                value={form.ac_pname_eng}
                onChange={(value) => set("ac_pname_eng", value)}
              />
            </Field>

            <Field label="ชื่อ (อังกฤษ)" error={errors.ac_fname_eng}>
              {input("ac_fname_eng", "First name")}
            </Field>

            <Field label="นามสกุล (อังกฤษ)" error={errors.ac_lname_eng}>
              {input("ac_lname_eng", "Last name")}
            </Field>
          </div>
        </div>

        {/* ================= ACCOUNT & PERSONAL DETAILS ================= */}
        <div className="min-w-0 space-y-3 sm:col-span-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              ข้อมูลเพิ่มเติม
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Username" error={errors.ac_username}>
              {input("ac_username", "ชื่อผู้ใช้เข้าสู่ระบบ")}
            </Field>

            <Field label="เลข HN" error={errors.ac_hn}>
              {input("ac_hn", "เลข HN")}
            </Field>

            <Field label="วันเดือนปีเกิด" error={errors.ac_birthday}>
              <DatePickerField
                name="ac_birthday"
                value={form.ac_birthday}
                onChange={(value) => set("ac_birthday", value)}
                max={new Date().toLocaleDateString("en-CA")}
                clearable
                placeholder="เลือกวันเดือนปีเกิด"
              />
            </Field>

            <Field label="ชื่อเล่น" error={errors.ac_nickname}>
              {input("ac_nickname", "กรอกชื่อเล่น")}
            </Field>
          </div>
        </div>
      </Card>

      <Card
        icon={<ContactRound size={20} />}
        title="ข้อมูลติดต่อ"
        subtitle="เบอร์โทรศัพท์และอีเมล"
      >
        <Field label="หมายเลขโทรศัพท์" error={errors.ac_phone_number}>
          <div className="relative">
            <Phone
              size={17}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
            />

            <input
              type="tel"
              name="ac_phone_number"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={12}
              value={formatPhoneInput(form.ac_phone_number)}
              placeholder="081-234-5678"
              disabled={isSaving}
              onChange={(event) => {
                const phone = event.currentTarget.value
                  .replace(/\D/g, "")
                  .slice(0, 10);

                set("ac_phone_number", phone);
              }}
              className={`${control} pl-11 ${
                errors.ac_phone_number
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                  : ""
              }`}
              aria-invalid={!!errors.ac_phone_number}
            />
          </div>

          <p className="mt-1 text-xs text-slate-400">
            รูปแบบ xxx-xxx-xxxx (10 หลัก)
          </p>
        </Field>

        <Field label="อีเมล" error={errors.ac_email}>
          <div className="relative">
            <Mail
              size={16}
              className="absolute top-3.5 left-3 text-slate-400"
            />
            <input
              type="email"
              className={`${control} pl-10`}
              value={form.ac_email}
              placeholder="example@hospital.go.th"
              onChange={(event) => set("ac_email", event.target.value)}
            />
          </div>
        </Field>
      </Card>

      <Card
        icon={<BriefcaseBusiness size={20} />}
        title="ข้อมูลการทำงาน"
        subtitle="จัดการหน่วยงาน ตำแหน่ง และประเภทตำแหน่งของบุคลากร"
      >
        {/* ================= LICENSE ================= */}
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm shadow-cyan-500/20">
              <BadgeCheck size={18} />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                ข้อมูลใบประกอบวิชาชีพ
              </h4>
              <p className="text-[11px] text-slate-400">Professional License</p>
            </div>
          </div>

          <Field
            label="เลขใบประกอบวิชาชีพ"
            error={errors.ac_certificate_number}
          >
            <div className="relative">
              <BadgeCheck
                size={17}
                className="pointer-events-none absolute top-3.5 left-3.5 text-slate-400"
              />

              <input
                type="text"
                name="ac_certificate_number"
                value={form.ac_certificate_number}
                onChange={(event) =>
                  set("ac_certificate_number", event.target.value)
                }
                maxLength={100}
                placeholder="เช่น ว12345 (ถ้ามี)"
                autoComplete="off"
                className={`${control} pl-11`}
                aria-invalid={!!errors.ac_certificate_number}
              />
            </div>
          </Field>
        </div>

        {/* ================= DEPARTMENT ================= */}
        <div className="min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                <Building2 size={16} />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">
                  หน่วยงานที่สังกัด
                </p>
                <p className="text-[11px] text-slate-400">Department</p>
              </div>
            </div>

            {form.dep_id && (
              <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                ID #{form.dep_id}
              </span>
            )}
          </div>

          <Field label="เลือกหน่วยงาน" error={errors.dep_id}>
            <SearchableSelect
              name="dep_id"
              value={form.dep_id}
              onChange={(value) => set("dep_id", value)}
              options={departments}
              placeholder="พิมพ์ชื่อหรือคลิกเลือกหน่วยงาน"
              emptyMessage="ไม่พบหน่วยงานที่ค้นหา"
            />
          </Field>
        </div>

        {/* ================= POSITION ================= */}
        <div className="min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                <BriefcaseBusiness size={16} />
              </div>

              <p className="text-xs font-bold text-slate-800 dark:text-white">
                ตำแหน่งงาน
              </p>
            </div>

            {form.ps_id && (
              <span className="rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                ID #{form.ps_id}
              </span>
            )}
          </div>

          <Field label="เลือกตำแหน่ง" error={errors.ps_id}>
            <SearchableSelect
              name="ps_id"
              value={form.ps_id}
              onChange={(value) => set("ps_id", value)}
              options={positions}
              placeholder="พิมพ์ชื่อหรือคลิกเลือกตำแหน่ง"
              emptyMessage="ไม่พบตำแหน่งที่ค้นหา"
            />
          </Field>
        </div>

        {/* ================= POSITION TYPE ================= */}
        <div className="min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                <ShieldCheck size={16} />
              </div>

              <p className="text-xs font-bold text-slate-800 dark:text-white">
                ประเภทตำแหน่ง
              </p>
            </div>

            {form.ps_type_id && (
              <span className="rounded-lg bg-violet-50 px-2 py-1 text-[11px] font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                ID #{form.ps_type_id}
              </span>
            )}
          </div>

          <Field label="เลือกประเภทตำแหน่ง" error={errors.ps_type_id}>
            <SearchableSelect
              name="ps_type_id"
              value={form.ps_type_id}
              onChange={(value) => set("ps_type_id", value)}
              options={availableTypes}
              placeholder="พิมพ์ชื่อหรือคลิกเลือกประเภทตำแหน่ง"
              emptyMessage="ไม่พบประเภทตำแหน่งที่ค้นหา"
            />
          </Field>
        </div>

        {/* ================= INFORMATION ================= */}
        <div className="min-w-0 sm:col-span-2">
          <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 p-4 dark:border-indigo-500/20 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-cyan-500/10">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-indigo-600 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-300">
              <Building2 size={18} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
                การเลือกข้อมูลการทำงาน
              </p>

              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                สามารถคลิก Dropdown เพื่อดูรายการทั้งหมด
                หรือพิมพ์ชื่อเพื่อค้นหาได้ทันที เมื่อเลือกรายการ
                ระบบจะแสดงชื่อและบันทึกรหัสของข้อมูลที่เลือกโดยอัตโนมัติ
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* PROFILE PICTURE: match PersonCreate layout and cropper */}
      <Card
        icon={<ImagePlus size={20} />}
        title="รูปโปรไฟล์บุคลากร"
        subtitle="ดูรูปเดิม เปลี่ยนรูปใหม่พร้อมครอป หรือเก็บรูปเดิมไว้โดยไม่ต้องอัปโหลด"
      >
        <div className="min-w-0 sm:col-span-2">
          <div className="flex flex-col gap-5 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 sm:flex-row sm:items-center sm:p-6 dark:border-blue-500/25 dark:from-blue-500/10 dark:via-slate-900 dark:to-cyan-500/10">
            <div className="flex w-full shrink-0 justify-center sm:w-auto">
              {profileFile && profilePreview ? (
                <ProfileImageCropper
                  ref={cropperRef}
                  src={profilePreview}
                  file={profileFile}
                  disabled={isSaving}
                />
              ) : originalImageUrl && !removeExistingImage ? (
                <div className="relative h-60 w-52 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={toProfileSrc(originalImageUrl)}
                    alt={`รูปโปรไฟล์ ${person.ac_fname} ${person.ac_lname}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-60 w-52 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-200 bg-white/80 text-slate-400 dark:border-blue-500/20 dark:bg-slate-900/70">
                  <UserRound size={64} strokeWidth={1.3} />
                  <span className="text-xs">ยังไม่มีรูปโปรไฟล์</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-white">
                  <Camera size={18} className="text-indigo-600" />
                  {profileFile
                    ? "เลือกรูปใหม่แล้ว — ปรับตำแหน่งและซูมได้"
                    : removeExistingImage
                      ? "จะลบรูปเดิมเมื่อกดบันทึก"
                      : originalImageUrl
                        ? "กำลังแสดงรูปที่บันทึกไว้"
                        : "สามารถเพิ่มรูปโปรไฟล์ได้"}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  รองรับ JPG, PNG, WebP ขนาดไม่เกิน 2 MB · รูปไม่บังคับ ·
                  หากไม่เลือกรูปใหม่ รูปเดิมจะยังอยู่เหมือนเดิม
                </p>
              </div>
              {profileFile && (
                <p className="truncate rounded-lg bg-white px-3 py-2 text-xs text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300">
                  {profileFile.name}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <label
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:brightness-110 ${isSaving ? "pointer-events-none opacity-50" : ""}`}
                >
                  <UploadCloud size={17} />
                  {originalImageUrl ? "เปลี่ยนรูปภาพ" : "เลือกรูปภาพ"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={isSaving}
                    aria-label="เลือกรูปโปรไฟล์บุคลากร"
                    onChange={handleProfileFileChange}
                  />
                </label>
                {(profileFile || removeExistingImage) && (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={undoImageChange}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <ArrowLeft size={16} /> ยกเลิกการเปลี่ยนรูป
                  </button>
                )}
                {(originalImageUrl || profileFile) && !removeExistingImage && (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={removeImage}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:bg-slate-900 dark:text-rose-400"
                  >
                    <Trash2 size={16} /> ลบรูปโปรไฟล์
                  </button>
                )}
              </div>
              {profileError && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10"
                >
                  {profileError}
                </p>
              )}
              <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                <ShieldCheck
                  size={16}
                  className="mt-0.5 shrink-0 text-indigo-500"
                />
                รูปจะถูกอัปโหลดเมื่อกดบันทึกเท่านั้น
                และไม่กระทบข้อมูลเดิมถ้าไม่เปลี่ยนรูป
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* RFID: editable independently of the optional profile picture. */}
      <Card
        icon={<Radio size={20} />}
        title="ข้อมูลบัตร RFID"
        subtitle="แก้ไขรหัสบัตร RFID เดิม เพิ่มบัตรใหม่ หรือเว้นว่างได้"
      >
        <div className="min-w-0 sm:col-span-2">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 p-4 sm:p-5 dark:border-indigo-500/20 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-cyan-500/10">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                <Radio size={19} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  รหัสบัตร RFID
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ไม่บังคับ · สูงสุด 100 ตัวอักษร
                </p>
              </div>
            </div>
            <Field label="รหัส RFID" error={errors.rfid}>
              <input
                type="text"
                name="rfid"
                autoComplete="off"
                maxLength={100}
                disabled={isSaving}
                className={control}
                value={form.rfid}
                onChange={(event) => set("rfid", event.target.value)}
                placeholder="กรอกรหัสบัตร RFID (ถ้ามี)"
              />
            </Field>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              หากไม่ต้องการเปลี่ยนบัตร ให้คงค่าเดิมไว้
              หรือเว้นว่างเพื่อล้างรหัสเมื่อกดบันทึก
            </p>
          </div>
        </div>
      </Card>

      <Card
        icon={<LockKeyhole size={20} />}
        title="สิทธิ์และสถานะบัญชี"
        subtitle="ตั้งค่าบทบาท ระดับสิทธิ์ สถานะบัญชี และกำหนดรหัสผ่านใหม่ให้ผู้ใช้งาน"
      >
        {/* ================= ROLE ================= */}
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
              <ShieldCheck size={18} />
            </div>

            <div>
              <p className="text-xs font-extrabold text-slate-800 dark:text-white">
                บทบาทผู้ใช้งาน
              </p>
              <p className="text-[11px] text-slate-400">Account Role</p>
            </div>
          </div>

          <Field label="เลือกบทบาท" error={errors.ac_role}>
            <AccountRoleSelect
              value={form.ac_role}
              onChange={(value) => set("ac_role", value)}
              showDescription
            />
          </Field>
        </div>

        {/* ================= LEVEL ================= */}
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
              <LockKeyhole size={18} />
            </div>

            <div>
              <p className="text-xs font-extrabold text-slate-800 dark:text-white">
                ระดับสิทธิ์
              </p>
              <p className="text-[11px] text-slate-400">Permission Level</p>
            </div>
          </div>

          <Field label="ระดับสิทธิ์ (0–100)" error={errors.level}>
            <div className="relative">
              <input
                className={`${control} pr-14`}
                type="number"
                min={0}
                max={100}
                value={form.level}
                onChange={(event) => set("level", event.target.value)}
              />

              <span className="pointer-events-none absolute top-3.5 right-3 text-xs font-bold text-indigo-500">
                / 100
              </span>
            </div>
          </Field>
        </div>

        {/* ================= ACCOUNT STATUS ================= */}
        <div className="min-w-0 space-y-3 sm:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
              <CheckCircle2 size={18} />
            </div>

            <div>
              <p className="text-xs font-extrabold text-slate-800 dark:text-white">
                สถานะบัญชี
              </p>
              <p className="text-[11px] text-slate-400">Account Status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* ACTIVE */}
            <button
              type="button"
              aria-pressed={form.ac_active === "1"}
              onClick={() => set("ac_active", "1")}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ${
                form.ac_active === "1"
                  ? "border-emerald-400 bg-gradient-to-r from-emerald-50 to-teal-50 ring-2 ring-emerald-500/10 dark:border-emerald-500/40 dark:from-emerald-500/15 dark:to-teal-500/10"
                  : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 dark:border-slate-700 dark:bg-slate-900"
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                <CheckCircle2 size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-slate-800 dark:text-white">
                  เปิดใช้งาน
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  อนุญาตให้บัญชีเข้าสู่ระบบ
                </p>
              </div>

              {form.ac_active === "1" && (
                <BadgeCheck size={20} className="shrink-0 text-emerald-500" />
              )}
            </button>

            {/* INACTIVE */}
            <button
              type="button"
              aria-pressed={form.ac_active === "0"}
              onClick={() => set("ac_active", "0")}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ${
                form.ac_active === "0"
                  ? "border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 ring-2 ring-amber-500/10 dark:border-amber-500/40 dark:from-amber-500/15 dark:to-orange-500/10"
                  : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/30 dark:border-slate-700 dark:bg-slate-900"
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                <XCircle size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-slate-800 dark:text-white">
                  ปิดใช้งาน
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  ระงับการเข้าใช้งานบัญชี
                </p>
              </div>

              {form.ac_active === "0" && (
                <BadgeCheck size={20} className="shrink-0 text-amber-500" />
              )}
            </button>
          </div>
        </div>

        {/* ================= ADMIN PASSWORD CHANGE ================= */}
        <div className="min-w-0 space-y-4 sm:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
              <KeyRound size={20} />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                กำหนดรหัสผ่านใหม่
              </h4>
              <p className="text-xs text-slate-400">Administrator · optional</p>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-blue-50/80 via-white to-violet-50/80 p-4 shadow-sm sm:p-5 dark:border-indigo-500/20 dark:from-blue-500/10 dark:via-slate-900 dark:to-violet-500/10">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="new-password"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  รหัสผ่านใหม่
                </label>

                <div className="relative">
                  <KeyRound
                    size={17}
                    className="absolute top-3.5 left-3.5 text-slate-400"
                  />

                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      setPasswordError("");
                    }}
                    placeholder="กำหนดรหัสผ่านใหม่"
                    autoComplete="new-password"
                    minLength={12}
                    disabled={isSaving}
                    className={`${control} pr-12 pl-11`}
                  />

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 text-slate-400 hover:text-indigo-600"
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  ยืนยันรหัสผ่านใหม่
                </label>

                <div className="relative">
                  <ShieldCheck
                    size={17}
                    className="absolute top-3.5 left-3.5 text-slate-400"
                  />

                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setPasswordError("");
                    }}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    autoComplete="new-password"
                    minLength={12}
                    disabled={isSaving}
                    className={`${control} pr-12 pl-11`}
                  />

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 text-slate-400 hover:text-indigo-600"
                    aria-label={
                      showConfirmPassword
                        ? "ซ่อนรหัสผ่านยืนยัน"
                        : "แสดงรหัสผ่านยืนยัน"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {passwordError && (
              <p
                role="alert"
                className="mt-3 text-xs font-medium text-rose-600"
              >
                {passwordError}
              </p>
            )}

            {newPassword &&
              confirmPassword &&
              newPassword === confirmPassword && (
                <p className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-600">
                  <CheckCircle2 size={16} />
                  รหัสผ่านทั้งสองช่องตรงกัน · พร้อมบันทึก
                </p>
              )}

            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-500/20 dark:bg-blue-500/10">
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                ผู้ดูแลระบบสามารถกำหนดรหัสผ่านใหม่ได้โดยไม่ต้องทราบรหัสเดิม
                กรอกอย่างน้อย 12 ตัวอักษรและยืนยันให้ตรงกัน
                หากเว้นว่างทั้งสองช่อง ระบบจะคงรหัสผ่านเดิมไว้
              </p>
            </div>
          </div>
        </div>

        {/* ================= SECURITY NOTE ================= */}
        <div className="min-w-0 sm:col-span-2">
          <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 p-4 dark:border-indigo-500/20 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-violet-500/10">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-300"
            />

            <div>
              <p className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
                ความปลอดภัยของบัญชี
              </p>

              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                การเปลี่ยนบทบาท ระดับสิทธิ์ หรือสถานะบัญชี
                จะมีผลต่อการเข้าถึงระบบของบุคลากร กรุณาตรวจสอบข้อมูลก่อนบันทึก
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900/95">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {dirty
            ? "มีการแก้ไขข้อมูลที่ยังไม่ได้บันทึก"
            : "ข้อมูลยังไม่มีการเปลี่ยนแปลง"}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={goBack}
            disabled={isSaving}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isSaving || !dirty}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-md shadow-indigo-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            {isSaving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </div>
    </form>
  );
}
