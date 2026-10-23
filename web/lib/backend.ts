import { getAccessToken } from "@/lib/supabase/server";

/** Internal backend origin. Server-only: never expose this to the browser. */
export const API_ORIGIN = (
  process.env.API_ORIGIN ??
  process.env.NEXT_PUBLIC_API_ORIGIN ??
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export interface BackendResult {
  response: Response;
  /** Parsed JSON body, or null when the response has no JSON body. */
  body: unknown;
}

export interface BackendRequestOptions {
  method?: string;
  /** JSON body. Mutually exclusive with `rawBody`. */
  json?: unknown;
  /** Raw body preserved byte-for-byte (needed for webhook signatures). */
  rawBody?: string;
  headers?: Record<string, string>;
  /** Forward the signed-in user's Supabase access token. Defaults to true. */
  authenticate?: boolean;
  signal?: AbortSignal;
}

/**
 * Calls the FastAPI backend from a Next.js route handler.
 * Adds the Supabase access token and the caller's IP so the backend can
 * enforce ownership and rate limits without trusting request bodies.
 */
export async function callBackend(
  path: string,
  options: BackendRequestOptions = {},
): Promise<BackendResult> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  let body: string | undefined;
  if (options.rawBody !== undefined) {
    body = options.rawBody;
  } else if (options.json !== undefined) {
    body = JSON.stringify(options.json);
    headers["Content-Type"] = "application/json";
  }

  if (options.authenticate !== false) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_ORIGIN}/v1${path}`, {
    method: options.method ?? (body ? "POST" : "GET"),
    headers,
    body,
    cache: "no-store",
    signal: options.signal ?? AbortSignal.timeout(25_000),
  });

  const contentType = response.headers.get("content-type") ?? "";
  let parsed: unknown = null;
  if (contentType.includes("application/json")) {
    parsed = await response.json().catch(() => null);
  }

  return { response, body: parsed };
}

/** Converts a backend error payload into a consistent `{ error, code }` shape. */
export function normaliseBackendError(
  status: number,
  payload: unknown,
): { status: number; error: string; code: string } {
  let message = "The processing service could not complete this request.";
  let code = "backend_error";

  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === "string") {
      message = detail;
    } else if (detail && typeof detail === "object") {
      const record = detail as Record<string, unknown>;
      if (typeof record.error === "string") message = record.error;
      if (typeof record.code === "string") code = record.code;
    }
  }

  return { status, error: message, code };
}
