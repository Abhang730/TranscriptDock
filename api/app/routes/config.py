from fastapi import APIRouter, Request

from ..schemas.models import ConfigOut

router = APIRouter()


@router.get("/config", response_model=ConfigOut)
async def public_config(request: Request) -> ConfigOut:
    settings = request.app.state.settings
    return ConfigOut(
        demo_mode=settings.demo_mode,
        provider=settings.provider_name,
        payments_enabled=settings.payments_enabled,
        supported_languages=["auto", "en", "hi", "mr"],
        free_batch_size=settings.free_batch_size,
        paid_batch_size=settings.paid_batch_size,
        pack_price_paise=settings.pack_price_paise,
        pack_credits=settings.pack_credits,
        free_credits=settings.free_credits,
        anonymous_single_allowed=True,
    )
