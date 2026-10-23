"""Application errors with stable codes the frontend can branch on."""

from __future__ import annotations


class AppError(Exception):
    status_code = 400
    code = "request_failed"

    def __init__(self, message: str, *, code: str | None = None, status_code: int | None = None):
        super().__init__(message)
        self.message = message
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code


class InvalidUrl(AppError):
    status_code = 400
    code = "invalid_url"


class UnsupportedHost(AppError):
    status_code = 400
    code = "unsupported_host"


class PlaylistEmpty(AppError):
    status_code = 400
    code = "playlist_empty"


class CaptionsUnavailable(AppError):
    status_code = 422
    code = "captions_unavailable"


class ProviderUnavailable(AppError):
    status_code = 503
    code = "provider_unavailable"


class Unauthenticated(AppError):
    status_code = 401
    code = "unauthenticated"


class Forbidden(AppError):
    status_code = 403
    code = "forbidden"


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class InsufficientCredits(AppError):
    status_code = 402
    code = "insufficient_credits"


class BatchLimitExceeded(AppError):
    status_code = 400
    code = "batch_limit"


class RateLimited(AppError):
    status_code = 429
    code = "rate_limited"


class PaymentsNotConfigured(AppError):
    status_code = 503
    code = "payments_not_configured"


class PaymentVerificationFailed(AppError):
    status_code = 400
    code = "payment_verification_failed"
