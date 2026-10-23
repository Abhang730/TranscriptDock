from __future__ import annotations

from ..config import Settings
from .store import Store


def build_store(settings: Settings) -> Store:
    """Build the configured persistence backend.

    "memory" is for local/demo use and loses data on restart. "supabase" uses
    the Supabase REST API with a service-role key and must only be used
    server-side.
    """
    backend = settings.store_backend.strip().lower()
    if backend == "supabase":
        from .supabase_store import SupabaseStore

        return SupabaseStore(settings)

    from .memory_store import MemoryStore

    return MemoryStore()


__all__ = ["Store", "build_store"]
