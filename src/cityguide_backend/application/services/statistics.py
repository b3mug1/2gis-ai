from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from cityguide_backend.application.schemas import SearchStatisticsResponse
from cityguide_backend.domain.ports import SearchStatisticsRepository


class StatisticsService:
    def __init__(self, session: AsyncSession, repository: SearchStatisticsRepository) -> None:
        self._session = session
        self._repository = repository

    async def daily_summary(self, user_id=None, limit: int = 365) -> list[SearchStatisticsResponse]:
        rows = await self._repository.daily_summary(user_id=user_id, limit=limit)
        return [SearchStatisticsResponse.model_validate(row) for row in rows]
