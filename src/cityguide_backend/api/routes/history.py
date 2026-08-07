from __future__ import annotations

from fastapi import APIRouter, Depends

from cityguide_backend.api.dependencies import get_current_user, get_db_session
from cityguide_backend.application.schemas import SearchHistoryResponse
from cityguide_backend.domain.entities import UserProfile
from cityguide_backend.infrastructure.repositories import SqlAlchemySearchHistoryRepository

router = APIRouter(tags=["history"])


@router.get("/history", response_model=list[SearchHistoryResponse])
async def history(
    current_user: UserProfile = Depends(get_current_user), session=Depends(get_db_session)
) -> list[SearchHistoryResponse]:  # noqa: ANN001
    rows = await SqlAlchemySearchHistoryRepository(session).list_for_user(current_user.id)
    return [SearchHistoryResponse.model_validate(row) for row in rows]
