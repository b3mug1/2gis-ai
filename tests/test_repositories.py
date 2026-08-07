from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import uuid4

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock

from cityguide_backend.domain.entities import (
    Coordinates,
    PlaceCandidate,
    PlaceReview,
    ReviewSummary,
    SearchIntent,
    SearchResult,
    PlaceRecommendation,
)
from cityguide_backend.infrastructure.db.models import SearchHistoryModel, UserModel
from cityguide_backend.infrastructure.repositories import (
    SqlAlchemySearchHistoryRepository,
    SqlAlchemyUserRepository,
)


@pytest.mark.asyncio
async def test_user_repository_create_adds_lowercased_user() -> None:
    session = AsyncMock(spec=AsyncSession)
    session.flush = AsyncMock()
    repo = SqlAlchemyUserRepository(session)

    profile = await repo.create(
        email="USER@example.com", password_hash="hash", full_name="User", role="user"
    )

    assert profile.email == "user@example.com"
    assert session.add.call_count == 1
    added = session.add.call_args.args[0]
    assert isinstance(added, UserModel)
    assert added.email == "user@example.com"


@pytest.mark.asyncio
async def test_search_history_repository_serializes_payloads() -> None:
    session = AsyncMock(spec=AsyncSession)
    session.flush = AsyncMock()
    repo = SqlAlchemySearchHistoryRepository(session)
    intent = SearchIntent(query="sushi", location_text="Astana")
    result = SearchResult(
        recommendation=PlaceRecommendation(
            place_id="1",
            name="Place",
            rating=4.9,
            walking_time=10,
            pros=["good"],
            cons=["busy"],
            reason="best",
            confidence=0.9,
            score=0.95,
        ),
        alternatives=[],
        intent=intent,
        source="2gis+gemini",
        generated_at=datetime.now(timezone.utc),
    )

    await repo.create(user_id=uuid4(), query="sushi", intent=intent, result=result)

    assert session.add.call_count == 1
    added = session.add.call_args.args[0]
    assert isinstance(added, SearchHistoryModel)
    assert added.intent["query"] == "sushi"
    assert added.result["recommendation"]["name"] == "Place"
