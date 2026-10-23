"""In-memory persistence for local development, demos and tests.

Data is lost when the process restarts. That is acceptable for the demo build
and is documented; production deployments must use the Supabase store.
"""

from __future__ import annotations

import asyncio
from datetime import datetime

from ..domain import Account, Job, Payment
from ..errors import NotFoundError
from .store import Store


class MemoryStore(Store):
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self.accounts: dict[str, Account] = {}
        self.ledger: list[dict] = []
        self._credit_refs: set[tuple[str, str]] = set()
        self.jobs: dict[str, Job] = {}
        self.payments: dict[str, Payment] = {}
        self.webhook_events: set[str] = set()

    async def close(self) -> None:  # pragma: no cover - nothing to close
        return None

    # --- accounts and credits ----------------------------------------------

    async def ensure_account(
        self, user_id: str, email: str | None, free_credits: int
    ) -> Account:
        async with self._lock:
            account = self.accounts.get(user_id)
            if account is None:
                account = Account(
                    user_id=user_id,
                    email=email,
                    balance=0,
                    free_credits_granted=0,
                )
                self.accounts[user_id] = account

            if account.free_credits_granted == 0 and free_credits > 0:
                reference = f"free:{user_id}"
                if (user_id, reference) not in self._credit_refs:
                    self._credit_refs.add((user_id, reference))
                    account.balance += free_credits
                    account.free_credits_granted = free_credits
                    self.ledger.append(
                        {
                            "user_id": user_id,
                            "delta": free_credits,
                            "reason": "free_tier",
                            "reference": reference,
                            "created_at": datetime.now(),
                        }
                    )
            if email and account.email != email:
                account.email = email
            return account

    async def get_account(self, user_id: str) -> Account | None:
        return self.accounts.get(user_id)

    async def get_balance(self, user_id: str) -> int:
        account = self.accounts.get(user_id)
        return account.balance if account else 0

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
        async with self._lock:
            account = self.accounts.get(user_id)
            if account is None:
                account = Account(
                    user_id=user_id, email=None, balance=0, free_credits_granted=0
                )
                self.accounts[user_id] = account

            key = (user_id, reference)
            if key in self._credit_refs:
                return account.balance

            self._credit_refs.add(key)
            account.balance += amount
            if mark_pack:
                account.pack_purchased_at = datetime.now()
            self.ledger.append(
                {
                    "user_id": user_id,
                    "delta": amount,
                    "reason": reason,
                    "reference": reference,
                    "created_at": datetime.now(),
                }
            )
            return account.balance

    async def consume_credit(
        self, user_id: str, reference: str, reason: str = "job_item"
    ) -> bool:
        async with self._lock:
            account = self.accounts.get(user_id)
            if account is None or account.balance < 1:
                return False

            key = (user_id, reference)
            if key in self._credit_refs:
                return True

            self._credit_refs.add(key)
            account.balance -= 1
            self.ledger.append(
                {
                    "user_id": user_id,
                    "delta": -1,
                    "reason": reason,
                    "reference": reference,
                    "created_at": datetime.now(),
                }
            )
            return True

    # --- jobs ---------------------------------------------------------------

    async def save_job(self, job: Job) -> None:
        async with self._lock:
            self.jobs[job.id] = job

    async def get_job(self, job_id: str) -> Job | None:
        return self.jobs.get(job_id)

    async def list_jobs(self, user_id: str, limit: int = 50) -> list[Job]:
        jobs = [job for job in self.jobs.values() if job.user_id == user_id]
        jobs.sort(key=lambda item: item.created_at, reverse=True)
        return jobs[:limit]

    async def delete_job(self, job_id: str) -> None:
        async with self._lock:
            if job_id not in self.jobs:
                raise NotFoundError("That job does not exist.")
            del self.jobs[job_id]

    # --- payments -----------------------------------------------------------

    async def create_payment(self, payment: Payment) -> None:
        async with self._lock:
            self.payments[payment.id] = payment

    async def get_payment(self, payment_id: str) -> Payment | None:
        return self.payments.get(payment_id)

    async def get_payment_by_order(self, order_id: str) -> Payment | None:
        for payment in self.payments.values():
            if payment.provider_order_id == order_id:
                return payment
        return None

    async def update_payment(self, payment: Payment) -> None:
        async with self._lock:
            self.payments[payment.id] = payment

    async def list_payments(self, user_id: str) -> list[Payment]:
        payments = [payment for payment in self.payments.values() if payment.user_id == user_id]
        payments.sort(key=lambda item: item.created_at, reverse=True)
        return payments

    async def mark_webhook_seen(
        self, event_id: str, provider: str, event_type: str
    ) -> bool:
        async with self._lock:
            key = f"{provider}:{event_id}"
            if key in self.webhook_events:
                return False
            self.webhook_events.add(key)
            return True

    async def delete_user_data(self, user_id: str) -> None:
        """Delete account data while keeping a zeroed, non-re-grantable profile.

        Retaining the profile row (with the free-credit marker intact) stops a
        caller from repeatedly deleting data to farm free credits. The auth
        record itself is deleted by the BFF using the Supabase admin API.
        """
        async with self._lock:
            account = self.accounts.get(user_id)
            if account is not None:
                account.balance = 0
                account.email = None
                account.pack_purchased_at = None

            for job_id in [job.id for job in self.jobs.values() if job.user_id == user_id]:
                self.jobs.pop(job_id, None)
            for payment_id in [
                payment.id for payment in self.payments.values() if payment.user_id == user_id
            ]:
                self.payments.pop(payment_id, None)
            self.ledger = [
                row
                for row in self.ledger
                if row["user_id"] != user_id or row["reason"] == "free_tier"
            ]

    async def purge_expired(
        self, transcript_cutoff: datetime, job_cutoff: datetime
    ) -> None:
        async with self._lock:
            for job_id in [
                job.id for job in self.jobs.values() if job.created_at < job_cutoff
            ]:
                self.jobs.pop(job_id, None)

            for job in self.jobs.values():
                if job.created_at < transcript_cutoff:
                    for item in job.items:
                        item.transcript = None
