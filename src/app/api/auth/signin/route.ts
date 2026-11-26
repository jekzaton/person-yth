import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/db";
import { tblAccount } from "@/db/schema";

import {
  createAuthToken,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
} from "@/lib/auth";

export const runtime = "nodejs";

// ======================================================
// VALIDATION
// ======================================================

const signinSchema = z.object({
  ac_cid: z
    .string()
    .trim()
    .regex(/^\d{13}$/, "กรุณากรอกเลขบัตรประชาชน 13 หลัก"),

  ac_password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

// POST /api/auth/signin

export async function POST(request: NextRequest) {
  let step = "START";
  try {
    // ==================================================
    // 1. READ JSON
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
    // 2. VALIDATE
    // ==================================================

    const validation = signinSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง",
          errors: z.flattenError(validation.error).fieldErrors,
        },
        { status: 400 },
      );
    }

    const { ac_cid, ac_password } = validation.data;

    // ==================================================
    // 3. FIND ACCOUNT
    // ==================================================
    step = "FIND_ACCOUNT";
    const [account] = await db
      .select({
        ac_id: tblAccount.ac_id,
        ac_cid: tblAccount.ac_cid,
        ac_password: tblAccount.ac_password,

        ac_username: tblAccount.ac_username,

        ac_pname: tblAccount.ac_pname,
        ac_fname: tblAccount.ac_fname,
        ac_lname: tblAccount.ac_lname,

        ac_email: tblAccount.ac_email,
        img_profile: tblAccount.img_profile,

        level: tblAccount.level,
        ac_role: tblAccount.ac_role,
        ac_active: tblAccount.ac_active,
      })
      .from(tblAccount)
      .where(eq(tblAccount.ac_cid, ac_cid))
      .limit(1);

    // ==================================================
    // 4. VERIFY PASSWORD
    // ==================================================

    if (!account?.ac_password) {
      return NextResponse.json(
        {
          success: false,
          message: "เลขบัตรประชาชนหรือรหัสผ่านไม่ถูกต้อง",
        },
        { status: 401 },
      );
    }
    step = "VERIFY_PASSWORD";
    const validPassword = await bcrypt.compare(
      ac_password,
      account.ac_password,
    );

    if (!validPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "เลขบัตรประชาชนหรือรหัสผ่านไม่ถูกต้อง",
        },
        { status: 401 },
      );
    }

    // ==================================================
    // 5. CHECK ACCOUNT STATUS
    // ==================================================

    if (account.ac_active !== 1) {
      return NextResponse.json(
        {
          success: false,
          message: "บัญชีถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
        },
        { status: 403 },
      );
    }

    // ==================================================
    // 6. CREATE JWT
    // ==================================================
    // ใช้ Helper เดียวกับ auth.ts และ proxy.ts
    step = "CREATE_JWT";

    // console.log("[SIGNIN JWT CHECK]", {
    //   acIdValid: Number.isSafeInteger(account.ac_id),
    //   cidValid: /^\d{13}$/.test(account.ac_cid),
    //   role: account.ac_role,
    //   level: account.level,
    //   active: account.ac_active,
    //   secretConfigured: Boolean(process.env.JWT_SECRET),
    //   secretLength: new TextEncoder().encode(process.env.JWT_SECRET ?? "")
    //     .length,
    // });

    const token = await createAuthToken({
      ac_id: account.ac_id,
      ac_cid: account.ac_cid,
      ac_role: account.ac_role,
      level: account.level,
    });

    // ==================================================
    // 7. SUCCESS RESPONSE
    // ==================================================

    const response = NextResponse.json(
      {
        success: true,
        message: "เข้าสู่ระบบสำเร็จ",

        data: {
          ac_id: account.ac_id,
          ac_username: account.ac_username,

          ac_pname: account.ac_pname,
          ac_fname: account.ac_fname,
          ac_lname: account.ac_lname,

          ac_email: account.ac_email,
          img_profile: account.img_profile,

          level: account.level,
          ac_role: account.ac_role,
        },
      },
      { status: 200 },
    );

    response.headers.set("Cache-Control", "no-store");

    // ==================================================
    // 8. SET HTTPONLY COOKIE
    // ==================================================
    step = "SET_COOKIE";
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error("[SIGNIN ERROR]", {
      step,
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
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
