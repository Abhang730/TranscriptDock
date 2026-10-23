"""API schemas.

Responses are serialised in camelCase to match the TypeScript client. Anything
without a leading underscore is part of the public contract.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


def to_camel(value: str) -> str:
    head, *rest = value.split("_")
    return head + "".join(part.capitalize() for part in rest)


class APIModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


JobMode = Literal["single", "playlist"]
JobStatus = Literal["pending", "processing", "partial", "completed", "failed", "cancelled"]
ItemStatus = Literal["pending", "processing", "success", "failed"]
Language = Literal["auto", "en", "hi", "mr"]


# --- Requests ----------------------------------------------------------------


class CreateJobRequest(APIModel):
    mode: JobMode
    url: str = Field(min_length=1, max_length=2048)
    language: Language = "auto"
    selected_video_ids: list[str] | None = Field(default=None, max_length=200)


class PreviewRequest(APIModel):
    url: str = Field(min_length=1, max_length=2048)


class VerifyPaymentRequest(APIModel):
    payment_id: str = Field(min_length=4, max_length=128)
    order_id: str = Field(min_length=4, max_length=128)
    signature: str = Field(min_length=16, max_length=256)


# --- Transcripts and jobs ----------------------------------------------------


class SegmentOut(APIModel):
    start: float
    duration: float
    text: str


class TranscriptOut(APIModel):
    id: str
    item_id: str | None = None
    title: str
    source_url: str
    video_id: str
    language: str | None
    provider: str
    is_demo: bool
    text: str
    segments: list[SegmentOut]
    segment_count: int
    is_timestamped: bool
    created_at: datetime


class JobItemOut(APIModel):
    id: str
    position: int
    title: str
    source_url: str
    video_id: str
    status: ItemStatus
    transcript: TranscriptOut | None = None
    error_message: str | None = None
    retry_count: int
    started_at: datetime | None = None
    completed_at: datetime | None = None


class JobOut(APIModel):
    id: str
    mode: JobMode
    source_url: str
    status: JobStatus
    language: str
    total_items: int
    succeeded_items: int
    failed_items: int
    playlist_title: str | None = None
    error_message: str | None = None
    is_demo: bool
    created_at: datetime
    updated_at: datetime
    items: list[JobItemOut]


class JobListOut(APIModel):
    jobs: list[JobOut]


class PlaylistEntryOut(APIModel):
    video_id: str
    title: str
    source_url: str
    duration_seconds: int | None = None


class PlaylistPreviewOut(APIModel):
    playlist_id: str
    title: str
    entries: list[PlaylistEntryOut]
    provider: str
    is_demo: bool


# --- Account, credits, payments ---------------------------------------------


class CreditOut(APIModel):
    balance: int
    pack_held: bool
    purchased_at: datetime | None = None
    free_credits_granted: int


class CreateOrderOut(APIModel):
    order_id: str
    amount_paise: int
    currency: str
    key_id: str
    credits: int
    pack_price_inr: int


class PaymentOut(APIModel):
    id: str
    provider: str
    provider_order_id: str
    provider_payment_id: str | None = None
    amount_paise: int
    currency: str
    status: Literal["created", "paid", "failed", "refunded"]
    credits_granted: int
    created_at: datetime
    updated_at: datetime


class PaymentListOut(APIModel):
    payments: list[PaymentOut]


class VerifyPaymentOut(APIModel):
    ok: bool
    credits_granted: int
    balance: int


class HealthOut(APIModel):
    status: str
    service: str
    version: str
    demo_mode: bool
    provider: str
    store_backend: str
    payments_enabled: bool
    auth_configured: bool


class ConfigOut(APIModel):
    demo_mode: bool
    provider: str
    payments_enabled: bool
    supported_languages: list[str]
    free_batch_size: int
    paid_batch_size: int
    pack_price_paise: int
    pack_credits: int
    free_credits: int
    anonymous_single_allowed: bool
