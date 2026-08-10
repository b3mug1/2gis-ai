from __future__ import annotations

from datetime import datetime
from typing import Any, Protocol
from uuid import UUID

from cityguide_backend.domain.entities import (
    Coordinates,
    PlaceCandidate,
    PlaceReview,
    ReviewSummary,
    SearchIntent,
    SearchResult,
    UserProfile,
)


class UserRepository(Protocol):
    async def get_by_email(self, email: str) -> UserProfile | None: ...

    async def get_auth_data_by_email(self, email: str) -> dict[str, Any] | None: ...

    async def get_by_id(self, user_id: UUID) -> UserProfile | None: ...

    async def get_by_oauth(self, provider: str, oauth_id: str) -> UserProfile | None: ...

    async def create(
        self,
        *,
        email: str,
        password_hash: str | None = None,
        full_name: str,
        role: str,
        oauth_provider: str | None = None,
        oauth_id: str | None = None,
    ) -> UserProfile: ...

    async def link_oauth(self, user_id: UUID, oauth_provider: str, oauth_id: str) -> None: ...

    async def update_last_login(self, user_id: UUID) -> None: ...


class RefreshTokenRepository(Protocol):
    async def create(
        self,
        *,
        user_id: UUID,
        token_hash: str,
        expires_at: datetime,
        revoked_at: datetime | None = None,
    ) -> None: ...

    async def get_by_hash(self, token_hash: str) -> dict[str, Any] | None: ...

    async def revoke(self, token_hash: str) -> None: ...

    async def revoke_all_for_user(self, user_id: UUID) -> None: ...


class SearchHistoryRepository(Protocol):
    async def create(
        self, *, user_id: UUID, query: str, intent: SearchIntent, result: SearchResult
    ) -> None: ...

    async def list_for_user(self, user_id: UUID, limit: int = 50) -> list[dict[str, Any]]: ...


class FavoritePlaceRepository(Protocol):
    async def list_for_user(self, user_id: UUID) -> list[dict[str, Any]]: ...

    async def add(
        self, *, user_id: UUID, place: PlaceCandidate, note: str | None = None
    ) -> dict[str, Any]: ...

    async def delete(self, favorite_id: UUID, user_id: UUID) -> None: ...


class CachedAIResultRepository(Protocol):
    async def get(self, cache_key: str) -> dict[str, Any] | None: ...

    async def set(self, cache_key: str, payload: dict[str, Any], ttl_seconds: int) -> None: ...

    async def delete(self, cache_key: str) -> None: ...


class SearchSessionRepository(Protocol):
    async def create(
        self, *, user_id: UUID, query: str, intent: SearchIntent, status: str
    ) -> UUID: ...

    async def update_result(self, session_id: UUID, result: SearchResult, status: str) -> None: ...

    async def cleanup_expired(self, before: datetime) -> int: ...


class SearchStatisticsRepository(Protocol):
    async def increment(
        self, *, user_id: UUID | None, total: int = 1, successful: int = 0
    ) -> None: ...

    async def daily_summary(self, *, user_id: UUID | None = None) -> list[dict[str, Any]]: ...


class AIUsageLogRepository(Protocol):
    async def create(
        self,
        *,
        user_id: UUID | None,
        operation: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        metadata: dict[str, Any],
    ) -> None: ...


class TwoGISClient(Protocol):
    async def search_places(self, intent: SearchIntent) -> list[PlaceCandidate]: ...

    async def get_reviews(self, place_id: str) -> list[PlaceReview]: ...

    async def geocode_location(self, location_text: str) -> Coordinates | None: ...


class AIClient(Protocol):
    async def extract_intent(
        self,
        query: str,
        *,
        user_location: Coordinates | None = None,
        locale: str = "en",
    ) -> SearchIntent: ...

    async def summarize_reviews(
        self, intent: SearchIntent, place: PlaceCandidate, *, locale: str = "en"
    ) -> ReviewSummary: ...


class CacheBackend(Protocol):
    async def get_json(self, key: str) -> dict[str, Any] | None: ...

    async def set_json(self, key: str, value: dict[str, Any], ttl_seconds: int) -> None: ...

    async def delete(self, key: str) -> None: ...

    async def incr_window(self, key: str, ttl_seconds: int) -> int: ...
