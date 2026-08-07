from __future__ import annotations

from collections.abc import AsyncIterator
from collections.abc import AsyncIterator
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from cityguide_backend.application.services.auth import AuthService
from cityguide_backend.application.services.favorites import FavoritesService
from cityguide_backend.application.services.search import SearchService
from cityguide_backend.application.services.statistics import StatisticsService
from cityguide_backend.core.config import Settings, get_settings
from cityguide_backend.core.exceptions import AuthenticationError, AuthorizationError
from cityguide_backend.core.exceptions import AuthenticationError, AuthorizationError
from cityguide_backend.core.security import decode_jwt
from cityguide_backend.domain.entities import UserProfile, UserRole
from cityguide_backend.infrastructure.repositories import (
    SqlAlchemyAIUsageLogRepository,
    SqlAlchemyCachedAIResultRepository,
    SqlAlchemyFavoritePlaceRepository,
    SqlAlchemyRefreshTokenRepository,
    SqlAlchemySearchHistoryRepository,
    SqlAlchemySearchSessionRepository,
    SqlAlchemySearchStatisticsRepository,
    SqlAlchemyUserRepository,
)


def get_session_factory(request: Request) -> async_sessionmaker[AsyncSession]:
    return request.app.state.session_factory


async def get_db_session(request: Request) -> AsyncIterator[AsyncSession]:
    factory: async_sessionmaker[AsyncSession] = request.app.state.session_factory
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def get_settings_dep() -> Settings:
    return get_settings()


def get_auth_service(request: Request, session: AsyncSession = Depends(get_db_session)) -> AuthService:
    return AuthService(
        session=session,
        users=SqlAlchemyUserRepository(session),
        refresh_tokens=SqlAlchemyRefreshTokenRepository(session),
        settings=request.app.state.settings,
    )


def get_search_service(request: Request, session: AsyncSession = Depends(get_db_session)) -> SearchService:
    return SearchService(
        session=session,
        settings=request.app.state.settings,
        ai_client=request.app.state.gemini_client,
        place_client=request.app.state.twogis_client,
        cache_backend=request.app.state.cache,
        session_repo=SqlAlchemySearchSessionRepository(session),
        history_repo=SqlAlchemySearchHistoryRepository(session),
        statistics_repo=SqlAlchemySearchStatisticsRepository(session),
        ai_usage_repo=SqlAlchemyAIUsageLogRepository(session),
        cached_ai_repo=SqlAlchemyCachedAIResultRepository(session),
    )


def get_favorites_service(request: Request, session: AsyncSession = Depends(get_db_session)) -> FavoritesService:
    return FavoritesService(session=session, repository=SqlAlchemyFavoritePlaceRepository(session))


def get_statistics_service(request: Request, session: AsyncSession = Depends(get_db_session)) -> StatisticsService:
    return StatisticsService(session=session, repository=SqlAlchemySearchStatisticsRepository(session))


async def get_current_user(request: Request, authorization: Annotated[str | None, Header()] = None, session: AsyncSession = Depends(get_db_session)) -> UserProfile:
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationError("Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_jwt(token, request.app.state.settings.jwt_secret_key)
    subject = payload.get("sub")
    if not subject:
        raise AuthenticationError("Invalid token subject")
    user_profile = await SqlAlchemyUserRepository(session).get_by_id(UUID(subject))
    if user_profile is None:
        raise AuthenticationError("User not found")
    if not user_profile.is_active:
        raise AuthorizationError("User account is disabled")
    return user_profile
