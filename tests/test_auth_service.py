from __future__ import annotations

import pytest

from cityguide_backend.application.schemas import LoginRequest, RegisterRequest
from cityguide_backend.application.services.auth import AuthService
from cityguide_backend.core.config import Settings
from cityguide_backend.core.security import hash_password, hash_token
from tests.fakes import FakeSession, MemoryRefreshTokenRepository, MemoryUserRepository


@pytest.mark.asyncio
async def test_register_login_refresh_logout_flow() -> None:
    session = FakeSession()
    users = MemoryUserRepository()
    refresh_tokens = MemoryRefreshTokenRepository()
    settings = Settings.model_construct(
        database_url="sqlite+aiosqlite:///:memory:",
        redis_url="redis://localhost:6379/0",
        jwt_secret_key="secret",
        gemini_api_key="",
        twogis_api_key="",
    )
    service = AuthService(
        session=session, users=users, refresh_tokens=refresh_tokens, settings=settings
    )

    register = await service.register(
        RegisterRequest(email="user@example.com", password="Passw0rd123", full_name="Test User")
    )
    assert register.user.email == "user@example.com"
    assert register.tokens.access_token

    login = await service.login(LoginRequest(email="user@example.com", password="Passw0rd123"))
    assert login.user.full_name == "Test User"

    refreshed = await service.refresh_session(login.tokens.refresh_token)
    assert refreshed.user.email == "user@example.com"
    assert refreshed.tokens.refresh_token != login.tokens.refresh_token

    await service.logout(refreshed.tokens.refresh_token)
    assert (
        refresh_tokens.tokens[hash_token(refreshed.tokens.refresh_token)]["revoked_at"] is not None
    )
