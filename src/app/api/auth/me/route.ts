import { NextRequest, NextResponse } from "next/server";

import { AuthError, requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        user: {
          ac_id: user.ac_id,
          ac_role: user.ac_role,
          level: user.level,
          ac_active: user.ac_active,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: error.message,
        },
        {
          status: error.status,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    console.error("AUTH ME ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถตรวจสอบสถานะการเข้าสู่ระบบได้",
      },
      { status: 500 },
    );
  }
}
