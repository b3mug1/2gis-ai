from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from cityguide_backend.application.schemas import AuthTokens, LoginRequest, RegisterRequest, UserResponse
from cityguide_backend.core.config import Settings
from cityguide_backend.core.exceptions import AuthenticationError, ConflictError, NotFoundError
from cityguide_backend.core.security import (
    create_access_token,
    create_refresh_token_raw,
    hash_password,
    hash_token,
    verify_password,
)
from cityguide_backend.domain.entities import UserProfile, UserRole
from cityguide_backend.domain.ports import RefreshTokenRepository, UserRepository


@dataclass(slots=True)
class AuthResult:
    user: UserResponse
    tokens: AuthTokens


class AuthService:
    def __init__(self, session: AsyncSession, users: UserRepository, refresh_tokens: RefreshTokenRepository, settings: Settings) -> None:
        self._session = session
        self._users = users
        self._refresh_tokens = refresh_tokens
        self._settings = settings

    async def register(self, request: RegisterRequest) -> AuthResult:
        async with self._session.begin():
            existing = await self._users.get_by_email(request.email)
            if existing is not None:
                raise ConflictError("User already exists")
            profile = await self._users.create(
                email=request.email,
                password_hash=hash_password(request.password),
                full_name=request.full_name,
                role=UserRole.user.value,
            )
            tokens = await self._issue_tokens(profile.id)
        return AuthResult(user=self._to_user_response(profile), tokens=tokens)

    async def login(self, request: LoginRequest) -> AuthResult:
        async with self._session.begin():
            existing = await self._users.get_auth_data_by_email(request.email)
            if existing is None:
                raise AuthenticationError("Invalid credentials")
            if not existing.get("is_active", True):
                raise AuthenticationError("Invalid credentials")
            if not verify_password(request.password, existing["password_hash"]):
                raise AuthenticationError("Invalid credentials")
            user_profile = await self._users.get_by_id(existing["id"])
            if user_profile is None:
                raise AuthenticationError("Invalid credentials")
            await self._users.update_last_login(existing["id"])
            tokens = await self._issue_tokens(existing["id"])
        return AuthResult(user=self._to_user_response(user_profile), tokens=tokens)

    async def refresh(self, refresh_token: str) -> AuthTokens:
        token_hash = hash_token(refresh_token)
        async with self._session.begin():
            token_row = await self._refresh_tokens.get_by_hash(token_hash)
            if token_row is None:
                raise AuthenticationError("Invalid refresh token")
            if token_row["revoked_at"] is not None or token_row["expires_at"] < datetime.now(timezone.utc):
                raise AuthenticationError("Refresh token expired")
            await self._refresh_tokens.revoke(token_hash)
            tokens = await self._issue_tokens(token_row["user_id"])
        return tokens

    async def refresh_session(self, refresh_token: str) -> AuthResult:
        token_hash = hash_token(refresh_token)
        async with self._session.begin():
            token_row = await self._refresh_tokens.get_by_hash(token_hash)
            if token_row is None:
                raise AuthenticationError("Invalid refresh token")
            if token_row["revoked_at"] is not None or token_row["expires_at"] < datetime.now(timezone.utc):
                raise AuthenticationError("Refresh token expired")
            user_profile = await self._users.get_by_id(token_row["user_id"])
            if user_profile is None:
                raise AuthenticationError("User not found")
            await self._refresh_tokens.revoke(token_hash)
            tokens = await self._issue_tokens(token_row["user_id"])
        return AuthResult(user=self._to_user_response(user_profile), tokens=tokens)

    async def logout(self, refresh_token: str) -> None:
        async with self._session.begin():
            await self._refresh_tokens.revoke(hash_token(refresh_token))

    async def me(self, user_id: UUID) -> UserResponse:
        profile = await self._users.get_by_id(user_id)
        if profile is None:
            raise NotFoundError("User not found")
        return self._to_user_response(profile)

    async def _issue_tokens(self, user_id: UUID) -> AuthTokens:
        refresh_token = create_refresh_token_raw()
        refresh_token_hash = hash_token(refresh_token)
        expires_at = datetime.now(timezone.utc) + timedelta(days=self._settings.jwt_refresh_token_expire_days)
        await self._refresh_tokens.create(user_id=user_id, token_hash=refresh_token_hash, expires_at=expires_at)
        access_token = create_access_token(
            subject=str(user_id),
            secret_key=self._settings.jwt_secret_key,
            expires_delta=timedelta(minutes=self._settings.jwt_access_token_expire_minutes),
        )
        return AuthTokens(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=self._settings.jwt_access_token_expire_minutes * 60,
        )

    def _to_user_response(self, profile: UserProfile) -> UserResponse:
        return UserResponse(id=profile.id, email=profile.email, full_name=profile.full_name, role=profile.role.value, is_active=profile.is_active)
