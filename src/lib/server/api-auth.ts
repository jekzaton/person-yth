import "server-only";

import type { NextRequest } from "next/server";

import { requireAuth } from "@/lib/auth";
import { jsonError } from "./api-response";

// ================================================
// TYPES
// ================================================

export type ApiRole = "admin" | "member" | "user";

interface AuthorizeOptions {
  roles?: readonly ApiRole[];
  requireActive?: boolean;
}

// ================================================
// AUTHORIZATION
// ================================================

export async function authorizeApi(
  request: NextRequest,
  options: AuthorizeOptions = {},
) {
  const { roles = [], requireActive = true } = options;

  // ตรวจ JWT และสถานะบัญชีล่าสุดจากฐานข้อมูล
  const user = await requireAuth(request);

  // ตรวจบัญชีเปิดใช้งาน
  if (requireActive && user.ac_active !== 1) {
    return {
      authorized: false as const,
      response: jsonError("บัญชีผู้ใช้งานถูกระงับหรือปิดใช้งาน", 403),
    };
  }

  // ตรวจบทบาท
  if (roles.length > 0 && !roles.includes(user.ac_role as ApiRole)) {
    return {
      authorized: false as const,
      response: jsonError("คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้", 403),
    };
  }

  return {
    authorized: true as const,
    user,
  };
}

// ================================================
// SHORTCUT FUNCTIONS
// ================================================

// Login + Active
export function authorizeActiveUser(request: NextRequest) {
  return authorizeApi(request, {
    requireActive: true,
  });
}

// Login + Admin + Active
export function authorizeAdmin(request: NextRequest) {
  return authorizeApi(request, {
    roles: ["admin"],
    requireActive: true,
  });
}

// Login + Admin/Member + Active
export function authorizeStaff(request: NextRequest) {
  return authorizeApi(request, {
    roles: ["admin", "member"],
    requireActive: true,
  });
}
