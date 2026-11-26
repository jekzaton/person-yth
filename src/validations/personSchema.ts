import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max, `กรอกได้ไม่เกิน ${max} ตัวอักษร`);

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `กรุณากรอก${label}`)
    .max(max, `${label}ต้องไม่เกิน ${max} ตัวอักษร`);

const optionalId = (label: string) =>
  z.string().refine((value) => {
    if (value.trim() === "") {
      return true;
    }

    if (!/^[1-9]\d*$/.test(value)) {
      return false;
    }

    const id = Number(value);

    return Number.isSafeInteger(id) && id >= 1 && id <= 2147483647;
  }, `กรุณาเลือก${label}ให้ถูกต้อง`);

// ======================================================
// 2. CITIZEN ID VALIDATION
// ======================================================

/**
 * ตรวจสอบเลขบัตรประชาชน 13 หลัก
 *
 * ข้อมูลที่รับจาก React Hook Form:
 * 1111111111111
 *
 * หมายเหตุ:
 * ตรวจเฉพาะความยาวและรูปแบบ
 * ไม่ได้ตรวจ Check Digit
 * ไม่ได้ตรวจเลขซ้ำในฐานข้อมูล
 */
const cidSchema = z
  .string()
  .regex(/^\d{13}$/, "กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก");

// ======================================================
// 3. BIRTHDAY VALIDATION
// ======================================================

/**
 * ตรวจวันที่รูปแบบ YYYY-MM-DD
 * ต้องเป็นวันที่จริงและไม่อยู่ในอนาคต
 */
function isValidBirthday(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isRealDate) {
    return false;
  }

  // วันที่ปัจจุบันตามประเทศไทย
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const today = [getPart("year"), getPart("month"), getPart("day")].join("-");

  return value <= today;
}

/** วันเกิดบังคับสำหรับหน้า Create */
const requiredBirthday = z
  .string()
  .min(1, "กรุณาเลือกวันเดือนปีเกิด")
  .refine(
    (value) => value === "" || isValidBirthday(value),
    "วันเดือนปีเกิดไม่ถูกต้องหรืออยู่ในอนาคต",
  );

/** วันเกิดไม่บังคับสำหรับหน้า Edit */
const optionalBirthday = z
  .string()
  .refine(
    (value) => value === "" || isValidBirthday(value),
    "วันเดือนปีเกิดไม่ถูกต้องหรืออยู่ในอนาคต",
  );

// ======================================================
// 4. CONTACT VALIDATION
// ======================================================

/**
 * Email:
 * - เว้นว่างได้
 * - ตรวจรูปแบบเมื่อมีค่า
 */
const emailSchema = z
  .string()
  .trim()
  .max(255, "อีเมลต้องไม่เกิน 255 ตัวอักษร")
  .refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "รูปแบบอีเมลไม่ถูกต้อง",
  );

/**
 * Phone:
 * - เว้นว่างได้
 * - เก็บตัวเลข 10 หลัก
 * - ไม่เก็บขีด
 *
 * ตัวอย่าง 0812345678
 */
const phoneSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^0\d{9}$/.test(value),
    "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก",
  );

// ======================================================
// 5. COMMON PERSONNEL FIELDS
// ======================================================

const thaiNameFields = {
  ac_pname: requiredText("คำนำหน้าชื่อ", 50),
  ac_fname: requiredText("ชื่อภาษาไทย", 150),
  ac_lname: requiredText("นามสกุลภาษาไทย", 150),
};

const englishNameFields = {
  ac_pname_eng: requiredText("คำนำหน้าภาษาอังกฤษ", 50),
  ac_fname_eng: requiredText("First Name", 150),
  ac_lname_eng: requiredText("Last Name", 150),
};

const employmentFields = {
  dep_id: optionalId("หน่วยงาน"),
  ps_id: optionalId("ตำแหน่ง"),
  ps_type_id: optionalId("ประเภทตำแหน่ง"),
  ac_certificate_number: optionalText(100),
};

// ======================================================
// 6. CREATE PERSON SCHEMA
// ======================================================

export const personCreateSchema = z.object({
  // IDENTIFICATION
  ac_cid: cidSchema,
  ac_hn: optionalText(20),
  ac_birthday: requiredBirthday,

  // THAI NAME
  ...thaiNameFields,
  ac_nickname: optionalText(150),

  // ENGLISH NAME
  ...englishNameFields,

  // CONTACT
  ac_email: emailSchema,
  ac_phone_number: phoneSchema,
  ac_address: z.string().trim(),

  // EMPLOYMENT
  ...employmentFields,

  // PROFILE & RFID
  img_profile: optionalText(500),
  rfid: optionalText(100),
});

// ======================================================
// 7. CREATE PERSON TYPES & DEFAULTS
// ======================================================

export type PersonCreateFormValues = z.infer<typeof personCreateSchema>;

export const personCreateDefaults: PersonCreateFormValues = {
  // IDENTIFICATION
  ac_cid: "",
  ac_hn: "",
  ac_birthday: "",

  // THAI NAME
  ac_pname: "",
  ac_fname: "",
  ac_lname: "",
  ac_nickname: "",

  // ENGLISH NAME
  ac_pname_eng: "",
  ac_fname_eng: "",
  ac_lname_eng: "",

  // CONTACT
  ac_email: "",
  ac_phone_number: "",
  ac_address: "",

  // EMPLOYMENT
  dep_id: "",
  ps_id: "",
  ps_type_id: "",
  ac_certificate_number: "",

  // PROFILE
  img_profile: "",
  rfid: "",
};

// ======================================================
// 8. EDIT PERSON SCHEMA
// ======================================================

export const editSchema = z.object({
  // THAI NAME
  ac_pname: optionalText(50),
  ac_fname: requiredText("ชื่อ", 150),
  ac_lname: requiredText("นามสกุล", 150),
  ac_nickname: optionalText(150),

  // ENGLISH NAME
  ac_pname_eng: optionalText(50),
  ac_fname_eng: optionalText(150),
  ac_lname_eng: optionalText(150),

  // BIRTHDAY
  ac_birthday: optionalBirthday,

  // ACCOUNT
  ac_username: optionalText(100),
  ac_hn: optionalText(20),

  // CONTACT
  ac_email: emailSchema,
  ac_phone_number: phoneSchema,

  // EMPLOYMENT
  dep_id: optionalId("หน่วยงาน"),
  ps_id: optionalId("ตำแหน่ง"),
  ps_type_id: optionalId("ประเภทตำแหน่ง"),
  ac_certificate_number: optionalText(100),

  // PERMISSIONS
  ac_role: z.enum(["admin", "member", "user"]),

  level: z
    .string()
    .regex(/^\d+$/, "ระดับสิทธิ์ต้องเป็นตัวเลข")
    .refine(
      (value) => Number(value) <= 100,
      "ระดับสิทธิ์ต้องอยู่ระหว่าง 0–100",
    ),

  ac_active: z.enum(["0", "1"]),
});

// ======================================================
// 9. EDIT PERSON TYPE
// ======================================================

export type PersonEditFormValues = z.infer<typeof editSchema>;
