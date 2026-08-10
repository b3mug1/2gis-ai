from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import Select, delete, func, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

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
from cityguide_backend.domain.ports import (
    AIUsageLogRepository,
    CachedAIResultRepository,
    FavoritePlaceRepository,
    RefreshTokenRepository,
    SearchHistoryRepository,
    SearchSessionRepository,
    SearchStatisticsRepository,
    UserRepository,
)
from cityguide_backend.infrastructure.db.models import (
    AIUsageLogModel,
    CachedAIResultModel,
    FavoritePlaceModel,
    RefreshTokenModel,
    SearchHistoryModel,
    SearchSessionModel,
    SearchStatisticsModel,
    UserModel,
)


def _to_profile(model: UserModel) -> UserProfile:
    return UserProfile(
        id=model.id,
        email=model.email,
        full_name=model.full_name,
        role=UserRole(model.role),
        is_active=model.is_active,
    )


def _to_serialized_intent(intent: SearchIntent) -> dict[str, Any]:
    return {
        "query": intent.query,
        "location_text": intent.location_text,
        "coordinates": None
        if intent.coordinates is None
        else {"latitude": intent.coordinates.latitude, "longitude": intent.coordinates.longitude},
        "radius_m": intent.radius_m,
        "budget_kzt": intent.budget_kzt,
        "party_size": intent.party_size,
        "cuisine": intent.cuisine,
        "place_type": intent.place_type,
        "amenities": intent.amenities,
        "mood": intent.mood,
        "sort_by": intent.sort_by,
        "open_now": intent.open_now,
        "min_rating": intent.min_rating,
        "price_category": intent.price_category,
        "requires_parking": intent.requires_parking,
        "requires_quiet": intent.requires_quiet,
        "laptop_friendly": intent.laptop_friendly,
        "romantic": intent.romantic,
    }


def _to_serialized_result(result: SearchResult) -> dict[str, Any]:
    return {
        "recommendation": {
            "place_id": result.recommendation.place_id,
            "name": result.recommendation.name,
            "rating": result.recommendation.rating,
            "walking_time": result.recommendation.walking_time,
            "pros": result.recommendation.pros,
            "cons": result.recommendation.cons,
            "reason": result.recommendation.reason,
            "confidence": result.recommendation.confidence,
            "score": result.recommendation.score,
            "address": result.recommendation.address,
            "categories": result.recommendation.categories,
            "distance_m": result.recommendation.distance_m,
            "price_category": result.recommendation.price_category,
            "opening_hours": result.recommendation.opening_hours,
            "phone": result.recommendation.phone,
            "url": result.recommendation.url,
        },
        "alternatives": [
            {
                "place_id": alt.place_id,
                "name": alt.name,
                "rating": alt.rating,
                "walking_time": alt.walking_time,
                "pros": alt.pros,
                "cons": alt.cons,
                "reason": alt.reason,
                "confidence": alt.confidence,
                "score": alt.score,
                "address": alt.address,
                "categories": alt.categories,
                "distance_m": alt.distance_m,
                "price_category": alt.price_category,
                "opening_hours": alt.opening_hours,
                "phone": alt.phone,
                "url": alt.url,
            }
            for alt in result.alternatives
        ],
        "intent": _to_serialized_intent(result.intent),
        "source": result.source,
        "generated_at": result.generated_at.isoformat(),
    }


class SqlAlchemyUserRepository(UserRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_email(self, email: str) -> UserProfile | None:
        model = await self._session.scalar(
            select(UserModel).where(UserModel.email == email.lower())
        )
        return None if model is None else _to_profile(model)

    async def get_auth_data_by_email(self, email: str) -> dict[str, Any] | None:
        model = await self._session.scalar(
            select(UserModel).where(UserModel.email == email.lower())
        )
        if model is None:
            return None
        return {
            "id": model.id,
            "email": model.email,
            "password_hash": model.password_hash,
            "is_active": model.is_active,
        }

    async def get_by_id(self, user_id: uuid.UUID) -> UserProfile | None:
        model = await self._session.get(UserModel, user_id)
        return None if model is None else _to_profile(model)

    async def get_by_oauth(self, provider: str, oauth_id: str) -> UserProfile | None:
        model = await self._session.scalar(
            select(UserModel).where(
                UserModel.oauth_provider == provider, UserModel.oauth_id == oauth_id
            )
        )
        return None if model is None else _to_profile(model)

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
        model = UserModel(
            email=email.lower(),
            password_hash=password_hash,
            full_name=full_name.strip(),
            role=role,
            oauth_provider=oauth_provider,
            oauth_id=oauth_id,
        )
        self._session.add(model)
        await self._session.flush()
        return _to_profile(model)

    async def link_oauth(self, user_id: uuid.UUID, oauth_provider: str, oauth_id: str) -> None:
        await self._session.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(oauth_provider=oauth_provider, oauth_id=oauth_id)
        )

    async def update_last_login(self, user_id: uuid.UUID) -> None:
        await self._session.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(last_login_at=datetime.now(timezone.utc))
        )



class SqlAlchemyRefreshTokenRepository(RefreshTokenRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
        revoked_at: datetime | None = None,
    ) -> None:
        self._session.add(
            RefreshTokenModel(
                user_id=user_id, token_hash=token_hash, expires_at=expires_at, revoked_at=revoked_at
            )
        )
        await self._session.flush()

    async def get_by_hash(self, token_hash: str) -> dict[str, Any] | None:
        model = await self._session.scalar(
            select(RefreshTokenModel).where(RefreshTokenModel.token_hash == token_hash)
        )
        if model is None:
            return None
        return {
            "id": model.id,
            "user_id": model.user_id,
            "token_hash": model.token_hash,
            "expires_at": model.expires_at,
            "revoked_at": model.revoked_at,
        }

    async def revoke(self, token_hash: str) -> None:
        await self._session.execute(
            update(RefreshTokenModel)
            .where(RefreshTokenModel.token_hash == token_hash)
            .values(revoked_at=datetime.now(timezone.utc))
        )

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        await self._session.execute(
            update(RefreshTokenModel)
            .where(RefreshTokenModel.user_id == user_id)
            .values(revoked_at=datetime.now(timezone.utc))
        )


class SqlAlchemySearchHistoryRepository(SearchHistoryRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self, *, user_id: uuid.UUID, query: str, intent: SearchIntent, result: SearchResult
    ) -> None:
        self._session.add(
            SearchHistoryModel(
                user_id=user_id,
                query=query,
                intent=_to_serialized_intent(intent),
                result=_to_serialized_result(result),
            )
        )
        await self._session.flush()

    async def list_for_user(self, user_id: uuid.UUID, limit: int = 50) -> list[dict[str, Any]]:
        rows = await self._session.scalars(
            select(SearchHistoryModel)
            .where(SearchHistoryModel.user_id == user_id)
            .order_by(SearchHistoryModel.created_at.desc())
            .limit(limit)
        )
        return [
            {
                "id": row.id,
                "query": row.query,
                "intent": row.intent,
                "result": row.result,
                "created_at": row.created_at,
            }
            for row in rows.all()
        ]


class SqlAlchemyFavoritePlaceRepository(FavoritePlaceRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_for_user(self, user_id: uuid.UUID) -> list[dict[str, Any]]:
        rows = await self._session.scalars(
            select(FavoritePlaceModel)
            .where(FavoritePlaceModel.user_id == user_id)
            .order_by(FavoritePlaceModel.created_at.desc())
        )
        return [
            {
                "id": row.id,
                "place_id": row.place_id,
                "place_name": row.place_name,
                "payload": row.payload,
                "note": row.note,
                "created_at": row.created_at,
            }
            for row in rows.all()
        ]

    async def add(
        self, *, user_id: uuid.UUID, place: PlaceCandidate, note: str | None = None
    ) -> dict[str, Any]:
        statement = (
            insert(FavoritePlaceModel)
            .values(
                user_id=user_id,
                place_id=place.place_id,
                place_name=place.name,
                payload={
                    "place_id": place.place_id,
                    "name": place.name,
                    "address": place.address,
                    "rating": place.rating,
                    "categories": place.categories,
                    "price_category": place.price_category,
                    "opening_hours": place.opening_hours,
                    "distance_m": place.distance_m,
                    "latitude": place.latitude,
                    "longitude": place.longitude,
                    "phone": place.phone,
                    "url": place.url,
                },
                note=note,
            )
            .on_conflict_do_update(
                constraint="uq_favorite_places_user_place",
                set_={
                    "place_name": place.name,
                    "payload": {
                        "place_id": place.place_id,
                        "name": place.name,
                        "address": place.address,
                        "rating": place.rating,
                        "categories": place.categories,
                        "price_category": place.price_category,
                        "opening_hours": place.opening_hours,
                        "distance_m": place.distance_m,
                        "latitude": place.latitude,
                        "longitude": place.longitude,
                        "phone": place.phone,
                        "url": place.url,
                    },
                    "note": note,
                },
            )
            .returning(FavoritePlaceModel)
        )
        row = await self._session.scalar(statement)
        assert row is not None
        return {
            "id": row.id,
            "place_id": row.place_id,
            "place_name": row.place_name,
            "payload": row.payload,
            "note": row.note,
            "created_at": row.created_at,
        }

    async def delete(self, favorite_id: uuid.UUID, user_id: uuid.UUID) -> None:
        await self._session.execute(
            delete(FavoritePlaceModel).where(
                FavoritePlaceModel.id == favorite_id, FavoritePlaceModel.user_id == user_id
            )
        )


class SqlAlchemyCachedAIResultRepository(CachedAIResultRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, cache_key: str) -> dict[str, Any] | None:
        row = await self._session.scalar(
            select(CachedAIResultModel).where(
                CachedAIResultModel.cache_key == cache_key,
                CachedAIResultModel.expires_at > datetime.now(timezone.utc),
            )
        )
        if row is None:
            return None
        return {"cache_key": row.cache_key, "payload": row.payload, "expires_at": row.expires_at}

    async def set(self, cache_key: str, payload: dict[str, Any], ttl_seconds: int) -> None:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
        statement = (
            insert(CachedAIResultModel)
            .values(cache_key=cache_key, payload=payload, expires_at=expires_at)
            .on_conflict_do_update(
                index_elements=[CachedAIResultModel.cache_key],
                set_={"payload": payload, "expires_at": expires_at},
            )
        )
        await self._session.execute(statement)

    async def delete(self, cache_key: str) -> None:
        await self._session.execute(
            delete(CachedAIResultModel).where(CachedAIResultModel.cache_key == cache_key)
        )


class SqlAlchemySearchSessionRepository(SearchSessionRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self, *, user_id: uuid.UUID, query: str, intent: SearchIntent, status: str
    ) -> uuid.UUID:
        model = SearchSessionModel(
            user_id=user_id, query=query, intent=_to_serialized_intent(intent), status=status
        )
        self._session.add(model)
        await self._session.flush()
        return model.id

    async def update_result(self, session_id: uuid.UUID, result: SearchResult, status: str) -> None:
        await self._session.execute(
            update(SearchSessionModel)
            .where(SearchSessionModel.id == session_id)
            .values(
                result=_to_serialized_result(result),
                status=status,
                completed_at=datetime.now(timezone.utc),
            )
        )

    async def cleanup_expired(self, before: datetime) -> int:
        result = await self._session.execute(
            delete(SearchSessionModel).where(SearchSessionModel.created_at < before)
        )
        return int(result.rowcount or 0)


class SqlAlchemySearchStatisticsRepository(SearchStatisticsRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def increment(
        self, *, user_id: uuid.UUID | None, total: int = 1, successful: int = 0
    ) -> None:
        stat_date = datetime.now(timezone.utc).date()
        statement = (
            insert(SearchStatisticsModel)
            .values(
                stat_date=datetime.combine(stat_date, datetime.min.time(), tzinfo=timezone.utc),
                user_id=user_id,
                total_searches=total,
                successful_searches=successful,
            )
            .on_conflict_do_update(
                constraint="uq_search_statistics_date_user",
                set_={
                    "total_searches": SearchStatisticsModel.total_searches + total,
                    "successful_searches": SearchStatisticsModel.successful_searches + successful,
                    "updated_at": datetime.now(timezone.utc),
                },
            )
        )
        await self._session.execute(statement)

    async def daily_summary(self, *, user_id: uuid.UUID | None = None) -> list[dict[str, Any]]:
        query: Select[tuple[Any, ...]] = select(
            SearchStatisticsModel.stat_date,
            SearchStatisticsModel.user_id,
            SearchStatisticsModel.total_searches,
            SearchStatisticsModel.successful_searches,
        ).order_by(SearchStatisticsModel.stat_date.desc())
        if user_id is not None:
            query = query.where(SearchStatisticsModel.user_id == user_id)
        rows = await self._session.execute(query)
        return [
            {
                "stat_date": row.stat_date,
                "user_id": row.user_id,
                "total_searches": row.total_searches,
                "successful_searches": row.successful_searches,
            }
            for row in rows.all()
        ]


class SqlAlchemyAIUsageLogRepository(AIUsageLogRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        user_id: uuid.UUID | None,
        operation: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        metadata: dict[str, Any],
    ) -> None:
        self._session.add(
            AIUsageLogModel(
                user_id=user_id,
                operation=operation,
                model=model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                metadata_json=metadata,
            )
        )
        await self._session.flush()
