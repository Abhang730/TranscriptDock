"""Razorpay payments.

Security properties:
  * The amount, currency and credit grant are decided server-side only.
  * Checkout success is never trusted; a valid HMAC signature is required.
  * Webhook signatures are verified over the raw body.
  * Entitlements are granted at most once per payment/order, even when the
    checkout callback and webhook both arrive.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import uuid
from datetime import datetime, timezone

import httpx

from ..config import Settings
from ..database.store import Store
from ..domain import Payment
from ..errors import (
    AppError,
    NotFoundError,
    PaymentVerificationFailed,
    PaymentsNotConfigured,
)
from ..schemas.models import CreateOrderOut
from .credit_service import CreditService

logger = logging.getLogger(__name__)


class PaymentGatewayError(AppError):
    status_code = 502
    code = "payment_gateway_error"


class PaymentService:
    SUPPORTED_CURRENCY = "INR"

    def __init__(self, store: Store, settings: Settings, credits: CreditService) -> None:
        self.store = store
        self.settings = settings
        self.credits = credits

    # --- order creation -----------------------------------------------------

    async def create_order(
        self, user_id: str, email: str | None = None
    ) -> CreateOrderOut:
        if not self.settings.payments_enabled:
            raise PaymentsNotConfigured(
                "Checkout is disabled because Razorpay credentials are not "
                "configured on the server."
            )

        # Make sure the profile (and its free grant) exists before adding pack
        # credits, so the ledger balance is complete.
        await self.credits.ensure_account(user_id, email)

        amount = self.settings.pack_price_paise  # never from the request
        remote = await self._create_remote_order(
            amount=amount,
            receipt=f"td-{uuid.uuid4().hex[:24]}",
            user_id=user_id,
        )

        order_id = remote.get("id")
        if not isinstance(order_id, str) or not order_id:
            raise PaymentGatewayError("Razorpay did not return an order id.")

        remote_amount = int(remote.get("amount", -1))
        remote_currency = str(remote.get("currency", "")).upper()
        if remote_amount != amount or remote_currency != self.SUPPORTED_CURRENCY:
            logger.error(
                "Razorpay order mismatch: expected %s %s, got %s %s",
                amount,
                self.SUPPORTED_CURRENCY,
                remote_amount,
                remote_currency,
            )
            raise PaymentGatewayError(
                "The payment gateway returned an order with an unexpected amount."
            )

        payment = Payment(
            id=str(uuid.uuid4()),
            user_id=user_id,
            provider="razorpay",
            provider_order_id=order_id,
            provider_payment_id=None,
            amount_paise=amount,
            currency=self.SUPPORTED_CURRENCY,
            status="created",
        )
        await self.store.create_payment(payment)

        return CreateOrderOut(
            order_id=order_id,
            amount_paise=amount,
            currency=self.SUPPORTED_CURRENCY,
            key_id=self.settings.razorpay_key_id or "",
            credits=self.settings.pack_credits,
            pack_price_inr=amount // 100,
        )

    async def _create_remote_order(
        self, *, amount: int, receipt: str, user_id: str
    ) -> dict:
        """POST to Razorpay. Separated so tests can replace it."""
        if not self.settings.razorpay_key_id or not self.settings.razorpay_key_secret:
            raise PaymentsNotConfigured("Razorpay credentials are missing.")

        async with httpx.AsyncClient(
            base_url=self.settings.razorpay_api_base,
            auth=(self.settings.razorpay_key_id, self.settings.razorpay_key_secret),
            timeout=15.0,
        ) as client:
            response = await client.post(
                "/orders",
                json={
                    "amount": amount,
                    "currency": self.SUPPORTED_CURRENCY,
                    "receipt": receipt,
                    "notes": {"user_id": user_id, "product": "transcriptdock_support_pack"},
                },
            )

        if response.status_code >= 400:
            logger.error("Razorpay order failed: %s %s", response.status_code, response.text[:300])
            raise PaymentGatewayError(
                "Razorpay rejected the order request. Check the API keys."
            )
        return response.json()

    # --- verification -------------------------------------------------------

    def _expected_signature(self, order_id: str, payment_id: str) -> str:
        secret = (self.settings.razorpay_key_secret or "").encode("utf-8")
        message = f"{order_id}|{payment_id}".encode("utf-8")
        return hmac.new(secret, message, hashlib.sha256).hexdigest()

    async def verify_payment(
        self, user_id: str, payment_id: str, order_id: str, signature: str
    ) -> tuple[int, int]:
        if not self.settings.payments_enabled:
            raise PaymentsNotConfigured(
                "Checkout is disabled because Razorpay credentials are not configured."
            )

        payment = await self.store.get_payment_by_order(order_id)
        if payment is None or payment.user_id != user_id:
            raise NotFoundError("That payment order does not belong to your account.")

        expected = self._expected_signature(order_id, payment_id)
        if not hmac.compare_digest(expected, signature):
            raise PaymentVerificationFailed(
                "The payment signature could not be verified, so no credits were granted."
            )

        granted, balance = await self._grant_entitlement(payment, payment_id)
        return granted, balance

    async def _grant_entitlement(
        self, payment: Payment, provider_payment_id: str | None
    ) -> tuple[int, int]:
        """Grant credits exactly once for a verified payment."""
        if payment.status == "paid":
            # Duplicate callback/webhook: report zero new credits.
            balance = await self.credits.store.get_balance(payment.user_id)
            return 0, balance

        # A webhook can arrive before the user opens the dashboard.
        await self.credits.ensure_account(payment.user_id, None)

        # Grant before marking the payment paid. If the status update fails, a
        # retried webhook re-enters this branch and the grant is idempotent by
        # payment id, so the user is never left paid-without-credits.
        balance = await self.credits.grant_pack(payment.user_id, payment.id)

        payment.status = "paid"
        payment.provider_payment_id = provider_payment_id or payment.provider_payment_id
        payment.credits_granted = self.settings.pack_credits
        payment.updated_at = datetime.now(timezone.utc)
        await self.store.update_payment(payment)
        return payment.credits_granted, balance

    # --- webhooks -----------------------------------------------------------

    async def handle_webhook(
        self, raw_body: bytes, signature: str, event_id_header: str | None
    ) -> dict:
        secret = self.settings.razorpay_webhook_secret
        if not secret:
            raise PaymentsNotConfigured(
                "Webhook processing is disabled because RAZORPAY_WEBHOOK_SECRET "
                "is not configured."
            )

        expected = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise PaymentVerificationFailed("Invalid webhook signature.")

        try:
            data = json.loads(raw_body)
        except json.JSONDecodeError as exc:
            raise PaymentVerificationFailed("Webhook body is not valid JSON.") from exc

        event = str(data.get("event", "unknown"))
        payload = data.get("payload") or {}
        entity = ((payload.get("payment") or {}).get("entity") or {}) if isinstance(payload, dict) else {}
        order_entity = ((payload.get("order") or {}).get("entity") or {}) if isinstance(payload, dict) else {}

        order_id = entity.get("order_id") or order_entity.get("id")
        provider_payment_id = entity.get("id")

        event_key = event_id_header or f"{event}:{provider_payment_id or order_id or 'unknown'}"
        first_delivery = await self.store.mark_webhook_seen(
            event_key, "razorpay", event
        )
        if not first_delivery:
            return {"ok": True, "duplicate": True}

        if event in {"payment.captured", "order.paid"}:
            if not order_id:
                raise PaymentVerificationFailed("Webhook has no order reference.")
            payment = await self.store.get_payment_by_order(str(order_id))
            if payment is None:
                logger.warning("Webhook for unknown order %s", order_id)
                return {"ok": True, "ignored": True}

            if entity:
                amount = int(entity.get("amount", -1))
                currency = str(entity.get("currency", "")).upper()
                if amount != payment.amount_paise or currency != payment.currency:
                    logger.error(
                        "Webhook amount mismatch for order %s: %s %s",
                        order_id,
                        amount,
                        currency,
                    )
                    raise PaymentVerificationFailed(
                        "Webhook amount does not match the stored order."
                    )

            await self._grant_entitlement(payment, provider_payment_id)
            return {"ok": True}

        if event == "payment.failed":
            if order_id:
                payment = await self.store.get_payment_by_order(str(order_id))
                if payment and payment.status == "created":
                    payment.status = "failed"
                    payment.provider_payment_id = provider_payment_id
                    payment.updated_at = datetime.now(timezone.utc)
                    await self.store.update_payment(payment)
            return {"ok": True}

        return {"ok": True, "ignored": True}
