"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  personCreateSchema,
  personCreateDefaults,
  type PersonCreateFormValues,
} from "@/validations/personSchema";
import { useRouter } from "@/i18n/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  Hash,
  IdCard,
  ImagePlus,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Radio,
  Save,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserRound,
  UserRoundPlus,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";

import { api, ApiError } from "@/lib/api";
import { TextInput } from "../form/input/TextInput";
import {
  formatCid,
  formatPhoneInput,
  isValidThaiCid,
  normalizeCid,
} from "@/utils/formatter";
import PnameSelect from "../form/PnameSelect";
import PnameSelectEng from "../form/PnameSelectEng";
import SearchableSelect, {
  type SelectOption,
} from "@/components/form/SearchableSelect";
import ProfileImageCropper, {
  type ProfileImageCropperRef,
} from "@/components/form/ProfileImageCropper";

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start gap-3 rounded-t-2xl border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 px-5 py-4 sm:px-6 dark:border-gray-800 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-cyan-500/10">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <Icon size={20} strokeWidth={1.8} />
        </div>

        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-5 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  required = false,
  error,
  children,
  className = "",
}: {
  label?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {children}

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "block w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-blue-500";

const selectClass = `${inputClass} appearance-none`;

type PersonCreateProps = {
  departments: SelectOption[];
  positions: SelectOption[];
  positionTypes: SelectOption[];
};

export default function PersonCreate({
  departments,
  positions,
  positionTypes,
}: PersonCreateProps) {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<PersonCreateFormValues>({
    resolver: zodResolver(personCreateSchema),
    defaultValues: personCreateDefaults,

    mode: "onChange",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [profileError, setProfileError] = useState<string>("");
  const cropperRef = useRef<ProfileImageCropperRef>(null);

  const MAX_PROFILE_SIZE = 2 * 1024 * 1024;

  useEffect(() => {
    if (!profileFile) {
      setProfilePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(profileFile);
    setProfilePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [profileFile]);

  const handleProfileFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    // อนุญาตให้เลือกไฟล์เดิมซ้ำได้
    event.target.value = "";

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setProfileError("รองรับเฉพาะ JPG, PNG และ WebP");
      return;
    }

    if (file.size > MAX_PROFILE_SIZE) {
      setProfileError("รูปภาพต้องมีขนาดไม่เกิน 2 MB");
      return;
    }

    setProfileError("");
    setProfileFile(file);
  };

  const removeProfileFile = () => {
    setProfileFile(null);
    setProfileError("");
  };

  const onSubmit = async (values: PersonCreateFormValues) => {
    const optionalString = (value: string | null | undefined): string | null =>
      value?.trim() || null;

    const optionalInt = (
      value: string | number | null | undefined,
    ): number | null => {
      if (value == null || String(value).trim() === "") {
        return null;
      }

      const id = Number(value);

      if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
        throw new Error("รหัสหน่วยงาน ตำแหน่ง หรือประเภทตำแหน่งไม่ถูกต้อง");
      }

      return id;
    };

    try {
      // =====================================================
      // 1. PREPARE CID
      // =====================================================

      const cid = normalizeCid(values.ac_cid);

      // ตรวจความยาวซ้ำเพื่อป้องกันการส่งค่าผิดรูปแบบ
      // ไม่ตรวจ Check Digit ซ้ำที่นี่
      if (!/^\d{13}$/.test(cid)) {
        setError("ac_cid", {
          type: "manual",
          message: "กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก",
        });

        toast.warning("กรุณาตรวจสอบเลขบัตรประชาชน");
        return;
      }

      // =====================================================
      // 2. PREPARE PAYLOAD
      // =====================================================

      const payload: {
        ac_cid: string;
        ac_hn: string | null;
        ac_birthday: string;
        ac_pname: string | null;
        ac_fname: string;
        ac_lname: string;
        ac_nickname: string | null;
        ac_pname_eng: string | null;
        ac_fname_eng: string | null;
        ac_lname_eng: string | null;
        ac_email: string | null;
        ac_phone_number: string | null;
        ac_address: string | null;
        dep_id: number | null;
        ps_id: number | null;
        ps_type_id: number | null;
        ac_certificate_number: string | null;
        img_profile: string | null;
        rfid: string | null;
      } = {
        // IDENTIFICATION
        ac_cid: cid,
        ac_hn: optionalString(values.ac_hn),
        ac_birthday: values.ac_birthday,

        // THAI NAME
        ac_pname: optionalString(values.ac_pname),
        ac_fname: values.ac_fname.trim(),
        ac_lname: values.ac_lname.trim(),
        ac_nickname: optionalString(values.ac_nickname),

        // ENGLISH NAME
        ac_pname_eng: optionalString(values.ac_pname_eng),
        ac_fname_eng: optionalString(values.ac_fname_eng),
        ac_lname_eng: optionalString(values.ac_lname_eng),

        // CONTACT
        ac_email: optionalString(values.ac_email),
        ac_phone_number: optionalString(
          values.ac_phone_number?.replace(/\D/g, ""),
        ),
        ac_address: optionalString(values.ac_address),

        // EMPLOYMENT
        dep_id: optionalInt(values.dep_id),
        ps_id: optionalInt(values.ps_id),
        ps_type_id: optionalInt(values.ps_type_id),
        ac_certificate_number: optionalString(values.ac_certificate_number),

        // PROFILE
        img_profile: null,
        rfid: optionalString(values.rfid),
      };

      // =====================================================
      // 3. CROP AND UPLOAD PROFILE IMAGE (OPTIONAL)
      // =====================================================

      if (profileFile) {
        const croppedFile = await cropperRef.current?.getCroppedFile();

        if (!croppedFile) {
          throw new Error(
            "ไม่สามารถเตรียมรูปโปรไฟล์ได้ กรุณาเลือกรูปใหม่อีกครั้ง",
          );
        }

        const uploadData = new FormData();
        uploadData.append("file", croppedFile);

        const uploadResponse = await fetch(
          "/person-yth/api/auth/person/upload-profile",
          {
            method: "POST",
            body: uploadData,
            credentials: "same-origin",
          },
        );

        let uploadResult: {
          success?: boolean;
          message?: string;
          data?: {
            url?: string;
          };
        };

        try {
          uploadResult = await uploadResponse.json();
        } catch {
          throw new Error(
            "เซิร์ฟเวอร์ส่งข้อมูลตอบกลับการอัปโหลดรูปภาพไม่ถูกต้อง",
          );
        }

        if (
          !uploadResponse.ok ||
          !uploadResult.success ||
          !uploadResult.data?.url
        ) {
          throw new Error(
            uploadResult.message ?? "ไม่สามารถอัปโหลดรูปโปรไฟล์ได้",
          );
        }

        payload.img_profile = uploadResult.data.url;
      }

      // =====================================================
      // 4. CREATE PERSONNEL
      // =====================================================

      // API จะสร้างข้อมูลบัญชีเอง:
      // ac_username = u + ac_id + ps_id
      // ac_password = Server กำหนดรหัสผ่านเริ่มต้น
      // ac_role = user
      // level = 1
      // ac_active = 1

      const result = await api.post("/auth/person", payload);

      if (!result.success) {
        throw new Error(result.message || "ไม่สามารถเพิ่มข้อมูลบุคลากรได้");
      }

      // =====================================================
      // 5. SUCCESS
      // =====================================================

      toast.success("เพิ่มข้อมูลบุคลากรสำเร็จ", {
        icon: <CheckCircle2 size={20} />,
      });

      router.replace("/personnel");
      router.refresh();
    } catch (error) {
      // =====================================================
      // 6. API ERRORS
      // =====================================================

      if (error instanceof ApiError) {
        // -----------------------------------------------
        // VALIDATION ERRORS
        // -----------------------------------------------

        if (error.details && typeof error.details === "object") {
          const fieldErrors = error.details as Record<string, unknown>;

          for (const [field, messages] of Object.entries(fieldErrors)) {
            if (
              Object.prototype.hasOwnProperty.call(
                personCreateDefaults,
                field,
              ) &&
              Array.isArray(messages) &&
              typeof messages[0] === "string"
            ) {
              setError(field as keyof PersonCreateFormValues, {
                type: "server",
                message: messages[0],
              });
            }
          }
        }

        // -----------------------------------------------
        // DUPLICATE CID
        // -----------------------------------------------

        if (error.status === 409) {
          if (error.message.includes("เลขบัตรประชาชน")) {
            setError("ac_cid", {
              type: "server",
              message: "เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว",
            });
          }

          toast.error(error.message);
          return;
        }

        // -----------------------------------------------
        // OTHER API ERRORS
        // -----------------------------------------------

        toast.error(error.message);
        return;
      }

      // =====================================================
      // 7. UNEXPECTED ERRORS
      // =====================================================

      console.error("CREATE PERSON ERROR:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "ไม่สามารถบันทึกข้อมูลบุคลากรได้",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => {
        toast.warning("กรุณาตรวจสอบข้อมูลที่กรอก");
      })}
      noValidate
      className="space-y-6 pb-8"
    >
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.push("/personnel")}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-blue-600 dark:text-gray-400"
          >
            <ArrowLeft size={17} />
            กลับไปรายชื่อบุคลากร
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <UserRoundPlus size={25} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                เพิ่มข้อมูลบุคลากร
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                บันทึกข้อมูลบุคลากรใหม่เข้าสู่ระบบโรงพยาบาลยางตลาด
              </p>
            </div>
          </div>
        </div>

        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          * จำเป็นต้องกรอก
        </span>
      </div>

      {/* PERSONAL INFORMATION */}
      <FormSection
        icon={IdCard}
        title="ข้อมูลส่วนบุคคล"
        description="ข้อมูลระบุตัวตน ชื่อภาษาไทย และชื่อภาษาอังกฤษ"
      >
        {/* CID / HN / BIRTHDAY / NICKNAME */}
        <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          {/* ================= CID ================= */}
          <div className="min-w-0 lg:col-span-4">
            <Field
              label="เลขบัตรประชาชน"
              required
              error={errors.ac_cid?.message}
            >
              <Controller
                name="ac_cid"
                control={control}
                render={({ field }) => {
                  const cid = normalizeCid(field.value ?? "");
                  const isComplete = cid.length === 13;
                  const isValid = isComplete && /^\d{13}$/.test(cid);

                  return (
                    <div className="space-y-2">
                      <TextInput
                        ref={field.ref}
                        name={field.name}
                        type="text"
                        value={formatCid(cid)}
                        inputMode="numeric"
                        maxLength={17}
                        autoComplete="off"
                        placeholder="x-xxxx-xxxxx-xx-x"
                        leadingIcon={<IdCard size={17} />}
                        error={!!errors.ac_cid}
                        onBlur={field.onBlur}
                        onChange={(event) => {
                          const value = normalizeCid(event.target.value);
                          field.onChange(value);
                        }}
                      />

                      {/* แสดงสถานะเฉพาะเมื่อกรอกครบ 13 หลัก */}
                      {isComplete && (
                        <div
                          className={`flex items-center gap-2 text-xs font-medium ${
                            isValid
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isValid ? (
                            <>
                              <CheckCircle2 size={15} />
                              กรอกเลขบัตรประชาชนครบ 13 หลักแล้ว
                            </>
                          ) : (
                            <>
                              <XCircle size={15} />
                              หลักตรวจสอบสุดท้ายไม่ถูกต้อง
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
            </Field>
          </div>

          {/* ================= HN ================= */}
          <div className="min-w-0 lg:col-span-2">
            <Field label="เลข HN" error={errors.ac_hn?.message}>
              <TextInput
                {...register("ac_hn")}
                maxLength={20}
                placeholder="HN (ถ้ามี)"
                leadingIcon={<Hash size={17} />}
                error={!!errors.ac_hn}
              />
            </Field>
          </div>

          {/* ================= BIRTHDAY ================= */}
          <div className="min-w-0 lg:col-span-3">
            <Field
              label="วันเดือนปีเกิด"
              required
              error={errors.ac_birthday?.message}
            >
              <TextInput
                {...register("ac_birthday")}
                type="date"
                max={new Date().toLocaleDateString("sv-SE")}
                error={!!errors.ac_birthday}
              />
            </Field>
          </div>

          {/* ================= NICKNAME ================= */}
          <div className="min-w-0 lg:col-span-3">
            <Field label="ชื่อเล่น" error={errors.ac_nickname?.message}>
              <TextInput
                {...register("ac_nickname")}
                maxLength={150}
                placeholder="ชื่อเล่น (ถ้ามี)"
                leadingIcon={<UserRound size={17} />}
                error={!!errors.ac_nickname}
              />
            </Field>
          </div>
        </div>

        {/* THAI FULL NAME */}
        <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          {/* คำนำหน้าชื่อ */}
          <div className="min-w-0 lg:col-span-3">
            <Field
              label="คำนำหน้าชื่อ"
              required
              error={errors.ac_pname?.message}
            >
              <Controller
                name="ac_pname"
                control={control}
                render={({ field }) => (
                  <PnameSelect
                    name={field.name}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    required
                    placeholder="เลือกคำนำหน้า"
                    error={errors.ac_pname?.message}
                  />
                )}
              />
            </Field>
          </div>

          {/* ชื่อภาษาไทย */}
          <div className="min-w-0 lg:col-span-5">
            <Field
              label="ชื่อ (ภาษาไทย)"
              required
              error={errors.ac_fname?.message}
            >
              <TextInput
                {...register("ac_fname")}
                maxLength={150}
                placeholder="กรอกชื่อ"
                error={!!errors.ac_fname}
              />
            </Field>
          </div>

          {/* นามสกุลภาษาไทย */}
          <div className="min-w-0 sm:col-span-2 lg:col-span-4">
            <Field
              label="นามสกุล (ภาษาไทย)"
              required
              error={errors.ac_lname?.message}
            >
              <TextInput
                {...register("ac_lname")}
                maxLength={150}
                placeholder="กรอกนามสกุล"
                error={!!errors.ac_lname}
              />
            </Field>
          </div>
        </div>

        {/* ENGLISH FULL NAME */}
        <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          {/* English Prefix */}
          <div className="min-w-0 lg:col-span-3">
            <Field label="Prefix" required error={errors.ac_pname_eng?.message}>
              <Controller
                name="ac_pname_eng"
                control={control}
                render={({ field }) => (
                  <PnameSelectEng
                    name={field.name}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    required
                    placeholder="Select prefix"
                    // ไม่ส่ง error ซ้ำ เพราะ Field แสดงอยู่แล้ว
                  />
                )}
              />
            </Field>
          </div>

          {/* English First Name */}
          <div className="min-w-0 lg:col-span-5">
            <Field
              label="First Name"
              required
              error={errors.ac_fname_eng?.message}
            >
              <TextInput
                {...register("ac_fname_eng")}
                maxLength={150}
                placeholder="First Name"
              />
            </Field>
          </div>

          {/* English Last Name */}
          <div className="min-w-0 sm:col-span-2 lg:col-span-4">
            <Field
              label="Last Name"
              required
              error={errors.ac_lname_eng?.message}
            >
              <TextInput
                {...register("ac_lname_eng")}
                maxLength={150}
                placeholder="Last Name"
              />
            </Field>
          </div>
        </div>
      </FormSection>

      {/* CONTACT INFORMATION */}
      <FormSection
        icon={Phone}
        title="ข้อมูลการติดต่อ"
        description="เบอร์โทรศัพท์ อีเมล และที่อยู่สำหรับติดต่อ"
      >
        <Field label="เบอร์โทรศัพท์" error={errors.ac_phone_number?.message}>
          <Controller
            name="ac_phone_number"
            control={control}
            render={({ field }) => (
              <TextInput
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={formatPhoneInput(field.value ?? "")}
                onChange={(event) => {
                  field.onChange(
                    event.target.value.replace(/\D/g, "").slice(0, 10),
                  );
                }}
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={12}
                placeholder="08x-xxx-xxxx"
                leadingIcon={<Phone size={17} />}
                error={!!errors.ac_phone_number}
              />
            )}
          />
        </Field>

        <Field label="อีเมล" error={errors.ac_email?.message}>
          <TextInput
            {...register("ac_email")}
            type="email"
            maxLength={255}
            placeholder="example@hospital.go.th"
            leadingIcon={<Mail size={17} />}
            error={!!errors.ac_email}
          />
        </Field>

        <Field label="ที่อยู่" className="sm:col-span-2">
          <div className="relative">
            <MapPin
              size={17}
              className="absolute top-3.5 left-3.5 text-gray-400"
            />

            <textarea
              {...register("ac_address")}
              rows={3}
              placeholder="บ้านเลขที่ หมู่ ถนน ตำบล อำเภอ จังหวัด"
              className={`${inputClass} resize-y pl-10`}
            />
          </div>
        </Field>
      </FormSection>

      {/* WORK INFORMATION */}

      <FormSection
        icon={BriefcaseBusiness}
        title="ข้อมูลการทำงาน"
        description="หน่วยงาน ตำแหน่ง ประเภทตำแหน่ง และข้อมูลทางวิชาชีพ"
      >
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm shadow-cyan-500/20">
              <BadgeCheck size={19} />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                ข้อมูลใบประกอบวิชาชีพ
              </h4>
            </div>
          </div>

          <Field error={errors.ac_certificate_number?.message}>
            <TextInput
              {...register("ac_certificate_number")}
              maxLength={100}
              placeholder="กรอกเลข (ถ้ามี) เช่น ว12345"
              aria-label="เลขใบประกอบวิชาชีพ"
              leadingIcon={<BadgeCheck size={17} />}
              error={!!errors.ac_certificate_number}
            />
          </Field>
        </div>
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-sm shadow-blue-500/20">
              <Building2 size={19} />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                หน่วยงานที่สังกัด
              </h4>
            </div>
          </div>

          <Field error={errors.dep_id?.message}>
            <Controller
              name="dep_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  name={field.name}
                  value={field.value == null ? "" : String(field.value)}
                  onChange={field.onChange}
                  options={departments}
                  placeholder="ค้นหาหรือเลือกหน่วยงาน"
                  emptyMessage="ไม่พบหน่วยงานที่ค้นหา"
                  error={errors.dep_id?.message}
                />
              )}
            />
          </Field>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/20">
              <BriefcaseBusiness size={19} />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                ตำแหน่งงาน
              </h4>
            </div>
          </div>

          <Field error={errors.ps_id?.message}>
            <Controller
              name="ps_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  name={field.name}
                  value={field.value == null ? "" : String(field.value)}
                  onChange={field.onChange}
                  options={positions}
                  placeholder="ค้นหาหรือเลือกตำแหน่ง"
                  emptyMessage="ไม่พบตำแหน่งที่ค้นหา"
                  error={errors.ps_id?.message}
                />
              )}
            />
          </Field>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-sm shadow-violet-500/20">
              <ShieldCheck size={19} />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                ประเภทตำแหน่ง
              </h4>
            </div>
          </div>

          <Field error={errors.ps_type_id?.message}>
            <Controller
              name="ps_type_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  name={field.name}
                  value={field.value == null ? "" : String(field.value)}
                  onChange={field.onChange}
                  options={positionTypes}
                  placeholder="ค้นหาหรือเลือกประเภทตำแหน่ง"
                  emptyMessage="ไม่พบประเภทตำแหน่งที่ค้นหา"
                  error={errors.ps_type_id?.message}
                />
              )}
            />
          </Field>
        </div>

        {/* ==========================================
      INFORMATION
  ========================================== */}
        <div className="min-w-0 sm:col-span-2">
          <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 p-4 dark:border-indigo-500/20 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-cyan-500/10">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-indigo-500/15 dark:text-indigo-300">
              <ShieldCheck size={18} />
            </div>

            <div>
              <p className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
                วิธีเลือกข้อมูลการทำงาน
              </p>

              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                สามารถคลิก Dropdown เพื่อดูรายการทั้งหมด
                หรือพิมพ์ชื่อเพื่อค้นหาได้ทันที ระบบจะบันทึกรหัส ID
                ของรายการที่เลือกโดยอัตโนมัติ
              </p>
            </div>
          </div>
        </div>
      </FormSection>

      {/* PROFILE AND RFID */}

      <FormSection
        icon={ImagePlus}
        title="ข้อมูลโปรไฟล์และ RFID"
        description="เพิ่มรูปโปรไฟล์และเชื่อมต่อข้อมูลบัตร RFID (ไม่บังคับ)"
      >
        {/* ================= PROFILE UPLOAD ================= */}
        <div className="min-w-0 space-y-4">
          {/* TITLE */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/20">
              <ImagePlus size={19} />
            </div>

            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                รูปโปรไฟล์บุคลากร
              </h4>
              <p className="text-xs text-slate-400">
                Profile Picture · ไม่บังคับ
              </p>
            </div>
          </div>

          {/* UPLOAD CARD */}
          <div className="relative min-w-0 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/80 p-4 shadow-sm sm:p-5 dark:border-blue-500/25 dark:from-blue-500/10 dark:via-slate-900 dark:to-cyan-500/10">
            {/* DECORATION */}
            <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              {/* IMAGE PREVIEW + DRAG + ZOOM */}
              <div className="w-full shrink-0 sm:w-auto">
                <ProfileImageCropper
                  ref={cropperRef}
                  src={profilePreview}
                  file={profileFile}
                  disabled={isSubmitting}
                />
              </div>

              {/* UPLOAD DETAILS */}
              <div className="w-full min-w-0 flex-1 space-y-3 text-center sm:text-left">
                {/* STATUS */}
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-slate-800 dark:text-white">
                    {profileFile ? "เลือกรูปโปรไฟล์แล้ว" : "เพิ่มรูปโปรไฟล์"}
                  </p>

                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    รองรับ JPG, PNG และ WebP ขนาดไม่เกิน 2 MB
                    สามารถเว้นว่างและเพิ่มภายหลังได้
                  </p>
                </div>

                {/* FILENAME */}
                {profileFile && (
                  <div className="min-w-0 rounded-xl border border-indigo-100 bg-white/80 px-3 py-2.5 dark:border-indigo-500/20 dark:bg-slate-800/70">
                    <div className="flex items-center gap-2">
                      <ImagePlus
                        size={15}
                        className="shrink-0 text-indigo-500"
                      />
                      <span
                        className="min-w-0 flex-1 truncate text-left text-xs font-medium text-slate-600 dark:text-slate-300"
                        title={profileFile.name}
                      >
                        {profileFile.name}
                      </span>
                    </div>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <label
                    className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/15 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg ${isSubmitting ? "pointer-events-none opacity-50" : ""} `}
                  >
                    <UploadCloud size={17} />
                    {profileFile ? "เปลี่ยนรูปภาพ" : "เลือกรูปภาพ"}

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleProfileFileChange}
                      disabled={isSubmitting}
                      aria-label="เลือกรูปโปรไฟล์บุคลากร"
                      className="sr-only"
                    />
                  </label>

                  {profileFile && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={removeProfileFile}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-600 transition-all hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/30 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 size={16} />
                      ลบรูป
                    </button>
                  )}
                </div>

                {/* OPTIONAL NOTE */}
                <div className="flex items-start justify-center gap-2 rounded-xl bg-blue-100/50 px-3 py-2.5 text-left sm:justify-start dark:bg-blue-500/10">
                  <ShieldCheck
                    size={16}
                    className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
                  />
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                    ระบบจะปรับภาพให้พอดีกับกรอบตัวอย่าง
                    โดยรักษาสัดส่วนภาพต้นฉบับ
                  </p>
                </div>
              </div>
            </div>

            {/* ERROR */}
            {profileError && (
              <p
                role="alert"
                className="relative mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
              >
                {profileError}
              </p>
            )}
          </div>
        </div>

        {/* ================= RFID ================= */}
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/20">
              <Radio size={19} />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                ข้อมูล RFID
              </h4>

              <p className="text-xs text-slate-400">RFID Card · ไม่บังคับ</p>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950/40">
            <Field label="รหัสบัตร RFID" error={errors.rfid?.message}>
              <TextInput
                {...register("rfid")}
                maxLength={100}
                placeholder="กรอกรหัส RFID (ถ้ามี)"
                leadingIcon={<Radio size={17} />}
                error={!!errors.rfid}
              />
            </Field>

            <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 p-3 dark:from-indigo-500/10 dark:to-blue-500/10">
              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-300"
              />

              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                ใช้สำหรับเชื่อมต่อกับระบบอ่านบัตร RFID
                หรือระบบยืนยันตัวตนภายในโรงพยาบาล
                หากยังไม่มีบัตรสามารถเว้นว่างได้
              </p>
            </div>
          </div>
        </div>
      </FormSection>

      {/* FOOTER ACTIONS */}
      <div className="flex flex-col-reverse gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs text-gray-400">
          <CalendarDays size={14} className="mr-1 inline" />
          วันที่สร้างและแก้ไขล่าสุดจะถูกบันทึกอัตโนมัติ
        </p>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => router.push("/personnel")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            ยกเลิก
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                กำลังบันทึกข้อมูล...
              </>
            ) : (
              <>
                <Save size={18} />
                บันทึกบุคลากร
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
