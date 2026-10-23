from fastapi import APIRouter, Depends

from ..auth.dependencies import AuthUser, require_user
from ..deps import get_credit_service, get_payment_service
from ..schemas.models import (
    CreateOrderOut,
    PaymentListOut,
    VerifyPaymentOut,
    VerifyPaymentRequest,
)
from ..serializers import payment_out
from ..services.credit_service import CreditService
from ..services.payment_service import PaymentService

router = APIRouter()


@router.post("/payments/orders", response_model=CreateOrderOut)
async def create_order(
    user: AuthUser = Depends(require_user),
    payments: PaymentService = Depends(get_payment_service),
) -> CreateOrderOut:
    return await payments.create_order(user.id, user.email)


@router.post("/payments/verify", response_model=VerifyPaymentOut)
async def verify_payment(
    payload: VerifyPaymentRequest,
    user: AuthUser = Depends(require_user),
    payments: PaymentService = Depends(get_payment_service),
) -> VerifyPaymentOut:
    granted, balance = await payments.verify_payment(
        user_id=user.id,
        payment_id=payload.payment_id,
        order_id=payload.order_id,
        signature=payload.signature,
    )
    return VerifyPaymentOut(ok=True, credits_granted=granted, balance=balance)


@router.get("/payments", response_model=PaymentListOut)
async def list_payments(
    user: AuthUser = Depends(require_user),
    payments: PaymentService = Depends(get_payment_service),
    credits: CreditService = Depends(get_credit_service),
) -> PaymentListOut:
    records = await payments.store.list_payments(user.id)
    return PaymentListOut(payments=[payment_out(record) for record in records])
