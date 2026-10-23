"""Domain -> API schema conversion."""

from __future__ import annotations

from .domain import Job, JobItem, Payment, TranscriptRecord
from .schemas.models import (
    JobItemOut,
    JobOut,
    PaymentOut,
    SegmentOut,
    TranscriptOut,
)


def transcript_out(record: TranscriptRecord, item_id: str) -> TranscriptOut:
    return TranscriptOut(
        id=record.id,
        item_id=item_id,
        title=record.title,
        source_url=record.source_url,
        video_id=record.video_id,
        language=record.language,
        provider=record.provider,
        is_demo=record.is_demo,
        text=record.text,
        segments=[
            SegmentOut(start=segment.start, duration=segment.duration, text=segment.text)
            for segment in record.segments
        ],
        segment_count=record.segment_count,
        is_timestamped=record.is_timestamped,
        created_at=record.created_at,
    )


def item_out(item: JobItem) -> JobItemOut:
    return JobItemOut(
        id=item.id,
        position=item.position,
        title=item.title,
        source_url=item.source_url,
        video_id=item.video_id,
        status=item.status,
        transcript=transcript_out(item.transcript, item.id) if item.transcript else None,
        error_message=item.error_message,
        retry_count=item.retry_count,
        started_at=item.started_at,
        completed_at=item.completed_at,
    )


def job_out(job: Job) -> JobOut:
    return JobOut(
        id=job.id,
        mode=job.mode,
        source_url=job.source_url,
        status=job.status,
        language=job.language,
        total_items=job.total_items,
        succeeded_items=job.succeeded_items,
        failed_items=job.failed_items,
        playlist_title=job.playlist_title,
        error_message=job.error_message,
        is_demo=job.is_demo,
        created_at=job.created_at,
        updated_at=job.updated_at,
        items=[item_out(item) for item in job.items],
    )


def payment_out(payment: Payment) -> PaymentOut:
    return PaymentOut(
        id=payment.id,
        provider=payment.provider,
        provider_order_id=payment.provider_order_id,
        provider_payment_id=payment.provider_payment_id,
        amount_paise=payment.amount_paise,
        currency=payment.currency,
        status=payment.status,
        credits_granted=payment.credits_granted,
        created_at=payment.created_at,
        updated_at=payment.updated_at,
    )
