import "server-only";

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { tblAccount, type AccountRole } from "@/db/schema/tbl_account";

// =====================================================
// CONFIGURATION
// =====================================================

export const AUTH_COOKIE_NAME = "person_yth_token";

// JWT อายุ 8 ชั่วโมง
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 8;

const JWT_ISSUER = "person-yth";
const JWT_AUDIENCE = "person-yth-users";

// =====================================================
// JWT SECRET
// =====================================================

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const encoded = new TextEncoder().encode(secret);

  if (encoded.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 bytes");
  }

  return encoded;
}

// =====================================================
// TYPES
// =====================================================

export interface AuthUser {
  ac_id: number;
  ac_cid: string;
  ac_role: AccountRole;
  level: number;
  ac_active: number;
}

export interface AuthTokenPayload extends JWTPayload {
  ac_id: number;
  ac_cid: string;
  ac_role: AccountRole;
  level: number;
}

// =====================================================
// AUTH ERROR
// =====================================================

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403 = 401,
  ) {
    super(message);

    this.name = "AuthError";
  }
}

// =====================================================
// CREATE JWT TOKEN
// =====================================================

export async function createAuthToken(
  user: Pick<AuthUser, "ac_id" | "ac_cid" | "ac_role" | "level">,
): Promise<string> {
  if (
    !Number.isSafeInteger(user.ac_id) ||
    user.ac_id <= 0 ||
    !/^\d{13}$/.test(user.ac_cid) ||
    !["admin", "member", "user"].includes(user.ac_role) ||
    !Number.isSafeInteger(user.level) ||
    user.level < 0
  ) {
    throw new Error("Invalid account data for JWT");
  }

  return new SignJWT({
    ac_id: user.ac_id,
    ac_cid: user.ac_cid,
    ac_role: user.ac_role,
    level: user.level,
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setSubject(String(user.ac_id))
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime("8h")
    .sign(getJwtSecret());
}

// =====================================================
// VERIFY JWT TOKEN
// =====================================================

export async function verifyAuthToken(
  token: string,
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (
      typeof payload.ac_id !== "number" ||
      !Number.isSafeInteger(payload.ac_id) ||
      payload.ac_id <= 0 ||
      payload.sub !== String(payload.ac_id) ||
      typeof payload.ac_cid !== "string" ||
      !/^\d{13}$/.test(payload.ac_cid) ||
      !["admin", "member", "user"].includes(String(payload.ac_role)) ||
      typeof payload.level !== "number" ||
      !Number.isSafeInteger(payload.level) ||
      payload.level < 0
    ) {
      return null;
    }

    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}

// =====================================================
// REQUIRE AUTHENTICATED USER
// =====================================================

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  // -------------------------------------------------
  // 1. READ JWT HTTPONLY COOKIE
  // -------------------------------------------------

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    throw new AuthError("กรุณาเข้าสู่ระบบก่อนใช้งาน", 401);
  }

  // -------------------------------------------------
  // 2. VERIFY JWT
  // -------------------------------------------------

  const payload = await verifyAuthToken(token);

  if (!payload) {
    throw new AuthError(
      "เซสชันหมดอายุหรือ Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่",
      401,
    );
  }

  // -------------------------------------------------
  // 3. FETCH CURRENT ACCOUNT FROM MYSQL
  // -------------------------------------------------

  const [account] = await db
    .select({
      ac_id: tblAccount.ac_id,
      ac_cid: tblAccount.ac_cid,
      ac_role: tblAccount.ac_role,
      level: tblAccount.level,
      ac_active: tblAccount.ac_active,
    })
    .from(tblAccount)
    .where(eq(tblAccount.ac_id, payload.ac_id))
    .limit(1);

  // -------------------------------------------------
  // 4. ACCOUNT EXISTS
  // -------------------------------------------------

  if (!account) {
    throw new AuthError("ไม่พบบัญชีผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่", 401);
  }

  // -------------------------------------------------
  // 5. CHECK ACCOUNT IDENTITY
  // -------------------------------------------------

  if (account.ac_cid !== payload.ac_cid) {
    throw new AuthError(
      "ข้อมูลบัญชีผู้ใช้งานไม่ตรงกับระบบ กรุณาเข้าสู่ระบบใหม่",
      401,
    );
  }

  // -------------------------------------------------
  // 6. CHECK ACCOUNT STATUS
  // -------------------------------------------------

  if (account.ac_active !== 1) {
    throw new AuthError(
      "บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
      403,
    );
  }

  // -------------------------------------------------
  // 7. RETURN CURRENT ROLE AND LEVEL
  // -------------------------------------------------

  return {
    ac_id: account.ac_id,
    ac_cid: account.ac_cid,
    ac_role: account.ac_role,
    level: account.level,
    ac_active: account.ac_active,
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();

  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token);

  if (!payload) {
    return null;
  }

  const [account] = await db
    .select({
      ac_id: tblAccount.ac_id,
      ac_cid: tblAccount.ac_cid,
      ac_role: tblAccount.ac_role,
      level: tblAccount.level,
      ac_active: tblAccount.ac_active,
    })
    .from(tblAccount)
    .where(eq(tblAccount.ac_id, payload.ac_id))
    .limit(1);

  if (!account) {
    return null;
  }

  // ป้องกัน Token ของบัญชีอื่น
  if (account.ac_cid !== payload.ac_cid) {
    return null;
  }

  // บัญชีที่ถูกปิดใช้งานไม่มีสิทธิ์
  if (account.ac_active !== 1) {
    return null;
  }

  return {
    ac_id: account.ac_id,
    ac_cid: account.ac_cid,
    ac_role: account.ac_role,
    level: account.level,
    ac_active: account.ac_active,
  };
}
// =====================================================
// REQUIRE ACTIVE USER
// =====================================================
// requireAuth ตรวจ ac_active จาก DB อยู่แล้ว

export const requireActiveUser = requireAuth;

// =====================================================
// CHECK AUTHENTICATION STATUS
// =====================================================

export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    await requireAuth(request);

    return true;
  } catch (error) {
    if (error instanceof AuthError) {
      return false;
    }

    // Database หรือระบบมีปัญหา
    // ไม่ควรซ่อน Error ให้กลายเป็นไม่ได้ Login
    throw error;
  }
}

// =====================================================
// REQUIRE SPECIFIC ROLES
// =====================================================

export async function requireRole(
  request: NextRequest,
  roles: readonly AccountRole[],
): Promise<AuthUser> {
  const user = await requireAuth(request);

  if (!roles.includes(user.ac_role)) {
    throw new AuthError("คุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้", 403);
  }

  return user;
}

// =====================================================
// REQUIRE ADMIN
// =====================================================

export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  return requireRole(request, ["admin"]);
}

// =====================================================
// REQUIRE MINIMUM LEVEL
// =====================================================

export async function requireLevel(
  request: NextRequest,
  minimumLevel: number,
): Promise<AuthUser> {
  if (!Number.isSafeInteger(minimumLevel) || minimumLevel < 0) {
    throw new Error("Invalid minimumLevel");
  }

  const user = await requireAuth(request);

  if (user.level < minimumLevel) {
    throw new AuthError("ระดับสิทธิ์ของคุณไม่เพียงพอ", 403);
  }

  return user;
}

// =====================================================
// COOKIE CONFIGURATION
// =====================================================

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/person-yth",
  maxAge: AUTH_COOKIE_MAX_AGE,
};
