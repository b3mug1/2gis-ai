from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID


class UserRole(str, Enum):
    user = "user"
    admin = "admin"


@dataclass(slots=True)
class Coordinates:
    latitude: float
    longitude: float


@dataclass(slots=True)
class SearchIntent:
    query: str
    location_text: str | None = None
    coordinates: Coordinates | None = None
    radius_m: int = 2000
    budget_kzt: int | None = None
    party_size: int = 1
    cuisine: str | None = None
    place_type: str | None = None
    amenities: list[str] = field(default_factory=list)
    mood: str | None = None
    sort_by: str = "best_match"
    open_now: bool = False
    min_rating: float = 0.0
    price_category: str | None = None
    requires_parking: bool = False
    requires_quiet: bool = False
    laptop_friendly: bool = False
    romantic: bool = False
    travel_mode: str | None = None
    max_travel_time_min: int | None = None


@dataclass(slots=True)
class PlaceReview:
    author: str | None
    rating: float | None
    text: str
    published_at: datetime | None = None


@dataclass(slots=True)
class PlaceCandidate:
    place_id: str
    name: str
    address: str | None = None
    rating: float | None = None
    reviews_count: int | None = None
    distance_m: int | None = None
    latitude: float | None = None
    longitude: float | None = None
    categories: list[str] = field(default_factory=list)
    price_category: str | None = None
    opening_hours: str | None = None
    phone: str | None = None
    url: str | None = None
    is_open_now: bool | None = None
    has_parking: bool | None = None
    reviews: list[PlaceReview] = field(default_factory=list)
    photos: list[str] = field(default_factory=list)
    raw: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class ReviewSummary:
    summary: str
    pros: list[str]
    cons: list[str]
    reason: str
    confidence: float
    sentiment_score: float


@dataclass(slots=True)
class PlaceRecommendation:
    place_id: str
    name: str
    rating: float | None
    walking_time: int | None
    pros: list[str]
    cons: list[str]
    reason: str
    confidence: float
    score: float
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    categories: list[str] = field(default_factory=list)
    distance_m: int | None = None
    price_category: str | None = None
    opening_hours: str | None = None
    phone: str | None = None
    url: str | None = None
    photos: list[str] = field(default_factory=list)
    driving_time: int | None = None


@dataclass(slots=True)
class PlaceComparisonItem:
    place_id: str
    name: str
    best_for: str
    pros: list[str] = field(default_factory=list)
    cons: list[str] = field(default_factory=list)
    rating: float | None = None
    price_category: str | None = None
    address: str | None = None


@dataclass(slots=True)
class PlaceComparisonResult:
    verdict: str
    winner_place_id: str | None
    comparisons: list[PlaceComparisonItem]
    key_differences: list[str]



@dataclass(slots=True)
class SearchResult:
    recommendation: PlaceRecommendation
    alternatives: list[PlaceRecommendation]
    intent: SearchIntent
    source: str
    generated_at: datetime


@dataclass(slots=True)
class UserProfile:
    id: UUID
    email: str
    full_name: str
    role: UserRole
    is_active: bool = True
