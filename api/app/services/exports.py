"""Transcript export rendering.

All formats are generated from stored transcript records. SRT/VTT require
timestamps and fail explicitly when segments are missing rather than emitting an
empty subtitle file.
"""

from __future__ import annotations

import csv
import io
import re
import zipfile
from dataclasses import dataclass

from ..domain import Job, JobItem
from ..errors import AppError


class ExportUnavailable(AppError):
    status_code = 422
    code = "export_unavailable"


@dataclass
class ExportFile:
    content: bytes
    filename: str
    media_type: str


def slugify(value: str, fallback: str = "transcript") -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "-", value).strip("-._").lower()
    return cleaned[:80] or fallback


def _timestamp(seconds: float, *, comma: bool) -> str:
    total_ms = max(0, int(round(seconds * 1000)))
    hours, remainder = divmod(total_ms, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    separator = "," if comma else "."
    return f"{hours:02d}:{minutes:02d}:{secs:02d}{separator}{millis:03d}"


def _header(item: JobItem, job: Job) -> str:
    transcript = item.transcript
    if transcript is None:
        return ""
    lines = [transcript.title, transcript.source_url]
    lines.append(f"Language: {transcript.language or 'unknown'}")
    lines.append(f"Provider: {transcript.provider}")
    if transcript.is_demo:
        lines.append("NOTE: This is demonstration data from the demo provider.")
    lines.append(f"Segments: {transcript.segment_count}")
    return "\n".join(lines)


def render_txt(job: Job, item: JobItem) -> ExportFile:
    if item.transcript is None:
        raise ExportUnavailable("That item has no transcript.")
    body = f"{_header(item, job)}\n\n{item.transcript.text}\n"
    filename = f"{slugify(item.transcript.title)}-{item.video_id}.txt"
    return ExportFile(body.encode("utf-8"), filename, "text/plain; charset=utf-8")


def render_srt(job: Job, item: JobItem) -> ExportFile:
    transcript = item.transcript
    if transcript is None:
        raise ExportUnavailable("That item has no transcript.")
    if not transcript.segments:
        raise ExportUnavailable(
            "This transcript has no timestamps, so an SRT file cannot be generated."
        )

    blocks: list[str] = []
    for index, segment in enumerate(transcript.segments, start=1):
        end = segment.start + segment.duration
        blocks.append(
            f"{index}\n{_timestamp(segment.start, comma=True)} --> "
            f"{_timestamp(end, comma=True)}\n{segment.text}\n"
        )

    filename = f"{slugify(transcript.title)}-{item.video_id}.srt"
    return ExportFile(
        ("\n".join(blocks)).encode("utf-8"),
        filename,
        "application/x-subrip; charset=utf-8",
    )


def render_vtt(job: Job, item: JobItem) -> ExportFile:
    transcript = item.transcript
    if transcript is None:
        raise ExportUnavailable("That item has no transcript.")
    if not transcript.segments:
        raise ExportUnavailable(
            "This transcript has no timestamps, so a VTT file cannot be generated."
        )

    blocks = ["WEBVTT", ""]
    for segment in transcript.segments:
        end = segment.start + segment.duration
        blocks.append(
            f"{_timestamp(segment.start, comma=False)} --> "
            f"{_timestamp(end, comma=False)}\n{segment.text}\n"
        )

    filename = f"{slugify(transcript.title)}-{item.video_id}.vtt"
    return ExportFile(
        ("\n".join(blocks)).encode("utf-8"),
        filename,
        "text/vtt; charset=utf-8",
    )


def render_segments_csv(job: Job, item: JobItem) -> ExportFile:
    transcript = item.transcript
    if transcript is None:
        raise ExportUnavailable("That item has no transcript.")
    if not transcript.segments:
        raise ExportUnavailable(
            "This transcript has no timestamped segments, so a segment CSV is not meaningful."
        )

    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerow(["index", "start_seconds", "duration_seconds", "text"])
    for index, segment in enumerate(transcript.segments, start=1):
        writer.writerow([index, f"{segment.start:.2f}", f"{segment.duration:.2f}", segment.text])

    filename = f"{slugify(transcript.title)}-{item.video_id}.csv"
    return ExportFile(buffer.getvalue().encode("utf-8"), filename, "text/csv; charset=utf-8")


def render_combined_txt(job: Job) -> ExportFile:
    successful = [item for item in job.items if item.transcript is not None]
    if not successful:
        raise ExportUnavailable("This job has no successful transcripts to combine.")

    sections = []
    for item in successful:
        separator = "=" * 72
        sections.append(
            f"{separator}\n{_header(item, job)}\n{separator}\n\n{item.transcript.text}\n"
        )

    title = job.playlist_title or (successful[0].transcript.title if successful else "playlist")
    filename = f"{slugify(title)}-combined.txt"
    return ExportFile(
        ("\n\n".join(sections)).encode("utf-8"),
        filename,
        "text/plain; charset=utf-8",
    )


def render_failure_report_csv(job: Job) -> ExportFile:
    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerow(
        ["position", "title", "video_id", "status", "language", "segments", "error"]
    )
    for item in job.items:
        writer.writerow(
            [
                item.position,
                item.title,
                item.video_id,
                item.status,
                item.transcript.language if item.transcript else "",
                item.transcript.segment_count if item.transcript else 0,
                item.error_message or "",
            ]
        )

    filename = f"{slugify(job.playlist_title or 'job')}-report.csv"
    return ExportFile(buffer.getvalue().encode("utf-8"), filename, "text/csv; charset=utf-8")


def render_zip(job: Job) -> ExportFile:
    successful = [item for item in job.items if item.transcript is not None]
    if not successful:
        raise ExportUnavailable("This job has no successful transcripts to archive.")

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for item in successful:
            file = render_txt(job, item)
            archive.writestr(f"{item.position:02d}-{file.filename}", file.content)
        report = render_failure_report_csv(job)
        archive.writestr("report.csv", report.content)

    title = job.playlist_title or "playlist"
    return ExportFile(
        buffer.getvalue(),
        f"{slugify(title)}-transcripts.zip",
        "application/zip",
    )


def render(job: Job, format_id: str, item: JobItem | None = None) -> ExportFile:
    format_id = format_id.lower()
    if item is not None:
        renderers = {
            "txt": render_txt,
            "srt": render_srt,
            "vtt": render_vtt,
            "csv": render_segments_csv,
        }
        if format_id not in renderers:
            raise ExportUnavailable("Unsupported export format for a single item.")
        return renderers[format_id](job, item)

    renderers = {
        "txt": render_combined_txt,
        "zip": render_zip,
        "csv": render_failure_report_csv,
    }
    if format_id not in renderers:
        raise ExportUnavailable("Unsupported job export format.")
    return renderers[format_id](job)
