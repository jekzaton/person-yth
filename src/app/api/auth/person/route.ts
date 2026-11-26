import { NextRequest, NextResponse } from "next/server";

import { and, count, desc, eq, like, ne, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { tblAccount, departments, positions, positionType } from "@/db/schema";
import { AuthError, requireAdmin } from "@/lib/auth";
import { z } from "zod";

import bcrypt from "bcryptjs";
import { generatePersonnelUsername } from "@/utils/accountGenerator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LIMIT = 100;

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  if (!value) return fallback;

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

const optionalText = (max: number) => z.string().trim().max(max).nullish();

const optionalId = z.number().int().min(1).max(2147483647).nullish();

const createPersonSchema = z.object({
  // =============================================
  // IDENTIFICATION
  // =============================================

  // ตรวจเฉพาะตัวเลข 13 หลัก
  // ไม่ตรวจ Check Digit ในเวอร์ชันนี้
  ac_cid: z.string().regex(/^\d{13}$/, "กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก"),

  ac_hn: optionalText(20),

  ac_birthday: z.iso.date(),

  // =============================================
  // THAI NAME
  // =============================================

  ac_pname: optionalText(50),

  ac_fname: z.string().trim().min(1, "กรุณากรอกชื่อภาษาไทย").max(150),

  ac_lname: z.string().trim().min(1, "กรุณากรอกนามสกุลภาษาไทย").max(150),

  ac_nickname: optionalText(150),

  // =============================================
  // ENGLISH NAME
  // =============================================

  ac_pname_eng: optionalText(50),
  ac_fname_eng: optionalText(150),
  ac_lname_eng: optionalText(150),

  // =============================================
  // CONTACT
  // =============================================

  ac_email: z.union([z.email(), z.literal(""), z.null()]).optional(),

  ac_phone_number: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^0\d{9}$/.test(value),
      "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก",
    )
    .nullish(),

  ac_address: z.string().trim().nullish(),

  // =============================================
  // WORK INFORMATION
  // =============================================

  dep_id: optionalId,
  ps_id: optionalId,
  ps_type_id: optionalId,

  ac_certificate_number: optionalText(100),

  // =============================================
  // PROFILE & RFID
  // =============================================

  img_profile: optionalText(500),
  rfid: optionalText(100),
});

// เปลี่ยนข้อความว่างให้เป็น null
function emptyToNull(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned || null;
}

function isDuplicateEntry(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const current = error as {
    code?: string;
    errno?: number;
    cause?: unknown;
  };

  if (current.code === "ER_DUP_ENTRY" || current.errno === 1062) {
    return true;
  }

  return current.cause ? isDuplicateEntry(current.cause) : false;
}

// GET /api/auth/person

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);

    const page = parsePositiveInt(searchParams.get("page"), 1, 1_000_000);

    const limit = parsePositiveInt(searchParams.get("limit"), 10, MAX_LIMIT);

    const offset = (page - 1) * limit;

    const search = (searchParams.get("search") ?? "").trim().slice(0, 100);

    const status = searchParams.get("status") ?? "all";
    const role = searchParams.get("role") ?? "all";
    const department = searchParams.get("dep_id");

    // ======================================
    // 3. VALIDATION
    // ======================================

    if (!["all", "active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "ค่า status ไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    const allowedRoles = ["all", "admin", "member", "user"] as const;

    if (!allowedRoles.includes(role as (typeof allowedRoles)[number])) {
      return NextResponse.json(
        {
          success: false,
          message: "ค่า role ไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    // ======================================
    // 4. FILTER CONDITIONS
    // ======================================

    const conditions: SQL[] = [];

    if (search) {
      const escaped = search
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_");

      const keyword = `%${escaped}%`;

      const searchCondition = or(
        like(tblAccount.ac_fname, keyword),
        like(tblAccount.ac_lname, keyword),
        like(tblAccount.ac_fname_eng, keyword),
        like(tblAccount.ac_lname_eng, keyword),
        like(tblAccount.ac_hn, keyword),
        like(tblAccount.ac_username, keyword),
        like(tblAccount.ac_phone_number, keyword),
        like(tblAccount.ac_email, keyword),
      );

      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (status === "active") {
      conditions.push(eq(tblAccount.ac_active, 1));
    }

    if (status === "inactive") {
      conditions.push(ne(tblAccount.ac_active, 1));
    }

    if (role !== "all") {
      conditions.push(
        eq(tblAccount.ac_role, role as "admin" | "member" | "user"),
      );
    }

    if (department) {
      const depId = Number(department);

      if (!Number.isSafeInteger(depId) || depId < 1 || depId > 2147483647) {
        return NextResponse.json(
          {
            success: false,
            message: "รหัสแผนกไม่ถูกต้อง",
          },
          { status: 400 },
        );
      }

      conditions.push(eq(tblAccount.dep_id, depId));
    }

    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;

    // ======================================
    // 5. DATABASE QUERIES
    // ======================================

    const [personnel, totalResult, statsResult] = await Promise.all([
      // PERSONNEL LIST
      db
        .select({
          ac_id: tblAccount.ac_id,
          ac_cid: tblAccount.ac_cid,
          ac_username: tblAccount.ac_username,
          ac_hn: tblAccount.ac_hn,

          ac_pname: tblAccount.ac_pname,
          ac_fname: tblAccount.ac_fname,
          ac_lname: tblAccount.ac_lname,
          ac_nickname: tblAccount.ac_nickname,

          ac_pname_eng: tblAccount.ac_pname_eng,
          ac_fname_eng: tblAccount.ac_fname_eng,
          ac_lname_eng: tblAccount.ac_lname_eng,
          ac_birthday: tblAccount.ac_birthday,
          ac_email: tblAccount.ac_email,
          ac_phone_number: tblAccount.ac_phone_number,

          dep_id: tblAccount.dep_id,
          ps_id: tblAccount.ps_id,
          ac_certificate_number: tblAccount.ac_certificate_number,
          ps_name: positions.ps_name,
          dep_name: departments.dep_name,
          ps_type_id: tblAccount.ps_type_id,
          ps_name_type: positionType.ps_name_type,
          img_profile: tblAccount.img_profile,

          level: tblAccount.level,
          ac_active: tblAccount.ac_active,
          ac_role: tblAccount.ac_role,

          createdAt: tblAccount.createdAt,
          updatedAt: tblAccount.updatedAt,
        })
        .from(tblAccount)
        .leftJoin(positions, eq(tblAccount.ps_id, positions.ps_id))
        .leftJoin(departments, eq(tblAccount.dep_id, departments.dep_id))
        .leftJoin(
          positionType,
          eq(tblAccount.ps_type_id, positionType.ps_type_id),
        )
        .where(whereCondition)
        .orderBy(desc(tblAccount.ac_id))
        .limit(limit)
        .offset(offset),

      // FILTERED TOTAL
      db
        .select({
          total: count(),
        })
        .from(tblAccount)
        .where(whereCondition),

      // GLOBAL STATS
      db
        .select({
          total: count(),

          active: sql<number>`
              SUM(
                CASE
                  WHEN ${tblAccount.ac_active} = 1
                  THEN 1
                  ELSE 0
                END
              )
            `,

          inactive: sql<number>`
              SUM(
                CASE
                  WHEN ${tblAccount.ac_active} <> 1
                  THEN 1
                  ELSE 0
                END
              )
            `,
        })
        .from(tblAccount),
    ]);

    // ======================================
    // 6. FORMAT RESPONSE
    // ======================================

    const total = Number(totalResult[0]?.total ?? 0);

    const stats = statsResult[0];

    // ======================================
    // 7. RESPONSE
    // ======================================

    return NextResponse.json(
      {
        success: true,
        message: "ดึงข้อมูลบุคลากรสำเร็จ",

        data: personnel,

        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },

        stats: {
          total: Number(stats?.total ?? 0),
          active: Number(stats?.active ?? 0),
          inactive: Number(stats?.inactive ?? 0),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    // Authentication / Authorization Error
    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        {
          status: error.status,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // Unexpected Error
    console.error("GET PERSONNEL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการดึงข้อมูลบุคลากร",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ==================================================
    // 1. AUTHORIZATION
    // ==================================================

    await requireAdmin(request);

    // ==================================================
    // 2. READ REQUEST
    // ==================================================

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "รูปแบบ JSON ไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    // ==================================================
    // 3. VALIDATE PERSONNEL DATA
    // ==================================================

    const validation = createPersonSchema.safeParse(body);

    if (!validation.success) {
      const fieldErrors = z.flattenError(validation.error).fieldErrors;

      return NextResponse.json(
        {
          success: false,
          message: "กรุณาตรวจสอบข้อมูลบุคลากร",
          errors: fieldErrors,
          details: fieldErrors,
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const data = validation.data;

    // ==================================================
    // 4. CHECK DUPLICATE CID
    // ==================================================

    const existing = await db
      .select({
        ac_id: tblAccount.ac_id,
      })
      .from(tblAccount)
      .where(eq(tblAccount.ac_cid, data.ac_cid))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว",
          details: {
            ac_cid: ["เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว"],
          },
        },
        {
          status: 409,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // ==================================================
    // 5. GENERATE INITIAL PASSWORD HASH
    // ==================================================

    // ตามข้อกำหนดปัจจุบัน ใช้ CID เป็นรหัสเริ่มต้น
    // ควรเปลี่ยนเป็นรหัสสุ่มและบังคับเปลี่ยนเมื่อเข้าสู่ระบบ
    const hashedPassword = await bcrypt.hash(data.ac_cid, 12);

    // ==================================================
    // 6. CREATE PERSONNEL TRANSACTION
    // ==================================================

    const createdPerson = await db.transaction(async (tx) => {
      // ----------------------------------------------
      // 6.1 INSERT PERSONNEL
      // ----------------------------------------------

      const [insertResult] = await tx.insert(tblAccount).values({
        // IDENTIFICATION
        ac_cid: data.ac_cid,
        ac_password: hashedPassword,
        ac_username: null,

        ac_hn: emptyToNull(data.ac_hn),
        ac_birthday: data.ac_birthday,

        // THAI NAME
        ac_pname: emptyToNull(data.ac_pname),
        ac_fname: data.ac_fname,
        ac_lname: data.ac_lname,
        ac_nickname: emptyToNull(data.ac_nickname),

        // ENGLISH NAME
        ac_pname_eng: emptyToNull(data.ac_pname_eng),
        ac_fname_eng: emptyToNull(data.ac_fname_eng),
        ac_lname_eng: emptyToNull(data.ac_lname_eng),

        // CONTACT
        ac_email: emptyToNull(data.ac_email),
        ac_phone_number: emptyToNull(data.ac_phone_number),
        ac_address: emptyToNull(data.ac_address),

        // EMPLOYMENT
        dep_id: data.dep_id ?? null,
        ps_id: data.ps_id ?? null,
        ps_type_id: data.ps_type_id ?? null,

        ac_certificate_number: emptyToNull(data.ac_certificate_number),

        // PROFILE
        img_profile: emptyToNull(data.img_profile),
        rfid: emptyToNull(data.rfid),

        // DEFAULT PERMISSIONS
        ac_role: "user",
        level: 1,
        ac_active: 1,
      });

      // ----------------------------------------------
      // 6.2 GET NEW PERSONNEL ID
      // ----------------------------------------------

      const acId = Number(insertResult.insertId);

      if (!Number.isSafeInteger(acId) || acId <= 0) {
        throw new Error("ไม่สามารถสร้างรหัสบุคลากรได้");
      }

      // ----------------------------------------------
      // 6.3 GENERATE USERNAME
      // ----------------------------------------------

      // ac_id=1, ps_id=1 => u001001
      // ac_id=12, ps_id=3 => u012003

      const username = generatePersonnelUsername(acId, data.ps_id ?? null);

      // ----------------------------------------------
      // 6.4 UPDATE USERNAME
      // ----------------------------------------------

      await tx
        .update(tblAccount)
        .set({
          ac_username: username,
        })
        .where(eq(tblAccount.ac_id, acId));

      // ----------------------------------------------
      // 6.5 RETURN CREATED ACCOUNT
      // ----------------------------------------------

      return {
        ac_id: acId,
        ac_username: username,
        ac_fname: data.ac_fname,
        ac_lname: data.ac_lname,
        ac_role: "user" as const,
        level: 1,
        ac_active: 1,
      };
    });

    // ==================================================
    // 7. SUCCESS
    // ==================================================

    return NextResponse.json(
      {
        success: true,
        message: "เพิ่มข้อมูลบุคลากรสำเร็จ",
        data: createdPerson,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    // ==================================================
    // 8. AUTHORIZATION ERROR
    // ==================================================

    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        {
          status: error.status,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // ==================================================
    // 9. MYSQL DUPLICATE ERROR
    // ==================================================

    if (isDuplicateEntry(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "เลขบัตรประชาชนหรือ Username มีอยู่ในระบบแล้ว",
        },
        {
          status: 409,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // ==================================================
    // 10. UNEXPECTED ERROR
    // ==================================================

    console.error("CREATE PERSONNEL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูลบุคลากร",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
