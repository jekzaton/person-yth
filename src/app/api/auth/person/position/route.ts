import { NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { positions } from "@/db/schema";

import { authorizeAdmin } from "@/lib/server/api-auth";
import { jsonError, jsonSuccess } from "@/lib/server/api-response";
import { handleApiError } from "@/lib/server/api-error";

// ================================================
// VALIDATION
// ================================================

const positionSchema = z.object({
  ps_name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อตำแหน่ง")
    .max(255, "ชื่อตำแหน่งต้องไม่เกิน 255 ตัวอักษร"),
});

// ================================================
// MYSQL DUPLICATE KEY ERROR
// ================================================

function isDuplicateKeyError(error: unknown): boolean {
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

  return candidate.cause !== error && isDuplicateKeyError(candidate.cause);
}

// ================================================
// GET: POSITION LIST
// ================================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const data = await db
      .select({
        ps_id: positions.ps_id,
        ps_name: positions.ps_name,
      })
      .from(positions)
      .orderBy(asc(positions.ps_name), asc(positions.ps_id));

    return jsonSuccess("ดึงข้อมูลตำแหน่งสำเร็จ", data);
  } catch (error) {
    return handleApiError(error, "GET POSITION");
  }
}

// ================================================
// POST: CREATE POSITION
// ================================================

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError("รูปแบบ JSON ไม่ถูกต้อง", 400);
    }

    const parsed = positionSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(
        "ข้อมูลตำแหน่งไม่ถูกต้อง",
        400,
        z.flattenError(parsed.error).fieldErrors,
      );
    }

    const { ps_name } = parsed.data;

    // ตรวจชื่อตำแหน่งซ้ำ
    const existing = await db
      .select({
        ps_id: positions.ps_id,
      })
      .from(positions)
      .where(eq(positions.ps_name, ps_name))
      .limit(1);

    if (existing.length > 0) {
      return jsonError("ชื่อตำแหน่งนี้มีอยู่ในระบบแล้ว", 409, {
        ps_name: ["ชื่อตำแหน่งนี้มีอยู่ในระบบแล้ว"],
      });
    }

    try {
      const result = await db.insert(positions).values({ ps_name });

      return jsonSuccess(
        "เพิ่มตำแหน่งสำเร็จ",
        {
          ps_id: result[0].insertId,
          ps_name,
        },
        201,
      );
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return jsonError("ชื่อตำแหน่งนี้มีอยู่ในระบบแล้ว", 409, {
          ps_name: ["ชื่อตำแหน่งนี้มีอยู่ในระบบแล้ว"],
        });
      }

      throw error;
    }
  } catch (error) {
    return handleApiError(error, "POST POSITION");
  }
}
