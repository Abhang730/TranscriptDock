"""Application configuration.

All business-critical values (prices, credits, batch limits) live here and can
be overridden with environment variables. The frontend never decides them.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_env: str = "development"
    app_version: str = "0.3.0"
    service_name: str = "transcriptdock-api"

    # --- Transcript provider -------------------------------------------------
    # The demo provider is the only provider shipped in this repository.
    # Real retrieval stays disabled until an authorized provider is configured.
    demo_mode: bool = True
    provider_name: str = "demo"
    job_concurrency: int = 3
    item_timeout_seconds: float = 15.0

    # --- Supabase / auth -----------------------------------------------------
    supabase_url: str | None = None
    supabase_jwt_secret: str | None = None
    supabase_jwt_audience: str = "authenticated"
    supabase_service_role_key: str | None = None
    store_backend: str = "memory"  # "memory" (local/demo) or "supabase"

    # --- Entitlements --------------------------------------------------------
    pack_price_paise: int = 4900
    pack_credits: int = 50
    free_credits: int = 20
    free_batch_size: int = 5
    paid_batch_size: int = 25
    max_batch_size: int = 50

    # --- Payments ------------------------------------------------------------
    razorpay_key_id: str | None = None
    razorpay_key_secret: str | None = None
    razorpay_webhook_secret: str | None = None
    razorpay_api_base: str = "https://api.razorpay.com/v1"

    # --- Limits and retention ------------------------------------------------
    anonymous_single_per_hour: int = 10
    preview_per_hour: int = 30
    retention_days: int = 30
    job_retention_days: int = 90

    # --- Transport -----------------------------------------------------------
    cors_origins: str = "http://localhost:3000"
    trust_proxy_headers: bool = False
    max_url_length: int = 2048

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def payments_enabled(self) -> bool:
        return bool(self.razorpay_key_id and self.razorpay_key_secret)

    @property
    def webhooks_enabled(self) -> bool:
        return bool(self.razorpay_webhook_secret)

    @property
    def auth_configured(self) -> bool:
        return bool(self.supabase_jwt_secret or self.supabase_url)


@lru_cache
def get_settings() -> Settings:
    return Settings()
