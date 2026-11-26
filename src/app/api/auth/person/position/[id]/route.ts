import type { NextRequest } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { positions, tblAccount } from "@/db/schema";

import { authorizeAdmin } from "@/lib/server/api-auth";
import { handleApiError } from "@/lib/server/api-error";
import { jsonError, jsonSuccess } from "@/lib/server/api-response";

// ======================================================
// TYPES
// ======================================================

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// ======================================================
// VALIDATION
// ======================================================

const positionIdSchema = z.coerce
  .number<number>()
  .int()
  .positive()
  .max(2147483647);

const updatePositionSchema = z.object({
  ps_name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อตำแหน่ง")
    .max(255, "ชื่อตำแหน่งต้องไม่เกิน 255 ตัวอักษร"),
});

// ======================================================
// HELPERS
// ======================================================

function parsePositionId(value: string): number | null {
  // ไม่ยอมรับ 1.2, -1, 1abc หรือค่าอื่นที่ไม่ใช่เลขเต็มบวก
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const result = positionIdSchema.safeParse(value);

  return result.success ? result.data : null;
}

function isMysqlError(
  error: unknown,
  codes: readonly string[],
  errno: number,
): boolean {
  const visited = new Set<unknown>();
  let current: unknown = error;

  while (current && typeof current === "object" && !visited.has(current)) {
    visited.add(current);

    const candidate = current as {
      code?: unknown;
      errno?: unknown;
      cause?: unknown;
    };

    if (
      (typeof candidate.code === "string" && codes.includes(candidate.code)) ||
      candidate.errno === errno
    ) {
      return true;
    }

    current = candidate.cause;
  }

  return false;
}

function isDuplicateKeyError(error: unknown): boolean {
  return isMysqlError(error, ["ER_DUP_ENTRY"], 1062);
}

function isForeignKeyError(error: unknown): boolean {
  return isMysqlError(
    error,
    ["ER_ROW_IS_REFERENCED_2", "ER_ROW_IS_REFERENCED"],
    1451,
  );
}

async function findPosition(ps_id: number) {
  const [position] = await db
    .select({
      ps_id: positions.ps_id,
      ps_name: positions.ps_name,
    })
    .from(positions)
    .where(eq(positions.ps_id, ps_id))
    .limit(1);

  return position ?? null;
}

// ======================================================
// PUT /api/auth/person/position/:id
// แก้ไขชื่อตำแหน่ง
// ======================================================

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // --------------------------------------------------
    // 1. AUTHORIZATION
    // --------------------------------------------------

    const auth = await authorizeAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    // --------------------------------------------------
    // 2. VALIDATE POSITION ID
    // --------------------------------------------------

    const { id } = await context.params;
    const ps_id = parsePositionId(id);

    if (ps_id === null) {
      return jsonError("รหัสตำแหน่งไม่ถูกต้อง", 400);
    }

    // --------------------------------------------------
    // 3. VALIDATE REQUEST BODY
    // --------------------------------------------------

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError("รูปแบบ JSON ไม่ถูกต้อง", 400);
    }

    const parsed = updatePositionSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(
        "ข้อมูลตำแหน่งไม่ถูกต้อง",
        400,
        z.flattenError(parsed.error).fieldErrors,
      );
    }

    const { ps_name } = parsed.data;

    // --------------------------------------------------
    // 4. FIND EXISTING POSITION
    // --------------------------------------------------

    const position = await findPosition(ps_id);

    if (!position) {
      return jsonError("ไม่พบข้อมูลตำแหน่งที่ต้องการแก้ไข", 404);
    }

    // --------------------------------------------------
    // 5. SKIP UPDATE IF UNCHANGED
    // --------------------------------------------------

    if (position.ps_name === ps_name) {
      return jsonSuccess("ข้อมูลตำแหน่งไม่มีการเปลี่ยนแปลง", position);
    }

    // --------------------------------------------------
    // 6. CHECK DUPLICATE NAME
    // --------------------------------------------------

    const [duplicate] = await db
      .select({
        ps_id: positions.ps_id,
      })
      .from(positions)
      .where(and(eq(positions.ps_name, ps_name), ne(positions.ps_id, ps_id)))
      .limit(1);

    if (duplicate) {
      return jsonError("ชื่อตำแหน่งนี้มีอยู่ในระบบแล้ว", 409, {
        ps_name: ["ชื่อตำแหน่งนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น"],
      });
    }

    // --------------------------------------------------
    // 7. UPDATE
    // --------------------------------------------------

    try {
      await db
        .update(positions)
        .set({ ps_name })
        .where(eq(positions.ps_id, ps_id));
    } catch (error) {
      // ป้องกันการแก้ไขชื่อซ้ำจาก Concurrent Requests
      if (isDuplicateKeyError(error)) {
        return jsonError("ชื่อตำแหน่งนี้มีอยู่ในระบบแล้ว", 409, {
          ps_name: ["ชื่อตำแหน่งนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น"],
        });
      }

      throw error;
    }

    // --------------------------------------------------
    // 8. RESPONSE
    // --------------------------------------------------

    const updated = await findPosition(ps_id);

    if (!updated) {
      return jsonError("ไม่พบตำแหน่งหลังการแก้ไข กรุณาโหลดข้อมูลใหม่", 404);
    }

    return jsonSuccess("แก้ไขข้อมูลตำแหน่งสำเร็จ", updated);
  } catch (error) {
    return handleApiError(error, "PUT POSITION");
  }
}

// ======================================================
// DELETE /api/auth/person/position/:id
// ลบตำแหน่ง
// ======================================================

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // --------------------------------------------------
    // 1. AUTHORIZATION
    // --------------------------------------------------

    const auth = await authorizeAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    // --------------------------------------------------
    // 2. VALIDATE POSITION ID
    // --------------------------------------------------

    const { id } = await context.params;
    const ps_id = parsePositionId(id);

    if (ps_id === null) {
      return jsonError("รหัสตำแหน่งไม่ถูกต้อง", 400);
    }

    // --------------------------------------------------
    // 3. CHECK POSITION EXISTS
    // --------------------------------------------------

    const position = await findPosition(ps_id);

    if (!position) {
      return jsonError("ไม่พบตำแหน่งที่ต้องการลบ", 404);
    }

    // --------------------------------------------------
    // 4. CHECK PERSONNEL REFERENCES
    // --------------------------------------------------

    const [inUse] = await db
      .select({
        ac_id: tblAccount.ac_id,
      })
      .from(tblAccount)
      .where(eq(tblAccount.ps_id, ps_id))
      .limit(1);

    if (inUse) {
      return jsonError(
        "ไม่สามารถลบตำแหน่งนี้ได้ เนื่องจากมีบุคลากรใช้งานอยู่",
        409,
        {
          ps_id: [
            "ตำแหน่งนี้ถูกอ้างอิงโดยข้อมูลบุคลากร กรุณาย้ายตำแหน่งของบุคลากรก่อน",
          ],
        },
      );
    }

    // --------------------------------------------------
    // 5. DELETE
    // --------------------------------------------------

    try {
      await db.delete(positions).where(eq(positions.ps_id, ps_id));
    } catch (error) {
      // หากมี Foreign Key RESTRICT ในฐานข้อมูล
      if (isForeignKeyError(error)) {
        return jsonError(
          "ไม่สามารถลบตำแหน่งนี้ได้ เนื่องจากมีข้อมูลอื่นใช้งานอยู่",
          409,
        );
      }

      throw error;
    }

    // --------------------------------------------------
    // 6. RESPONSE
    // --------------------------------------------------

    return jsonSuccess("ลบข้อมูลตำแหน่งสำเร็จ", {
      ps_id: position.ps_id,
      ps_name: position.ps_name,
    });
  } catch (error) {
    return handleApiError(error, "DELETE POSITION");
  }
}
