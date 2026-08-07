from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class CoordinatesSchema(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not any(char.isdigit() for char in value) or not any(char.isalpha() for char in value):
            raise ValueError("password must contain letters and digits")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class AuthResponse(BaseModel):
    user: "UserResponse"
    tokens: AuthTokens


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str
    role: str
    is_active: bool


class SearchRequest(BaseModel):
    query: str = Field(min_length=3, max_length=1000)
    coordinates: CoordinatesSchema | None = None
    locale: str = Field(default="en")

    @field_validator("query")
    @classmethod
    def trim_query(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("query must not be empty")
        return normalized


class SearchIntentSchema(BaseModel):
    query: str
    location_text: str | None = None
    coordinates: CoordinatesSchema | None = None
    radius_m: int = Field(default=2000, ge=100, le=10000)
    budget_kzt: int | None = Field(default=None, ge=0, le=1000000)
    party_size: int = Field(default=1, ge=1, le=50)
    cuisine: str | None = None
    place_type: str | None = None
    amenities: list[str] = Field(default_factory=list)
    mood: str | None = None
    sort_by: str = "best_match"
    open_now: bool = False
    min_rating: float = Field(default=0, ge=0, le=5)
    price_category: str | None = None
    requires_parking: bool = False
    requires_quiet: bool = False
    laptop_friendly: bool = False
    romantic: bool = False


class ReviewSummarySchema(BaseModel):
    summary: str
    pros: list[str] = Field(default_factory=list)
    cons: list[str] = Field(default_factory=list)
    reason: str
    confidence: float = Field(ge=0, le=1)
    sentiment_score: float = Field(ge=-1, le=1)


class PlaceRecommendationSchema(BaseModel):
    place_id: str
    name: str
    rating: float | None
    walking_time: int | None
    pros: list[str]
    cons: list[str]
    reason: str
    confidence: float = Field(ge=0, le=1)
    score: float
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    categories: list[str] = Field(default_factory=list)
    distance_m: int | None = None
    price_category: str | None = None
    opening_hours: str | None = None
    phone: str | None = None
    url: str | None = None
    photos: list[str] = Field(default_factory=list)


class SuggestResponse(BaseModel):
    suggestions: list[str]


class PopularResponse(BaseModel):
    places: list[PlaceRecommendationSchema]



class SearchResponse(BaseModel):
    recommendation: PlaceRecommendationSchema
    alternatives: list[PlaceRecommendationSchema] = Field(default_factory=list)
    intent: SearchIntentSchema
    source: str
    generated_at: datetime


class FavoriteCreateRequest(BaseModel):
    place_id: str = Field(min_length=1, max_length=128)
    place_name: str = Field(min_length=1, max_length=255)
    payload: dict[str, Any]
    note: str | None = Field(default=None, max_length=500)


class FavoriteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    place_id: str
    place_name: str
    payload: dict[str, Any]
    note: str | None
    created_at: datetime


class SearchHistoryResponse(BaseModel):
    id: UUID
    query: str
    intent: dict[str, Any]
    result: dict[str, Any]
    created_at: datetime


class SearchStatisticsResponse(BaseModel):
    stat_date: datetime
    user_id: UUID | None
    total_searches: int
    successful_searches: int


class HealthResponse(BaseModel):
    status: str
    database: str
    redis: str
    external_services: dict[str, str]


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    error: str
    message: str
    details: dict[str, Any] | None = None


AuthResponse.model_rebuild()
