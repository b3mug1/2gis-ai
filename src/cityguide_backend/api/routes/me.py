from __future__ import annotations

from fastapi import APIRouter, Depends

from cityguide_backend.api.dependencies import get_current_user
from cityguide_backend.application.schemas import UserResponse
from cityguide_backend.domain.entities import UserProfile

router = APIRouter(tags=["me"])


@router.get("/me", response_model=UserResponse)
async def me(current_user: UserProfile = Depends(get_current_user)) -> UserResponse:
    return UserResponse(id=current_user.id, email=current_user.email, full_name=current_user.full_name, role=current_user.role.value, is_active=current_user.is_active)
