import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ======================================================
// POST /api/auth/signout
// ======================================================

export async function POST() {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: "ออกจากระบบสำเร็จ",
      },
      { status: 200 },
    );

    // Prevent caching
    response.headers.set("Cache-Control", "no-store");

    // ==================================================
    // DELETE JWT HTTPONLY COOKIE
    // ==================================================

    response.cookies.set({
      ...AUTH_COOKIE_OPTIONS,
      name: AUTH_COOKIE_NAME,
      value: "",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("SIGNOUT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการออกจากระบบ",
      },
      { status: 500 },
    );
  }
}
