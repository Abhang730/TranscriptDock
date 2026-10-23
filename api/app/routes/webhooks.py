from fastapi import APIRouter, Depends, Header, Request

from ..deps import get_payment_service
from ..services.payment_service import PaymentService

router = APIRouter()


@router.post("/webhooks/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str | None = Header(default=None),
    x_razorpay_event_id: str | None = Header(default=None),
    payments: PaymentService = Depends(get_payment_service),
) -> dict:
    raw = await request.body()
    if not x_razorpay_signature:
        # Signature verification lives in the service, but a missing header is
        # rejected here so the body is never processed unverified.
        from ..errors import PaymentVerificationFailed

        raise PaymentVerificationFailed("Missing Razorpay signature header.")
    return await payments.handle_webhook(
        raw_body=raw,
        signature=x_razorpay_signature,
        event_id_header=x_razorpay_event_id,
    )
