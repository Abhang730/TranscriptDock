/**
 * Central brand + pricing configuration.
 *
 * Everything here is presentation-facing. The backend (`api/app/config.py`)
 * is the source of truth for limits, prices and entitlements; these values
 * must stay in sync until the UI reads them from `/api/config`.
 */

/** Visible product name. */
export const BRAND_NAME = "TranscriptDock";

/** Product tagline used in metadata and marketing copy. */
export const BRAND_TAGLINE =
  "Turn video captions into clean, searchable transcripts.";

/** Logo mark — the geometric "TD" lockup. */
export const LOGO_SHORTCUT = "TD";

/**
 * Pricing + entitlement configuration for the one-time support pack.
 * Mirrored server-side in `api/app/config.py`.
 */
export const SUPPORT_PACK = {
  /** Price in INR, displayed only. */
  priceInr: 49,

  /** Paise amount used for payment creation/verification. */
  pricePaise: 4900,

  /** Entitlement granted by the pack — configurable server-side. */
  credits: 50,

  /** Max videos per batch for a pack holder — configurable server-side. */
  maxVideosPerBatch: 25,
} as const;

/** Free tier configured limits (user-facing descriptions). */
export const FREE_TIER = {
  /** Credits granted when a new account is created. */
  credits: 20,

  /** Max videos per batch for free users. */
  maxVideosPerBatch: 5,

  /** Label used in the UI. */
  creditsLabel: "Free",
} as const;

/** Supported transcript languages exposed to the UI. */
export const TRANSCRIPT_LANGUAGES = [
  { value: "auto", label: "Auto (best available)" },
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "mr", label: "Marathi" },
] as const;

/** Canonical transcript format definitions. */
export const TRANSCRIPT_FORMATS = [
  { id: "txt", label: "TXT", description: "Plain text transcript" },
  { id: "csv", label: "CSV", description: "Transcript as table rows" },
  { id: "srt", label: "SRT", description: "SubRip subtitles (when timestamps exist)" },
  { id: "vtt", label: "VTT", description: "WebVTT subtitles (when timestamps exist)" },
] as const;

export type TranscriptFormat = (typeof TRANSCRIPT_FORMATS)[number]["id"];

/** Public marketing site URL (used for auth redirects, OG tags, emails). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "http://localhost:3000";

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@transcriptdock.example";

/** Effective date used on legal pages (placeholder until a real date is supplied). */
export const LEGAL_EFFECTIVE_DATE = "2026-10-23";

/** Max entries accepted for an anonymous single-video demo request. */
export const ANONYMOUS_MAX_ITEMS = 1;
