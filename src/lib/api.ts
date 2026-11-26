/**
 * src/lib/api.ts
 * Centralized API Client
 */

export const BASE_PATH = "/person-yth";
export const API_URL = `${BASE_PATH}/api`;

// ======================================================
// TYPES
// ======================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;

  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  stats?: {
    total: number;
    active: number;
    inactive: number;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

// ======================================================
// API CLIENT
// ======================================================

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<ApiResponse<T>> {
  const { body, headers, ...restOptions } = options;

  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const url = `${API_URL}${normalizedEndpoint}`;

  const requestHeaders = new Headers(headers);

  const isFormData = body instanceof FormData;

  if (body !== undefined && !isFormData) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...restOptions,
    credentials: "same-origin",
    headers: requestHeaders,
    ...(body !== undefined
      ? {
          body: isFormData ? body : JSON.stringify(body),
        }
      : {}),
  });

  const contentType = response.headers.get("content-type");

  let result: ApiResponse<T>;

  if (contentType?.includes("application/json")) {
    result = (await response.json()) as ApiResponse<T>;
  } else {
    throw new ApiError("เซิร์ฟเวอร์ตอบกลับข้อมูลไม่ถูกต้อง", response.status);
  }

  if (!response.ok || !result.success) {
    throw new ApiError(
      result.message || "เกิดข้อผิดพลาดในการเรียก API",
      response.status,
      result.errors,
    );
  }

  return result;
}

// ======================================================
// HTTP METHODS
// ======================================================

export const api = {
  get: <T = unknown>(endpoint: string, options?: ApiOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "GET",
    }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "POST",
      body,
    }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PUT",
      body,
    }),

  patch: <T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: ApiOptions,
  ) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PATCH",
      body,
    }),

  delete: <T = unknown>(endpoint: string, options?: ApiOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "DELETE",
    }),
};
