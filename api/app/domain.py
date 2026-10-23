"""Internal domain records.

These are intentionally plain dataclasses: persistence layers serialize them,
and the API schemas convert them to camelCase JSON.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Literal

JobMode = Literal["single", "playlist"]
JobStatus = Literal["pending", "processing", "partial", "completed", "failed", "cancelled"]
ItemStatus = Literal["pending", "processing", "success", "failed"]
PaymentStatus = Literal["created", "paid", "failed", "refunded"]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class Segment:
    start: float
    duration: float
    text: str


@dataclass
class TranscriptRecord:
    id: str
    item_id: str
    title: str
    source_url: str
    video_id: str
    language: str | None
    provider: str
    is_demo: bool
    text: str
    segments: list[Segment]
    created_at: datetime = field(default_factory=utcnow)

    @property
    def segment_count(self) -> int:
        return len(self.segments)

    @property
    def is_timestamped(self) -> bool:
        return len(self.segments) > 0


@dataclass
class JobItem:
    id: str
    job_id: str
    position: int
    title: str
    source_url: str
    video_id: str
    status: ItemStatus = "pending"
    transcript: TranscriptRecord | None = None
    error_message: str | None = None
    error_code: str | None = None
    retry_count: int = 0
    started_at: datetime | None = None
    completed_at: datetime | None = None


@dataclass
class Job:
    id: str
    mode: JobMode
    source_url: str
    language: str
    status: JobStatus
    items: list[JobItem]
    user_id: str | None = None
    client_ip: str | None = None
    playlist_title: str | None = None
    error_message: str | None = None
    is_demo: bool = True
    created_at: datetime = field(default_factory=utcnow)
    updated_at: datetime = field(default_factory=utcnow)

    @property
    def total_items(self) -> int:
        return len(self.items)

    @property
    def succeeded_items(self) -> int:
        return sum(1 for item in self.items if item.status == "success")

    @property
    def failed_items(self) -> int:
        return sum(1 for item in self.items if item.status == "failed")

    def final_status(self) -> JobStatus:
        if self.status == "cancelled":
            return "cancelled"
        succeeded = self.succeeded_items
        failed = self.failed_items
        if succeeded + failed < self.total_items:
            return "processing" if succeeded or failed else "pending"
        if failed == 0:
            return "completed"
        if succeeded == 0:
            return "failed"
        return "partial"

    def expires_at(self, retention_days: int) -> datetime:
        return self.created_at + timedelta(days=retention_days)


@dataclass
class Account:
    user_id: str
    email: str | None
    balance: int
    free_credits_granted: int
    pack_purchased_at: datetime | None = None
    created_at: datetime = field(default_factory=utcnow)


@dataclass
class Payment:
    id: str
    user_id: str
    provider: str
    provider_order_id: str
    provider_payment_id: str | None
    amount_paise: int
    currency: str
    status: PaymentStatus
    credits_granted: int = 0
    created_at: datetime = field(default_factory=utcnow)
    updated_at: datetime = field(default_factory=utcnow)
