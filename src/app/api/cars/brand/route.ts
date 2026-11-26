import { NextRequest, NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { car_brands } from "@/db/schema/car_brand";
import { AuthError, requireAdmin } from "@/lib/auth";

// ======================================================
// CONFIG
// ======================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "private, no-store",
};

// ======================================================
// VALIDATION
// ======================================================

const brandSchema = z.strictObject({
  c_brand_name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อยี่ห้อรถ")
    .max(255, "ชื่อยี่ห้อรถต้องไม่เกิน 255 ตัวอักษร")
    .transform((value) => value.replace(/\s+/g, " ")),
});

// ======================================================
// RESPONSE HELPERS
// ======================================================

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

// ======================================================
// DATABASE ERROR HANDLER
// ======================================================

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
    return errorResponse("ชื่อยี่ห้อรถนี้มีอยู่ในระบบแล้ว", 409, {
      c_brand_name: ["กรุณาใช้ชื่อยี่ห้อรถอื่น"],
    });
  }

  // Missing table
  if (dbError.code === "ER_NO_SUCH_TABLE" || dbError.errno === 1146) {
    console.error("[CAR_BRAND_API] Table missing:", error);

    return errorResponse("ไม่พบตาราง car_brand กรุณาตรวจสอบฐานข้อมูล", 500);
  }

  console.error("[CAR_BRAND_API]", error);

  return errorResponse("เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", 500);
}

// ======================================================
// CHECK DUPLICATE BRAND NAME
// ======================================================

async function brandNameExists(name: string): Promise<boolean> {
  const normalizedName = name.toLowerCase();

  const [existing] = await db
    .select({
      c_brand_id: car_brands.c_brand_id,
    })
    .from(car_brands)
    .where(
      eq(sql<string>`LOWER(TRIM(${car_brands.c_brand_name}))`, normalizedName),
    )
    .limit(1);

  return Boolean(existing);
}

// ======================================================
// GET /api/cars/brand
// GET ALL BRANDS
// ======================================================

export async function GET(request: NextRequest) {
  try {
    // Allow Admin only
    await requireAdmin(request);

    const brands = await db
      .select({
        c_brand_id: car_brands.c_brand_id,
        c_brand_name: car_brands.c_brand_name,
      })
      .from(car_brands)
      .orderBy(asc(car_brands.c_brand_name));

    return successResponse("ดึงข้อมูลยี่ห้อรถสำเร็จ", brands);
  } catch (error) {
    return handleError(error);
  }
}

// ======================================================
// POST /api/cars/brand
// CREATE BRAND
// ======================================================

export async function POST(request: NextRequest) {
  try {
    // Allow Admin only
    await requireAdmin(request);

    // -----------------------------------------------
    // READ JSON
    // -----------------------------------------------

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("รูปแบบ JSON ไม่ถูกต้อง", 400);
    }

    // -----------------------------------------------
    // VALIDATE REQUEST
    // -----------------------------------------------

    const validation = brandSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "กรุณาตรวจสอบข้อมูลยี่ห้อรถ",
        400,
        z.flattenError(validation.error).fieldErrors,
      );
    }

    const { c_brand_name } = validation.data;

    // ตรวจอีกครั้งหลัง normalize ช่องว่าง
    if (!c_brand_name.trim()) {
      return errorResponse("กรุณากรอกชื่อยี่ห้อรถ", 400, {
        c_brand_name: ["กรุณากรอกชื่อยี่ห้อรถ"],
      });
    }

    // -----------------------------------------------
    // CHECK DUPLICATE NAME
    // -----------------------------------------------

    const duplicate = await brandNameExists(c_brand_name);

    if (duplicate) {
      return errorResponse("ชื่อยี่ห้อรถนี้มีอยู่ในระบบแล้ว", 409, {
        c_brand_name: ["กรุณาใช้ชื่อยี่ห้อรถอื่น"],
      });
    }

    // -----------------------------------------------
    // INSERT BRAND
    // -----------------------------------------------

    const inserted = await db
      .insert(car_brands)
      .values({
        c_brand_name,
      })
      .$returningId();

    const brandId = inserted[0]?.c_brand_id;

    if (
      typeof brandId !== "number" ||
      !Number.isSafeInteger(brandId) ||
      brandId <= 0
    ) {
      throw new Error("ไม่สามารถรับรหัสยี่ห้อรถหลังบันทึกได้");
    }

    // -----------------------------------------------
    // GET CREATED BRAND
    // -----------------------------------------------

    const [newBrand] = await db
      .select({
        c_brand_id: car_brands.c_brand_id,
        c_brand_name: car_brands.c_brand_name,
      })
      .from(car_brands)
      .where(eq(car_brands.c_brand_id, brandId))
      .limit(1);

    if (!newBrand) {
      throw new Error("ไม่พบข้อมูลยี่ห้อรถหลังเพิ่มข้อมูล");
    }

    // -----------------------------------------------
    // SUCCESS
    // -----------------------------------------------

    return successResponse("เพิ่มยี่ห้อรถสำเร็จ", newBrand, 201);
  } catch (error) {
    return handleError(error);
  }
}
