"""Per-instance sliding-window rate limiting.

This is intentionally simple. It protects a single API instance from casual
abuse; a multi-instance deployment should enforce the same limits at the edge
(Cloud Run / Cloudflare) as well.
"""

from __future__ import annotations

import asyncio
import time
from collections import deque


class SlidingWindowLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = {}
        self._lock = asyncio.Lock()

    async def allow(self, key: str, limit: int, window_seconds: int = 3600) -> bool:
        if limit <= 0:
            return False

        now = time.monotonic()
        async with self._lock:
            bucket = self._hits.setdefault(key, deque())
            while bucket and now - bucket[0] > window_seconds:
                bucket.popleft()
            if len(bucket) >= limit:
                return False
            bucket.append(now)
            return True

    async def reset(self) -> None:
        async with self._lock:
            self._hits.clear()
