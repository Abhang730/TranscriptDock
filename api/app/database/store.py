"""Persistence interface.

Two implementations exist: an in-memory store for local/demo use and a
Supabase (PostgREST) store for deployments. Both must enforce the same rules:
credits never go negative, grants are idempotent by reference, and every query
is scoped to a single user.
"""

from __future__ import annotations

from datetime import datetime
from typing import Protocol

from ..domain import Account, Job, Payment


class Store(Protocol):
    async def ensure_account(
        self, user_id: str, email: str | None, free_credits: int
    ) -> Account: ...

    async def get_account(self, user_id: str) -> Account | None: ...

    async def get_balance(self, user_id: str) -> int: ...

    async def grant_credits(
        self,
        user_id: str,
        amount: int,
        reason: str,
        reference: str,
        *,
        mark_pack: bool = False,
    ) -> int: ...

    async def consume_credit(
        self, user_id: str, reference: str, reason: str = "job_item"
    ) -> bool: ...

    async def save_job(self, job: Job) -> None: ...

    async def get_job(self, job_id: str) -> Job | None: ...

    async def list_jobs(self, user_id: str, limit: int = 50) -> list[Job]: ...

    async def delete_job(self, job_id: str) -> None: ...

    async def create_payment(self, payment: Payment) -> None: ...

    async def get_payment(self, payment_id: str) -> Payment | None: ...

    async def get_payment_by_order(self, order_id: str) -> Payment | None: ...

    async def update_payment(self, payment: Payment) -> None: ...

    async def list_payments(self, user_id: str) -> list[Payment]: ...

    async def mark_webhook_seen(
        self, event_id: str, provider: str, event_type: str
    ) -> bool: ...

    async def delete_user_data(self, user_id: str) -> None: ...

    async def purge_expired(
        self, transcript_cutoff: datetime, job_cutoff: datetime
    ) -> None: ...

    async def close(self) -> None: ...
