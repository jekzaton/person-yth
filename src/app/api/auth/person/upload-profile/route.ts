import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { AuthError, requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 2 * 1024 * 1024;
const NO_STORE = { "Cache-Control": "private, no-store" };

function reject(message: string, status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: NO_STORE },
  );
}

function getExtension(bytes: Uint8Array, mime: string): string | null {
  const jpg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;
  const png =
    bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n);
  const webp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP";
  if (mime === "image/jpeg" && jpg) return "jpg";
  if (mime === "image/png" && png) return "png";
  if (mime === "image/webp" && webp) return "webp";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return reject("กรุณาส่งรูปด้วย multipart/form-data");
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return reject("ไม่สามารถอ่านข้อมูลรูปภาพได้");
    }

    const file = formData.get("file");
    if (!(file instanceof File)) return reject("กรุณาเลือกไฟล์รูปภาพ");
    if (file.size === 0 || file.size > MAX_SIZE) {
      return reject("ไฟล์ต้องมีขนาดไม่เกิน 2 MB และต้องไม่ว่าง");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = getExtension(buffer, file.type);
    if (!extension) return reject("รองรับเฉพาะ JPG, PNG และ WebP ที่ถูกต้อง");

    const filename = `${randomUUID()}.${extension}`;
    const uploadDir = path.resolve(
      process.cwd(),
      "public",
      "uploads",
      "personnel",
    );
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer, { flag: "wx" });

    return NextResponse.json(
      {
        success: true,
        message: "อัปโหลดรูปสำเร็จ",
        data: { url: `/person-yth/uploads/personnel/${filename}` },
      },
      { status: 201, headers: NO_STORE },
    );
  } catch (error) {
    if (error instanceof AuthError) return reject(error.message, error.status);
    console.error("[UPLOAD_PROFILE_ERROR]", error);
    return reject("ไม่สามารถอัปโหลดรูปภาพได้", 500);
  }
}
