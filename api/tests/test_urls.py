from __future__ import annotations

import pytest

from app.errors import InvalidUrl, UnsupportedHost
from app.services.urls import parse_source_url

VALID_VIDEO_URLS = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=42s",
    "www.youtube.com/watch?v=dQw4w9WgXcQ",
]


@pytest.mark.parametrize("url", VALID_VIDEO_URLS)
def test_valid_video_urls_are_normalised(url):
    parsed = parse_source_url(url, expected="video")
    assert parsed.kind == "video"
    assert parsed.video_id == "dQw4w9WgXcQ"
    assert parsed.canonical_url == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"


def test_valid_playlist_url():
    parsed = parse_source_url(
        "https://www.youtube.com/playlist?list=PL1234567890abcdef", expected="playlist"
    )
    assert parsed.kind == "playlist"
    assert parsed.playlist_id == "PL1234567890abcdef"


@pytest.mark.parametrize(
    "url",
    [
        "https://vimeo.com/123456789",
        "https://evil.example/watch?v=dQw4w9WgXcQ",
        "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ",
        "https://www.youtube.com@evil.example/watch?v=dQw4w9WgXcQ",
    ],
)
def test_non_allowlisted_hosts_are_rejected(url):
    with pytest.raises(UnsupportedHost):
        parse_source_url(url, expected="video")


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1/watch?v=dQw4w9WgXcQ",
        "http://169.254.169.254/latest/meta-data",
        "https://www.youtube.com:8080/watch?v=dQw4w9WgXcQ",
        "ftp://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "file:///etc/passwd",
        "javascript:alert(1)",
        "https://user:pass@www.youtube.com/watch?v=dQw4w9WgXcQ",
    ],
)
def test_ssrf_and_scheme_attacks_are_rejected(url):
    with pytest.raises((InvalidUrl, UnsupportedHost)):
        parse_source_url(url, expected="video")


@pytest.mark.parametrize(
    "url",
    [
        "https://www.youtube.com/watch?v=short",
        "https://www.youtube.com/watch?v=dQw4w9WgXc",
        "https://www.youtube.com/playlist?list=short",
        "https://www.youtube.com/",
        "",
        "   ",
    ],
)
def test_malformed_urls_are_rejected(url):
    with pytest.raises(InvalidUrl):
        parse_source_url(url)


def test_playlist_url_rejected_in_single_mode():
    with pytest.raises(InvalidUrl):
        parse_source_url(
            "https://www.youtube.com/playlist?list=PL1234567890abcdef",
            expected="video",
        )


def test_video_url_rejected_in_playlist_mode():
    with pytest.raises(InvalidUrl):
        parse_source_url(
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ", expected="playlist"
        )
