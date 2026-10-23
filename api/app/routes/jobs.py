from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response

from ..auth.dependencies import AuthUser, client_ip, optional_user, require_user
from ..deps import get_job_service
from ..schemas.models import CreateJobRequest, JobListOut, JobOut
from ..serializers import job_out
from ..services.job_service import JobService

router = APIRouter()


@router.post("/jobs", response_model=JobOut, status_code=201)
async def create_job(
    payload: CreateJobRequest,
    user: AuthUser | None = Depends(optional_user),
    ip: str = Depends(client_ip),
    service: JobService = Depends(get_job_service),
) -> JobOut:
    job = await service.create_job(
        user=user,
        ip=ip,
        mode=payload.mode,
        url=payload.url,
        language=payload.language,
        selected_video_ids=payload.selected_video_ids,
    )
    return job_out(job)


@router.get("/jobs", response_model=JobListOut)
async def list_jobs(
    user: AuthUser = Depends(require_user),
    service: JobService = Depends(get_job_service),
) -> JobListOut:
    jobs = await service.list_jobs(user)
    return JobListOut(jobs=[job_out(job) for job in jobs])


@router.get("/jobs/{job_id}", response_model=JobOut)
async def get_job(
    job_id: str,
    user: AuthUser | None = Depends(optional_user),
    ip: str = Depends(client_ip),
    service: JobService = Depends(get_job_service),
) -> JobOut:
    job = await service.get_job(job_id, user, ip)
    return job_out(job)


@router.post("/jobs/{job_id}/retry", response_model=JobOut, status_code=202)
async def retry_job(
    job_id: str,
    user: AuthUser | None = Depends(optional_user),
    ip: str = Depends(client_ip),
    service: JobService = Depends(get_job_service),
) -> JobOut:
    job = await service.retry_failed(job_id, user, ip)
    return job_out(job)


@router.delete("/jobs/{job_id}", status_code=204)
async def delete_job(
    job_id: str,
    user: AuthUser | None = Depends(optional_user),
    ip: str = Depends(client_ip),
    service: JobService = Depends(get_job_service),
) -> Response:
    await service.delete_job(job_id, user, ip)
    return Response(status_code=204)


@router.get("/jobs/{job_id}/export")
async def export_job(
    job_id: str,
    format: str = Query(default="txt"),
    user: AuthUser | None = Depends(optional_user),
    ip: str = Depends(client_ip),
    service: JobService = Depends(get_job_service),
) -> Response:
    file = await service.export(job_id, user, ip, format)
    return file_response(file.content, file.filename, file.media_type)


@router.get("/jobs/{job_id}/items/{item_id}/export")
async def export_item(
    job_id: str,
    item_id: str,
    format: str = Query(default="txt"),
    user: AuthUser | None = Depends(optional_user),
    ip: str = Depends(client_ip),
    service: JobService = Depends(get_job_service),
) -> Response:
    file = await service.export(job_id, user, ip, format, item_id=item_id)
    return file_response(file.content, file.filename, file.media_type)


def file_response(content: bytes, filename: str, media_type: str) -> Response:
    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )
