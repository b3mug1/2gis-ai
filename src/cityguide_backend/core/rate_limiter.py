from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from cityguide_backend.core.config import Settings
from cityguide_backend.core.exceptions import RateLimitError
from cityguide_backend.infrastructure.cache.redis import RedisCache

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, cache: RedisCache, settings: Settings) -> None:
        super().__init__(app)
        self._cache = cache
        self._settings = settings

    async def dispatch(self, request: Request, call_next):
        scope = request.url.path
        if scope in {"/health", "/docs", "/openapi.json"}:
            return await call_next(request)
        client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "anonymous")
        key = f"rate:{client_ip}:{scope}"
        current = await self._cache.incr_window(key, self._settings.rate_limit_window_seconds)
        if current > self._settings.rate_limit_requests:
            return JSONResponse(status_code=RateLimitError.status_code, content={"error": RateLimitError.error_code, "message": "Too many requests"})
        return await call_next(request)
