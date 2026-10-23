"""Credit accounting.

Credits are consumed only for successfully produced transcripts. Consumption
and grants are atomic, idempotent by reference, and can never take a balance
below zero.
"""

from __future__ import annotations

from ..config import Settings
from ..database.store import Store
from ..domain import Account
from ..errors import Unauthenticated
from ..schemas.models import CreditOut


class CreditService:
    def __init__(self, store: Store, settings: Settings) -> None:
        self.store = store
        self.settings = settings

    async def ensure_account(self, user_id: str, email: str | None) -> Account:
        return await self.store.ensure_account(
            user_id, email, self.settings.free_credits
        )

    async def get_credit_out(self, user_id: str, email: str | None) -> CreditOut:
        if not user_id:
            raise Unauthenticated("Sign in to see your credits.")
        account = await self.ensure_account(user_id, email)
        return CreditOut(
            balance=account.balance,
            pack_held=account.pack_purchased_at is not None,
            purchased_at=account.pack_purchased_at,
            free_credits_granted=account.free_credits_granted,
        )

    async def consume_for_item(self, user_id: str, item_id: str) -> bool:
        """Charge one credit for a successfully processed item.

        The item id is the idempotency reference, so retries cannot double-charge.
        """
        return await self.store.consume_credit(user_id, f"item:{item_id}")

    async def grant_pack(self, user_id: str, payment_reference: str) -> int:
        return await self.store.grant_credits(
            user_id,
            self.settings.pack_credits,
            reason="support_pack",
            reference=f"payment:{payment_reference}",
            mark_pack=True,
        )
