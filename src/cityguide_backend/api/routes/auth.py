from __future__ import annotations

from fastapi import APIRouter, Depends

from cityguide_backend.api.dependencies import get_auth_service
from cityguide_backend.application.schemas import AuthResponse, LoginRequest, LogoutRequest, MessageResponse, RefreshRequest, RegisterRequest
from cityguide_backend.application.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(payload: RegisterRequest, service: AuthService = Depends(get_auth_service)) -> AuthResponse:
    result = await service.register(payload)
    return AuthResponse(user=result.user, tokens=result.tokens)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, service: AuthService = Depends(get_auth_service)) -> AuthResponse:
    result = await service.login(payload)
    return AuthResponse(user=result.user, tokens=result.tokens)


@router.post("/refresh", response_model=AuthResponse)
async def refresh(payload: RefreshRequest, service: AuthService = Depends(get_auth_service)) -> AuthResponse:
    result = await service.refresh_session(payload.refresh_token)
    return AuthResponse(user=result.user, tokens=result.tokens)


@router.post("/logout", response_model=MessageResponse)
async def logout(payload: LogoutRequest, service: AuthService = Depends(get_auth_service)) -> MessageResponse:
    await service.logout(payload.refresh_token)
    return MessageResponse(message="Logged out")
