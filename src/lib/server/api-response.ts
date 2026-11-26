import "server-only";

import { NextResponse } from "next/server";

// ================================================
// SUCCESS RESPONSE
// ================================================

export function jsonSuccess<T>(message: string, data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status },
  );
}

// ================================================
// ERROR RESPONSE
// ================================================

export function jsonError(message: string, status = 400, errors?: unknown) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(errors !== undefined ? { errors } : {}),
    },
    { status },
  );
}
