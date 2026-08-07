from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

import pytest

from cityguide_backend.application.schemas import CoordinatesSchema, SearchRequest
from cityguide_backend.application.services.search import SearchService
from cityguide_backend.core.config import Settings
from cityguide_backend.domain.entities import (
    Coordinates,
    PlaceCandidate,
    PlaceReview,
    ReviewSummary,
    SearchIntent,
)
from tests.fakes import (
    FakeSession,
    MemoryAIUsageLogRepository,
    MemoryCachedAIResultRepository,
    MemorySearchHistoryRepository,
    MemorySearchSessionRepository,
    MemorySearchStatisticsRepository,
    StaticAIClient,
    StaticTwoGISClient,
)


class InMemoryCache:
    def __init__(self) -> None:
        self.store: dict[str, dict[str, object]] = {}

    async def get_json(self, key: str):
        return self.store.get(key)

    async def set_json(self, key: str, value: dict, ttl_seconds: int) -> None:
        self.store[key] = value

    async def delete(self, key: str) -> None:
        self.store.pop(key, None)

    async def incr_window(self, key: str, ttl_seconds: int) -> int:
        return 1


@pytest.mark.asyncio
async def test_search_service_returns_ranked_recommendation() -> None:
    session = FakeSession()
    settings = Settings.model_construct(
        database_url="sqlite+aiosqlite:///:memory:",
        redis_url="redis://localhost:6379/0",
        jwt_secret_key="secret",
        gemini_api_key="key",
        gemini_model="gemini-1.5-flash",
        twogis_api_key="key",
        search_max_candidates=5,
        search_cache_ttl_seconds=900,
    )
    places = [
        PlaceCandidate(
            place_id="1",
            name="Good Sushi",
            rating=4.9,
            distance_m=900,
            price_category="budget",
            is_open_now=True,
            has_parking=True,
            reviews=[PlaceReview(author="A", rating=5, text="great")],
        ),
        PlaceCandidate(
            place_id="2",
            name="Okay Sushi",
            rating=4.2,
            distance_m=300,
            price_category="premium",
            is_open_now=False,
            has_parking=False,
            reviews=[PlaceReview(author="B", rating=4, text="fine")],
        ),
    ]
    ai_client = StaticAIClient(
        intent=SearchIntent(
            query="sushi",
            location_text="Astana",
            coordinates=Coordinates(51.0, 71.0),
            radius_m=2000,
            budget_kzt=10000,
            open_now=True,
            requires_parking=True,
        ),
        summaries={
            "1": ReviewSummary(
                summary="great",
                pros=["fresh"],
                cons=["busy"],
                reason="matches budget and parking",
                confidence=0.9,
                sentiment_score=0.8,
            ),
            "2": ReviewSummary(
                summary="fine",
                pros=["close"],
                cons=["expensive"],
                reason="less suitable",
                confidence=0.6,
                sentiment_score=0.1,
            ),
        },
    )
    place_client = StaticTwoGISClient(places=places, reviews={"1": [], "2": []})
    cache = InMemoryCache()
    service = SearchService(
        session=session,
        settings=settings,
        ai_client=ai_client,
        place_client=place_client,
        cache_backend=cache,
        session_repo=MemorySearchSessionRepository(),
        history_repo=MemorySearchHistoryRepository(),
        statistics_repo=MemorySearchStatisticsRepository(),
        ai_usage_repo=MemoryAIUsageLogRepository(),
        cached_ai_repo=MemoryCachedAIResultRepository(),
    )

    response = await service.search(
        SearchRequest(
            query="Find sushi near me", coordinates=CoordinatesSchema(latitude=51.0, longitude=71.0)
        ),
        user_id=uuid4(),
    )

    assert response.recommendation.name == "Good Sushi"
    assert response.recommendation.score > response.alternatives[0].score
    assert cache.store
