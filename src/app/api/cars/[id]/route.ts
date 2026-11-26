import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { car_register } from "@/db/schema/car_register";
import { car_brands } from "@/db/schema/car_brand";
import { AuthError, requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const NO_STORE = {
  "Cache-Control": "private, no-store",
};

// ============================================
// VALIDATION
// ============================================

const carSchema = z.strictObject({
  car_license: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s+/g, "").toUpperCase())
    .pipe(z.string().min(1, "กรุณากรอกทะเบียนรถ").max(50)),

  car_province: z.string().trim().min(1, "กรุณาเลือกจังหวัด").max(100),

  c_brand_id: z.coerce.number().int().positive("กรุณาเลือกยี่ห้อรถ"),

  car_model: z.string().trim().min(1, "กรุณากรอกรุ่นรถ").max(150),

  car_color: z.string().trim().min(1, "กรุณากรอกสีรถ").max(100),

  car_type_id: z.coerce.number().int().positive("กรุณาเลือกประเภทรถ"),

  ac_id: z.coerce.number().int().positive("กรุณาเลือกบุคลากร"),
});

// ============================================
// RESPONSE HELPERS
// ============================================

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

// ============================================
// PARSE ID
// ============================================

async function parseCarId(context: RouteContext): Promise<number | null> {
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

// ============================================
// DATABASE ERROR
// ============================================

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

  if (dbError.code === "ER_DUP_ENTRY" || dbError.errno === 1062) {
    return errorResponse("ทะเบียนรถนี้มีอยู่ในระบบแล้ว", 409, {
      car_license: ["กรุณาใช้ทะเบียนรถอื่น"],
    });
  }

  if (dbError.code === "ER_ROW_IS_REFERENCED_2" || dbError.errno === 1451) {
    return errorResponse(
      "ไม่สามารถลบรถคันนี้ได้ เนื่องจากมีข้อมูลอื่นอ้างอิงอยู่",
      409,
    );
  }

  if (dbError.code === "ER_NO_REFERENCED_ROW_2" || dbError.errno === 1452) {
    return errorResponse(
      "ข้อมูลยี่ห้อ ประเภท หรือบุคลากรที่เลือกไม่ถูกต้อง",
      400,
    );
  }

  console.error("[CAR_ID_API]", error);

  return errorResponse("เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", 500);
}

// ============================================
// FIND CAR
// ============================================

async function findCar(id: number) {
  const [car] = await db
    .select({
      car_id: car_register.car_id,
      car_license: car_register.car_license,
      car_province: car_register.car_province,
      c_brand_id: car_register.c_brand_id,
      brand_name: car_brands.c_brand_name,
      car_model: car_register.car_model,
      car_color: car_register.car_color,
      car_type_id: car_register.car_type_id,
      car_print_status: car_register.car_print_status,
      ac_id: car_register.ac_id,
    })
    .from(car_register)
    .leftJoin(car_brands, eq(car_register.c_brand_id, car_brands.c_brand_id))
    .where(eq(car_register.car_id, id))
    .limit(1);

  return car ?? null;
}

// ============================================
// CHECK LICENSE DUPLICATE
// ============================================

async function licenseExists(
  license: string,
  currentId: number,
): Promise<boolean> {
  const [existing] = await db
    .select({
      car_id: car_register.car_id,
    })
    .from(car_register)
    .where(
      and(
        ne(car_register.car_id, currentId),
        eq(
          sql<string>`UPPER(REPLACE(REPLACE(TRIM(${car_register.car_license}), ' ', ''), CHAR(9), ''))`,
          license,
        ),
      ),
    )
    .limit(1);

  return Boolean(existing);
}

// ============================================
// GET /api/cars/[id]
// ============================================

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);

    const id = await parseCarId(context);

    if (id === null) {
      return errorResponse("รหัสรถไม่ถูกต้อง", 400);
    }

    const car = await findCar(id);

    if (!car) {
      return errorResponse("ไม่พบข้อมูลทะเบียนรถ", 404);
    }

    return successResponse("ดึงข้อมูลรถสำเร็จ", car);
  } catch (error) {
    return handleError(error);
  }
}

// ============================================
// UPDATE CAR
// ============================================

async function updateCar(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);

    const id = await parseCarId(context);

    if (id === null) {
      return errorResponse("รหัสรถไม่ถูกต้อง", 400);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("รูปแบบ JSON ไม่ถูกต้อง", 400);
    }

    const validation = carSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "กรุณาตรวจสอบข้อมูลรถยนต์",
        400,
        z.flattenError(validation.error).fieldErrors,
      );
    }

    const data = validation.data;

    // ========================================
    // CHECK CAR EXISTS
    // ========================================

    const existingCar = await findCar(id);

    if (!existingCar) {
      return errorResponse("ไม่พบทะเบียนรถที่ต้องการแก้ไข", 404);
    }

    // ========================================
    // CHECK LICENSE DUPLICATE
    // ========================================

    if (await licenseExists(data.car_license, id)) {
      return errorResponse("ทะเบียนรถนี้มีอยู่ในระบบแล้ว", 409, {
        car_license: ["ทะเบียนรถห้ามซ้ำ"],
      });
    }

    // ========================================
    // CHECK BRAND
    // ========================================

    const [brand] = await db
      .select({
        c_brand_id: car_brands.c_brand_id,
      })
      .from(car_brands)
      .where(eq(car_brands.c_brand_id, data.c_brand_id))
      .limit(1);

    if (!brand) {
      return errorResponse("ไม่พบยี่ห้อรถที่เลือก", 400);
    }

    // ========================================
    // UPDATE CAR
    // ========================================

    await db.update(car_register).set(data).where(eq(car_register.car_id, id));

    const updatedCar = await findCar(id);

    if (!updatedCar) {
      return errorResponse("ไม่พบข้อมูลรถหลังแก้ไข", 404);
    }

    return successResponse("แก้ไขทะเบียนรถสำเร็จ", updatedCar);
  } catch (error) {
    return handleError(error);
  }
}

// ============================================
// PUT /api/cars/[id]
// ============================================

export async function PUT(request: NextRequest, context: RouteContext) {
  return updateCar(request, context);
}

// ============================================
// PATCH /api/cars/[id]
// ============================================

export async function PATCH(request: NextRequest, context: RouteContext) {
  return updateCar(request, context);
}

// ============================================
// DELETE /api/cars/[id]
// ============================================

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);

    const id = await parseCarId(context);

    if (id === null) {
      return errorResponse("รหัสรถไม่ถูกต้อง", 400);
    }

    const existingCar = await findCar(id);

    if (!existingCar) {
      return errorResponse("ไม่พบทะเบียนรถที่ต้องการลบ", 404);
    }

    await db.delete(car_register).where(eq(car_register.car_id, id));

    return successResponse("ลบทะเบียนรถสำเร็จ", existingCar);
  } catch (error) {
    return handleError(error);
  }
}
