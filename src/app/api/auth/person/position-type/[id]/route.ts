import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { positionType } from "@/db/schema/position_type";
import { tblAccount } from "@/db/schema/tbl_account";

import { AuthError, requireAuth, requireAdmin } from "@/lib/auth";

// ======================================================
// CONFIGURATION
// ======================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NAME_LENGTH = 255;

// Next.js 15/16: Dynamic Route params เป็น Promise
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// ======================================================
// RESPONSE HELPERS
// ======================================================

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function successResponse<T>(message: string, data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function isDuplicateEntry(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    errno?: number;
    cause?: unknown;
  };

  if (candidate.code === "ER_DUP_ENTRY" || candidate.errno === 1062) {
    return true;
  }

  return candidate.cause ? isDuplicateEntry(candidate.cause) : false;
}

function handleError(error: unknown) {
  if (error instanceof AuthError) {
    return errorResponse(error.message, error.status);
  }

  if (isDuplicateEntry(error)) {
    return errorResponse(
      "ไม่สามารถบันทึกได้ เนื่องจากมีประเภทตำแหน่งชื่อนี้อยู่แล้ว",
      409,
    );
  }

  console.error("[POSITION_TYPE_ID_API]", error);

  return errorResponse("เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", 500);
}

function parseId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id)) {
    return null;
  }

  return id;
}

type ValidationResult =
  | {
      valid: true;
      name: string;
    }
  | {
      valid: false;
      message: string;
    };

function validateName(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      valid: false,
      message: "รูปแบบข้อมูลไม่ถูกต้อง",
    };
  }

  const value = Reflect.get(body, "ps_name_type");

  if (typeof value !== "string") {
    return {
      valid: false,
      message: "กรุณากรอกชื่อประเภทตำแหน่ง",
    };
  }

  const name = value.trim();

  if (!name) {
    return {
      valid: false,
      message: "กรุณากรอกชื่อประเภทตำแหน่ง",
    };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return {
      valid: false,
      message: `ชื่อประเภทตำแหน่งต้องไม่เกิน ${MAX_NAME_LENGTH} ตัวอักษร`,
    };
  }

  return {
    valid: true,
    name,
  };
}

// ======================================================
// GET /api/auth/person/position-type/[id]
// ======================================================
// ผู้ใช้ที่ Login แล้วทุก Role สามารถดูได้
// ======================================================

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // 1. AUTHENTICATION
    await requireAuth(request);

    // 2. VALIDATE ID
    const { id: rawId } = await context.params;
    const id = parseId(rawId);

    if (id === null) {
      return errorResponse("รหัสประเภทตำแหน่งไม่ถูกต้อง", 400);
    }

    // 3. FETCH DATA
    const [item] = await db
      .select({
        ps_type_id: positionType.ps_type_id,
        ps_name_type: positionType.ps_name_type,
      })
      .from(positionType)
      .where(eq(positionType.ps_type_id, id))
      .limit(1);

    if (!item) {
      return errorResponse("ไม่พบข้อมูลประเภทตำแหน่ง", 404);
    }

    return successResponse("ดึงข้อมูลประเภทตำแหน่งสำเร็จ", item);
  } catch (error) {
    return handleError(error);
  }
}

async function updatePositionType(request: NextRequest, context: RouteContext) {
  try {
    // 1. ตรวจสิทธิ์ Admin
    await requireAdmin(request);

    // 2. ตรวจ ID
    const { id: rawId } = await context.params;
    const id = parseId(rawId);

    if (id === null) {
      return errorResponse("รหัสประเภทตำแหน่งไม่ถูกต้อง", 400);
    }

    // 3. อ่าน JSON
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("รูปแบบ JSON ไม่ถูกต้อง", 400);
    }

    // 4. ตรวจชื่อที่ส่งมา
    const validation = validateName(body);

    if (!validation.valid) {
      return errorResponse(validation.message, 400);
    }

    const ps_name_type = validation.name.replace(/\s+/g, " ");

    // 5. ตรวจว่ารายการนี้มีอยู่จริง
    const [existing] = await db
      .select({
        ps_type_id: positionType.ps_type_id,
        ps_name_type: positionType.ps_name_type,
      })
      .from(positionType)
      .where(eq(positionType.ps_type_id, id))
      .limit(1);

    if (!existing) {
      return errorResponse("ไม่พบประเภทตำแหน่งที่ต้องการแก้ไข", 404);
    }

    // 6. ตรวจชื่อซ้ำกับรายการอื่น (ยกเว้น ID ตัวเอง)
    const [duplicate] = await db
      .select({
        ps_type_id: positionType.ps_type_id,
      })
      .from(positionType)
      .where(
        and(
          ne(positionType.ps_type_id, id),
          sql`
            LOWER(TRIM(${positionType.ps_name_type}))
            = LOWER(${ps_name_type})
          `,
        ),
      )
      .limit(1);

    if (duplicate) {
      return errorResponse(
        "ไม่สามารถแก้ไขได้ เนื่องจากมีประเภทตำแหน่งชื่อนี้อยู่แล้ว",
        409,
      );
    }

    // 7. ชื่อไม่เปลี่ยน ไม่จำเป็นต้อง UPDATE
    if (existing.ps_name_type === ps_name_type) {
      return successResponse(
        "ข้อมูลประเภทตำแหน่งไม่มีการเปลี่ยนแปลง",
        existing,
      );
    }

    // 8. อัปเดตข้อมูล
    await db
      .update(positionType)
      .set({ ps_name_type })
      .where(eq(positionType.ps_type_id, id));

    return successResponse("แก้ไขประเภทตำแหน่งสำเร็จ", {
      ps_type_id: id,
      ps_name_type,
    });
  } catch (error) {
    return handleError(error);
  }
}

// ======================================================
// PUT /api/auth/person/position-type/[id]
// ======================================================

export async function PUT(request: NextRequest, context: RouteContext) {
  return updatePositionType(request, context);
}

// ======================================================
// PATCH /api/auth/person/position-type/[id]
// ======================================================

export async function PATCH(request: NextRequest, context: RouteContext) {
  return updatePositionType(request, context);
}

// ======================================================
// DELETE /api/auth/person/position-type/[id]
// ======================================================
// Admin เท่านั้น
// ป้องกันการลบเมื่อมีบุคลากรใช้งานอยู่
// ======================================================

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // 1. CHECK ADMIN
    await requireAdmin(request);

    // 2. VALIDATE ID
    const { id: rawId } = await context.params;
    const id = parseId(rawId);

    if (id === null) {
      return errorResponse("รหัสประเภทตำแหน่งไม่ถูกต้อง", 400);
    }

    // 3. CHECK EXISTING RECORD
    const [existing] = await db
      .select({
        ps_type_id: positionType.ps_type_id,
        ps_name_type: positionType.ps_name_type,
      })
      .from(positionType)
      .where(eq(positionType.ps_type_id, id))
      .limit(1);

    if (!existing) {
      return errorResponse("ไม่พบประเภทตำแหน่งที่ต้องการลบ", 404);
    }

    // 4. CHECK REFERENCES IN PERSONNEL
    const [referenced] = await db
      .select({
        ac_id: tblAccount.ac_id,
      })
      .from(tblAccount)
      .where(eq(tblAccount.ps_type_id, id))
      .limit(1);

    if (referenced) {
      return errorResponse(
        "ไม่สามารถลบประเภทตำแหน่งนี้ได้ เนื่องจากมีบุคลากรใช้งานอยู่",
        409,
      );
    }

    // 5. DELETE RECORD
    await db.delete(positionType).where(eq(positionType.ps_type_id, id));

    // 6. RESPONSE
    return successResponse("ลบประเภทตำแหน่งสำเร็จ", {
      ps_type_id: existing.ps_type_id,
      ps_name_type: existing.ps_name_type,
    });
  } catch (error) {
    return handleError(error);
  }
}
