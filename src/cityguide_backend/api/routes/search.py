from __future__ import annotations

from fastapi import APIRouter, Depends

from cityguide_backend.api.dependencies import get_current_user, get_search_service
from cityguide_backend.application.schemas import SearchRequest, SearchResponse
from cityguide_backend.application.services.search import SearchService
from cityguide_backend.domain.entities import UserProfile

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=SearchResponse)
async def search_places(payload: SearchRequest, service: SearchService = Depends(get_search_service), current_user: UserProfile = Depends(get_current_user)) -> SearchResponse:
    return await service.search(payload, user_id=current_user.id)
