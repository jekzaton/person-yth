import { NextRequest, NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { AuthError, requireAdmin } from "@/lib/auth";
import { car_type } from "@/db/schema/car_type";
import { carTypeSchema } from "@/validations/carTypeScheme";
import z from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "private, no-store",
};

function successResponse<T>(message: string, data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    {
      status,
      headers: NO_STORE,
    },
  );
}

function errorResponse(message: string, status: number, errors?: unknown) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(errors !== undefined ? { errors, details: errors } : {}),
    },
    {
      status,
      headers: NO_STORE,
    },
  );
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
  // Auth Error (401, 403)
  if (error instanceof AuthError) {
    return errorResponse(error.message, error.status);
  }

  const dbError = getDbError(error);

  // Duplicate name
  if (dbError.code === "ER_DUP_ENTRY" || dbError.errno === 1062) {
    return errorResponse("ชื่อประเภทรถนี้มีอยู่ในระบบแล้ว", 409, {
      car_type_name: ["กรุณาใช้ชื่อประเภทรถอื่น"],
    });
  }

  // Missing table
  if (dbError.code === "ER_NO_SUCH_TABLE" || dbError.errno === 1146) {
    console.error("[CAR_TYPE_API] Table missing:", error);

    return errorResponse("ไม่พบตาราง car_type กรุณาตรวจสอบฐานข้อมูล", 500);
  }

  console.error("[CAR_TYPE_API]", error);

  return errorResponse("เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", 500);
}

async function TypeNameExists(car_type_name: string): Promise<boolean> {
  const normalizedName = car_type_name.toLowerCase();

  const [existing] = await db
    .select({
      car_type_id: car_type.car_type_id,
    })
    .from(car_type)
    .where(
      eq(sql<string>`LOWER(TRIM(${car_type.car_type_name}))`, normalizedName),
    )
    .limit(1);

  return Boolean(existing);
}

export async function GET(request: NextRequest) {
  try {
    // Allow Admin only
    await requireAdmin(request);

    const car_types = await db
      .select({
        car_type_id: car_type.car_type_id,
        car_type_name: car_type.car_type_name,
      })
      .from(car_type)
      .orderBy(asc(car_type.car_type_name));

    return successResponse("ดึงข้อมูลประเภทรถสำเร็จ", car_types);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Allow Admin only
    await requireAdmin(request);

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

    // ตรวจอีกครั้งหลัง normalize ช่องว่าง
    if (!car_type_name.trim()) {
      return errorResponse("กรุณากรอกประเภทรถ", 400, {
        car_type_name: ["กรุณากรอกประเภทรถ"],
      });
    }

    const duplicate = await TypeNameExists(car_type_name);

    if (duplicate) {
      return errorResponse("ประเภทรถนี้มีอยู่ในระบบแล้ว", 409, {
        car_type_name: ["กรุณาใช้ประเภทรถอื่น"],
      });
    }

    const inserted = await db
      .insert(car_type)
      .values({
        car_type_name,
      })
      .$returningId();

    const typeId = inserted[0]?.car_type_id;

    if (
      typeof typeId !== "number" ||
      !Number.isSafeInteger(typeId) ||
      typeId <= 0
    ) {
      throw new Error("ไม่สามารถรับรหัสประเภทรถหลังบันทึกได้");
    }

    const [newType] = await db
      .select({
        car_type_id: car_type.car_type_id,
        car_type_name: car_type.car_type_name,
      })
      .from(car_type)
      .where(eq(car_type.car_type_id, typeId))
      .limit(1);

    if (!newType) {
      throw new Error("ไม่พบข้อมูลประเภทรถหลังเพิ่มข้อมูล");
    }

    return successResponse("เพิ่มประเภทรถสำเร็จ", newType, 201);
  } catch (error) {
    return handleError(error);
  }
}
