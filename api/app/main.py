"""FastAPI application factory."""

from __future__ import annotations

import logging
import warnings
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import Settings, get_settings
from .database import build_store
from .errors import AppError, ConfigurationError
from .routes import api_router
from .services.credit_service import CreditService
from .services.job_service import JobService, wait_for_jobs
from .services.payment_service import PaymentService
from .services.rate_limit import SlidingWindowLimiter
from .services.transcript_provider import build_provider

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)

# FastAPI wraps request models in Annotated metadata, which makes pydantic 2.14
# emit a false-positive "alias has no effect" warning for camelCase request
# fields. Aliases are verified working by the test suite (camelCase request
# bodies parse correctly), so the noise is suppressed intentionally.
from pydantic.warnings import UnsupportedFieldAttributeWarning  # noqa: E402

warnings.filterwarnings("ignore", category=UnsupportedFieldAttributeWarning)


def create_app(settings: Settings | None = None) -> FastAPI:
    resolved = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        active = getattr(app.state, "settings_override", None) or get_settings()

        try:
            store = build_store(active)
            provider = build_provider(active)
        except ConfigurationError as exc:
            logger.critical("Refusing to start: %s", exc)
            raise
        credits = CreditService(store, active)
        limiter = SlidingWindowLimiter()

        app.state.settings = active
        app.state.store = store
        app.state.provider = provider
        app.state.credits = credits
        app.state.limiter = limiter
        app.state.job_service = JobService(store, active, provider, credits, limiter)
        app.state.payments = PaymentService(store, active, credits)

        logger.info(
            "TranscriptDock API started (provider=%s store=%s demo=%s payments=%s)",
            provider.name,
            active.store_backend,
            provider.is_demo,
            active.payments_enabled,
        )
        try:
            yield
        finally:
            await wait_for_jobs()
            await store.close()

    app = FastAPI(
        title="TranscriptDock API",
        version=resolved.app_version,
        description=(
            "Transcript jobs, exports, credits and payments. The shipped provider "
            "is a labelled demo provider; real transcription requires an "
            "authorized provider."
        ),
        lifespan=lifespan,
        docs_url="/docs" if resolved.app_env != "production" else None,
        redoc_url=None,
    )
    app.state.settings_override = resolved

    app.add_middleware(
        CORSMiddleware,
        allow_origins=resolved.cors_origin_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "X-Razorpay-Signature",
            "X-Razorpay-Event-Id",
            "X-Forwarded-For",
        ],
    )

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("Cache-Control", "no-store")
        return response

    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": {"error": exc.message, "code": exc.code}},
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        logger.info("Validation error on %s: %s", request.url.path, exc.errors())
        return JSONResponse(
            status_code=422,
            content={
                "detail": {
                    "error": "The request did not match the expected shape.",
                    "code": "validation_error",
                }
            },
        )

    @app.exception_handler(Exception)
    async def handle_unexpected(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error on %s", request.url.path)
        return JSONResponse(
            status_code=500,
            content={
                "detail": {
                    "error": "The service hit an unexpected error. Nothing was charged.",
                    "code": "internal_error",
                }
            },
        )

    @app.get("/", include_in_schema=False)
    async def root() -> dict:
        return {
            "service": resolved.service_name,
            "version": resolved.app_version,
            "docs": "/docs" if resolved.app_env != "production" else None,
            "health": "/v1/health",
        }

    app.include_router(api_router, prefix="/v1")
    return app


app = create_app()
