from __future__ import annotations

import zipfile

import pytest

from app.domain import Job, JobItem, Segment, TranscriptRecord
from app.services.exports import (
    ExportUnavailable,
    render_combined_txt,
    render_failure_report_csv,
    render_srt,
    render_txt,
    render_vtt,
    render_zip,
)


def make_item(
    position: int,
    *,
    with_segments: bool = True,
    status: str = "success",
    error: str | None = None,
) -> JobItem:
    item = JobItem(
        id=f"item-{position}",
        job_id="job-1",
        position=position,
        title=f"Video {position}",
        source_url=f"https://www.youtube.com/watch?v=video{position}",
        video_id=f"video{position}",
        status=status,
        error_message=error,
    )
    if status == "success":
        segments = (
            [
                Segment(start=0.0, duration=2.5, text=f"First line {position}."),
                Segment(start=2.5, duration=3.25, text=f"Second line {position}."),
            ]
            if with_segments
            else []
        )
        item.transcript = TranscriptRecord(
            id=f"transcript-{position}",
            item_id=item.id,
            title=f"Video {position}",
            source_url=item.source_url,
            video_id=item.video_id,
            language="en",
            provider="demo",
            is_demo=True,
            text=" ".join(segment.text for segment in segments) or "Untimed transcript.",
            segments=segments,
        )
    return item


def make_job(items: list[JobItem]) -> Job:
    return Job(
        id="job-1",
        mode="playlist" if len(items) > 1 else "single",
        source_url="https://www.youtube.com/playlist?list=PL1234567890abcdef",
        language="auto",
        status="completed",
        items=items,
        playlist_title="Test playlist",
    )


def test_txt_includes_metadata_and_demo_notice():
    file = render_txt(make_job([make_item(1)]), make_item(1))
    text = file.content.decode()
    assert "Video 1" in text
    assert "Provider: demo" in text
    assert "demonstration data" in text
    assert file.filename.endswith(".txt")


def test_srt_uses_comma_timestamps():
    item = make_item(1)
    file = render_srt(make_job([item]), item)
    body = file.content.decode()
    assert "00:00:00,000 --> 00:00:02,500" in body
    assert "00:00:02,500 --> 00:00:05,750" in body
    assert body.startswith("1\n")


def test_vtt_uses_dot_timestamps_and_header():
    item = make_item(1)
    file = render_vtt(make_job([item]), item)
    body = file.content.decode()
    assert body.startswith("WEBVTT")
    assert "00:00:00.000 --> 00:00:02.500" in body


def test_srt_requires_timestamps():
    item = make_item(1, with_segments=False)
    with pytest.raises(ExportUnavailable):
        render_srt(make_job([item]), item)


def test_combined_txt_keeps_playlist_order():
    items = [make_item(1), make_item(2)]
    file = render_combined_txt(make_job(items))
    body = file.content.decode()
    assert body.index("Video 1") < body.index("Video 2")
    assert body.count("Provider: demo") == 2


def test_zip_contains_one_file_per_success_and_a_report():
    items = [
        make_item(1),
        make_item(2, status="failed", error="No captions"),
        make_item(3),
    ]
    file = render_zip(make_job(items))
    assert file.media_type == "application/zip"

    with zipfile.ZipFile(__import__("io").BytesIO(file.content)) as archive:
        names = archive.namelist()
        assert "01-video-1-video1.txt" in names
        assert "03-video-3-video3.txt" in names
        assert "report.csv" in names
        assert len(names) == 3


def test_failure_report_lists_every_item_with_errors():
    items = [make_item(1), make_item(2, status="failed", error="No captions")]
    file = render_failure_report_csv(make_job(items))
    body = file.content.decode()
    assert body.splitlines()[0] == "position,title,video_id,status,language,segments,error"
    assert "failed" in body
    assert "No captions" in body


def test_zip_fails_when_nothing_succeeded():
    items = [make_item(1, status="failed", error="No captions")]
    with pytest.raises(ExportUnavailable):
        render_zip(make_job(items))
