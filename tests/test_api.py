from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from cityguide_backend.application.schemas import (
    AuthResponse,
    AuthTokens,
    MessageResponse,
    UserResponse,
)
from cityguide_backend.main import app


class FakeAuthService:
    async def register(self, payload):  # noqa: ANN001
        user = UserResponse(
            id=uuid4(),
            email=payload.email,
            full_name=payload.full_name,
            role="user",
            is_active=True,
        )
        tokens = AuthTokens(access_token="access", refresh_token="refresh", expires_in=1800)
        return type("Result", (), {"user": user, "tokens": tokens})()

    async def login(self, payload):  # noqa: ANN001
        user = UserResponse(
            id=uuid4(), email=payload.email, full_name="Test User", role="user", is_active=True
        )
        tokens = AuthTokens(access_token="access", refresh_token="refresh", expires_in=1800)
        return type("Result", (), {"user": user, "tokens": tokens})()

    async def refresh_session(self, refresh_token: str):
        user = UserResponse(
            id=uuid4(), email="user@example.com", full_name="Test User", role="user", is_active=True
        )
        tokens = AuthTokens(access_token="new-access", refresh_token="new-refresh", expires_in=1800)
        return type("Result", (), {"user": user, "tokens": tokens})()

    async def logout(self, refresh_token: str) -> None:
        return None


class FakeSearchService:
    async def search(self, request, *, user_id, user_location=None):  # noqa: ANN001
        return {
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
                "categories": ["sushi"],
                "distance_m": 800,
                "price_category": "budget",
                "opening_hours": "daily",
                "phone": None,
                "url": None,
            },
            "alternatives": [],
            "intent": {
                "query": request.query,
                "location_text": None,
                "coordinates": request.coordinates.model_dump() if request.coordinates else None,
                "radius_m": 2000,
                "budget_kzt": 10000,
                "party_size": 1,
                "cuisine": "sushi",
                "place_type": "restaurant",
                "amenities": [],
                "mood": None,
                "sort_by": "best_match",
                "open_now": False,
                "min_rating": 0,
                "price_category": "budget",
                "requires_parking": False,
                "requires_quiet": False,
                "laptop_friendly": False,
                "romantic": False,
            },
            "source": "2gis+gemini",
            "generated_at": "2026-08-04T00:00:00+00:00",
        }


@pytest.mark.asyncio
async def test_search_endpoint_with_dependency_overrides() -> None:
    app.dependency_overrides.clear()
    from cityguide_backend.api.dependencies import (
        get_current_user,
        get_search_service,
        get_auth_service,
    )

    app.dependency_overrides[get_search_service] = lambda: FakeSearchService()
    app.dependency_overrides[get_current_user] = lambda: type(
        "User",
        (),
        {
            "id": uuid4(),
            "email": "u@example.com",
            "full_name": "User",
            "role": type("Role", (), {"value": "user"})(),
            "is_active": True,
        },
    )()
    app.dependency_overrides[get_auth_service] = lambda: FakeAuthService()

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app, lifespan="off"), base_url="http://test"
        ) as client:
            response = await client.post(
                "/search",
                json={
                    "query": "sushi near astana",
                    "coordinates": {"latitude": 51.0, "longitude": 71.0},
                },
                headers={"Authorization": "Bearer test"},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["recommendation"]["name"] == "Good Sushi"
