from fastapi import APIRouter

from . import account, config, credits, health, jobs, payments, playlists, webhooks

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(config.router, tags=["config"])
api_router.include_router(playlists.router, tags=["playlists"])
api_router.include_router(jobs.router, tags=["jobs"])
api_router.include_router(credits.router, tags=["credits"])
api_router.include_router(payments.router, tags=["payments"])
api_router.include_router(webhooks.router, tags=["webhooks"])
api_router.include_router(account.router, tags=["account"])

__all__ = ["api_router"]
