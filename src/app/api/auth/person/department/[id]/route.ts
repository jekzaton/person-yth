import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { departments, tblAccount } from "@/db/schema";
import { authorizeAdmin } from "@/lib/server/api-auth";
import { handleApiError } from "@/lib/server/api-error";

// ======================================================
// TYPES
// ======================================================

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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
// HELPERS
// ======================================================

function parseDepartmentId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id) || id > 2147483647) {
    return null;
  }

  return id;
}

function getDatabaseError(error: unknown) {
  const err = error as {
    code?: string;
    errno?: number;
    cause?: {
      code?: string;
      errno?: number;
    };
  };

  return {
    code: err?.cause?.code ?? err?.code,
    errno: err?.cause?.errno ?? err?.errno,
  };
}

// ======================================================
// PUT /api/auth/person/department/:id
// ======================================================

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // AUTH
    const auth = await authorizeAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    // PARAMS
    const { id: rawId } = await context.params;
    const depId = parseDepartmentId(rawId);

    if (depId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "รหัสแผนกไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    // BODY
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

    // VALIDATE
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

    // CHECK EXISTENCE
    const [existing] = await db
      .select({
        dep_id: departments.dep_id,
      })
      .from(departments)
      .where(eq(departments.dep_id, depId))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลแผกที่ต้องการแก้ไข",
        },
        { status: 404 },
      );
    }

    // CHECK DUPLICATE NAME
    const [duplicate] = await db
      .select({
        dep_id: departments.dep_id,
      })
      .from(departments)
      .where(
        and(
          eq(departments.dep_name, data.dep_name),
          ne(departments.dep_id, depId),
        ),
      )
      .limit(1);

    if (duplicate) {
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

    // UPDATE
    await db
      .update(departments)
      .set({
        dep_name: data.dep_name,
        dep_phone: data.dep_phone,
      })
      .where(eq(departments.dep_id, depId));

    return NextResponse.json(
      {
        success: true,
        message: "แก้ไขข้อมูลแผนกสำเร็จ",
        data: {
          dep_id: depId,
          dep_name: data.dep_name,
          dep_phone: data.dep_phone,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const dbError = getDatabaseError(error);

    if (dbError.code === "ER_DUP_ENTRY" || dbError.errno === 1062) {
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

    return handleApiError(error, "UPDATE DEPARTMENT");
  }
}

// ======================================================
// DELETE /api/auth/person/department/:id
// ======================================================

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // AUTH
    const auth = await authorizeAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    // PARAMS
    const { id: rawId } = await context.params;
    const depId = parseDepartmentId(rawId);

    if (depId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "รหัสแผนกไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    // CHECK EXISTENCE
    const [existing] = await db
      .select({
        dep_id: departments.dep_id,
        dep_name: departments.dep_name,
      })
      .from(departments)
      .where(eq(departments.dep_id, depId))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบแผนกที่ต้องการลบ",
        },
        { status: 404 },
      );
    }

    // CHECK DEPARTMENT USAGE
    const [assignedPerson] = await db
      .select({
        ac_id: tblAccount.ac_id,
      })
      .from(tblAccount)
      .where(eq(tblAccount.dep_id, depId))
      .limit(1);

    if (assignedPerson) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถลบแผนกนี้ได้ เนื่องจากมีบุคลากรสังกัดอยู่ กรุณาย้ายบุคลากรไปแผนกอื่นก่อน",
        },
        { status: 409 },
      );
    }

    // DELETE
    await db.delete(departments).where(eq(departments.dep_id, depId));

    return NextResponse.json(
      {
        success: true,
        message: "ลบแผนกสำเร็จ",
        data: {
          dep_id: depId,
          dep_name: existing.dep_name,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const dbError = getDatabaseError(error);

    if (dbError.code === "ER_ROW_IS_REFERENCED_2" || dbError.errno === 1451) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่สามารถลบแผนกนี้ได้ เนื่องจากมีข้อมูลอื่นใช้งานอยู่",
        },
        { status: 409 },
      );
    }

    return handleApiError(error, "DELETE DEPARTMENT");
  }
}
