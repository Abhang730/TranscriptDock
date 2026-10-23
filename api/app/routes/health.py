from fastapi import APIRouter, Request

from ..schemas.models import HealthOut

router = APIRouter()


@router.get("/health", response_model=HealthOut)
async def health(request: Request) -> HealthOut:
    settings = request.app.state.settings
    return HealthOut(
        status="ok",
        service=settings.service_name,
        version=settings.app_version,
        demo_mode=settings.demo_mode,
        provider=settings.provider_name,
        store_backend=settings.store_backend,
        payments_enabled=settings.payments_enabled,
        auth_configured=settings.auth_configured,
    )
