import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";

import { AuthError, requireAdmin } from "@/lib/auth";
import { car_type } from "@/db/schema/car_type";
import { carTypeSchema } from "@/validations/carTypeScheme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const NO_STORE = {
  "Cache-Control": "private, no-store",
};

function successResponse<T>(message: string, data: T, status = 200) {
  return NextResponse.json(
    { success: true, message, data },
    { status, headers: NO_STORE },
  );
}

function errorResponse(message: string, status: number, errors?: unknown) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(errors !== undefined ? { errors, details: errors } : {}),
    },
    { status, headers: NO_STORE },
  );
}

async function parseCarTypeId(context: RouteContext): Promise<number | null> {
  const { id: rawId } = await context.params;

  if (!/^[1-9]\d*$/.test(rawId)) {
    return null;
  }

  const id = Number(rawId);

  if (!Number.isSafeInteger(id) || id > 2147483647) {
    return null;
  }

  return id;
}

function getDbError(error: unknown): {
  code?: string;
  errno?: number;
} {
  let current: unknown = error;

  for (let i = 0; i < 5; i++) {
    if (!current || typeof current !== "object") {
      break;
    }

    const value = current as {
      code?: string;
      errno?: number;
      cause?: unknown;
    };

    if (value.code || value.errno !== undefined) {
      return {
        code: value.code,
        errno: value.errno,
      };
    }

    current = value.cause;
  }

  return {};
}

function handleError(error: unknown) {
  if (error instanceof AuthError) {
    return errorResponse(error.message, error.status);
  }

  const dbError = getDbError(error);

  // ชื่อประเภทซ้ำ
  if (dbError.code === "ER_DUP_ENTRY" || dbError.errno === 1062) {
    return errorResponse("ชื่อประเภทรถนี้มีอยู่ในระบบแล้ว", 409, {
      car_type_name: ["กรุณาใช้ชื่อประเภทรถอื่น"],
    });
  }

  // มีข้อมูลรถยนต์อ้างอิง
  if (
    dbError.code === "ER_ROW_IS_REFERENCED_2" ||
    dbError.code === "ER_ROW_IS_REFERENCED" ||
    dbError.errno === 1451
  ) {
    return errorResponse(
      "ไม่สามารถลบประเภทรถนี้ได้ เนื่องจากมีข้อมูลอื่นอ้างอิงอยู่",
      409,
    );
  }

  // ไม่พบตาราง
  if (dbError.code === "ER_NO_SUCH_TABLE" || dbError.errno === 1146) {
    return errorResponse("ไม่พบตาราง car_type กรุณาตรวจสอบฐานข้อมูล", 500);
  }

  console.error("[CAR_TYPE_ID_API]", error);

  return errorResponse("เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", 500);
}

async function findType(id: number) {
  const [types] = await db
    .select({
      car_type_id: car_type.car_type_id,
      car_type_name: car_type.car_type_name,
    })
    .from(car_type)
    .where(eq(car_type.car_type_id, id))
    .limit(1);

  return types ?? null;
}

async function typeNameExists(
  name: string,
  currentId: number,
): Promise<boolean> {
  const normalizedName = name.toLowerCase();

  const [existing] = await db
    .select({
      car_type_id: car_type.car_type_id,
    })
    .from(car_type)
    .where(
      and(
        ne(car_type.car_type_id, currentId),
        eq(sql<string>`LOWER(TRIM(${car_type.car_type_name}))`, normalizedName),
      ),
    )
    .limit(1);

  return Boolean(existing);
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // เฉพาะ Admin
    await requireAdmin(request);

    const id = await parseCarTypeId(context);

    if (id === null) {
      return errorResponse("รหัสประเภทรถไม่ถูกต้อง", 400);
    }

    const types = await findType(id);

    if (!types) {
      return errorResponse("ไม่พบข้อมูลประเภทรถ", 404);
    }

    return successResponse("ดึงข้อมูลประเภทรถสำเร็จ", types);
  } catch (error) {
    return handleError(error);
  }
}

async function updateType(request: NextRequest, context: RouteContext) {
  try {
    // เฉพาะ Admin
    await requireAdmin(request);

    const id = await parseCarTypeId(context);

    if (id === null) {
      return errorResponse("รหัสประเภทรถไม่ถูกต้อง", 400);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("รูปแบบ JSON ไม่ถูกต้อง", 400);
    }

    const validation = carTypeSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "กรุณาตรวจสอบข้อมูลประเภทรถ",
        400,
        z.flattenError(validation.error).fieldErrors,
      );
    }

    const { car_type_name } = validation.data;

    const existingType = await findType(id);

    if (!existingType) {
      return errorResponse("ไม่พบประเภทรถที่ต้องการแก้ไข", 404);
    }

    // ----------------------------------------
    // CHECK DUPLICATE NAME
    // ----------------------------------------

    if (await typeNameExists(car_type_name, id)) {
      return errorResponse("ชื่อประเภทรถนี้มีอยู่ในระบบแล้ว", 409, {
        car_type_name: ["กรุณาใช้ชื่อประเภทรถอื่น"],
      });
    }

    // ----------------------------------------
    // CHECK UNCHANGED
    // ----------------------------------------

    if (existingType.car_type_name === car_type_name) {
      return successResponse("ไม่มีข้อมูลเปลี่ยนแปลง", existingType);
    }

    // ----------------------------------------
    // UPDATE
    // ----------------------------------------

    await db
      .update(car_type)
      .set({ car_type_name })
      .where(eq(car_type.car_type_id, id));

    const updatedType = await findType(id);

    if (!updateType) {
      return errorResponse("ไม่พบข้อมูลประเภทรถหลังแก้ไข", 404);
    }

    return successResponse("แก้ไขประเภทรถสำเร็จ", updateType);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return updateType(request, context);
}

// ======================================================
// PATCH /api/cars/brand/[id]
// ======================================================

export async function PATCH(request: NextRequest, context: RouteContext) {
  return updateType(request, context);
}

// ======================================================
// DELETE /api/cars/brand/[id]
// ======================================================

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // เฉพาะ Admin
    await requireAdmin(request);

    const id = await parseCarTypeId(context);

    if (id === null) {
      return errorResponse("รหัสประเภทรถไม่ถูกต้อง", 400);
    }

    const existingType = await findType(id);

    if (!existingType) {
      return errorResponse("ไม่พบประเภทรถที่ต้องการลบ", 404);
    }

    // ----------------------------------------
    // DELETE
    // ----------------------------------------

    await db.delete(car_type).where(eq(car_type.car_type_id, id));

    return successResponse("ลบประเภทรถสำเร็จ", {
      car_type_id: existingType.car_type_id,
      car_type_name: existingType.car_type_name,
    });
  } catch (error) {
    return handleError(error);
  }
}
