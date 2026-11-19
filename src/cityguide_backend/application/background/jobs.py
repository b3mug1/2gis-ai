from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from cityguide_backend.infrastructure.cache.redis import RedisCache
from cityguide_backend.infrastructure.db.models import CachedAIResultModel, SearchSessionModel


class BackgroundJobRunner:
    def __init__(
        self, session_factory: async_sessionmaker[AsyncSession], cache: RedisCache
    ) -> None:
        self._session_factory = session_factory
        self._cache = cache
        self._tasks: list[asyncio.Task[None]] = []
        self._stop_event = asyncio.Event()

    async def start(self) -> None:
        self._tasks = [
            asyncio.create_task(self._cleanup_loop(), name="cleanup-expired-sessions"),
        ]

    async def stop(self) -> None:
        self._stop_event.set()
        for task in self._tasks:
            task.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)

    async def refresh_cached_places(self) -> int:
        refreshed = 0
        async with self._session_factory() as session:
            rows = await session.execute(
                select(CachedAIResultModel).where(
                    CachedAIResultModel.expires_at > datetime.now(UTC)
                )
            )
            for row in rows.scalars().all():
                ttl_seconds = max(60, int((row.expires_at - datetime.now(UTC)).total_seconds()))
                await self._cache.set_json(row.cache_key, row.payload, ttl_seconds)
                refreshed += 1
        return refreshed

    async def generate_ai_summaries(self) -> int:
        generated = 0
        async with self._session_factory() as session:
            rows = await session.execute(
                select(SearchSessionModel).where(
                    SearchSessionModel.status == "completed", SearchSessionModel.result.is_not(None)
                )
            )
            for row in rows.scalars().all():
                cache_key = f"session:{row.id}"
                await self._cache.set_json(cache_key, row.result or {}, 3600)
                generated += 1
        return generated

    async def clean_expired_sessions(self) -> int:
        async with self._session_factory() as session:
            async with session.begin():
                result = await session.execute(
                    delete(SearchSessionModel).where(
                        SearchSessionModel.created_at < datetime.now(UTC) - timedelta(days=1)
                    )
                )
                await session.execute(
                    delete(CachedAIResultModel).where(
                        CachedAIResultModel.expires_at < datetime.now(UTC)
                    )
                )
                return int(result.rowcount or 0)

    async def _cleanup_loop(self) -> None:
        while not self._stop_event.is_set():
            try:
                await self.clean_expired_sessions()
            except Exception:
                pass
            await asyncio.sleep(3600)
