from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AI City Guide"
    app_env: str = "local"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    log_level: str = "INFO"
    frontend_origins: str = Field("http://localhost:7000,http://127.0.0.1:7000", alias="FRONTEND_ORIGINS")

    database_url: str = Field("postgresql+asyncpg://cityguide:cityguide@localhost:5432/cityguide", alias="DATABASE_URL")
    redis_url: str = Field("redis://localhost:6379/0", alias="REDIS_URL")

    jwt_secret_key: str = Field("change-me-in-production", alias="JWT_SECRET_KEY")
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 30

    gemini_api_key: str = Field("", alias="GEMINI_API_KEY")
    gemini_model: str = Field("gemini-1.5-flash", alias="GEMINI_MODEL")

    twogis_api_key: str = Field("", alias="TWOGIS_API_KEY")
    twogis_base_url: str = "https://catalog.api.2gis.com"
    twogis_timeout_seconds: float = 10.0

    search_cache_ttl_seconds: int = 900
    session_cache_ttl_seconds: int = 86400
    rate_limit_requests: int = 60
    rate_limit_window_seconds: int = 60
    search_max_candidates: int = 8
    admin_email: str = "admin@cityguide.com"
    admin_password: str = "ChangeMe123!"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
