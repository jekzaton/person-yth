import { NextRequest, NextResponse } from "next/server";
import { asc, count, sql } from "drizzle-orm";

import { db } from "@/db";
import { positionType } from "@/db/schema/position_type";

import { AuthError, requireAuth, requireAdmin } from "@/lib/auth";

// ======================================================
// CONFIG
// ======================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NAME_LENGTH = 255;

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

  if (candidate.cause && candidate.cause !== error) {
    return isDuplicateEntry(candidate.cause);
  }

  return false;
}
function handleError(error: unknown) {
  if (error instanceof AuthError) {
    return errorResponse(error.message, error.status);
  }

  if (isDuplicateEntry(error)) {
    return errorResponse("มีประเภทตำแหน่งชื่อนี้อยู่ในระบบแล้ว", 409);
  }

  console.error("[POSITION_TYPE_API]", error);

  return errorResponse("เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", 500);
}

// ======================================================
// VALIDATION
// ======================================================

function validateName(body: unknown):
  | { valid: true; name: string }
  | {
      valid: false;
      message: string;
    } {
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

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const rows = await db
      .select({
        ps_type_id: positionType.ps_type_id,
        ps_name_type: positionType.ps_name_type,
      })
      .from(positionType)
      .orderBy(asc(positionType.ps_type_id));

    return NextResponse.json(
      {
        success: true,
        message: "ดึงข้อมูลประเภทตำแหน่งสำเร็จ",
        data: rows,
        total: rows.length,
        canManage: user.ac_role === "admin",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("[POSITION_TYPE_GET_ERROR]", error);

    return handleError(error);
  }
}

// ======================================================
// POST /api/auth/person/position-type
// ======================================================
// Admin เท่านั้น
// ======================================================

export async function POST(request: NextRequest) {
  try {
    // 1. CHECK ADMIN PERMISSION
    await requireAdmin(request);

    // 2. PARSE REQUEST BODY
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("รูปแบบ JSON ไม่ถูกต้อง", 400);
    }

    // 3. VALIDATE INPUT
    const validation = validateName(body);

    if (!validation.valid) {
      return errorResponse(validation.message, 400);
    }

    const ps_name_type = validation.name;

    // 4. CHECK DUPLICATE NAME
    const [existing] = await db
      .select({
        ps_type_id: positionType.ps_type_id,
      })
      .from(positionType)
      .where(
        sql`
          LOWER(TRIM(${positionType.ps_name_type}))
          = LOWER(${ps_name_type})
        `,
      )
      .limit(1);

    if (existing) {
      return errorResponse("มีประเภทตำแหน่งชื่อนี้อยู่ในระบบแล้ว", 409);
    }

    // 5. INSERT
    const result = await db.insert(positionType).values({
      ps_name_type,
    });

    const insertedId = result[0].insertId;

    // 6. RESPONSE
    return successResponse(
      "เพิ่มประเภทตำแหน่งสำเร็จ",
      {
        ps_type_id: insertedId,
        ps_name_type,
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
