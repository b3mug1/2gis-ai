from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

from cityguide_backend.infrastructure.cache.redis import RedisCache
from cityguide_backend.infrastructure.db.models import CachedAIResultModel, SearchSessionModel, SearchStatisticsModel


class BackgroundJobRunner:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession], cache: RedisCache) -> None:
        self._session_factory = session_factory
        self._cache = cache
        self._tasks: list[asyncio.Task[None]] = []
        self._stop_event = asyncio.Event()

    async def start(self) -> None:
        self._tasks = [
            asyncio.create_task(self._cleanup_loop(), name="cleanup-expired-sessions"),
            asyncio.create_task(self._statistics_loop(), name="collect-search-statistics"),
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
                select(CachedAIResultModel).where(CachedAIResultModel.expires_at > datetime.now(timezone.utc))
            )
            for row in rows.scalars().all():
                ttl_seconds = max(60, int((row.expires_at - datetime.now(timezone.utc)).total_seconds()))
                await self._cache.set_json(row.cache_key, row.payload, ttl_seconds)
                refreshed += 1
        return refreshed

    async def generate_ai_summaries(self) -> int:
        generated = 0
        async with self._session_factory() as session:
            rows = await session.execute(
                select(SearchSessionModel).where(SearchSessionModel.status == "completed", SearchSessionModel.result.is_not(None))
            )
            for row in rows.scalars().all():
                cache_key = f"session:{row.id}"
                await self._cache.set_json(cache_key, row.result or {}, 3600)
                generated += 1
        return generated

    async def clean_expired_sessions(self) -> int:
        async with self._session_factory() as session:
            async with session.begin():
                result = await session.execute(delete(SearchSessionModel).where(SearchSessionModel.created_at < datetime.now(timezone.utc) - timedelta(days=1)))
                await session.execute(delete(CachedAIResultModel).where(CachedAIResultModel.expires_at < datetime.now(timezone.utc)))
                return int(result.rowcount or 0)

    async def collect_statistics(self) -> None:
        async with self._session_factory() as session:
            async with session.begin():
                today = datetime.combine(datetime.now(timezone.utc).date(), datetime.min.time(), tzinfo=timezone.utc)
                statement = (
                    select(
                        SearchSessionModel.user_id,
                        func.count(SearchSessionModel.id).label("total_searches"),
                        func.count(SearchSessionModel.result).filter(SearchSessionModel.status == "completed").label("successful_searches"),
                    )
                    .where(SearchSessionModel.created_at >= today)
                    .group_by(SearchSessionModel.user_id)
                )
                rows = await session.execute(statement)
                for row in rows.all():
                    upsert = insert(SearchStatisticsModel).values(
                        stat_date=today,
                        user_id=row.user_id,
                        total_searches=row.total_searches,
                        successful_searches=row.successful_searches,
                    ).on_conflict_do_update(
                        constraint="uq_search_statistics_date_user",
                        set_={
                            "total_searches": SearchStatisticsModel.total_searches + row.total_searches,
                            "successful_searches": SearchStatisticsModel.successful_searches + row.successful_searches,
                            "updated_at": datetime.now(timezone.utc),
                        },
                    )
                    await session.execute(upsert)

    async def _cleanup_loop(self) -> None:
        while not self._stop_event.is_set():
            try:
                await self.clean_expired_sessions()
            except Exception:
                pass
            await asyncio.sleep(3600)

    async def _statistics_loop(self) -> None:
        while not self._stop_event.is_set():
            try:
                await self.collect_statistics()
            except Exception:
                pass
            await asyncio.sleep(1800)
