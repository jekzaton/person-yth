import { NextRequest, NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { car_register } from "@/db/schema/car_register";
import { car_brands } from "@/db/schema/car_brand";
import { AuthError, requireAdmin } from "@/lib/auth";
import { car_type, tblAccount } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "private, no-store",
};

// ============================================
// VALIDATION
// ============================================

export const carSchema = z.strictObject({
  car_license: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s+/g, "").toUpperCase())
    .pipe(
      z
        .string()
        .min(1, "กรุณากรอกทะเบียนรถ")
        .max(50, "ทะเบียนรถต้องไม่เกิน 50 ตัวอักษร"),
    ),

  car_province: z.string().trim().min(1, "กรุณาเลือกจังหวัด").max(100),

  c_brand_id: z.coerce.number().int().positive("กรุณาเลือกยี่ห้อรถ"),

  car_model: z.string().trim().min(1, "กรุณากรอกรุ่นรถ").max(150),

  car_color: z.string().trim().min(1, "กรุณากรอกสีรถ").max(100),

  car_type_id: z.coerce.number().int().positive("กรุณาเลือกประเภทรถ"),

  ac_id: z.coerce.number().int().positive("กรุณาเลือกบุคลากร"),
});

// ============================================
// RESPONSE
// ============================================

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

  if (dbError.code === "ER_NO_REFERENCED_ROW_2" || dbError.errno === 1452) {
    return errorResponse(
      "ไม่พบข้อมูลอ้างอิงที่เลือก กรุณาตรวจสอบยี่ห้อ ประเภท และบุคลากร",
      400,
    );
  }

  console.error("[CARS_API]", error);

  return errorResponse("เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", 500);
}

// ============================================
// CHECK DUPLICATE LICENSE
// ============================================

async function licenseExists(license: string): Promise<boolean> {
  const [existing] = await db
    .select({
      car_id: car_register.car_id,
    })
    .from(car_register)
    .where(
      eq(
        sql<string>`UPPER(REPLACE(REPLACE(TRIM(${car_register.car_license}), ' ', ''), CHAR(9), ''))`,
        license,
      ),
    )
    .limit(1);

  return Boolean(existing);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const cars = await db
      .select({
        car_id: car_register.car_id,
        car_license: car_register.car_license,
        car_province: car_register.car_province,

        c_brand_id: car_register.c_brand_id,
        brand_name: car_brands.c_brand_name,

        car_model: car_register.car_model,
        car_color: car_register.car_color,

        car_type_id: car_register.car_type_id,
        car_type_name: car_type.car_type_name,

        car_print_status: car_register.car_print_status,

        ac_id: car_register.ac_id,
        ac_pname: tblAccount.ac_pname,
        ac_fname: tblAccount.ac_fname,
        ac_lname: tblAccount.ac_lname,
      })
      .from(car_register)
      .leftJoin(car_brands, eq(car_register.c_brand_id, car_brands.c_brand_id))
      .leftJoin(car_type, eq(car_register.car_type_id, car_type.car_type_id))
      .leftJoin(tblAccount, eq(car_register.ac_id, tblAccount.ac_id))
      .orderBy(asc(car_register.car_id));

    return NextResponse.json(
      {
        success: true,
        message: "ดึงข้อมูลทะเบียนรถสำเร็จ",
        data: cars.map((car) => {
          const { ac_pname, ac_fname, ac_lname, ...fields } = car;

          return {
            ...fields,
            account_name:
              [ac_fname, ac_fname, ac_lname].filter(Boolean).join(" ").trim() ||
              null,
          };
        }),
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    return handleError(error);
  }
}

// ============================================
// POST /api/cars
// ============================================

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

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
    // CHECK DUPLICATE LICENSE
    // ========================================

    if (await licenseExists(data.car_license)) {
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
    // CREATE CAR
    // ========================================

    const inserted = await db
      .insert(car_register)
      .values({
        ...data,
        car_print_status: 0,
      })
      .$returningId();

    const carId = inserted[0]?.car_id;

    if (
      typeof carId !== "number" ||
      !Number.isSafeInteger(carId) ||
      carId <= 0
    ) {
      throw new Error("ไม่สามารถรับรหัสรถหลังบันทึกได้");
    }

    const [newCar] = await db
      .select()
      .from(car_register)
      .where(eq(car_register.car_id, carId))
      .limit(1);

    if (!newCar) {
      throw new Error("ไม่พบข้อมูลรถหลังบันทึก");
    }

    return successResponse(
      "เพิ่มทะเบียนรถสำเร็จ",
      {
        ...newCar,
        brand_name: car_brands ? undefined : undefined,
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
