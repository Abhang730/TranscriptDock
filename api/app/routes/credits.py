from fastapi import APIRouter, Depends

from ..auth.dependencies import AuthUser, require_user
from ..deps import get_credit_service
from ..schemas.models import CreditOut
from ..services.credit_service import CreditService

router = APIRouter()


@router.get("/credits", response_model=CreditOut)
async def get_credits(
    user: AuthUser = Depends(require_user),
    credits: CreditService = Depends(get_credit_service),
) -> CreditOut:
    return await credits.get_credit_out(user.id, user.email)
