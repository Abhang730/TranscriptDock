from fastapi import APIRouter, Depends, Response

from ..auth.dependencies import AuthUser, require_user
from ..deps import get_job_service
from ..services.job_service import JobService

router = APIRouter()


@router.delete("/me", status_code=204)
async def delete_me(
    user: AuthUser = Depends(require_user),
    service: JobService = Depends(get_job_service),
) -> Response:
    """Delete all application data for the authenticated user.

    The auth record itself is deleted by the Next.js BFF using the Supabase
    admin API, so this endpoint never needs the service-role key.
    """
    await service.delete_user_data(user)
    return Response(status_code=204)
