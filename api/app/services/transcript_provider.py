"""Transcript provider abstraction.

The interface separates *how* captions are obtained from the rest of the
product. Only the demo provider ships here. A production provider must be an
authorized/licensed caption source; unauthorized scraping is not implemented.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol

from ..config import Settings
from ..errors import ProviderUnavailable
from .urls import ParsedSource


@dataclass
class TranscriptPayload:
    title: str
    video_id: str
    source_url: str
    language: str
    text: str
    segments: list
    provider: str
    is_demo: bool


@dataclass
class PlaylistEntryPayload:
    video_id: str
    title: str
    source_url: str
    duration_seconds: int | None = None


@dataclass
class PlaylistPayload:
    playlist_id: str
    title: str
    entries: list[PlaylistEntryPayload] = field(default_factory=list)
    provider: str = "demo"
    is_demo: bool = True


class TranscriptProvider(Protocol):
    name: str
    is_demo: bool

    async def fetch_transcript(
        self, source: ParsedSource, language: str
    ) -> TranscriptPayload: ...

    async def list_playlist(self, source: ParsedSource) -> PlaylistPayload: ...


def build_provider(settings: Settings) -> TranscriptProvider:
    """Return the configured provider.

    Unknown provider names fail closed instead of silently falling back to demo
    data in a deployment that expects real transcripts.
    """
    name = settings.provider_name.strip().lower()
    if name == "demo":
        from .demo_provider import DemoProvider

        return DemoProvider()

    raise ProviderUnavailable(
        "The configured transcript provider is not implemented in this build. "
        "Only the demo provider is available until an authorized provider is wired."
    )
