from fastapi import APIRouter, Depends

from ..auth.dependencies import client_ip
from ..deps import get_job_service
from ..schemas.models import PlaylistEntryOut, PlaylistPreviewOut, PreviewRequest
from ..services.job_service import JobService

router = APIRouter()


@router.post("/playlists/preview", response_model=PlaylistPreviewOut)
async def preview_playlist(
    payload: PreviewRequest,
    ip: str = Depends(client_ip),
    service: JobService = Depends(get_job_service),
) -> PlaylistPreviewOut:
    playlist = await service.preview_playlist(payload.url, ip)
    return PlaylistPreviewOut(
        playlist_id=playlist.playlist_id,
        title=playlist.title,
        entries=[
            PlaylistEntryOut(
                video_id=entry.video_id,
                title=entry.title,
                source_url=entry.source_url,
                duration_seconds=entry.duration_seconds,
            )
            for entry in playlist.entries
        ],
        provider=playlist.provider,
        is_demo=playlist.is_demo,
    )
