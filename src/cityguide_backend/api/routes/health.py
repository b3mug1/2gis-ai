from __future__ import annotations

from fastapi import APIRouter, Request
from sqlalchemy import text

from cityguide_backend.application.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    database_status = "ok"
    redis_status = "ok"
    try:
        async with request.app.state.session_factory() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        database_status = "degraded"
    try:
        await request.app.state.cache.ping()
    except Exception:
        redis_status = "degraded"
    external_services = {
        "2gis": "configured" if request.app.state.settings.twogis_api_key else "missing_api_key",
        "gemini": "configured" if request.app.state.settings.gemini_api_key else "missing_api_key",
    }
    status = "ok" if database_status == "ok" and redis_status == "ok" else "degraded"
    return HealthResponse(
        status=status,
        database=database_status,
        redis=redis_status,
        external_services=external_services,
    )
