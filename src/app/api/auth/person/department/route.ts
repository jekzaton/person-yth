import { NextRequest, NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { departments } from "@/db/schema";
import { authorizeAdmin } from "@/lib/server/api-auth";
import { handleApiError } from "@/lib/server/api-error";

// ======================================================
// VALIDATION
// ======================================================

const departmentSchema = z.object({
  dep_name: z
    .string()
    .trim()
    .min(1, "กรุณาระบุชื่อแผนก")
    .max(255, "ชื่อแผนกต้องไม่เกิน 255 ตัวอักษร"),

  dep_phone: z
    .string()
    .trim()
    .max(20, "เบอร์โทรศัพท์ต้องไม่เกิน 20 ตัวอักษร")
    .nullish()
    .transform((value) => value || null),
});

// ======================================================
// MYSQL ERROR HELPER
// ======================================================

function isDuplicateError(error: unknown): boolean {
  const err = error as {
    code?: string;
    errno?: number;
    cause?: {
      code?: string;
      errno?: number;
    };
  };

  return (
    err?.code === "ER_DUP_ENTRY" ||
    err?.errno === 1062 ||
    err?.cause?.code === "ER_DUP_ENTRY" ||
    err?.cause?.errno === 1062
  );
}

// ======================================================
// GET /api/auth/person/department
// ======================================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const result = await db
      .select({
        dep_id: departments.dep_id,
        dep_name: departments.dep_name,
        dep_phone: departments.dep_phone,
      })
      .from(departments)
      .orderBy(desc(departments.dep_id));

    return NextResponse.json(
      {
        success: true,
        message: "ดึงข้อมูลแผนกสำเร็จ",
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, "GET DEPARTMENTS");
  }
}

// ======================================================
// POST /api/auth/person/department
// ======================================================

export async function POST(request: NextRequest) {
  try {
    // --------------------------------------------------
    // AUTHORIZATION
    // --------------------------------------------------

    const auth = await authorizeAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    // --------------------------------------------------
    // READ BODY
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
    // VALIDATE
    // --------------------------------------------------

    const validation = departmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "ข้อมูลแผนกไม่ถูกต้อง",
          errors: z.flattenError(validation.error).fieldErrors,
        },
        { status: 400 },
      );
    }

    const data = validation.data;

    // --------------------------------------------------
    // CHECK DUPLICATE NAME
    // --------------------------------------------------

    const existing = await db
      .select({
        dep_id: departments.dep_id,
      })
      .from(departments)
      .where(eq(departments.dep_name, data.dep_name))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ชื่อแผนกนี้มีอยู่ในระบบแล้ว",
          errors: {
            dep_name: ["ชื่อแผนกนี้มีอยู่ในระบบแล้ว"],
          },
        },
        { status: 409 },
      );
    }

    // --------------------------------------------------
    // INSERT
    // --------------------------------------------------

    let result: Awaited<
      ReturnType<ReturnType<typeof db.insert<typeof departments>>["values"]>
    >;

    try {
      result = await db.insert(departments).values({
        dep_name: data.dep_name,
        dep_phone: data.dep_phone,
      });
    } catch (error) {
      if (isDuplicateError(error)) {
        return NextResponse.json(
          {
            success: false,
            message: "ชื่อแผนกนี้มีอยู่ในระบบแล้ว",
            errors: {
              dep_name: ["ชื่อแผนกนี้มีอยู่ในระบบแล้ว"],
            },
          },
          { status: 409 },
        );
      }

      throw error;
    }

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "เพิ่มแผนกสำเร็จ",
        data: {
          dep_id: result[0].insertId,
          dep_name: data.dep_name,
          dep_phone: data.dep_phone,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "CREATE DEPARTMENT");
  }
}
