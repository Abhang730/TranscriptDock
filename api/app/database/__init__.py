from __future__ import annotations

from ..config import Settings
from ..errors import ConfigurationError
from .store import Store


def build_store(settings: Settings) -> Store:
    """Build the configured persistence backend.

    "memory" is for local/demo use and loses data on restart. "supabase" uses
    the Supabase REST API with a service-role key and must only be used
    server-side.

    Unknown backends fail closed instead of silently falling back to memory, and
    production refuses the in-memory backend so a misconfigured deployment
    cannot quietly discard accounts, jobs, transcripts and credits on restart.
    """
    backend = settings.store_backend.strip().lower()
    if backend == "memory":
        if settings.app_env.strip().lower() == "production":
            raise ConfigurationError(
                "Refusing to start with STORE_BACKEND=memory while APP_ENV=production: "
                "the in-memory store loses accounts, jobs, transcripts and credits on "
                "restart and on every scale event. Set STORE_BACKEND=supabase with "
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or run with "
                "APP_ENV=development for a demo."
            )
        from .memory_store import MemoryStore

        return MemoryStore()

    if backend == "supabase":
        from .supabase_store import SupabaseStore

        return SupabaseStore(settings)

    raise ConfigurationError(
        f"Unknown STORE_BACKEND={settings.store_backend!r}. Supported values are "
        "'memory' (local/demo only) and 'supabase'."
    )


__all__ = ["Store", "build_store"]
