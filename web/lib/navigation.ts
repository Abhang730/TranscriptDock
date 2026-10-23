import { SITE_URL } from "./brand";

/**
 * Allows only same-site absolute paths as post-auth redirects.
 * Prevents open-redirect abuse through `?next=`.
 */
export function safeNextPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\")) return fallback;
  if (/^\/[a-z]+:/i.test(trimmed)) return fallback;
  return trimmed.slice(0, 512);
}

/** Absolute site URL for a path, used by auth and metadata helpers. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
