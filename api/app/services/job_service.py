"""Job orchestration: creation, bounded processing, retries and ownership."""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import timedelta

from ..config import Settings
from ..database.store import Store
from ..domain import Job, JobItem, Segment, TranscriptRecord, utcnow
from ..errors import (
    AppError,
    BatchLimitExceeded,
    CaptionsUnavailable,
    Forbidden,
    InsufficientCredits,
    NotFoundError,
    PlaylistEmpty,
    RateLimited,
    Unauthenticated,
)
from ..auth.jwt import AuthUser
from .credit_service import CreditService
from .exports import ExportFile, render
from .rate_limit import SlidingWindowLimiter
from .transcript_provider import PlaylistPayload, TranscriptPayload, TranscriptProvider
from .urls import ParsedSource, parse_source_url

logger = logging.getLogger(__name__)

# Keep strong references to background tasks so they are not garbage collected.
_background_tasks: set[asyncio.Task] = set()


class JobService:
    def __init__(
        self,
        store: Store,
        settings: Settings,
        provider: TranscriptProvider,
        credits: CreditService,
        limiter: SlidingWindowLimiter,
    ) -> None:
        self.store = store
        self.settings = settings
        self.provider = provider
        self.credits = credits
        self.limiter = limiter
        self._last_purge = None

    # --- helpers ------------------------------------------------------------

    async def _purge(self, force: bool = False) -> None:
        now = utcnow()
        if not force and self._last_purge and (now - self._last_purge) < timedelta(minutes=5):
            return
        self._last_purge = now
        try:
            await self.store.purge_expired(
                now - timedelta(days=self.settings.retention_days),
                now - timedelta(days=self.settings.job_retention_days),
            )
        except Exception:  # purge must never break a request
            logger.exception("Retention purge failed")

    def _schedule(self, job_id: str) -> None:
        task = asyncio.create_task(self.process_job(job_id))
        _background_tasks.add(task)
        task.add_done_callback(_background_tasks.discard)

    def _batch_limit(self, account_pack_held: bool) -> int:
        limit = (
            self.settings.paid_batch_size
            if account_pack_held
            else self.settings.free_batch_size
        )
        return max(1, min(limit, self.settings.max_batch_size))

    async def _load_owned(
        self, job_id: str, user: AuthUser | None, ip: str
    ) -> Job:
        job = await self.store.get_job(job_id)
        if job is None:
            raise NotFoundError("That job does not exist.")
        if job.user_id is None:
            # Anonymous demo jobs are capability records: the unguessable job id
            # is the access token and the job expires with the retention window.
            # Binding to the caller IP is unreliable behind a BFF/proxy, where
            # the forwarded address is not stable across requests.
            return job
        if user is None or user.id != job.user_id:
            # Deliberately the same response as "missing" so job ids do not leak.
            raise NotFoundError("That job does not exist.")
        return job

    # --- creation -----------------------------------------------------------

    async def create_job(
        self,
        *,
        user: AuthUser | None,
        ip: str,
        mode: str,
        url: str,
        language: str,
        selected_video_ids: list[str] | None,
    ) -> Job:
        await self._purge()

        if mode not in {"single", "playlist"}:
            raise AppError("Unsupported job mode.", code="invalid_mode")

        expected = "video" if mode == "single" else "playlist"
        source = parse_source_url(url, expected=expected)  # type: ignore[arg-type]

        if mode == "single":
            return await self._create_single(user, ip, source, language)
        return await self._create_playlist(user, source, language, selected_video_ids)

    async def _create_single(
        self,
        user: AuthUser | None,
        ip: str,
        source: ParsedSource,
        language: str,
    ) -> Job:
        if user is None:
            if not self.provider.is_demo:
                raise Unauthenticated(
                    "Sign in to process a video with the configured provider."
                )
            allowed = await self.limiter.allow(
                f"anon-single:{ip}", self.settings.anonymous_single_per_hour
            )
            if not allowed:
                raise RateLimited(
                    "Too many anonymous demo runs from this network. Sign in for a "
                    "larger allowance, or try again later."
                )

        if user is not None:
            account = await self.credits.ensure_account(user.id, user.email)
            if account.balance < 1:
                raise InsufficientCredits(
                    "You have no credits left. The support pack adds more credits."
                )

        payload = await self.provider.fetch_transcript(source, language)
        item_id = str(uuid.uuid4())
        transcript = self._transcript_from_payload(payload, item_id)
        now = utcnow()

        item = JobItem(
            id=item_id,
            job_id="",
            position=1,
            title=payload.title,
            source_url=payload.source_url,
            video_id=payload.video_id,
            status="success",
            transcript=transcript,
            started_at=now,
            completed_at=now,
        )

        if user is not None:
            charged = await self.credits.consume_for_item(user.id, item.id)
            if not charged:
                raise InsufficientCredits(
                    "You have no credits left. The support pack adds more credits."
                )

        job = Job(
            id=str(uuid.uuid4()),
            mode="single",
            source_url=source.canonical_url,
            language=language,
            status="completed",
            items=[item],
            user_id=user.id if user else None,
            client_ip=ip if user is None else None,
            is_demo=payload.is_demo,
        )
        item.job_id = job.id
        await self.store.save_job(job)
        return job

    async def _create_playlist(
        self,
        user: AuthUser | None,
        source: ParsedSource,
        language: str,
        selected_video_ids: list[str] | None,
    ) -> Job:
        if user is None:
            raise Unauthenticated(
                "Sign in to process a playlist. Playlist jobs are saved to your "
                "account and use your credits."
            )

        account = await self.credits.ensure_account(user.id, user.email)
        playlist: PlaylistPayload = await self.provider.list_playlist(source)
        if not playlist.entries:
            raise PlaylistEmpty("That playlist has no available videos.")

        entries = playlist.entries
        if selected_video_ids:
            wanted = set(selected_video_ids)
            entries = [entry for entry in entries if entry.video_id in wanted]
            if not entries:
                raise PlaylistEmpty(
                    "None of the selected videos are part of this playlist."
                )
            # Preserve the playlist's original order, not the request order.
            order = {entry.video_id: index for index, entry in enumerate(playlist.entries)}
            entries.sort(key=lambda entry: order.get(entry.video_id, 0))

        limit = self._batch_limit(account.pack_purchased_at is not None)
        if len(entries) > limit:
            raise BatchLimitExceeded(
                f"Your batch limit is {limit} videos. Deselect "
                f"{len(entries) - limit} video(s) or get the support pack for a "
                f"higher limit."
            )

        if account.balance < len(entries):
            raise InsufficientCredits(
                f"This batch needs {len(entries)} credits but you have "
                f"{account.balance}. Deselect videos or add credits."
            )

        job = Job(
            id=str(uuid.uuid4()),
            mode="playlist",
            source_url=source.canonical_url,
            language=language,
            status="pending",
            items=[],
            user_id=user.id,
            playlist_title=playlist.title,
            is_demo=playlist.is_demo,
        )
        job.items = [
            JobItem(
                id=str(uuid.uuid4()),
                job_id=job.id,
                position=index + 1,
                title=entry.title,
                source_url=entry.source_url,
                video_id=entry.video_id,
            )
            for index, entry in enumerate(entries)
        ]

        await self.store.save_job(job)
        self._schedule(job.id)
        return job

    def _transcript_from_payload(
        self, payload: TranscriptPayload, item_id: str
    ) -> TranscriptRecord:
        return TranscriptRecord(
            id=str(uuid.uuid4()),
            item_id=item_id,
            title=payload.title,
            source_url=payload.source_url,
            video_id=payload.video_id,
            language=payload.language,
            provider=payload.provider,
            is_demo=payload.is_demo,
            text=payload.text,
            segments=[
                Segment(start=s.start, duration=s.duration, text=s.text)
                for s in payload.segments
            ],
        )

    # --- processing ---------------------------------------------------------

    async def process_job(self, job_id: str) -> None:
        job = await self.store.get_job(job_id)
        if job is None:
            return

        job.status = "processing"
        job.updated_at = utcnow()
        await self.store.save_job(job)

        semaphore = asyncio.Semaphore(max(1, self.settings.job_concurrency))

        async def run_item(item: JobItem) -> None:
            if item.status == "success":
                return
            async with semaphore:
                item.status = "processing"
                item.started_at = utcnow()
                item.error_message = None
                item.error_code = None
                job.updated_at = utcnow()
                await self.store.save_job(job)

                item_source = ParsedSource(
                    kind="video",
                    video_id=item.video_id,
                    canonical_url=item.source_url,
                )

                try:
                    payload = await asyncio.wait_for(
                        self.provider.fetch_transcript(item_source, job.language),
                        timeout=self.settings.item_timeout_seconds,
                    )
                except asyncio.TimeoutError:
                    self._fail(item, "The provider timed out for this video.", "provider_timeout")
                except CaptionsUnavailable as exc:
                    self._fail(item, exc.message, exc.code)
                except AppError as exc:
                    self._fail(item, exc.message, exc.code)
                except Exception:
                    logger.exception("Unexpected provider failure for %s", item.video_id)
                    self._fail(
                        item,
                        "The provider returned an unexpected error for this video.",
                        "provider_error",
                    )
                else:
                    if job.user_id:
                        charged = await self.credits.consume_for_item(job.user_id, item.id)
                        if not charged:
                            self._fail(
                                item,
                                "Not enough credits to store this transcript. It was not charged.",
                                "insufficient_credits",
                            )
                        else:
                            self._succeed(item, payload)
                    else:
                        self._succeed(item, payload)

                item.completed_at = utcnow()
                job.updated_at = utcnow()
                await self.store.save_job(job)

        pending = [item for item in job.items if item.status != "success"]
        if pending:
            await asyncio.gather(*(run_item(item) for item in pending))

        job.status = job.final_status()
        job.updated_at = utcnow()
        await self.store.save_job(job)

    def _fail(self, item: JobItem, message: str, code: str) -> None:
        item.status = "failed"
        item.error_message = message
        item.error_code = code
        item.transcript = None

    def _succeed(self, item: JobItem, payload: TranscriptPayload) -> None:
        item.status = "success"
        item.transcript = self._transcript_from_payload(payload, item.id)
        item.error_message = None
        item.error_code = None

    # --- reads, retries, deletes -------------------------------------------

    async def preview_playlist(self, url: str, ip: str) -> PlaylistPayload:
        allowed = await self.limiter.allow(
            f"preview:{ip}", self.settings.preview_per_hour
        )
        if not allowed:
            raise RateLimited("Too many playlist previews. Try again later.")
        source = parse_source_url(url, expected="playlist")
        return await self.provider.list_playlist(source)

    async def get_job(self, job_id: str, user: AuthUser | None, ip: str) -> Job:
        return await self._load_owned(job_id, user, ip)

    async def list_jobs(self, user: AuthUser) -> list[Job]:
        await self._purge()
        return await self.store.list_jobs(user.id)

    async def retry_failed(self, job_id: str, user: AuthUser | None, ip: str) -> Job:
        job = await self._load_owned(job_id, user, ip)
        if job.mode == "playlist" and job.user_id is None:
            raise Forbidden("Only the account that created this job can retry it.")

        failed = [item for item in job.items if item.status == "failed"]
        if not failed:
            return job
        if job.status in {"pending", "processing"}:
            raise AppError(
                "This job is still processing. Retry once it finishes.",
                code="job_active",
                status_code=409,
            )

        for item in failed:
            item.status = "pending"
            item.error_message = None
            item.error_code = None
            item.retry_count += 1
            item.started_at = None
            item.completed_at = None

        job.status = "pending"
        job.updated_at = utcnow()
        await self.store.save_job(job)
        self._schedule(job.id)
        return job

    async def delete_job(self, job_id: str, user: AuthUser | None, ip: str) -> None:
        await self._load_owned(job_id, user, ip)
        await self.store.delete_job(job_id)

    async def export(
        self,
        job_id: str,
        user: AuthUser | None,
        ip: str,
        format_id: str,
        item_id: str | None = None,
    ) -> ExportFile:
        job = await self._load_owned(job_id, user, ip)
        item: JobItem | None = None
        if item_id is not None:
            item = next((entry for entry in job.items if entry.id == item_id), None)
            if item is None:
                raise NotFoundError("That transcript does not exist in this job.")
        return render(job, format_id, item)

    async def delete_user_data(self, user: AuthUser) -> None:
        await self.store.delete_user_data(user.id)


async def wait_for_jobs() -> None:
    """Await in-flight background jobs. Used by tests and graceful shutdown."""
    if _background_tasks:
        await asyncio.gather(*list(_background_tasks), return_exceptions=True)


__all__ = ["JobService", "wait_for_jobs"]
