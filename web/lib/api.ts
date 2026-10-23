import type { ApiError } from "./types";

export class ApiRequestError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = "request_failed") {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Browser-side fetch for the app's own `/api/*` routes.
 * Never talks to the FastAPI backend directly, so the backend origin stays
 * private and auth cookies are sent same-origin.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    credentials: "same-origin",
  });

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as
    | (T & Partial<ApiError>)
    | null;

  if (!response.ok) {
    const message =
      (payload && typeof payload.error === "string" && payload.error) ||
      "Something went wrong. Please try again.";
    const code =
      (payload && typeof payload.code === "string" && payload.code) ||
      "request_failed";
    throw new ApiRequestError(message, response.status, code);
  }

  return payload as T;
}

/** Downloads a file from an `/api/*` export route. */
export async function downloadFile(path: string, fallbackName: string) {
  const response = await fetch(path, { credentials: "same-origin" });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | Partial<ApiError>
      | null;
    throw new ApiRequestError(
      payload?.error ?? "The download could not be generated.",
      response.status,
      payload?.code ?? "download_failed",
    );
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const filename = match?.[1] ? decodeURIComponent(match[1]) : fallbackName;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
