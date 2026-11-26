import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { car_brands } from "@/db/schema/car_brand";
import { AuthError, requireAdmin } from "@/lib/auth";

// ======================================================
// CONFIG
// ======================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
    .transform((value) => value.replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .min(1, "กรุณากรอกชื่อยี่ห้อรถ")
        .max(255, "ชื่อยี่ห้อรถต้องไม่เกิน 255 ตัวอักษร"),
    ),
});

// ======================================================
// RESPONSE HELPERS
// ======================================================

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

// ======================================================
// PARSE ID
// ======================================================

async function parseBrandId(context: RouteContext): Promise<number | null> {
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
  if (error instanceof AuthError) {
    return errorResponse(error.message, error.status);
  }

  const dbError = getDbError(error);

  // ชื่อยี่ห้อซ้ำ
  if (dbError.code === "ER_DUP_ENTRY" || dbError.errno === 1062) {
    return errorResponse("ชื่อยี่ห้อรถนี้มีอยู่ในระบบแล้ว", 409, {
      c_brand_name: ["กรุณาใช้ชื่อยี่ห้อรถอื่น"],
    });
  }

  // มีข้อมูลรถยนต์อ้างอิง
  if (
    dbError.code === "ER_ROW_IS_REFERENCED_2" ||
    dbError.code === "ER_ROW_IS_REFERENCED" ||
    dbError.errno === 1451
  ) {
    return errorResponse(
      "ไม่สามารถลบยี่ห้อรถนี้ได้ เนื่องจากมีข้อมูลอื่นอ้างอิงอยู่",
      409,
    );
  }

  // ไม่พบตาราง
  if (dbError.code === "ER_NO_SUCH_TABLE" || dbError.errno === 1146) {
    return errorResponse("ไม่พบตาราง car_brand กรุณาตรวจสอบฐานข้อมูล", 500);
  }

  console.error("[CAR_BRAND_ID_API]", error);

  return errorResponse("เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", 500);
}

// ======================================================
// FIND BRAND BY ID
// ======================================================

async function findBrand(id: number) {
  const [brand] = await db
    .select({
      c_brand_id: car_brands.c_brand_id,
      c_brand_name: car_brands.c_brand_name,
    })
    .from(car_brands)
    .where(eq(car_brands.c_brand_id, id))
    .limit(1);

  return brand ?? null;
}

// ======================================================
// CHECK DUPLICATE NAME
// ======================================================

async function brandNameExists(
  name: string,
  currentId: number,
): Promise<boolean> {
  const normalizedName = name.toLowerCase();

  const [existing] = await db
    .select({
      c_brand_id: car_brands.c_brand_id,
    })
    .from(car_brands)
    .where(
      and(
        ne(car_brands.c_brand_id, currentId),
        eq(
          sql<string>`LOWER(TRIM(${car_brands.c_brand_name}))`,
          normalizedName,
        ),
      ),
    )
    .limit(1);

  return Boolean(existing);
}

// ======================================================
// GET /api/cars/brand/[id]
// ======================================================

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // เฉพาะ Admin
    await requireAdmin(request);

    const id = await parseBrandId(context);

    if (id === null) {
      return errorResponse("รหัสยี่ห้อรถไม่ถูกต้อง", 400);
    }

    const brand = await findBrand(id);

    if (!brand) {
      return errorResponse("ไม่พบข้อมูลยี่ห้อรถ", 404);
    }

    return successResponse("ดึงข้อมูลยี่ห้อรถสำเร็จ", brand);
  } catch (error) {
    return handleError(error);
  }
}

// ======================================================
// UPDATE BRAND
// ======================================================

async function updateBrand(request: NextRequest, context: RouteContext) {
  try {
    // เฉพาะ Admin
    await requireAdmin(request);

    const id = await parseBrandId(context);

    if (id === null) {
      return errorResponse("รหัสยี่ห้อรถไม่ถูกต้อง", 400);
    }

    // ----------------------------------------
    // READ JSON
    // ----------------------------------------

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("รูปแบบ JSON ไม่ถูกต้อง", 400);
    }

    // ----------------------------------------
    // VALIDATE
    // ----------------------------------------

    const validation = brandSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "กรุณาตรวจสอบข้อมูลยี่ห้อรถ",
        400,
        z.flattenError(validation.error).fieldErrors,
      );
    }

    const { c_brand_name } = validation.data;

    // ----------------------------------------
    // FIND EXISTING BRAND
    // ----------------------------------------

    const existingBrand = await findBrand(id);

    if (!existingBrand) {
      return errorResponse("ไม่พบยี่ห้อรถที่ต้องการแก้ไข", 404);
    }

    // ----------------------------------------
    // CHECK DUPLICATE NAME
    // ----------------------------------------

    if (await brandNameExists(c_brand_name, id)) {
      return errorResponse("ชื่อยี่ห้อรถนี้มีอยู่ในระบบแล้ว", 409, {
        c_brand_name: ["กรุณาใช้ชื่อยี่ห้อรถอื่น"],
      });
    }

    // ----------------------------------------
    // CHECK UNCHANGED
    // ----------------------------------------

    if (existingBrand.c_brand_name === c_brand_name) {
      return successResponse("ไม่มีข้อมูลเปลี่ยนแปลง", existingBrand);
    }

    // ----------------------------------------
    // UPDATE
    // ----------------------------------------

    await db
      .update(car_brands)
      .set({ c_brand_name })
      .where(eq(car_brands.c_brand_id, id));

    const updatedBrand = await findBrand(id);

    if (!updatedBrand) {
      return errorResponse("ไม่พบข้อมูลยี่ห้อรถหลังแก้ไข", 404);
    }

    return successResponse("แก้ไขยี่ห้อรถสำเร็จ", updatedBrand);
  } catch (error) {
    return handleError(error);
  }
}

// ======================================================
// PUT /api/cars/brand/[id]
// ======================================================

export async function PUT(request: NextRequest, context: RouteContext) {
  return updateBrand(request, context);
}

// ======================================================
// PATCH /api/cars/brand/[id]
// ======================================================

export async function PATCH(request: NextRequest, context: RouteContext) {
  return updateBrand(request, context);
}

// ======================================================
// DELETE /api/cars/brand/[id]
// ======================================================

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // เฉพาะ Admin
    await requireAdmin(request);

    const id = await parseBrandId(context);

    if (id === null) {
      return errorResponse("รหัสยี่ห้อรถไม่ถูกต้อง", 400);
    }

    // ----------------------------------------
    // FIND EXISTING BRAND
    // ----------------------------------------

    const existingBrand = await findBrand(id);

    if (!existingBrand) {
      return errorResponse("ไม่พบยี่ห้อรถที่ต้องการลบ", 404);
    }

    // ----------------------------------------
    // DELETE
    // ----------------------------------------

    await db.delete(car_brands).where(eq(car_brands.c_brand_id, id));

    return successResponse("ลบยี่ห้อรถสำเร็จ", {
      c_brand_id: existingBrand.c_brand_id,
      c_brand_name: existingBrand.c_brand_name,
    });
  } catch (error) {
    return handleError(error);
  }
}
