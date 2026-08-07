from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request

from cityguide_backend.application.schemas import PopularResponse, PlaceRecommendationSchema, SuggestResponse
from cityguide_backend.infrastructure.external.twogis import TwoGISClientHTTP

router = APIRouter(prefix="/search", tags=["search"])


def get_twogis_client(request: Request) -> TwoGISClientHTTP:
    return request.app.state.twogis_client


@router.get("/suggest", response_model=SuggestResponse)
async def suggest_places(
    q: str = Query(..., min_length=1, max_length=200, description="Partial search query"),
    limit: int = Query(default=5, ge=1, le=10),
    twogis: TwoGISClientHTTP = Depends(get_twogis_client),
) -> SuggestResponse:
    suggestions = await twogis.suggest(q, limit=limit)
    return SuggestResponse(suggestions=suggestions)


@router.get("/popular", response_model=PopularResponse)
async def get_popular_places(
    limit: int = Query(default=6, ge=1, le=12),
    twogis: TwoGISClientHTTP = Depends(get_twogis_client),
) -> PopularResponse:
    candidates = await twogis.get_popular(limit=limit)
    places = [
        PlaceRecommendationSchema(
            place_id=c.place_id,
            name=c.name,
            rating=c.rating,
            walking_time=None,
            pros=[],
            cons=[],
            reason="",
            confidence=0.8,
            score=min(1.0, (c.rating or 0) / 5.0),
            address=c.address,
            latitude=c.latitude,
            longitude=c.longitude,
            categories=c.categories,
            distance_m=c.distance_m,
            price_category=c.price_category,
            opening_hours=c.opening_hours,
            phone=c.phone,
            url=c.url,
            photos=c.photos,
        )
        for c in candidates
    ]
    return PopularResponse(places=places)
