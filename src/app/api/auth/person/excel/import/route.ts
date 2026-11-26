import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";

import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { tblAccount } from "@/db/schema";
import { authorizeAdmin } from "@/lib/server/api-auth";
import { handleApiError } from "@/lib/server/api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_REPORTED_ERRORS = 100;
const LOOKUP_BATCH_SIZE = 500;
const MAX_MYSQL_ID = 2147483647;
const NO_STORE = { "Cache-Control": "private, no-store" };

const IMPORT_COLUMNS = [
  "ac_id",
  "ac_cid",
  "ac_hn",
  "ac_pname",
  "ac_fname",
  "ac_lname",
  "ac_pname_eng",
  "ac_fname_eng",
  "ac_lname_eng",
  "ac_email",
  "ac_phone_number",
  "ac_address",
  "ac_birthday",
  "dep_id",
  "ps_id",
  "ps_type_id",
  "ac_certificate_number",
  "img_profile",
  "rfid",
  "level",
  "ac_active",
  "ac_role",
] as const;

type ImportColumn = (typeof IMPORT_COLUMNS)[number];
type ImportRowValues = Record<ImportColumn, string>;

type ImportPerson = {
  // IMPORTANT: Retain ac_id from Excel instead of MySQL AUTO_INCREMENT.
  ac_id: number;
  ac_cid: string;
  ac_hn: string | null;
  ac_pname: string | null;
  ac_fname: string;
  ac_lname: string;
  ac_pname_eng: string | null;
  ac_fname_eng: string | null;
  ac_lname_eng: string | null;
  ac_email: string | null;
  ac_phone_number: string | null;
  ac_address: string | null;
  ac_birthday: string | null;
  dep_id: number | null;
  ps_id: number;
  ps_type_id: number | null;
  ac_certificate_number: string | null;
  img_profile: string | null;
  rfid: string | null;
};

type ImportErrorItem = {
  row: number;
  field: string;
  message: string;
};

type ImportResult = {
  total: number;
  imported: number;
  skipped: number;
  invalid: number;
  duplicateInFile: number;
  duplicateInDatabase: number;
  errors: ImportErrorItem[];
  errorsTruncated: boolean;
};

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

function badRequest(message: string, status = 400) {
  return jsonResponse({ success: false, message }, status);
}

class RowValidationError extends Error {
  constructor(
    public rowNumber: number,
    public field: string,
    message: string,
  ) {
    super(message);
    this.name = "RowValidationError";
  }
}

function rowError(row: number, field: string, message: string): never {
  throw new RowValidationError(row, field, message);
}

function textOrNull(value: string): string | null {
  return value.trim() || null;
}

const MAX_LENGTHS: Partial<Record<ImportColumn, number>> = {
  ac_cid: 13,
  ac_hn: 20,
  ac_pname: 50,
  ac_fname: 150,
  ac_lname: 150,
  ac_pname_eng: 50,
  ac_fname_eng: 150,
  ac_lname_eng: 150,
  ac_email: 255,
  ac_phone_number: 30,
  ac_certificate_number: 100,
  img_profile: 500,
  rfid: 100,
};

function validateLength(value: string, field: ImportColumn, row: number) {
  const max = MAX_LENGTHS[field] ?? 255;
  if (value.length > max) {
    rowError(row, field, `${field} ยาวเกิน ${max} ตัวอักษร`);
  }
}

function validCidFormat(cid: string): boolean {
  return /^\d{13}$/.test(cid);
}

function validCidChecksum(cid: string): boolean {
  if (!validCidFormat(cid)) return false;
  const sum = cid
    .slice(0, 12)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * (13 - index), 0);
  return (11 - (sum % 11)) % 10 === Number(cid[12]);
}

function parseId(
  value: string,
  field: string,
  row: number,
  required = false,
): number | null {
  if (!value) {
    if (required) rowError(row, field, `กรุณาระบุ ${field}`);
    return null;
  }
  if (!/^[1-9]\d*$/.test(value)) {
    rowError(row, field, `${field} ต้องเป็นจำนวนเต็มบวก`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > MAX_MYSQL_ID) {
    rowError(row, field, `${field} ไม่ถูกต้องหรือเกินช่วง INT`);
  }
  return parsed;
}

function parseBirthday(value: string, row: number): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    rowError(row, "ac_birthday", "วันเกิดต้องเป็น YYYY-MM-DD");
  }
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1000 || year > 9999) {
    rowError(row, "ac_birthday", "ปีเกิดไม่ถูกต้อง");
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    rowError(row, "ac_birthday", "วันเกิดไม่มีอยู่จริง");
  }
  return value;
}

// Preserve the existing import username convention.
function generateUsername(acId: number, psId: number): string {
  return `u${String(acId).padStart(3, "0")}${String(psId).padStart(3, "0")}`;
}

function readCell(row: ExcelJS.Row, index: number): string {
  const cell = row.getCell(index);
  const value = cell.value;
  const field = IMPORT_COLUMNS[index - 1];

  if (
    cell.type === ExcelJS.ValueType.Formula ||
    (value !== null &&
      typeof value === "object" &&
      ("formula" in value || "sharedFormula" in value))
  ) {
    rowError(row.number, field, "ไม่อนุญาตให้ใช้สูตร Excel");
  }
  if (cell.type === ExcelJS.ValueType.Error) {
    rowError(row.number, field, "พบค่า Error ใน Excel");
  }
  if (field === "ac_birthday" && value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (value !== null && typeof value === "object") {
    rowError(row.number, field, "ชนิดข้อมูล Excel ไม่รองรับ");
  }
  return cell.text.trim();
}

function parsePerson(values: ImportRowValues, row: ExcelJS.Row): ImportPerson {
  const rowNumber = row.number;
  const acId = parseId(values.ac_id, "ac_id", rowNumber, true);
  if (acId === null) {
    rowError(rowNumber, "ac_id", "ac_id ไม่ถูกต้อง");
  }
  if (row.getCell(2).type === ExcelJS.ValueType.Number) {
    rowError(rowNumber, "ac_cid", "CID ต้องกำหนดเซลล์เป็น Text");
  }
  if (!validCidFormat(values.ac_cid)) {
    rowError(rowNumber, "ac_cid", "CID ต้องเป็นตัวเลข 13 หลัก");
  }
  if (!validCidChecksum(values.ac_cid)) {
    rowError(rowNumber, "ac_cid", "CID ไม่ผ่านการตรวจสอบเลขตรวจสอบ");
  }
  if (!values.ac_fname) rowError(rowNumber, "ac_fname", "กรุณาระบุชื่อ");
  if (!values.ac_lname) rowError(rowNumber, "ac_lname", "กรุณาระบุนามสกุล");
  for (const field of IMPORT_COLUMNS) {
    validateLength(values[field], field, rowNumber);
  }

  const psId = parseId(values.ps_id, "ps_id", rowNumber, true);
  if (psId === null) rowError(rowNumber, "ps_id", "กรุณาระบุรหัสตำแหน่ง");

  const depId = parseId(values.dep_id, "dep_id", rowNumber);
  const psTypeId = parseId(values.ps_type_id, "ps_type_id", rowNumber);
  const birthday = parseBirthday(values.ac_birthday, rowNumber);

  if (values.level && values.level !== "1") {
    rowError(rowNumber, "level", "level ต้องเป็น 1");
  }
  if (values.ac_role && values.ac_role !== "user") {
    rowError(rowNumber, "ac_role", "ac_role ต้องเป็น user");
  }
  if (
    values.ac_active &&
    values.ac_active !== "0" &&
    values.ac_active !== "1"
  ) {
    rowError(rowNumber, "ac_active", "ac_active ต้องเป็น 0 หรือ 1");
  }

  return {
    ac_id: acId,
    ac_cid: values.ac_cid,
    ac_hn: textOrNull(values.ac_hn),
    ac_pname: textOrNull(values.ac_pname),
    ac_fname: values.ac_fname,
    ac_lname: values.ac_lname,
    ac_pname_eng: textOrNull(values.ac_pname_eng),
    ac_fname_eng: textOrNull(values.ac_fname_eng),
    ac_lname_eng: textOrNull(values.ac_lname_eng),
    ac_email: textOrNull(values.ac_email),
    ac_phone_number: textOrNull(values.ac_phone_number),
    ac_address: textOrNull(values.ac_address),
    ac_birthday: birthday,
    dep_id: depId,
    ps_id: psId,
    ps_type_id: psTypeId,
    ac_certificate_number: textOrNull(values.ac_certificate_number),
    img_profile: textOrNull(values.img_profile),
    rfid: textOrNull(values.rfid),
  };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeAdmin(request);
    if (!auth.authorized) return auth.response;

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return badRequest("กรุณาอัปโหลดแบบ multipart/form-data");
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return badRequest("ไม่สามารถอ่านไฟล์ที่อัปโหลดได้");
    }
    const file = formData.get("file");
    if (!(file instanceof File)) return badRequest("กรุณาเลือกไฟล์ Excel");
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return badRequest("รองรับเฉพาะไฟล์ .xlsx");
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return badRequest("ไฟล์ Excel ต้องไม่เกิน 10 MB และต้องไม่ว่าง");
    }

    const workbook = new ExcelJS.Workbook();
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await workbook.xlsx.load(
        buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
      );
    } catch {
      return badRequest("ไม่สามารถอ่านไฟล์ Excel ได้");
    }

    const sheet = workbook.getWorksheet("Personnel Import");
    if (!sheet) return badRequest("ไม่พบ Worksheet ชื่อ Personnel Import");

    const incorrectHeaders = IMPORT_COLUMNS.some(
      (field, index) =>
        sheet
          .getRow(1)
          .getCell(index + 1)
          .text.trim() !== field,
    );
    if (incorrectHeaders) {
      return badRequest(
        "หัวคอลัมน์ Excel ไม่ตรงกับ Template กรุณาดาวน์โหลดไฟล์ตัวอย่างใหม่",
      );
    }

    const accounts: ImportPerson[] = [];
    const seenCids = new Set<string>();
    const seenIds = new Set<number>();
    const errors: ImportErrorItem[] = [];
    let total = 0;
    let invalid = 0;
    let duplicateInFile = 0;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      try {
        const values = {} as ImportRowValues;
        for (let index = 0; index < IMPORT_COLUMNS.length; index++) {
          const field = IMPORT_COLUMNS[index];
          values[field] = readCell(row, index + 1);
        }
        const hasData = IMPORT_COLUMNS.some(
          (field) =>
            !["level", "ac_active", "ac_role"].includes(field) &&
            values[field] !== "",
        );
        if (!hasData) return;
        total++;

        // Keep original duplicate CID skip semantics.
        const cid = values.ac_cid;
        if (validCidChecksum(cid) && seenCids.has(cid)) {
          duplicateInFile++;
          return;
        }

        const person = parsePerson(values, row);
        if (seenIds.has(person.ac_id)) {
          rowError(
            rowNumber,
            "ac_id",
            `พบ ac_id ${person.ac_id} ซ้ำในไฟล์ Excel`,
          );
        }
        seenIds.add(person.ac_id);
        seenCids.add(person.ac_cid);
        accounts.push(person);
      } catch (error) {
        invalid++;
        if (errors.length < MAX_REPORTED_ERRORS) {
          if (error instanceof RowValidationError) {
            errors.push({
              row: error.rowNumber,
              field: error.field,
              message: error.message,
            });
          } else {
            errors.push({
              row: rowNumber,
              field: "unknown",
              message:
                error instanceof Error ? error.message : "ข้อมูลไม่ถูกต้อง",
            });
          }
        }
      }
    });

    // Find existing CIDs and skip those rows; do not mutate existing people.
    const existingCids = new Set<string>();
    for (let i = 0; i < accounts.length; i += LOOKUP_BATCH_SIZE) {
      const batch = accounts.slice(i, i + LOOKUP_BATCH_SIZE);
      const existing = await db
        .select({ ac_cid: tblAccount.ac_cid })
        .from(tblAccount)
        .where(
          inArray(
            tblAccount.ac_cid,
            batch.map((person) => person.ac_cid),
          ),
        );
      for (const item of existing) existingCids.add(item.ac_cid);
    }

    const newAccounts = accounts.filter(
      (person) => !existingCids.has(person.ac_cid),
    );
    const duplicateInDatabase = accounts.length - newAccounts.length;
    const skipped = duplicateInFile + duplicateInDatabase;

    if (newAccounts.length === 0) {
      const result: ImportResult = {
        total,
        imported: 0,
        skipped,
        invalid,
        duplicateInFile,
        duplicateInDatabase,
        errors,
        errorsTruncated: invalid > errors.length,
      };
      return jsonResponse({
        success: true,
        message: `ตรวจสอบ ${total} รายการ ข้ามข้อมูลซ้ำ ${skipped} รายการ ข้อมูลไม่ถูกต้อง ${invalid} รายการ`,
        data: result,
      });
    }

    // Reject the entire import if any NEW account ID conflicts with an existing ID.
    // This prevents overwriting another person's record.
    const existingIds = new Set<number>();
    for (let i = 0; i < newAccounts.length; i += LOOKUP_BATCH_SIZE) {
      const batch = newAccounts.slice(i, i + LOOKUP_BATCH_SIZE);
      const existing = await db
        .select({ ac_id: tblAccount.ac_id })
        .from(tblAccount)
        .where(
          inArray(
            tblAccount.ac_id,
            batch.map((person) => person.ac_id),
          ),
        );
      for (const item of existing) existingIds.add(item.ac_id);
    }
    if (existingIds.size > 0) {
      const conflicts = [...existingIds].sort((a, b) => a - b).slice(0, 20);
      return jsonResponse(
        {
          success: false,
          message:
            "ไม่สามารถนำเข้าได้ เนื่องจาก ac_id ใน Excel ซ้ำกับข้อมูลที่มีอยู่ใน MySQL",
          data: { conflictingIds: conflicts, totalConflicts: existingIds.size },
        },
        409,
      );
    }

    // Keep the existing imported-account defaults. For production, replace
    // CID-based initial passwords with securely generated temporary passwords.
    const prepared: Array<ImportPerson & { ac_password: string }> = [];
    for (const person of newAccounts) {
      prepared.push({
        ...person,
        ac_password: await bcrypt.hash(person.ac_cid, 10),
      });
    }

    await db.transaction(async (tx) => {
      for (const person of prepared) {
        const acId = person.ac_id;
        const temporaryUsername = `i_${randomUUID().replace(/-/g, "")}`;
        const insertValues = {
          ...person,
          // Explicitly INSERT the Excel ID, not a new AUTO_INCREMENT value.
          ac_id: acId,
          ac_birthday:
            person.ac_birthday as typeof tblAccount.$inferInsert.ac_birthday,
          ac_username: temporaryUsername,
          level: 1,
          ac_active: 0,
          ac_role: "user" as const,
        } satisfies typeof tblAccount.$inferInsert;

        // Exactly one insert per person. Duplicate IDs/CIDs cause rollback.
        await tx.insert(tblAccount).values(insertValues);

        const username = generateUsername(acId, person.ps_id);
        await tx
          .update(tblAccount)
          .set({ ac_username: username })
          .where(eq(tblAccount.ac_id, acId));
      }
    });

    const result: ImportResult = {
      total,
      imported: prepared.length,
      skipped,
      invalid,
      duplicateInFile,
      duplicateInDatabase,
      errors,
      errorsTruncated: invalid > errors.length,
    };

    return jsonResponse(
      {
        success: true,
        message: `ตรวจสอบ ${total} รายการ นำเข้าใหม่ ${result.imported} รายการ ข้ามข้อมูลซ้ำ ${skipped} รายการ ข้อมูลไม่ถูกต้อง ${invalid} รายการ`,
        data: result,
      },
      201,
    );
  } catch (error) {
    const dbError = error as {
      code?: string;
      errno?: number;
      cause?: { code?: string; errno?: number };
    };
    if (
      dbError.code === "ER_DUP_ENTRY" ||
      dbError.errno === 1062 ||
      dbError.cause?.code === "ER_DUP_ENTRY" ||
      dbError.cause?.errno === 1062
    ) {
      return badRequest(
        "พบข้อมูลซ้ำระหว่างบันทึก กรุณาลองนำเข้าใหม่ ข้อมูลเดิมไม่ได้ถูกแก้ไข",
        409,
      );
    }
    return handleApiError(error, "PERSONNEL EXCEL IMPORT");
  }
}
