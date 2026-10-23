"""Supabase (PostgREST) persistence.

Uses the service-role key, which bypasses Row Level Security. Every query here
is therefore explicitly scoped by user id; the RLS policies in `schema.sql`
protect direct client access with the anon key.

This implementation mirrors the memory store exactly. It requires a configured
Supabase project and has not been exercised against a live project in this
repository: treat it as integration scaffolding until credentials exist.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

import httpx

from ..config import Settings
from ..domain import Account, Job, JobItem, Payment, Segment, TranscriptRecord
from ..errors import ProviderUnavailable
from .store import Store

PAGE_SIZE = 1000


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _dt(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


class SupabaseStore(Store):
    def __init__(self, settings: Settings) -> None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise ProviderUnavailable(
                "STORE_BACKEND=supabase requires SUPABASE_URL and "
                "SUPABASE_SERVICE_ROLE_KEY."
            )
        self._base = f"{settings.supabase_url.rstrip('/')}/rest/v1"
        self._client = httpx.AsyncClient(
            timeout=15.0,
            headers={
                "apikey": settings.supabase_service_role_key,
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
        )

    # --- plumbing -----------------------------------------------------------

    def _url(self, path: str) -> str:
        return f"{self._base}/{path.lstrip('/')}"

    async def _request(
        self, method: str, path: str, *, params: dict | None = None, json: Any = None
    ) -> Any:
        response = await self._client.request(method, self._url(path), params=params, json=json)
        if response.status_code >= 400:
            raise ProviderUnavailable(
                f"Supabase request failed ({response.status_code}): {response.text[:200]}"
            )
        if not response.content:
            return None
        return response.json()

    async def _rpc(self, name: str, payload: dict) -> Any:
        return await self._request("POST", f"rpc/{name}", json=payload)

    async def close(self) -> None:
        await self._client.aclose()

    # --- accounts and credits ----------------------------------------------

    async def ensure_account(
        self, user_id: str, email: str | None, free_credits: int
    ) -> Account:
        rows = await self._rpc(
            "ensure_profile",
            {"p_user_id": user_id, "p_email": email, "p_free_credits": free_credits},
        )
        row = rows[0] if isinstance(rows, list) and rows else rows
        if not row:
            raise ProviderUnavailable("Could not create the Supabase profile.")
        return self._account_from_row(row)

    async def get_account(self, user_id: str) -> Account | None:
        rows = await self._request(
            "GET",
            "profiles",
            params={"id": f"eq.{user_id}", "select": "*"},
        )
        return self._account_from_row(rows[0]) if rows else None

    async def get_balance(self, user_id: str) -> int:
        rows = await self._request(
            "GET", "profiles", params={"id": f"eq.{user_id}", "select": "balance"}
        )
        return int(rows[0]["balance"]) if rows else 0

    async def grant_credits(
        self,
        user_id: str,
        amount: int,
        reason: str,
        reference: str,
        *,
        mark_pack: bool = False,
    ) -> int:
        if amount <= 0:
            raise ValueError("Grant amount must be positive")
        balance = await self._rpc(
            "grant_credits",
            {
                "p_user_id": user_id,
                "p_amount": amount,
                "p_reason": reason,
                "p_reference": reference,
                "p_mark_pack": mark_pack,
            },
        )
        return int(balance)

    async def consume_credit(
        self, user_id: str, reference: str, reason: str = "job_item"
    ) -> bool:
        balance = await self._rpc(
            "consume_credit",
            {
                "p_user_id": user_id,
                "p_reference": reference,
                "p_reason": reason,
            },
        )
        # The function returns the new balance, or -1 when it could not charge.
        return int(balance) >= 0

    def _account_from_row(self, row: dict) -> Account:
        return Account(
            user_id=row["id"],
            email=row.get("email"),
            balance=int(row.get("balance", 0)),
            free_credits_granted=int(row.get("free_credits_granted", 0)),
            pack_purchased_at=_dt(row.get("pack_purchased_at")),
            created_at=_dt(row.get("created_at")) or datetime.now(),
        )

    # --- jobs ---------------------------------------------------------------

    async def save_job(self, job: Job) -> None:
        job_row = {
            "id": job.id,
            "user_id": job.user_id,
            "mode": job.mode,
            "source_url": job.source_url,
            "status": job.status,
            "language": job.language,
            "playlist_title": job.playlist_title,
            "error_message": job.error_message,
            "is_demo": job.is_demo,
            "client_ip": job.client_ip,
            "created_at": _iso(job.created_at),
            "updated_at": _iso(job.updated_at),
        }
        await self._request(
            "POST",
            "jobs",
            params={"on_conflict": "id"},
            json=job_row,
        )

        item_rows = [
            {
                "id": item.id,
                "job_id": job.id,
                "position": item.position,
                "title": item.title,
                "source_url": item.source_url,
                "video_id": item.video_id,
                "status": item.status,
                "error_message": item.error_message,
                "error_code": item.error_code,
                "retry_count": item.retry_count,
                "started_at": _iso(item.started_at),
                "completed_at": _iso(item.completed_at),
            }
            for item in job.items
        ]
        if item_rows:
            await self._request(
                "POST", "job_items", params={"on_conflict": "id"}, json=item_rows
            )

        transcript_rows = [
            {
                "id": item.transcript.id,
                "item_id": item.id,
                "job_id": job.id,
                "user_id": job.user_id,
                "title": item.transcript.title,
                "source_url": item.transcript.source_url,
                "video_id": item.transcript.video_id,
                "language": item.transcript.language,
                "provider": item.transcript.provider,
                "is_demo": item.transcript.is_demo,
                "text": item.transcript.text,
                "segments": [
                    {"start": segment.start, "duration": segment.duration, "text": segment.text}
                    for segment in item.transcript.segments
                ],
                "created_at": _iso(item.transcript.created_at),
            }
            for item in job.items
            if item.transcript is not None
        ]
        if transcript_rows:
            await self._request(
                "POST",
                "transcripts",
                params={"on_conflict": "item_id"},
                json=transcript_rows,
            )

    async def get_job(self, job_id: str) -> Job | None:
        rows = await self._request(
            "GET",
            "jobs",
            params={
                "id": f"eq.{job_id}",
                "select": "*,job_items(*,transcripts(*))",
            },
        )
        return self._job_from_row(rows[0]) if rows else None

    async def list_jobs(self, user_id: str, limit: int = 50) -> list[Job]:
        rows = await self._request(
            "GET",
            "jobs",
            params={
                "user_id": f"eq.{user_id}",
                "select": "*,job_items(*,transcripts(*))",
                "order": "created_at.desc",
                "limit": str(limit),
            },
        )
        return [self._job_from_row(row) for row in rows or []]

    async def delete_job(self, job_id: str) -> None:
        await self._request("DELETE", "jobs", params={"id": f"eq.{job_id}"})

    def _job_from_row(self, row: dict) -> Job:
        items: list[JobItem] = []
        for item_row in sorted(row.get("job_items") or [], key=lambda item: item["position"]):
            transcripts = item_row.get("transcripts") or []
            transcript = None
            if transcripts:
                transcript_row = transcripts[0]
                transcript = TranscriptRecord(
                    id=transcript_row["id"],
                    item_id=item_row["id"],
                    title=transcript_row["title"],
                    source_url=transcript_row["source_url"],
                    video_id=transcript_row["video_id"],
                    language=transcript_row.get("language"),
                    provider=transcript_row["provider"],
                    is_demo=bool(transcript_row.get("is_demo")),
                    text=transcript_row["text"],
                    segments=[
                        Segment(
                            start=float(segment["start"]),
                            duration=float(segment["duration"]),
                            text=segment["text"],
                        )
                        for segment in transcript_row.get("segments") or []
                    ],
                    created_at=_dt(transcript_row.get("created_at")) or datetime.now(),
                )

            items.append(
                JobItem(
                    id=item_row["id"],
                    job_id=row["id"],
                    position=item_row["position"],
                    title=item_row["title"],
                    source_url=item_row["source_url"],
                    video_id=item_row["video_id"],
                    status=item_row["status"],
                    transcript=transcript,
                    error_message=item_row.get("error_message"),
                    error_code=item_row.get("error_code"),
                    retry_count=item_row.get("retry_count", 0),
                    started_at=_dt(item_row.get("started_at")),
                    completed_at=_dt(item_row.get("completed_at")),
                )
            )

        return Job(
            id=row["id"],
            mode=row["mode"],
            source_url=row["source_url"],
            language=row["language"],
            status=row["status"],
            items=items,
            user_id=row.get("user_id"),
            client_ip=row.get("client_ip"),
            playlist_title=row.get("playlist_title"),
            error_message=row.get("error_message"),
            is_demo=bool(row.get("is_demo")),
            created_at=_dt(row.get("created_at")) or datetime.now(),
            updated_at=_dt(row.get("updated_at")) or datetime.now(),
        )

    # --- payments -----------------------------------------------------------

    def _payment_from_row(self, row: dict) -> Payment:
        return Payment(
            id=row["id"],
            user_id=row["user_id"],
            provider=row["provider"],
            provider_order_id=row["provider_order_id"],
            provider_payment_id=row.get("provider_payment_id"),
            amount_paise=int(row["amount_paise"]),
            currency=row["currency"],
            status=row["status"],
            credits_granted=int(row.get("credits_granted", 0)),
            created_at=_dt(row.get("created_at")) or datetime.now(),
            updated_at=_dt(row.get("updated_at")) or datetime.now(),
        )

    async def create_payment(self, payment: Payment) -> None:
        await self._request(
            "POST",
            "payments",
            json={
                "id": payment.id,
                "user_id": payment.user_id,
                "provider": payment.provider,
                "provider_order_id": payment.provider_order_id,
                "provider_payment_id": payment.provider_payment_id,
                "amount_paise": payment.amount_paise,
                "currency": payment.currency,
                "status": payment.status,
                "credits_granted": payment.credits_granted,
                "created_at": _iso(payment.created_at),
                "updated_at": _iso(payment.updated_at),
            },
        )

    async def get_payment(self, payment_id: str) -> Payment | None:
        rows = await self._request(
            "GET", "payments", params={"id": f"eq.{payment_id}", "select": "*"}
        )
        return self._payment_from_row(rows[0]) if rows else None

    async def get_payment_by_order(self, order_id: str) -> Payment | None:
        rows = await self._request(
            "GET",
            "payments",
            params={"provider_order_id": f"eq.{order_id}", "select": "*"},
        )
        return self._payment_from_row(rows[0]) if rows else None

    async def update_payment(self, payment: Payment) -> None:
        await self._request(
            "PATCH",
            "payments",
            params={"id": f"eq.{payment.id}"},
            json={
                "provider_payment_id": payment.provider_payment_id,
                "status": payment.status,
                "credits_granted": payment.credits_granted,
                "updated_at": _iso(payment.updated_at),
            },
        )

    async def list_payments(self, user_id: str) -> list[Payment]:
        rows = await self._request(
            "GET",
            "payments",
            params={
                "user_id": f"eq.{user_id}",
                "select": "*",
                "order": "created_at.desc",
            },
        )
        return [self._payment_from_row(row) for row in rows or []]

    async def mark_webhook_seen(
        self, event_id: str, provider: str, event_type: str
    ) -> bool:
        response = await self._client.post(
            self._url("webhook_events"),
            params={"on_conflict": "id"},
            headers={"Prefer": "resolution=ignore-duplicates,return=representation"},
            json={
                "id": f"{provider}:{event_id}",
                "provider": provider,
                "event_type": event_type,
                "received_at": _iso(datetime.now()),
            },
        )
        if response.status_code >= 400:
            raise ProviderUnavailable(
                f"Could not record webhook event ({response.status_code})."
            )
        inserted = response.json() if response.content else []
        return bool(inserted)

    async def delete_user_data(self, user_id: str) -> None:
        # Keep the profile as a zeroed tombstone so a caller cannot repeatedly
        # delete data to farm free credits; the BFF deletes the auth user.
        await self._request(
            "PATCH",
            "profiles",
            params={"id": f"eq.{user_id}"},
            json={"balance": 0, "email": None, "pack_purchased_at": None},
        )
        await self._request("DELETE", "jobs", params={"user_id": f"eq.{user_id}"})
        await self._request("DELETE", "payments", params={"user_id": f"eq.{user_id}"})
        await self._request(
            "DELETE",
            "credit_ledger",
            params={"user_id": f"eq.{user_id}", "reason": "neq.free_tier"},
        )

    async def purge_expired(
        self, transcript_cutoff: datetime, job_cutoff: datetime
    ) -> None:
        await self._request(
            "DELETE",
            "jobs",
            params={"created_at": f"lt.{_iso(job_cutoff)}"},
        )
        await self._request(
            "DELETE",
            "transcripts",
            params={"created_at": f"lt.{_iso(transcript_cutoff)}"},
        )
