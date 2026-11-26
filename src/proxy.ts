import createMiddleware from "next-intl/middleware";
import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

import { routing } from "./i18n/routing";

// ======================================================
// CONFIG
// ======================================================

const intlMiddleware = createMiddleware(routing);

const BASE_PATH = "/person-yth";
const COOKIE_NAME = "person_yth_token";

const LOGIN_PATH = "/";
const DASHBOARD_PATH = "/dashboard";

const JWT_ISSUER = "person-yth";
const JWT_AUDIENCE = "person-yth-users";

const LOCALES: readonly string[] = routing.locales;

// ======================================================
// PATH HELPERS
// ======================================================

function stripBasePath(pathname: string): string {
  if (pathname === BASE_PATH) {
    return "/";
  }

  if (pathname.startsWith(`${BASE_PATH}/`)) {
    return pathname.slice(BASE_PATH.length) || "/";
  }

  return pathname || "/";
}

function normalizePathname(pathname: string): {
  pathname: string;
  locale: string | null;
} {
  const path = stripBasePath(pathname);

  const segments = path.split("/").filter(Boolean);

  const firstSegment = segments[0];

  const locale =
    firstSegment && LOCALES.includes(firstSegment) ? firstSegment : null;

  const remainingSegments = locale ? segments.slice(1) : segments;

  const normalizedPath =
    remainingSegments.length > 0 ? `/${remainingSegments.join("/")}` : "/";

  return {
    pathname: normalizedPath,
    locale,
  };
}

function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

// ======================================================
// AUTHENTICATION
// ======================================================

async function verifyAuth(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("[AUTH PROXY] JWT_SECRET is missing");
    return false;
  }

  const encodedSecret = new TextEncoder().encode(secret);

  if (encodedSecret.length < 32) {
    console.error("[AUTH PROXY] JWT_SECRET must be at least 32 bytes");
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return (
      typeof payload.ac_id === "number" &&
      Number.isSafeInteger(payload.ac_id) &&
      payload.ac_id > 0 &&
      payload.sub === String(payload.ac_id) &&
      typeof payload.ac_cid === "string" &&
      /^\d{13}$/.test(payload.ac_cid) &&
      (payload.ac_role === "admin" ||
        payload.ac_role === "member" ||
        payload.ac_role === "user") &&
      typeof payload.level === "number" &&
      Number.isSafeInteger(payload.level) &&
      payload.level >= 0
    );
  } catch {
    return false;
  }
}

// ======================================================
// REDIRECT
// ======================================================

function redirectTo(
  request: NextRequest,
  destination: string,
  locale: string | null,
): NextResponse {
  const localePrefix = locale ? `/${locale}` : "";

  const target =
    destination === "/"
      ? `${BASE_PATH}${localePrefix || "/"}`
      : `${BASE_PATH}${localePrefix}${destination}`;

  const url = new URL(target, request.url);

  // ไม่ส่ง query เดิมไปหน้า Login
  url.search = "";

  return NextResponse.redirect(url);
}

// ======================================================
// CLEAR AUTH COOKIE
// ======================================================

function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: BASE_PATH,
    maxAge: 0,
    expires: new Date(0),
  });
}

// ======================================================
// MAIN PROXY
// ======================================================

export default async function proxy(request: NextRequest) {
  const { pathname, locale } = normalizePathname(request.nextUrl.pathname);

  // -----------------------------------------------
  // API ROUTES
  // -----------------------------------------------
  // ให้ API จัดการสิทธิ์ด้วย requireAuth / requireAdmin
  // จากฐานข้อมูลจริง
  if (isApiPath(pathname)) {
    return NextResponse.next();
  }

  // -----------------------------------------------
  // AUTHENTICATION
  // -----------------------------------------------

  const authenticated = await verifyAuth(request);

  const isLoginPage = pathname === LOGIN_PATH;

  // -----------------------------------------------
  // ALREADY LOGIN
  // -----------------------------------------------

  if (authenticated && isLoginPage) {
    return redirectTo(request, DASHBOARD_PATH, locale);
  }

  // -----------------------------------------------
  // NOT AUTHENTICATED
  // -----------------------------------------------

  if (!authenticated && !isLoginPage) {
    const response = redirectTo(request, LOGIN_PATH, locale);

    clearAuthCookie(response);

    return response;
  }

  // -----------------------------------------------
  // NEXT INTL
  // -----------------------------------------------

  return intlMiddleware(request);
}

// ======================================================
// MATCHER
// ======================================================

export const config = {
  matcher: ["/", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
