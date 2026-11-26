import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";

import ExcelJS from "exceljs";

import { db } from "@/db";
import { tblAccount } from "@/db/schema";
import { authorizeAdmin } from "@/lib/server/api-auth";
import { handleApiError } from "@/lib/server/api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ======================================================
// IMPORT TEMPLATE - 24 COLUMNS
// ======================================================

const PERSONNEL_IMPORT_COLUMNS = [
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

// ======================================================
// HELPERS
// ======================================================

function safeExcel(value: string | null | undefined): string {
  const text = value ?? "";
  return /^\s*[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function maskCid(cid: string): string {
  if (!/^\d{13}$/.test(cid)) return "*************";
  return `${cid[0]}*********${cid.slice(-3)}`;
}

function createWorkbook(): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Person-YTH";
  workbook.lastModifiedBy = "Person-YTH";
  workbook.created = new Date();

  return workbook;
}

function styleSheet(worksheet: ExcelJS.Worksheet, columnCount: number) {
  const header = worksheet.getRow(1);
  header.height = 34;

  for (let i = 1; i <= columnCount; i++) {
    const cell = header.getCell(i);

    cell.font = {
      name: "Arial",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF234EAD" },
    };

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  }

  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columnCount },
  };
}

async function excelResponse(workbook: ExcelJS.Workbook, filename: string) {
  const binary = await workbook.xlsx.writeBuffer();

  // Handle ExcelJS / Node Buffer type differences.
  const source = Buffer.from(binary as unknown as Uint8Array);

  const bytes = new Uint8Array(source.byteLength);
  bytes.set(source);

  return new NextResponse(bytes.buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// ======================================================
// CREATE IMPORT TEMPLATE
// ======================================================

function createImportTemplate(): ExcelJS.Workbook {
  const workbook = createWorkbook();

  const sheet = workbook.addWorksheet("Personnel Import");

  sheet.columns = PERSONNEL_IMPORT_COLUMNS.map((name) => ({
    header: name,
    key: name,
    width:
      name === "ac_address"
        ? 42
        : name.includes("name") || name === "img_profile"
          ? 30
          : 22,
  }));

  // Preserve leading zeros.
  for (const name of ["ac_cid", "ac_hn", "ac_phone_number", "rfid"]) {
    sheet.getColumn(name).numFmt = "@";
  }

  sheet.getColumn("ac_birthday").numFmt = "yyyy-mm-dd";

  // Create blank entry rows with fixed defaults.
  for (let i = 0; i < 50; i++) {
    const row = sheet.addRow({
      level: 1,
      ac_active: 0,
      ac_role: "user",
    });

    row.height = 24;

    if (i % 2 === 0) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" },
        };
      });
    }
  }

  // Keep CID cells as text even in blank entry rows.
  for (let i = 2; i <= 51; i++) {
    sheet.getRow(i).getCell(2).numFmt = "@";
  }

  sheet
    .getColumn("ac_active")
    .eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber === 1) return;

      cell.dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"0,1"'],
      };
    });

  styleSheet(sheet, PERSONNEL_IMPORT_COLUMNS.length);

  // ----------------------------------------------------
  // INSTRUCTIONS
  // ----------------------------------------------------

  const guide = workbook.addWorksheet("Instructions");

  guide.columns = [
    { header: "ฟิลด์", key: "field", width: 28 },
    { header: "วิธีจัดการ", key: "mode", width: 24 },
    { header: "คำอธิบาย", key: "description", width: 80 },
  ];

  const generatedFields = new Set([
    "ac_id",
    "ac_password",
    "ac_username",
    "level",
    "ac_role",
  ]);

  const descriptions: Record<string, string> = {
    ac_id: "ระบบสร้าง Auto Increment ไม่ต้องกรอก",
    ac_cid: "เลขบัตรประชาชน 13 หลัก เก็บเป็น Text",
    ac_hn: "เลข HN เก็บเป็น Text",
    ac_pname: "คำนำหน้าชื่อภาษาไทย",
    ac_fname: "ชื่อภาษาไทย",
    ac_lname: "นามสกุลภาษาไทย",
    ac_pname_eng: "คำนำหน้าชื่อภาษาอังกฤษ",
    ac_fname_eng: "ชื่อภาษาอังกฤษ",
    ac_lname_eng: "นามสกุลภาษาอังกฤษ",
    ac_email: "อีเมล",
    ac_phone_number: "เบอร์โทรศัพท์ เก็บเป็น Text",
    ac_address: "ที่อยู่",
    ac_birthday: "วันเกิด รูปแบบ YYYY-MM-DD",
    dep_id: "รหัสหน่วยงานที่มีอยู่ในฐานข้อมูล",
    ps_id: "รหัสตำแหน่งที่มีอยู่ในฐานข้อมูล",
    ps_type_id: "รหัสประเภทตำแหน่งที่มีอยู่ในฐานข้อมูล",
    ac_certificate_number: "เลขใบประกอบวิชาชีพ",
    img_profile: "ชื่อไฟล์หรือที่อยู่รูปโปรไฟล์",
    rfid: "หมายเลข RFID เก็บเป็น Text",
    level: "ระบบกำหนดค่า 1",
    ac_active: "0 ปิดใช้งาน / 1 เปิดใช้งาน",
    ac_role: "ระบบกำหนดค่า user",
  };

  for (const field of PERSONNEL_IMPORT_COLUMNS) {
    guide.addRow({
      field,
      mode: generatedFields.has(field) ? "ระบบสร้าง/กำหนด" : "กรอกข้อมูล",
      description: descriptions[field],
    });
  }

  styleSheet(guide, 3);

  return workbook;
}

// ======================================================
// GET /api/auth/person/excel
// ======================================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const mode = request.nextUrl.searchParams.get("mode") ?? "export";

    // --------------------------------------------------
    // DOWNLOAD TEMPLATE
    // --------------------------------------------------

    if (mode === "template") {
      const workbook = createImportTemplate();

      return excelResponse(workbook, "personnel-import-template.xlsx");
    }

    if (mode !== "export") {
      return NextResponse.json(
        {
          success: false,
          message: "โหมดดาวน์โหลดไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // EXPORT PERSONNEL
    // --------------------------------------------------

    const persons = await db
      .select({
        ac_id: tblAccount.ac_id,
        ac_cid: tblAccount.ac_cid,
        ac_pname: tblAccount.ac_pname,
        ac_fname: tblAccount.ac_fname,
        ac_lname: tblAccount.ac_lname,
        ac_active: tblAccount.ac_active,
      })
      .from(tblAccount);

    const workbook = createWorkbook();
    const sheet = workbook.addWorksheet("Personnel");

    sheet.columns = [
      {
        header: "รหัสบุคลากร",
        key: "ac_id",
        width: 18,
      },
      {
        header: "เลขบัตรประชาชน (ปิดบัง)",
        key: "cid",
        width: 27,
      },
      {
        header: "คำนำหน้าและชื่อ",
        key: "firstName",
        width: 38,
      },
      {
        header: "นามสกุล",
        key: "lastName",
        width: 35,
      },
      {
        header: "สถานะ",
        key: "status",
        width: 20,
      },
    ];

    sheet.getColumn(2).numFmt = "@";

    for (const person of persons) {
      const row = sheet.addRow({
        ac_id: person.ac_id,
        cid: maskCid(person.ac_cid),
        firstName: safeExcel(
          `${person.ac_pname ?? ""}${person.ac_fname ?? ""}`,
        ),
        lastName: safeExcel(person.ac_lname),
        status: person.ac_active === 1 ? "เปิดใช้งาน" : "ปิดใช้งาน",
      });

      row.height = 25;

      if (row.number % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF1F5F9" },
          };
        });
      }
    }

    styleSheet(sheet, 5);

    const date = new Date().toISOString().slice(0, 10);

    return excelResponse(workbook, `personnel-${date}.xlsx`);
  } catch (error) {
    return handleApiError(error, "PERSONNEL EXCEL GET");
  }
}
