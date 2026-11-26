import "server-only";

import { AuthError } from "@/lib/auth";
import { jsonError } from "./api-response";

// ================================================
// COMMON API ERROR HANDLER
// ================================================

export function handleApiError(error: unknown, context = "API") {
  // Authentication Error
  if (error instanceof AuthError) {
    const status =
      "status" in error && typeof error.status === "number"
        ? error.status
        : 401;

    return jsonError(error.message, status);
  }

  // Unexpected Error
  console.error(`[${context} ERROR]`, error);

  return jsonError("เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", 500);
}
