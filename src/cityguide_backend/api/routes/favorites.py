from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Path

from cityguide_backend.api.dependencies import get_current_user, get_favorites_service
from cityguide_backend.application.schemas import FavoriteCreateRequest, FavoriteResponse
from cityguide_backend.application.services.favorites import FavoritesService
from cityguide_backend.domain.entities import UserProfile

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=list[FavoriteResponse])
async def list_favorites(
    service: FavoritesService = Depends(get_favorites_service),
    current_user: UserProfile = Depends(get_current_user),
) -> list[FavoriteResponse]:
    return await service.list(current_user.id)


@router.post("", response_model=FavoriteResponse)
async def add_favorite(
    payload: FavoriteCreateRequest,
    service: FavoritesService = Depends(get_favorites_service),
    current_user: UserProfile = Depends(get_current_user),
) -> FavoriteResponse:
    return await service.add(current_user.id, payload)


@router.delete("/{favorite_id}")
async def delete_favorite(
    favorite_id: UUID = Path(...),
    service: FavoritesService = Depends(get_favorites_service),
    current_user: UserProfile = Depends(get_current_user),
) -> dict[str, str]:
    await service.delete(favorite_id, current_user.id)
    return {"message": "Deleted"}
