from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from cityguide_backend.api.dependencies import get_current_user, get_statistics_service
from cityguide_backend.application.schemas import SearchStatisticsResponse
from cityguide_backend.application.services.statistics import StatisticsService
from cityguide_backend.domain.entities import UserProfile

router = APIRouter(tags=["statistics"])


@router.get("/statistics", response_model=list[SearchStatisticsResponse])
async def statistics(
    limit: int = Query(default=365, ge=1, le=1000),
    service: StatisticsService = Depends(get_statistics_service),
    current_user: UserProfile = Depends(get_current_user),
) -> list[SearchStatisticsResponse]:
    return await service.daily_summary(current_user.id, limit=limit)
