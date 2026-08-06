from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from cityguide_backend.application.schemas import FavoriteCreateRequest, FavoriteResponse
from cityguide_backend.domain.entities import Coordinates, PlaceCandidate
from cityguide_backend.domain.ports import FavoritePlaceRepository


class FavoritesService:
    def __init__(self, session: AsyncSession, repository: FavoritePlaceRepository) -> None:
        self._session = session
        self._repository = repository

    async def list(self, user_id: UUID) -> list[FavoriteResponse]:
        rows = await self._repository.list_for_user(user_id)
        return [FavoriteResponse.model_validate(row) for row in rows]

    async def add(self, user_id: UUID, request: FavoriteCreateRequest) -> FavoriteResponse:
        payload = request.payload
        place = PlaceCandidate(
            place_id=request.place_id,
            name=request.place_name,
            address=payload.get("address"),
            rating=payload.get("rating"),
            distance_m=payload.get("distance_m"),
            latitude=payload.get("latitude"),
            longitude=payload.get("longitude"),
            categories=list(payload.get("categories") or []),
            price_category=payload.get("price_category"),
            opening_hours=payload.get("opening_hours"),
            phone=payload.get("phone"),
            url=payload.get("url"),
        )
        async with self._session.begin():
            row = await self._repository.add(user_id=user_id, place=place, note=request.note)
        return FavoriteResponse.model_validate(row)

    async def delete(self, favorite_id: UUID, user_id: UUID) -> None:
        async with self._session.begin():
            await self._repository.delete(favorite_id, user_id)
