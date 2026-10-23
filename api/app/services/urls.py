"""Strict source-URL parsing.

Only canonical YouTube video and playlist links are accepted. Nothing in this
module fetches the URL: downstream code only receives a video/playlist id, which
removes the usual SSRF surface (no arbitrary host fetching).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal
from urllib.parse import parse_qs, urlparse

from ..errors import InvalidUrl, UnsupportedHost

SourceKind = Literal["video", "playlist"]

VIDEO_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
PLAYLIST_ID_RE = re.compile(r"^[A-Za-z0-9_-]{10,64}$")
IP_HOST_RE = re.compile(r"^\d{1,3}(\.\d{1,3}){3}$")

ALLOWED_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
    "www.youtu.be",
}


@dataclass(frozen=True)
class ParsedSource:
    kind: SourceKind
    canonical_url: str
    video_id: str | None = None
    playlist_id: str | None = None


def parse_source_url(value: str, expected: SourceKind | None = None) -> ParsedSource:
    """Parse and normalise a supported YouTube URL.

    Raises InvalidUrl / UnsupportedHost for anything else. Inputs are never
    fetched, so internal hosts, credentials and ports are rejected outright.
    """
    if not isinstance(value, str):
        raise InvalidUrl("The URL must be a string.")

    raw = value.strip()
    if not raw:
        raise InvalidUrl("Paste a video or playlist URL first.")
    if len(raw) > 2048:
        raise InvalidUrl("That URL is too long.")
    if "://" not in raw:
        raw = f"https://{raw}"

    try:
        parsed = urlparse(raw)
    except ValueError as exc:  # pragma: no cover - urlparse rarely raises
        raise InvalidUrl("That URL could not be parsed.") from exc

    if parsed.scheme not in {"http", "https"}:
        raise InvalidUrl("Only http and https links are supported.")
    if parsed.username or parsed.password:
        raise UnsupportedHost("Links with embedded credentials are not accepted.")
    try:
        port = parsed.port
    except ValueError as exc:
        raise InvalidUrl("That URL has an invalid port.") from exc
    if port is not None:
        raise UnsupportedHost("Links with an explicit port are not accepted.")

    host = (parsed.hostname or "").lower()
    if not host:
        raise InvalidUrl("That URL has no host.")
    if IP_HOST_RE.match(host) or host.startswith("["):
        raise UnsupportedHost("IP-address hosts are not supported.")
    if host not in ALLOWED_HOSTS:
        raise UnsupportedHost(
            "Only YouTube video and playlist links are supported in this build."
        )

    path = parsed.path.rstrip("/")
    query = parse_qs(parsed.query)
    source: ParsedSource | None = None

    if host in {"youtu.be", "www.youtu.be"}:
        candidate = path.lstrip("/")
        if VIDEO_ID_RE.match(candidate):
            source = ParsedSource(
                kind="video",
                video_id=candidate,
                canonical_url=f"https://www.youtube.com/watch?v={candidate}",
            )
    elif path == "/playlist" and query.get("list"):
        playlist_id = query["list"][0]
        if PLAYLIST_ID_RE.match(playlist_id):
            source = ParsedSource(
                kind="playlist",
                playlist_id=playlist_id,
                canonical_url=f"https://www.youtube.com/playlist?list={playlist_id}",
            )
    elif path == "/watch" and query.get("v"):
        video_id = query["v"][0]
        if VIDEO_ID_RE.match(video_id):
            source = ParsedSource(
                kind="video",
                video_id=video_id,
                canonical_url=f"https://www.youtube.com/watch?v={video_id}",
            )
    else:
        prefix_match = re.match(r"^/(shorts|embed|live|v)/([^/]+)$", path)
        if prefix_match and VIDEO_ID_RE.match(prefix_match.group(2)):
            video_id = prefix_match.group(2)
            source = ParsedSource(
                kind="video",
                video_id=video_id,
                canonical_url=f"https://www.youtube.com/watch?v={video_id}",
            )

    if source is None:
        raise InvalidUrl(
            "That does not look like a supported YouTube video or playlist link."
        )

    if expected is not None and source.kind != expected:
        raise InvalidUrl(
            "That is a playlist link."
            if expected == "video"
            else "That is a single-video link."
        )

    return source
