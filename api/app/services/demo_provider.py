"""Deterministic demo provider.

This provider never touches the network. It produces stable, clearly-labelled
sample transcripts so the product, exports, jobs and failure handling can be
tested without pretending to offer real transcription.

Determinism matters: the same video id always yields the same title, segments
and (for a subset of ids) the same failure.
"""

from __future__ import annotations

import hashlib
import random
from dataclasses import dataclass

from ..domain import Segment
from ..errors import CaptionsUnavailable, PlaylistEmpty
from .transcript_provider import (
    PlaylistEntryPayload,
    PlaylistPayload,
    TranscriptPayload,
)
from .urls import ParsedSource

SUBJECTS = [
    "the ice-albedo effect",
    "water-vapour feedback",
    "ocean heat uptake",
    "cloud microphysics",
    "the carbon cycle",
    "aerosol cooling",
    "permafrost thaw",
    "the jet stream",
]

OPENERS = [
    "Let's begin with {subject} and why it matters in this unit.",
    "Today we are looking at {subject} in practical terms.",
    "The clearest example of this idea is {subject}.",
]

BODY = [
    "When the system changes, the response can either amplify the change or dampen it.",
    "A positive feedback reinforces the original change, while a negative feedback pushes back toward equilibrium.",
    "That distinction matters because the timescales are completely different.",
    "Observations show a range rather than a single number, and that range is part of the result.",
    "If you remember one thing from this section, make it the direction of the response.",
    "We can measure the input, the response, and the delay between them.",
    "The model is deliberately simple so the mechanism stays visible.",
    "In the next section we will connect this to the wider system.",
]

CLOSERS = [
    "That is the mechanism to keep in mind as we move on.",
    "We will return to this when we discuss the larger system.",
    "Write down the direction of each feedback before the next part.",
]

def _safe_playlist_video_id(seed_number: int, index: int) -> str:
    """Deterministic id that never triggers the demo's random failure rule."""
    for attempt in range(200):
        candidate = f"dm{(seed_number + index * 131 + attempt * 17):09x}"[-11:]
        candidate = candidate.ljust(11, "d")[:11]
        if "fail" in candidate:
            continue
        if _seed(f"captions:{candidate}").number % 11 == 0:
            continue
        return candidate
    return f"dm{index:09x}"[:11].ljust(11, "d")


PLAYLIST_TOPICS = [
    "Foundations",
    "Core mechanisms",
    "Measuring the response",
    "Common misconceptions",
    "Case study",
    "Worked example",
    "Field notes",
    "Exam revision",
    "Further reading",
]


@dataclass(frozen=True)
class _Seed:
    number: int
    digest: str


def _seed(value: str) -> _Seed:
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()
    return _Seed(number=int(digest[:8], 16), digest=digest)


def _title_for(video_id: str) -> str:
    seed = _seed(video_id)
    topic = SUBJECTS[seed.number % len(SUBJECTS)].title()
    return f"[Demo] {topic}: a worked explanation"


class DemoProvider:
    name = "demo"
    is_demo = True

    async def fetch_transcript(
        self, source: ParsedSource, language: str
    ) -> TranscriptPayload:
        video_id = source.video_id or ""
        seed = _seed(f"captions:{video_id}")

        # A deterministic subset of ids fails so failure handling can be tested.
        if "fail" in video_id.lower() or seed.number % 11 == 0:
            raise CaptionsUnavailable(
                "This demo video has no caption track. The demo provider returns "
                "a real unavailable state instead of inventing text."
            )

        rng = random.Random(seed.number)
        segment_count = 8 + (seed.number % 5)
        segments: list[Segment] = []
        clock = 0.0

        subject = SUBJECTS[(seed.number + 3) % len(SUBJECTS)]
        opener = OPENERS[seed.number % len(OPENERS)].format(subject=subject)

        for index in range(segment_count):
            if index == 0:
                text = opener
            elif index == segment_count - 1:
                text = CLOSERS[(seed.number + index) % len(CLOSERS)]
            else:
                first = BODY[(seed.number + index) % len(BODY)]
                second = BODY[(seed.number + index * 3 + 1) % len(BODY)]
                text = f"{first} {second}"

            duration = 3.0 + (rng.random() * 5.0)
            segments.append(
                Segment(start=round(clock, 2), duration=round(duration, 2), text=text)
            )
            clock += duration + 0.4

        text = " ".join(segment.text for segment in segments)

        # The demo corpus is English-only. Requesting Hindi/Marathi falls back to
        # the first available (English) track, which the API reports honestly.
        resolved_language = "en"

        return TranscriptPayload(
            title=_title_for(video_id),
            video_id=video_id,
            source_url=source.canonical_url,
            language=resolved_language,
            text=text,
            segments=segments,
            provider=self.name,
            is_demo=True,
        )

    async def list_playlist(self, source: ParsedSource) -> PlaylistPayload:
        playlist_id = source.playlist_id or ""
        seed = _seed(f"playlist:{playlist_id}")

        if "empty" in playlist_id.lower():
            raise PlaylistEmpty("That demo playlist has no available videos.")

        count = 6 + (seed.number % 4)
        rng = random.Random(seed.number)
        entries: list[PlaylistEntryPayload] = []

        for index in range(count):
            topic = PLAYLIST_TOPICS[(seed.number + index) % len(PLAYLIST_TOPICS)]
            # Exactly one entry fails, always at position 3, so retry and the
            # failure report are testable with predictable counts.
            video_id = (
                "fail002demo"
                if index == 2
                else _safe_playlist_video_id(seed.number, index)
            )
            entries.append(
                PlaylistEntryPayload(
                    video_id=video_id,
                    title=f"{index + 1:02d}. {topic}",
                    source_url=f"https://www.youtube.com/watch?v={video_id}",
                    duration_seconds=int(120 + rng.random() * 600),
                )
            )

        return PlaylistPayload(
            playlist_id=playlist_id,
            title=f"[Demo] Understanding the climate system ({count} videos)",
            entries=entries,
            provider=self.name,
            is_demo=True,
        )
