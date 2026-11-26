import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

import { db } from "@/db";
import { car_brands } from "@/db/schema/car_brand";
import { AuthError, requireAdmin } from "@/lib/auth";
import { car_type, tblAccount } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ========================================
// GET /api/cars/options
// ========================================

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const [brands, types, personnel] = await Promise.all([
      db
        .select({
          id: car_brands.c_brand_id,
          name: car_brands.c_brand_name,
        })
        .from(car_brands)
        .orderBy(asc(car_brands.c_brand_name)),

      db
        .select({
          id: car_type.car_type_id,
          name: car_type.car_type_name,
        })
        .from(car_type)
        .orderBy(asc(car_type.car_type_name)),

      db
        .select({
          ac_id: tblAccount.ac_id,
          ac_pname: tblAccount.ac_pname,
          ac_fname: tblAccount.ac_fname,
          ac_lname: tblAccount.ac_lname,
        })
        .from(tblAccount)
        .orderBy(asc(tblAccount.ac_fname), asc(tblAccount.ac_lname)),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "ดึงข้อมูลตัวเลือกสำเร็จ",
        data: {
          brands,
          types,
          accounts: personnel.map((person) => ({
            id: person.ac_id,
            name:
              [person.ac_pname, person.ac_fname, person.ac_lname]
                .filter(Boolean)
                .join(" ")
                .trim() || `บุคลากรรหัส ${person.ac_id}`,
          })),
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.status },
      );
    }

    console.error("[CARS_OPTIONS_API]", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "ไม่สามารถโหลดข้อมูลยี่ห้อ ประเภท และบุคลากรได้ กรุณาตรวจสอบโครงสร้างฐานข้อมูล",
      },
      { status: 500 },
    );
  }
}
