from __future__ import annotations

from fastapi import Depends, Header, Request

from ..config import Settings
from ..errors import Unauthenticated
from .jwt import AuthUser, verify_token_async

__all__ = ["AuthUser", "optional_user", "require_user", "client_ip"]


def app_settings(request: Request) -> Settings:
    """Settings actually used to build this app (tests may override them)."""
    return request.app.state.settings


def _bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return token.strip()


async def optional_user(
    request: Request,
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(app_settings),
) -> AuthUser | None:
    """Returns the verified user, or None for anonymous requests.

    A malformed/expired token is an error even on optional routes: silently
    downgrading to anonymous would hide a broken session.
    """
    token = _bearer_token(authorization)
    if not token:
        return None
    if not settings.auth_configured:
        raise Unauthenticated(
            "Authentication is not configured on the API. Set SUPABASE_JWT_SECRET "
            "or SUPABASE_URL."
        )
    return await verify_token_async(token, settings)


async def require_user(user: AuthUser | None = Depends(optional_user)) -> AuthUser:
    if user is None:
        raise Unauthenticated("Sign in to continue.")
    return user


def client_ip(request: Request, settings: Settings = Depends(app_settings)) -> str:
    """Best-effort caller IP.

    `X-Forwarded-For` is only trusted when TRUST_PROXY_HEADERS=true, which is
    appropriate behind the Next.js BFF or a known proxy. Direct clients cannot
    spoof their identity otherwise.
    """
    if settings.trust_proxy_headers:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()
    return request.client.host if request.client else "unknown"
