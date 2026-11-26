import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/db";
import { tblAccount } from "@/db/schema";

// ======================================================
// VALIDATION
// ======================================================

const registerSchema = z.object({
  ac_cid: z
    .string()
    .trim()
    .regex(/^\d{13}$/, "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก"),

  ac_username: z
    .string()
    .trim()
    .min(4, "ชื่อผู้ใช้ต้องมีอย่างน้อย 4 ตัวอักษร")
    .max(100, "ชื่อผู้ใช้ยาวเกินกำหนด"),

  ac_password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),

  ac_pname: z.string().trim().max(50).optional(),
  ac_fname: z.string().trim().min(1, "กรุณาระบุชื่อ"),
  ac_lname: z.string().trim().min(1, "กรุณาระบุนามสกุล"),

  ac_email: z.union([z.email(), z.literal("")]).optional(),

  ac_phone_number: z
    .union([
      z.string().regex(/^\d{9,10}$/, "เบอร์โทรศัพท์ไม่ถูกต้อง"),
      z.literal(""),
    ])
    .optional(),

  ac_birthday: z.union([z.iso.date(), z.literal("")]).optional(),
});

// ======================================================
// POST /api/auth/register
// ======================================================

export async function POST(request: NextRequest) {
  try {
    // --------------------------------------------------
    // 1. Read request body
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 2. Validate data
    // --------------------------------------------------

    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "ข้อมูลสมัครสมาชิกไม่ถูกต้อง",
          errors: z.flattenError(validation.error).fieldErrors,
        },
        { status: 400 },
      );
    }

    const data = validation.data;

    // --------------------------------------------------
    // 3. Check existing account
    // --------------------------------------------------

    const existingAccount = await db
      .select({
        ac_id: tblAccount.ac_id,
        ac_cid: tblAccount.ac_cid,
        ac_username: tblAccount.ac_username,
      })
      .from(tblAccount)
      .where(
        or(
          eq(tblAccount.ac_cid, data.ac_cid),
          eq(tblAccount.ac_username, data.ac_username),
        ),
      )
      .limit(1);

    if (existingAccount.length > 0) {
      const account = existingAccount[0];

      if (account.ac_cid === data.ac_cid) {
        return NextResponse.json(
          {
            success: false,
            message: "เลขบัตรประชาชนนี้ถูกลงทะเบียนแล้ว",
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว",
        },
        { status: 409 },
      );
    }

    // --------------------------------------------------
    // 4. Hash password
    // --------------------------------------------------

    const hashedPassword = await bcrypt.hash(data.ac_password, 12);

    // --------------------------------------------------
    // 5. Insert account
    // --------------------------------------------------

    const result = await db.insert(tblAccount).values({
      ac_cid: data.ac_cid,
      ac_username: data.ac_username,
      ac_password: hashedPassword,

      ac_pname: data.ac_pname || null,
      ac_fname: data.ac_fname,
      ac_lname: data.ac_lname,

      ac_email: data.ac_email || null,
      ac_phone_number: data.ac_phone_number || null,
      ac_birthday: data.ac_birthday || null,

      level: 1,
      ac_active: 1,
      ac_role: "user",
    });

    // --------------------------------------------------
    // 6. Response
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "สมัครสมาชิกสำเร็จ",
        data: {
          ac_id: result[0].insertId,
          ac_cid: data.ac_cid,
          ac_username: data.ac_username,
          ac_fname: data.ac_fname,
          ac_lname: data.ac_lname,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("REGISTER ERROR:", error);

    // MySQL duplicate key
    if (
      error instanceof Error &&
      (error.message.includes("ER_DUP_ENTRY") ||
        error.message.includes("Duplicate entry"))
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "เลขบัตรประชาชนหรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการสมัครสมาชิก",
      },
      { status: 500 },
    );
  }
}
