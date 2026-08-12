from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

from cityguide_backend.domain.entities import (
    Coordinates,
    PlaceCandidate,
    PlaceReview,
    ReviewSummary,
    SearchIntent,
    SearchResult,
    UserProfile,
    UserRole,
)

class NoopTransaction:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

class FakeSession:
    def __init__(self) -> None:
        self.added: list[Any] = []
        self.executed: list[Any] = []
        self.flushed = 0
        self.commits = 0

    def begin(self) -> NoopTransaction:
        return NoopTransaction()

    def add(self, obj: Any) -> None:
        self.added.append(obj)

    async def flush(self) -> None:
        self.flushed += 1

    async def commit(self) -> None:
        self.commits += 1

    async def execute(self, statement):
        self.executed.append(statement)
        raise AssertionError("FakeSession.execute should not be called in this test")

    async def scalar(self, statement):
        self.executed.append(statement)
        return None

    async def get(self, model, key):
        return None

@dataclass
class MemoryUserRepository:
    users: dict[str, dict[str, Any]] = field(default_factory=dict)

    async def get_by_email(self, email: str) -> UserProfile | None:
        record = self.users.get(email.lower())
        if record is None:
            return None
        return UserProfile(
            id=record["id"],
            email=record["email"],
            full_name=record["full_name"],
            role=UserRole(record["role"]),
            is_active=record["is_active"],
        )

    async def get_auth_data_by_email(self, email: str) -> dict[str, Any] | None:
        return self.users.get(email.lower())

    async def get_by_id(self, user_id: UUID) -> UserProfile | None:
        for record in self.users.values():
            if record["id"] == user_id:
                return UserProfile(
                    id=record["id"],
                    email=record["email"],
                    full_name=record["full_name"],
                    role=UserRole(record["role"]),
                    is_active=record["is_active"],
                )
        return None

    async def get_by_oauth(self, provider: str, oauth_id: str) -> UserProfile | None:
        for record in self.users.values():
            if record.get("oauth_provider") == provider and record.get("oauth_id") == oauth_id:
                return UserProfile(
                    id=record["id"],
                    email=record["email"],
                    full_name=record["full_name"],
                    role=UserRole(record["role"]),
                    is_active=record["is_active"],
                )
        return None

    async def create(
        self,
        *,
        email: str,
        password_hash: str | None = None,
        full_name: str,
        role: str,
        oauth_provider: str | None = None,
        oauth_id: str | None = None,
    ) -> UserProfile:
        user_id = uuid4()
        record = {
            "id": user_id,
            "email": email.lower(),
            "full_name": full_name,
            "role": role,
            "is_active": True,
            "password_hash": password_hash,
            "oauth_provider": oauth_provider,
            "oauth_id": oauth_id,
        }
        self.users[email.lower()] = record
        return UserProfile(
            id=user_id,
            email=email.lower(),
            full_name=full_name,
            role=UserRole(role),
            is_active=True,
        )

    async def link_oauth(self, user_id: UUID, oauth_provider: str, oauth_id: str) -> None:
        for record in self.users.values():
            if record["id"] == user_id:
                record["oauth_provider"] = oauth_provider
                record["oauth_id"] = oauth_id
                break

    async def update_last_login(self, user_id: UUID) -> None:
        return None

@dataclass
class MemoryRefreshTokenRepository:
    tokens: dict[str, dict[str, Any]] = field(default_factory=dict)

    async def create(
        self,
        *,
        user_id: UUID,
        token_hash: str,
        expires_at: datetime,
        revoked_at: datetime | None = None,
    ) -> None:
        self.tokens[token_hash] = {
            "user_id": user_id,
            "token_hash": token_hash,
            "expires_at": expires_at,
            "revoked_at": revoked_at,
        }

    async def get_by_hash(self, token_hash: str) -> dict[str, Any] | None:
        return self.tokens.get(token_hash)

    async def revoke(self, token_hash: str) -> None:
        if token_hash in self.tokens:
            self.tokens[token_hash]["revoked_at"] = datetime.now(timezone.utc)

    async def revoke_all_for_user(self, user_id: UUID) -> None:
        for token in self.tokens.values():
            if token["user_id"] == user_id:
                token["revoked_at"] = datetime.now(timezone.utc)

@dataclass
class MemorySearchHistoryRepository:
    entries: list[dict[str, Any]] = field(default_factory=list)

    async def create(
        self, *, user_id: UUID, query: str, intent: SearchIntent, result: SearchResult
    ) -> None:
        self.entries.append(
            {"user_id": user_id, "query": query, "intent": intent, "result": result}
        )

    async def list_for_user(self, user_id: UUID, limit: int = 50) -> list[dict[str, Any]]:
        return [entry for entry in self.entries if entry["user_id"] == user_id][:limit]

@dataclass
class MemoryFavoritePlaceRepository:
    favorites: list[dict[str, Any]] = field(default_factory=list)

    async def list_for_user(self, user_id: UUID) -> list[dict[str, Any]]:
        return [favorite for favorite in self.favorites if favorite["user_id"] == user_id]

    async def add(
        self, *, user_id: UUID, place: PlaceCandidate, note: str | None = None
    ) -> dict[str, Any]:
        favorite = {
            "id": uuid4(),
            "user_id": user_id,
            "place_id": place.place_id,
            "place_name": place.name,
            "payload": {"address": place.address, "rating": place.rating},
            "note": note,
            "created_at": datetime.now(timezone.utc),
        }
        self.favorites.append(favorite)
        return favorite

    async def delete(self, favorite_id: UUID, user_id: UUID) -> None:
        self.favorites = [
            favorite
            for favorite in self.favorites
            if not (favorite["id"] == favorite_id and favorite["user_id"] == user_id)
        ]

@dataclass
class MemoryCachedAIResultRepository:
    cache: dict[str, dict[str, Any]] = field(default_factory=dict)

    async def get(self, cache_key: str) -> dict[str, Any] | None:
        return self.cache.get(cache_key)

    async def set(self, cache_key: str, payload: dict[str, Any], ttl_seconds: int) -> None:
        self.cache[cache_key] = {"payload": payload, "ttl_seconds": ttl_seconds}

    async def delete(self, cache_key: str) -> None:
        self.cache.pop(cache_key, None)

@dataclass
class MemorySearchSessionRepository:
    sessions: dict[UUID, dict[str, Any]] = field(default_factory=dict)

    async def create(self, *, user_id: UUID, query: str, intent: SearchIntent, status: str) -> UUID:
        session_id = uuid4()
        self.sessions[session_id] = {
            "user_id": user_id,
            "query": query,
            "intent": intent,
            "status": status,
            "result": None,
        }
        return session_id

    async def update_result(self, session_id: UUID, result: SearchResult, status: str) -> None:
        self.sessions[session_id]["result"] = result
        self.sessions[session_id]["status"] = status

    async def cleanup_expired(self, before: datetime) -> int:
        return 0

@dataclass
class MemorySearchStatisticsRepository:
    increments: list[dict[str, Any]] = field(default_factory=list)

    async def increment(self, *, user_id: UUID | None, total: int = 1, successful: int = 0) -> None:
        self.increments.append({"user_id": user_id, "total": total, "successful": successful})

    async def daily_summary(self, *, user_id: UUID | None = None) -> list[dict[str, Any]]:
        return [
            {
                "stat_date": datetime.now(timezone.utc),
                "user_id": user_id,
                "total_searches": 1,
                "successful_searches": 1,
            }
        ]

@dataclass
class MemoryAIUsageLogRepository:
    logs: list[dict[str, Any]] = field(default_factory=list)

    async def create(
        self,
        *,
        user_id: UUID | None,
        operation: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        metadata: dict[str, Any],
    ) -> None:
        self.logs.append(
            {
                "user_id": user_id,
                "operation": operation,
                "model": model,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "metadata": metadata,
            }
        )

from cityguide_backend.domain.entities import (
    Coordinates,
    PlaceCandidate,
    PlaceComparisonItem,
    PlaceComparisonResult,
    PlaceReview,
    ReviewSummary,
    SearchIntent,
    SearchResult,
    UserProfile,
    UserRole,
)

@dataclass
class StaticAIClient:
    intent: SearchIntent
    summaries: dict[str, ReviewSummary]

    async def extract_intent(
        self,
        query: str,
        *,
        user_location: Coordinates | None = None,
        locale: str = "en",
    ) -> SearchIntent:
        return self.intent

    async def summarize_reviews(
        self, intent: SearchIntent, place: PlaceCandidate, *, locale: str = "en"
    ) -> ReviewSummary:
        return self.summaries[place.place_id]

    async def compare_places(
        self,
        places: list[PlaceCandidate],
        *,
        user_query: str | None = None,
        locale: str = "ru",
    ) -> PlaceComparisonResult:
        return PlaceComparisonResult(
            verdict="Test comparison verdict",
            winner_place_id=places[0].place_id if places else None,
            comparisons=[
                PlaceComparisonItem(
                    place_id=p.place_id,
                    name=p.name,
                    best_for="Testing",
                    pros=["Good"],
                    cons=["Bad"],
                    rating=p.rating,
                )
                for p in places
            ],
            key_differences=["Diff 1"],
        )

@dataclass
class StaticTwoGISClient:
    places: list[PlaceCandidate]
    reviews: dict[str, list[PlaceReview]]

    async def search_places(self, intent: SearchIntent) -> list[PlaceCandidate]:
        return self.places

    async def get_reviews(self, place_id: str) -> list[PlaceReview]:
        return self.reviews.get(place_id, [])

    async def get_place_by_id(self, place_id: str) -> PlaceCandidate | None:
        for p in self.places:
            if p.place_id == place_id:
                return p
        return None

    async def geocode_location(self, location_text: str) -> Coordinates | None:
        return Coordinates(latitude=51.1, longitude=71.1)
