import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { db } from "@/db";
import { tblAccount, departments, positions, positionType } from "@/db/schema";
import { AuthError, requireAdmin } from "@/lib/auth";
import {
  deleteUnusedPersonnelPhoto,
  isManagedPersonnelPhoto,
} from "@/lib/server/personnel-photo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const NO_STORE = { "Cache-Control": "private, no-store" };

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

function getDbError(error: unknown): { code?: string; errno?: number } {
  let current: unknown = error;
  for (let i = 0; i < 5; i++) {
    if (!current || typeof current !== "object") break;
    const value = current as {
      code?: string;
      errno?: number;
      cause?: unknown;
    };
    if (value.code || value.errno !== undefined) {
      return { code: value.code, errno: value.errno };
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
    return errorResponse("ข้อมูลซ้ำกับรายการที่มีอยู่ในระบบ", 409);
  }
  if (dbError.code === "ER_ROW_IS_REFERENCED_2" || dbError.errno === 1451) {
    return errorResponse(
      "ไม่สามารถลบข้อมูลได้ เนื่องจากมีข้อมูลอื่นอ้างอิงอยู่",
      409,
    );
  }
  if (dbError.code === "ER_NO_REFERENCED_ROW_2" || dbError.errno === 1452) {
    return errorResponse("ข้อมูลอ้างอิงหน่วยงานหรือตำแหน่งไม่ถูกต้อง", 400);
  }

  console.error("[PERSON_ID_API]", error);
  return errorResponse("เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", 500);
}

async function parsePersonId(context: RouteContext): Promise<number | null> {
  const { id: rawId } = await context.params;
  if (!/^[1-9]\d*$/.test(rawId)) return null;
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id <= 2147483647 ? id : null;
}

// PATCH only updates fields present in the request.
// img_profile omitted -> keep current; string -> replace; null -> clear.
// ac_password omitted -> retain existing password hash.
const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

const optionalId = z
  .number()
  .int()
  .positive()
  .max(2147483647)
  .nullable()
  .optional();

const updatePersonSchema = z.strictObject({
  ac_username: optionalText(100),
  ac_pname: optionalText(50),
  ac_fname: z.string().trim().min(1, "กรุณากรอกชื่อ").max(150).optional(),
  ac_lname: z.string().trim().min(1, "กรุณากรอกนามสกุล").max(150).optional(),
  ac_pname_eng: optionalText(50),
  ac_fname_eng: optionalText(150),
  ac_lname_eng: optionalText(150),
  ac_birthday: z.union([z.iso.date(), z.literal(""), z.null()]).optional(),
  ac_nickname: optionalText(150),
  ac_email: z
    .union([z.email("รูปแบบอีเมลไม่ถูกต้อง"), z.literal(""), z.null()])
    .optional(),
  ac_phone_number: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^0\d{9}$/.test(value),
      "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก",
    )
    .nullable()
    .optional(),
  ac_hn: optionalText(20),
  dep_id: optionalId,
  ps_id: optionalId,
  ps_type_id: optionalId,
  ac_certificate_number: optionalText(100),
  ac_role: z.enum(["admin", "member", "user"]).optional(),
  level: z.number().int().min(0).max(100).optional(),
  ac_active: z.union([z.literal(0), z.literal(1)]).optional(),
  img_profile: optionalText(500),
  rfid: optionalText(100),

  // Admin sets a new password directly. Leave out this field to keep the old one.
  // bcryptjs uses only the first 72 UTF-8 bytes of the password.
  ac_password: z
    .string()
    .min(12, "รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร")
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "รหัสผ่านต้องมีขนาดไม่เกิน 72 ไบต์",
    )
    .optional(),
});

type UpdatePerson = z.infer<typeof updatePersonSchema>;

function emptyToNull(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  return value?.trim() || null;
}

async function findPerson(id: number) {
  const [person] = await db
    .select({
      ac_id: tblAccount.ac_id,
      ac_cid: tblAccount.ac_cid,
      ac_username: tblAccount.ac_username,
      ac_birthday: tblAccount.ac_birthday,
      ac_nickname: tblAccount.ac_nickname,
      ac_pname: tblAccount.ac_pname,
      ac_fname: tblAccount.ac_fname,
      ac_lname: tblAccount.ac_lname,
      ac_pname_eng: tblAccount.ac_pname_eng,
      ac_fname_eng: tblAccount.ac_fname_eng,
      ac_lname_eng: tblAccount.ac_lname_eng,
      ac_email: tblAccount.ac_email,
      ac_phone_number: tblAccount.ac_phone_number,
      ac_hn: tblAccount.ac_hn,
      dep_id: tblAccount.dep_id,
      dep_name: departments.dep_name,
      ps_id: tblAccount.ps_id,
      ps_name: positions.ps_name,
      ps_type_id: tblAccount.ps_type_id,
      ps_type_name: positionType.ps_name_type,
      ac_certificate_number: tblAccount.ac_certificate_number,
      img_profile: tblAccount.img_profile,
      rfid: tblAccount.rfid,
      ac_role: tblAccount.ac_role,
      level: tblAccount.level,
      ac_active: tblAccount.ac_active,
      createdAt: tblAccount.createdAt,
      updatedAt: tblAccount.updatedAt,
    })
    .from(tblAccount)
    .leftJoin(departments, eq(tblAccount.dep_id, departments.dep_id))
    .leftJoin(positions, eq(tblAccount.ps_id, positions.ps_id))
    .leftJoin(positionType, eq(tblAccount.ps_type_id, positionType.ps_type_id))
    .where(eq(tblAccount.ac_id, id))
    .limit(1);

  return person ?? null;
}

async function usernameExists(username: string, currentId: number) {
  const [existing] = await db
    .select({ ac_id: tblAccount.ac_id })
    .from(tblAccount)
    .where(
      and(
        ne(tblAccount.ac_id, currentId),
        eq(tblAccount.ac_username, username),
      ),
    )
    .limit(1);
  return Boolean(existing);
}

async function validateReferences(data: UpdatePerson): Promise<string | null> {
  if (data.dep_id != null) {
    const [department] = await db
      .select({ id: departments.dep_id })
      .from(departments)
      .where(eq(departments.dep_id, data.dep_id))
      .limit(1);
    if (!department) return "ไม่พบหน่วยงานที่เลือก";
  }

  if (data.ps_id != null) {
    const [position] = await db
      .select({ id: positions.ps_id })
      .from(positions)
      .where(eq(positions.ps_id, data.ps_id))
      .limit(1);
    if (!position) return "ไม่พบตำแหน่งที่เลือก";
  }

  if (data.ps_type_id != null) {
    const [type] = await db
      .select({ id: positionType.ps_type_id })
      .from(positionType)
      .where(eq(positionType.ps_type_id, data.ps_type_id))
      .limit(1);
    if (!type) return "ไม่พบประเภทตำแหน่งที่เลือก";
  }
  return null;
}

async function isLastActiveAdmin() {
  const [result] = await db
    .select({ total: count() })
    .from(tblAccount)
    .where(and(eq(tblAccount.ac_role, "admin"), eq(tblAccount.ac_active, 1)));
  return Number(result?.total ?? 0) <= 1;
}

// GET /api/auth/person/[id]
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
    const id = await parsePersonId(context);
    if (id === null) return errorResponse("รหัสบุคลากรไม่ถูกต้อง", 400);
    const person = await findPerson(id);
    if (!person) return errorResponse("ไม่พบข้อมูลบุคลากร", 404);
    // Never include ac_password (or password hash) in read responses.
    return successResponse("ดึงข้อมูลบุคลากรสำเร็จ", person);
  } catch (error) {
    return handleError(error);
  }
}

async function updatePerson(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const id = await parsePersonId(context);
    if (id === null) return errorResponse("รหัสบุคลากรไม่ถูกต้อง", 400);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("รูปแบบ JSON ไม่ถูกต้อง", 400);
    }

    const validation = updatePersonSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        "กรุณาตรวจสอบข้อมูลบุคลากร",
        400,
        z.flattenError(validation.error).fieldErrors,
      );
    }

    const data = validation.data;
    if (Object.keys(data).length === 0) {
      return errorResponse("ไม่มีข้อมูลสำหรับแก้ไข", 400);
    }

    const existing = await findPerson(id);
    if (!existing) {
      return errorResponse("ไม่พบข้อมูลบุคลากรที่ต้องการแก้ไข", 404);
    }

    const username = emptyToNull(data.ac_username);
    if (username && (await usernameExists(username, id))) {
      return errorResponse("Username นี้มีผู้ใช้งานแล้ว", 409);
    }

    const referenceError = await validateReferences(data);
    if (referenceError) return errorResponse(referenceError, 400);

    // Prevent demoting or disabling one's own admin account.
    if (admin.ac_id === id) {
      if (
        (data.ac_role !== undefined && data.ac_role !== "admin") ||
        data.ac_active === 0
      ) {
        return errorResponse(
          "ไม่สามารถลดสิทธิ์หรือปิดใช้งานบัญชีของตนเองได้",
          409,
        );
      }
    }

    const removingAdmin =
      existing.ac_role === "admin" &&
      existing.ac_active === 1 &&
      ((data.ac_role !== undefined && data.ac_role !== "admin") ||
        data.ac_active === 0);

    if (removingAdmin && (await isLastActiveAdmin())) {
      return errorResponse(
        "ไม่สามารถปิดใช้งานหรือลดสิทธิ์ผู้ดูแลระบบคนสุดท้ายได้",
        409,
      );
    }

    const updateData: Partial<typeof tblAccount.$inferInsert> = {};

    if (data.ac_username !== undefined) updateData.ac_username = username;
    if (data.ac_birthday !== undefined)
      updateData.ac_birthday = data.ac_birthday || null;
    if (data.ac_nickname !== undefined)
      updateData.ac_nickname = emptyToNull(data.ac_nickname);
    if (data.ac_pname !== undefined)
      updateData.ac_pname = emptyToNull(data.ac_pname);
    if (data.ac_fname !== undefined) updateData.ac_fname = data.ac_fname;
    if (data.ac_lname !== undefined) updateData.ac_lname = data.ac_lname;
    if (data.ac_pname_eng !== undefined)
      updateData.ac_pname_eng = emptyToNull(data.ac_pname_eng);
    if (data.ac_fname_eng !== undefined)
      updateData.ac_fname_eng = emptyToNull(data.ac_fname_eng);
    if (data.ac_lname_eng !== undefined)
      updateData.ac_lname_eng = emptyToNull(data.ac_lname_eng);
    if (data.ac_email !== undefined)
      updateData.ac_email = emptyToNull(data.ac_email);
    if (data.ac_phone_number !== undefined)
      updateData.ac_phone_number = emptyToNull(data.ac_phone_number);
    if (data.ac_hn !== undefined) updateData.ac_hn = emptyToNull(data.ac_hn);
    if (data.dep_id !== undefined) updateData.dep_id = data.dep_id;
    if (data.ps_id !== undefined) updateData.ps_id = data.ps_id;
    if (data.ps_type_id !== undefined) updateData.ps_type_id = data.ps_type_id;
    if (data.ac_certificate_number !== undefined) {
      updateData.ac_certificate_number = emptyToNull(
        data.ac_certificate_number,
      );
    }
    if (data.ac_role !== undefined) updateData.ac_role = data.ac_role;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.ac_active !== undefined) updateData.ac_active = data.ac_active;
    if (data.img_profile !== undefined) {
      const newPhoto = emptyToNull(data.img_profile);
      // Only accept paths from our own upload endpoint.
      if (newPhoto && !isManagedPersonnelPhoto(newPhoto)) {
        return errorResponse("เส้นทางรูปโปรไฟล์ไม่ถูกต้อง", 400, {
          img_profile: ["กรุณาอัปโหลดรูปผ่านระบบเท่านั้น"],
        });
      }
      updateData.img_profile = newPhoto;
    }
    if (data.rfid !== undefined) {
      updateData.rfid = emptyToNull(data.rfid);
    }

    // Admin-chosen password: never store plaintext and never return the hash.
    if (data.ac_password !== undefined) {
      updateData.ac_password = await bcrypt.hash(data.ac_password, 12);
    }

    await db.update(tblAccount).set(updateData).where(eq(tblAccount.ac_id, id));

    // Only remove the old physical file AFTER the database update succeeds.
    // A failure to unlink does not undo saved personnel changes.
    if (
      data.img_profile !== undefined &&
      existing.img_profile &&
      existing.img_profile !== updateData.img_profile
    ) {
      try {
        await deleteUnusedPersonnelPhoto(existing.img_profile, id);
      } catch (photoError) {
        console.error("[PERSON_OLD_PHOTO_CLEANUP]", photoError);
      }
    }

    const updatedPerson = await findPerson(id);
    return successResponse("แก้ไขข้อมูลบุคลากรสำเร็จ", updatedPerson);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return updatePerson(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return updatePerson(request, context);
}

// DELETE /api/auth/person/[id]
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const id = await parsePersonId(context);
    if (id === null) return errorResponse("รหัสบุคลากรไม่ถูกต้อง", 400);
    if (admin.ac_id === id) {
      return errorResponse("ไม่สามารถลบบัญชีของตนเองได้", 409);
    }

    const existing = await findPerson(id);
    if (!existing) {
      return errorResponse("ไม่พบข้อมูลบุคลากรที่ต้องการลบ", 404);
    }

    if (
      existing.ac_role === "admin" &&
      existing.ac_active === 1 &&
      (await isLastActiveAdmin())
    ) {
      return errorResponse("ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้", 409);
    }

    await db.delete(tblAccount).where(eq(tblAccount.ac_id, id));

    if (existing.img_profile) {
      try {
        await deleteUnusedPersonnelPhoto(existing.img_profile, id);
      } catch (photoError) {
        console.error("[PERSON_DELETE_PHOTO_CLEANUP]", photoError);
      }
    }

    return successResponse("ลบข้อมูลบุคลากรสำเร็จ", {
      ac_id: id,
      ac_fname: existing.ac_fname,
      ac_lname: existing.ac_lname,
    });
  } catch (error) {
    return handleError(error);
  }
}
