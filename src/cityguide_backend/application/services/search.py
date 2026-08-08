from __future__ import annotations

import asyncio
import hashlib
from dataclasses import dataclass
from datetime import datetime, timezone
from math import radians, sin, cos, sqrt, atan2
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from cityguide_backend.application.schemas import (
    CoordinatesSchema,
    PlaceRecommendationSchema,
    ReviewSummarySchema,
    SearchIntentSchema,
    SearchRequest,
    SearchResponse,
)
from cityguide_backend.core.config import Settings
from cityguide_backend.core.exceptions import NoSearchResultsError
from cityguide_backend.domain.entities import (
    Coordinates,
    PlaceCandidate,
    PlaceRecommendation,
    ReviewSummary,
    SearchIntent,
    SearchResult,
)
from cityguide_backend.domain.ports import (
    AIClient,
    AIUsageLogRepository,
    CachedAIResultRepository,
    CacheBackend,
    SearchHistoryRepository,
    SearchSessionRepository,
    SearchStatisticsRepository,
    TwoGISClient,
)


@dataclass(slots=True)
class SearchContext:
    user_id: UUID | None
    coordinates: Coordinates | None


class SearchService:
    def __init__(
        self,
        session: AsyncSession,
        settings: Settings,
        ai_client: AIClient,
        place_client: TwoGISClient,
        cache_backend: CacheBackend,
        session_repo: SearchSessionRepository,
        history_repo: SearchHistoryRepository,
        statistics_repo: SearchStatisticsRepository,
        ai_usage_repo: AIUsageLogRepository,
        cached_ai_repo: CachedAIResultRepository,
    ) -> None:
        self._session = session
        self._settings = settings
        self._ai_client = ai_client
        self._place_client = place_client
        self._cache = cache_backend
        self._session_repo = session_repo
        self._history_repo = history_repo
        self._statistics_repo = statistics_repo
        self._ai_usage_repo = ai_usage_repo
        self._cached_ai_repo = cached_ai_repo

    async def search(
        self,
        request: SearchRequest,
        *,
        user_id: UUID | None,
        user_location: Coordinates | None = None,
    ) -> SearchResponse:
        cache_key = self._cache_key(request.query, request.coordinates, user_id)
        cached = await self._cache.get_json(cache_key)
        if cached is not None:
            response = SearchResponse.model_validate(cached)
            if user_id is not None:
                try:
                    dummy_intent = SearchIntent(query=request.query)
                    rec = PlaceRecommendation(
                        place_id=response.recommendation.place_id,
                        name=response.recommendation.name,
                        rating=response.recommendation.rating,
                        walking_time=response.recommendation.walking_time,
                        pros=response.recommendation.pros,
                        cons=response.recommendation.cons,
                        reason=response.recommendation.reason,
                        confidence=response.recommendation.confidence,
                        score=response.recommendation.score,
                        address=response.recommendation.address,
                        latitude=response.recommendation.latitude,
                        longitude=response.recommendation.longitude,
                        categories=response.recommendation.categories,
                        distance_m=response.recommendation.distance_m,
                        price_category=response.recommendation.price_category,
                        opening_hours=response.recommendation.opening_hours,
                        phone=response.recommendation.phone,
                        url=response.recommendation.url,
                    )
                    dummy_result = SearchResult(
                        recommendation=rec,
                        alternatives=[],
                        intent=dummy_intent,
                        source="cache",
                        generated_at=datetime.now(timezone.utc),
                    )
                    await self._history_repo.create(
                        user_id=user_id,
                        query=request.query,
                        intent=dummy_intent,
                        result=dummy_result,
                    )
                    await self._statistics_repo.increment(user_id=user_id, total=1, successful=1)
                    await self._session.commit()
                except Exception:
                    pass
            return response

        intent = await self._ai_client.extract_intent(request.query, user_location=user_location)
        if request.coordinates is not None:
            intent.coordinates = Coordinates(
                latitude=request.coordinates.latitude, longitude=request.coordinates.longitude
            )
        elif intent.location_text:
            geocoded = await self._place_client.geocode_location(intent.location_text)
            if geocoded is not None:
                intent.coordinates = geocoded
                # When user specifies a named location, use a wider radius to find places nearby
                intent.radius_m = max(intent.radius_m, 3000)

        session_id = None
        if user_id is not None:
            session_id = await self._session_repo.create(
                user_id=user_id, query=request.query, intent=intent, status="processing"
            )
            await self._session.flush()
        places = await self._place_client.search_places(intent)
        if not places:
            # Broaden radius and retry
            broader_intent = SearchIntent(
                query=intent.query,
                coordinates=intent.coordinates,
                radius_m=min(intent.radius_m * 3, 10000),
                cuisine=intent.cuisine,
                place_type=intent.place_type,
            )
            places = await self._place_client.search_places(broader_intent)
            if not places:
                raise NoSearchResultsError("No places found for this query")

        deduped = self._deduplicate_candidates(places)
        enriched = await asyncio.gather(
            *[self._enrich_place(intent, place) for place in deduped[:10]]
        )

        # Filter out candidates that are category mismatches or have low confidence/score
        # Use lenient threshold (0.05) so location-based searches ("кафе рядом с X") always return results
        relevant = [p for p in enriched if p.confidence > 0.05 and p.score > 0.05]
        if not relevant:
            # Fallback: broaden radius and search again with just the main keyword
            keyword = intent.query or "кафе"
            fallback_intent = SearchIntent(
                query=keyword,
                coordinates=intent.coordinates,
                radius_m=min(intent.radius_m * 3, 10000),
            )
            fallback_places = await self._place_client.search_places(fallback_intent)
            if fallback_places:
                enriched_fallback = await asyncio.gather(
                    *[
                        self._enrich_place(intent, place)
                        for place in self._deduplicate_candidates(fallback_places)[:10]
                    ]
                )
                relevant = [p for p in enriched_fallback if p.confidence > 0.05 and p.score > 0.05]

        final_pool = relevant if relevant else enriched
        ranked = sorted(final_pool, key=lambda item: item.score, reverse=True)
        recommendation = ranked[0]
        alternatives = ranked[1:4]
        result = SearchResult(
            recommendation=self._recommendation_from_scored(recommendation),
            alternatives=[
                self._recommendation_from_scored(candidate) for candidate in alternatives
            ],
            intent=intent,
            source="2gis+gemini",
            generated_at=datetime.now(timezone.utc),
        )

        response = self._to_response(result)
        payload = response.model_dump(mode="json")

        if user_id is not None:
            await self._history_repo.create(
                user_id=user_id, query=request.query, intent=intent, result=result
            )
            await self._statistics_repo.increment(user_id=user_id, total=1, successful=1)
            await self._ai_usage_repo.create(
                user_id=user_id,
                operation="search",
                model=self._settings.gemini_model,
                prompt_tokens=0,
                completion_tokens=0,
                metadata={"query": request.query},
            )
        await self._cache.set_json(cache_key, payload, self._settings.search_cache_ttl_seconds)
        await self._cached_ai_repo.set(cache_key, payload, self._settings.search_cache_ttl_seconds)
        if session_id is not None:
            await self._session_repo.update_result(session_id, result, status="completed")
        await self._session.commit()
        return response

    def _deduplicate_candidates(self, places: list[PlaceCandidate]) -> list[PlaceCandidate]:
        seen_names: set[str] = set()
        seen_ids: set[str] = set()
        unique: list[PlaceCandidate] = []
        for place in places:
            if place.place_id in seen_ids:
                continue
            brand_name = place.name.lower().split(",")[0].strip()
            if brand_name in seen_names:
                continue
            seen_ids.add(place.place_id)
            seen_names.add(brand_name)
            unique.append(place)
        return unique if len(unique) >= 2 else places

    async def _enrich_place(
        self, intent: SearchIntent, place: PlaceCandidate
    ) -> PlaceRecommendation:
        if not place.reviews:
            place.reviews = await self._place_client.get_reviews(place.place_id)
        summary = await self._ai_client.summarize_reviews(intent, place)

        # Filter synthetic / invalid dummy places without address or categories
        if not place.address and not place.categories and not place.rating:
            summary.confidence = 0.0

        score = self._score_place(intent, place, summary)
        walking_time = None if place.distance_m is None else max(1, round(place.distance_m / 80))
        return PlaceRecommendation(
            place_id=place.place_id,
            name=place.name,
            rating=place.rating,
            walking_time=walking_time,
            pros=summary.pros,
            cons=summary.cons,
            reason=summary.reason,
            confidence=summary.confidence,
            score=score,
            address=place.address,
            latitude=place.latitude,
            longitude=place.longitude,
            categories=place.categories,
            distance_m=place.distance_m,
            price_category=place.price_category,
            opening_hours=place.opening_hours,
            phone=place.phone,
            url=place.url,
            photos=place.photos,
        )

    def _is_category_mismatch(self, intent: SearchIntent, place: PlaceCandidate) -> bool:
        full_req = (
            intent.query + " " + (intent.cuisine or "") + " " + (intent.place_type or "")
        ).lower()
        food_keywords = {
            "sushi",
            "суши",
            "роллы",
            "pizza",
            "пицца",
            "burger",
            "бургер",
            "food",
            "еда",
            "restaurant",
            "ресторан",
            "cafe",
            "кафе",
            "bar",
            "бар",
            "кухня",
            "coffee",
            "кофе",
        }
        if any(kw in full_req for kw in food_keywords):
            non_food_terms = {
                "одежда",
                "обувь",
                "мебель",
                "мебельный",
                "маркетинг",
                "авто",
                "автозапчасти",
                "строительство",
                "недвижимость",
                "агентство",
                "юридические",
                "аптека",
                "цех",
                "производство",
            }
            food_terms = {
                "общепит",
                "ресторан",
                "кафе",
                "суши",
                "бар",
                "столовая",
                "доставка еды",
                "кофейня",
                "пекарня",
                "паб",
                "закусочная",
                "пиццерия",
                "бургерная",
                "быстрое питание",
                "fast food",
            }
            cats_lower = [c.lower() for c in place.categories]
            name_lower = place.name.lower()
            has_food_cat = any(any(ft in cat for ft in food_terms) for cat in cats_lower)
            if not has_food_cat:
                if any(any(nft in cat for nft in non_food_terms) for cat in cats_lower) or any(
                    nft in name_lower
                    for nft in {"женской одежды", "мебельный цех", "агентство", "магазин одежды"}
                ):
                    return True
        return False

    def _score_place(
        self, intent: SearchIntent, place: PlaceCandidate, summary: ReviewSummary
    ) -> float:
        if summary.confidence < 0.1:
            return 0.0
        if self._is_category_mismatch(intent, place):
            return 0.0

        rating = place.rating or 0.0
        distance = place.distance_m or intent.radius_m
        distance_score = max(0.0, 1.0 - (distance / max(intent.radius_m, 1)))
        budget_score = 1.0
        if intent.budget_kzt and place.price_category:
            price_rank = self._price_rank(place.price_category)
            budget_score = 1.0 if price_rank <= self._budget_rank(intent.budget_kzt) else 0.65
        parking_score = 1.0 if not intent.requires_parking or place.has_parking else 0.4
        quiet_score = 1.0 if not intent.requires_quiet else 0.85
        open_score = 1.0 if not intent.open_now or place.is_open_now else 0.3
        review_score = (summary.sentiment_score + 1.0) / 2.0
        confidence_factor = summary.confidence

        # Cuisine / Keyword relevance bonus
        relevance_bonus = 0.0
        query_terms = ((intent.query or "") + " " + (intent.cuisine or "")).lower()
        place_cats = " ".join([c.lower() for c in place.categories])
        place_name = place.name.lower()
        if "sushi" in query_terms or "суши" in query_terms or "ролл" in query_terms:
            if (
                "суши" in place_cats
                or "суши" in place_name
                or "sushi" in place_name
                or "японская" in place_cats
            ):
                relevance_bonus += 0.25
            elif "гриль" in place_cats or "шашлык" in place_name:
                relevance_bonus -= 0.10

        base = (
            (rating / 5.0) * 0.35
            + distance_score * 0.20
            + budget_score * 0.15
            + parking_score * 0.05
            + quiet_score * 0.05
            + open_score * 0.05
            + review_score * 0.15
            + relevance_bonus
        )
        return round(min(1.0, max(0.0, base * confidence_factor)), 4)

    def _price_rank(self, price_category: str) -> int:
        normalized = price_category.lower().strip()
        order = {"budget": 1, "mid": 2, "standard": 2, "premium": 3, "luxury": 4}
        return order.get(normalized, 2)

    def _budget_rank(self, budget_kzt: int) -> int:
        if budget_kzt <= 10000:
            return 1
        if budget_kzt <= 25000:
            return 2
        if budget_kzt <= 50000:
            return 3
        return 4

    def _recommendation_from_scored(
        self, recommendation: PlaceRecommendation
    ) -> PlaceRecommendation:
        return recommendation

    def _to_response(self, result: SearchResult) -> SearchResponse:
        return SearchResponse(
            recommendation=self._to_schema(result.recommendation),
            alternatives=[self._to_schema(item) for item in result.alternatives],
            intent=self._intent_schema(result.intent),
            source=result.source,
            generated_at=result.generated_at,
        )

    def _to_schema(self, recommendation: PlaceRecommendation) -> PlaceRecommendationSchema:
        return PlaceRecommendationSchema(
            place_id=recommendation.place_id,
            name=recommendation.name,
            rating=recommendation.rating,
            walking_time=recommendation.walking_time,
            pros=recommendation.pros,
            cons=recommendation.cons,
            reason=recommendation.reason,
            confidence=recommendation.confidence,
            score=recommendation.score,
            address=recommendation.address,
            latitude=recommendation.latitude,
            longitude=recommendation.longitude,
            categories=recommendation.categories,
            distance_m=recommendation.distance_m,
            price_category=recommendation.price_category,
            opening_hours=recommendation.opening_hours,
            phone=recommendation.phone,
            url=recommendation.url,
            photos=recommendation.photos,
        )

    def _intent_schema(self, intent: SearchIntent) -> SearchIntentSchema:
        return SearchIntentSchema(
            query=intent.query,
            location_text=intent.location_text,
            coordinates=None
            if intent.coordinates is None
            else CoordinatesSchema(
                latitude=intent.coordinates.latitude, longitude=intent.coordinates.longitude
            ),
            radius_m=intent.radius_m,
            budget_kzt=intent.budget_kzt,
            party_size=intent.party_size,
            cuisine=intent.cuisine,
            place_type=intent.place_type,
            amenities=intent.amenities,
            mood=intent.mood,
            sort_by=intent.sort_by,
            open_now=intent.open_now,
            min_rating=intent.min_rating,
            price_category=intent.price_category,
            requires_parking=intent.requires_parking,
            requires_quiet=intent.requires_quiet,
            laptop_friendly=intent.laptop_friendly,
            romantic=intent.romantic,
        )

    def _cache_key(
        self, query: str, coordinates: CoordinatesSchema | None, user_id: UUID | None
    ) -> str:
        raw = {
            "query": query.lower().strip(),
            "coordinates": None
            if coordinates is None
            else {"latitude": coordinates.latitude, "longitude": coordinates.longitude},
            "user_id": None if user_id is None else str(user_id),
        }
        return f"search:{hashlib.sha256(str(raw).encode('utf-8')).hexdigest()}"
