/**
 * Client-side mirror of the backend URL allowlist.
 * The backend remains the authority; this only gives immediate feedback.
 */

export type SourceKind = "video" | "playlist";

export interface ParsedSource {
  kind: SourceKind;
  /** Present for videos. */
  videoId?: string;
  /** Present for playlists. */
  playlistId?: string;
  /** Normalised canonical URL. */
  url: string;
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,64}$/;
const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

export function parseSourceUrl(input: string): ParsedSource | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) return null;

  const path = url.pathname.replace(/\/+$/, "");

  if (host === "youtu.be" || host === "www.youtu.be") {
    const id = path.slice(1);
    if (!VIDEO_ID.test(id)) return null;
    return { kind: "video", videoId: id, url: `https://www.youtube.com/watch?v=${id}` };
  }

  const list = url.searchParams.get("list");
  if (path === "/playlist" && list) {
    if (!PLAYLIST_ID.test(list)) return null;
    return {
      kind: "playlist",
      playlistId: list,
      url: `https://www.youtube.com/playlist?list=${list}`,
    };
  }

  const v = url.searchParams.get("v");
  if (path === "/watch" && v) {
    if (!VIDEO_ID.test(v)) return null;
    return { kind: "video", videoId: v, url: `https://www.youtube.com/watch?v=${v}` };
  }

  const prefixMatch = /^\/(shorts|embed|live|v)\/([^/]+)$/.exec(path);
  if (prefixMatch) {
    const id = prefixMatch[2];
    if (!VIDEO_ID.test(id)) return null;
    return { kind: "video", videoId: id, url: `https://www.youtube.com/watch?v=${id}` };
  }

  return null;
}

export function describeSourceError(input: string, expected: SourceKind): string {
  if (!input.trim()) {
    return expected === "video"
      ? "Paste a video URL first."
      : "Paste a playlist URL first.";
  }
  if (!parseSourceUrl(input)) {
    return "That doesn't look like a YouTube link. Supported: youtube.com/watch, youtu.be, youtube.com/shorts, youtube.com/playlist.";
  }
  const parsed = parseSourceUrl(input);
  if (parsed && parsed.kind !== expected) {
    return expected === "video"
      ? "That is a playlist link. Switch to playlist mode to process it."
      : "That is a single-video link. Switch to single-video mode to process it.";
  }
  return "";
}
