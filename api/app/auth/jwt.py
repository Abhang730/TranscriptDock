"""Supabase access-token verification.

Two supported modes:
  1. SUPABASE_JWT_SECRET present  -> HS256 verification with the project secret.
  2. Only SUPABASE_URL present    -> asymmetric verification via the project's
     JWKS endpoint (ES256/RS256).

Tokens are never accepted from a request body, and the service never trusts a
client-supplied user id.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

import jwt

from ..config import Settings
from ..errors import Unauthenticated

_jwks_client: jwt.PyJWKClient | None = None
_jwks_url: str | None = None


@dataclass(frozen=True)
class AuthUser:
    id: str
    email: str | None
    role: str | None = None


def _decode_hs256(token: str, settings: Settings) -> dict:
    return jwt.decode(
        token,
        settings.supabase_jwt_secret,
        algorithms=["HS256"],
        audience=settings.supabase_jwt_audience,
        options={"require": ["exp", "sub"]},
    )


def _decode_jwks(token: str, settings: Settings) -> dict:
    global _jwks_client, _jwks_url

    if not settings.supabase_url:
        raise Unauthenticated("Authentication is not configured.")

    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    if _jwks_client is None or _jwks_url != url:
        _jwks_client = jwt.PyJWKClient(url, cache_keys=True)
        _jwks_url = url

    signing_key = _jwks_client.get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=["ES256", "RS256"],
        audience=settings.supabase_jwt_audience,
        options={"require": ["exp", "sub"]},
    )


def verify_token(token: str, settings: Settings) -> AuthUser:
    if not settings.auth_configured:
        raise Unauthenticated(
            "Authentication is not configured on the API. Set SUPABASE_JWT_SECRET "
            "or SUPABASE_URL."
        )

    try:
        if settings.supabase_jwt_secret:
            claims = _decode_hs256(token, settings)
        else:
            claims = _decode_jwks(token, settings)
    except jwt.ExpiredSignatureError as exc:
        raise Unauthenticated("Your session has expired. Sign in again.") from exc
    except jwt.InvalidTokenError as exc:
        raise Unauthenticated("That session token is not valid.") from exc
    except Exception as exc:  # network/JWKS failures
        raise Unauthenticated("The session token could not be verified.") from exc

    subject = claims.get("sub")
    if not subject:
        raise Unauthenticated("The session token has no user id.")

    email = claims.get("email")
    return AuthUser(
        id=str(subject),
        email=email if isinstance(email, str) else None,
        role=claims.get("role"),
    )


async def verify_token_async(token: str, settings: Settings) -> AuthUser:
    # JWKS retrieval is blocking; keep it off the event loop.
    return await asyncio.to_thread(verify_token, token, settings)
