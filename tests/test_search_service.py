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


class RecordingAIClient:
    def __init__(self, intent: SearchIntent, summaries: dict[str, ReviewSummary]) -> None:
        self.intent = intent
        self.summaries = summaries
        self.intent_locales: list[str] = []
        self.summary_locales: list[str] = []

    async def extract_intent(
        self,
        query: str,
        *,
        user_location: Coordinates | None = None,
        locale: str = "en",
    ) -> SearchIntent:
        self.intent_locales.append(locale)
        return self.intent

    async def summarize_reviews(
        self, intent: SearchIntent, place: PlaceCandidate, *, locale: str = "en"
    ) -> ReviewSummary:
        self.summary_locales.append(locale)
        if place.place_id == "bad":
            raise RuntimeError("boom")
        return self.summaries[place.place_id]

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


@pytest.mark.asyncio
async def test_search_service_uses_cached_intent_for_history() -> None:
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
    cache = InMemoryCache()
    service = SearchService(
        session=session,
        settings=settings,
        ai_client=RecordingAIClient(intent=SearchIntent(query="sushi"), summaries={}),
        place_client=StaticTwoGISClient(places=[], reviews={}),
        cache_backend=cache,
        session_repo=MemorySearchSessionRepository(),
        history_repo=MemorySearchHistoryRepository(),
        statistics_repo=MemorySearchStatisticsRepository(),
        ai_usage_repo=MemoryAIUsageLogRepository(),
        cached_ai_repo=MemoryCachedAIResultRepository(),
    )
    user_id = uuid4()
    request = SearchRequest(
        query="sushi",
        coordinates=CoordinatesSchema(latitude=51.1, longitude=71.1),
        locale="kz",
    )
    cache.store[service._cache_key(request.query, request.coordinates, user_id)] = {  # type: ignore[attr-defined]
        "recommendation": {
            "place_id": "1",
            "name": "Good Sushi",
            "rating": 4.9,
            "walking_time": 10,
            "pros": ["fresh"],
            "cons": ["busy"],
            "reason": "best fit",
            "confidence": 0.95,
            "score": 0.99,
            "address": "Astana",
            "latitude": 51.1,
            "longitude": 71.1,
            "categories": ["sushi"],
            "distance_m": 800,
            "price_category": "budget",
            "opening_hours": "daily",
            "phone": None,
            "url": None,
            "photos": [],
        },
        "alternatives": [],
        "intent": {
            "query": "sushi",
            "location_text": "Astana",
            "coordinates": {"latitude": 51.1, "longitude": 71.1},
            "radius_m": 3000,
            "budget_kzt": 10000,
            "party_size": 2,
            "cuisine": "sushi",
            "place_type": "restaurant",
            "amenities": ["wifi"],
            "mood": "date",
            "sort_by": "best_match",
            "open_now": True,
            "min_rating": 4,
            "price_category": "budget",
            "requires_parking": True,
            "requires_quiet": False,
            "laptop_friendly": False,
            "romantic": True,
        },
        "source": "2gis+gemini",
        "generated_at": "2026-08-04T00:00:00+00:00",
    }

    response = await service.search(request, user_id=user_id)

    assert response.recommendation.name == "Good Sushi"
    assert len(service._history_repo.entries) == 1  # type: ignore[attr-defined]
    history_entry = service._history_repo.entries[0]  # type: ignore[attr-defined]
    assert history_entry["intent"].budget_kzt == 10000
    assert history_entry["intent"].coordinates is not None
    assert history_entry["result"].recommendation.name == "Good Sushi"


@pytest.mark.asyncio
async def test_search_service_survives_single_candidate_failure() -> None:
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
            place_id="bad",
            name="Broken Place",
            rating=4.8,
            distance_m=500,
            is_open_now=True,
            reviews=[PlaceReview(author="A", rating=5, text="great")],
        ),
        PlaceCandidate(
            place_id="good",
            name="Good Place",
            rating=4.7,
            distance_m=700,
            is_open_now=True,
            reviews=[PlaceReview(author="B", rating=5, text="nice")],
        ),
    ]
    ai_client = RecordingAIClient(
        intent=SearchIntent(query="cafe", coordinates=Coordinates(51.0, 71.0)),
        summaries={
            "good": ReviewSummary(
                summary="ok",
                pros=["calm"],
                cons=[],
                reason="fits well",
                confidence=0.9,
                sentiment_score=0.7,
            ),
        },
    )
    service = SearchService(
        session=session,
        settings=settings,
        ai_client=ai_client,
        place_client=StaticTwoGISClient(places=places, reviews={}),
        cache_backend=InMemoryCache(),
        session_repo=MemorySearchSessionRepository(),
        history_repo=MemorySearchHistoryRepository(),
        statistics_repo=MemorySearchStatisticsRepository(),
        ai_usage_repo=MemoryAIUsageLogRepository(),
        cached_ai_repo=MemoryCachedAIResultRepository(),
    )

    response = await service.search(
        SearchRequest(query="best cafe", locale="kz"),
        user_id=uuid4(),
    )

    assert response.recommendation.place_id == "good"
    assert ai_client.intent_locales == ["kz"]
    assert ai_client.summary_locales == ["kz", "kz"]


@pytest.mark.asyncio
async def test_search_service_compare_places() -> None:
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
        PlaceCandidate(place_id="p1", name="Place One", rating=4.8),
        PlaceCandidate(place_id="p2", name="Place Two", rating=4.5),
    ]
    service = SearchService(
        session=session,
        settings=settings,
        ai_client=StaticAIClient(intent=SearchIntent(query="test"), summaries={}),
        place_client=StaticTwoGISClient(places=places, reviews={}),
        cache_backend=InMemoryCache(),
        session_repo=MemorySearchSessionRepository(),
        history_repo=MemorySearchHistoryRepository(),
        statistics_repo=MemorySearchStatisticsRepository(),
        ai_usage_repo=MemoryAIUsageLogRepository(),
        cached_ai_repo=MemoryCachedAIResultRepository(),
    )

    from cityguide_backend.application.schemas import ComparePlacesRequest
    result = await service.compare(ComparePlacesRequest(place_ids=["p1", "p2"], user_query="best place"))
    assert result.verdict == "Test comparison verdict"
    assert len(result.comparisons) == 2
    assert result.winner_place_id == "p1"


@pytest.mark.asyncio
async def test_search_service_stream_events() -> None:
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
            name="Good Place",
            rating=4.9,
            distance_m=1000,
            reviews=[PlaceReview(author="A", rating=5, text="great")],
        )
    ]
    ai_client = StaticAIClient(
        intent=SearchIntent(query="cafe", radius_m=2000),
        summaries={
            "1": ReviewSummary(
                summary="great", pros=["nice"], cons=[], reason="fits request well", confidence=0.9, sentiment_score=0.8
            )
        },
    )
    service = SearchService(
        session=session,
        settings=settings,
        ai_client=ai_client,
        place_client=StaticTwoGISClient(places=places, reviews={}),
        cache_backend=InMemoryCache(),
        session_repo=MemorySearchSessionRepository(),
        history_repo=MemorySearchHistoryRepository(),
        statistics_repo=MemorySearchStatisticsRepository(),
        ai_usage_repo=MemoryAIUsageLogRepository(),
        cached_ai_repo=MemoryCachedAIResultRepository(),
    )

    events = []
    async for event in service.search_stream(
        SearchRequest(query="cafe near me", travel_mode="walking", max_travel_time_min=15),
        user_id=None,
    ):
        events.append(event["event"])

    assert "status" in events
    assert "intent" in events
    assert "places" in events
    assert "done" in events

