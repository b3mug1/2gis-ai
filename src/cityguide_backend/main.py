from __future__ import annotations

from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from cityguide_backend.api.routes.auth import router as auth_router
from cityguide_backend.api.routes.favorites import router as favorites_router
from cityguide_backend.api.routes.health import router as health_router
from cityguide_backend.api.routes.history import router as history_router
from cityguide_backend.api.routes.me import router as me_router
from cityguide_backend.api.routes.search import router as search_router
from cityguide_backend.api.routes.statistics import router as statistics_router
from cityguide_backend.application.background.jobs import BackgroundJobRunner
from cityguide_backend.core.config import Settings, get_settings
from cityguide_backend.core.exceptions import AppError, ValidationAppError
from cityguide_backend.core.logging import configure_logging
from cityguide_backend.core.rate_limiter import RateLimitMiddleware
from cityguide_backend.core.security import hash_password
from cityguide_backend.infrastructure.cache.redis import RedisCache
from cityguide_backend.infrastructure.db.session import create_engine, create_session_factory, init_models
from cityguide_backend.infrastructure.external.gemini import GeminiAIClient
from cityguide_backend.infrastructure.external.twogis import TwoGISClientHTTP
from cityguide_backend.infrastructure.repositories import SqlAlchemyUserRepository


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings: Settings = app.state.settings
    configure_logging(settings.log_level)
    app.state.engine = create_engine(settings)
    app.state.session_factory = create_session_factory(app.state.engine)
    app.state.http_client = httpx.AsyncClient(headers={"User-Agent": settings.app_name})
    app.state.cache = RedisCache.from_url(settings.redis_url)
    app.state.gemini_client = GeminiAIClient(settings)
    app.state.twogis_client = TwoGISClientHTTP(app.state.http_client, settings)
    app.state.background_jobs = BackgroundJobRunner(app.state.session_factory, app.state.cache)
    if settings.app_env in {"local", "test"}:
        await init_models(app.state.engine)
    async with app.state.session_factory() as session:
        user_repo = SqlAlchemyUserRepository(session)
        existing = await user_repo.get_by_email(settings.admin_email)
        if existing is None:
            await user_repo.create(email=settings.admin_email, password_hash=hash_password(settings.admin_password), full_name="System Admin", role="admin")
            await session.commit()
    await app.state.background_jobs.start()
    yield
    await app.state.background_jobs.stop()
    await app.state.cache.close()
    await app.state.http_client.aclose()
    await app.state.engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
    app.state.settings = settings
    allowed_origins = [origin.strip() for origin in settings.frontend_origins.split(",") if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def add_rate_limit(request: Request, call_next):
        if not hasattr(app.state, "cache"):
            return await call_next(request)
        middleware = RateLimitMiddleware(app, app.state.cache, settings)
        return await middleware.dispatch(request, call_next)

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(status_code=exc.status_code, content={"error": exc.error_code, "message": exc.message})

    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(status_code=422, content={"error": ValidationAppError.error_code, "message": "Validation failed", "details": exc.errors()})

    @app.exception_handler(Exception)
    async def unexpected_handler(request: Request, exc: Exception):
        return JSONResponse(status_code=500, content={"error": "internal_server_error", "message": "An unexpected error occurred"})

    app.include_router(auth_router)
    app.include_router(search_router)
    app.include_router(history_router)
    app.include_router(favorites_router)
    app.include_router(statistics_router)
    app.include_router(me_router)
    app.include_router(health_router)
    return app


app = create_app()


def main() -> None:
    import uvicorn

    settings = get_settings()
    uvicorn.run("cityguide_backend.main:app", host=settings.app_host, port=settings.app_port, reload=settings.app_env == "local")
