from __future__ import annotations

from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from cityguide_backend.core.config import Settings
from cityguide_backend.core.exceptions import ExternalServiceError
from cityguide_backend.domain.entities import Coordinates, PlaceCandidate, PlaceReview, SearchIntent

# Default to Astana city center when no coordinates are provided
_ASTANA_DEFAULT_POINT = "71.4460,51.1801"
_ASTANA_DEFAULT_RADIUS = 5000

# Map LLM-generated sort values → valid 2GIS catalog sort values
_SORT_MAP: dict[str, str] = {
    "best_match": "relevance",
    "rating": "rating",
    "distance": "distance",
    "relevance": "relevance",
    "name": "name",
    "flamp_rating": "flamp_rating",
}

class TwoGISClientHTTP:
    def __init__(self, client: httpx.AsyncClient, settings: Settings) -> None:
        self._client = client
        self._settings = settings

    def _headers(self) -> dict[str, str]:
        # 2GIS Catalog API uses 'key' query param, not Bearer auth
        return {}

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=3),
        retry=retry_if_exception_type((httpx.HTTPError, ExternalServiceError)),
    )
    async def _request_json(self, path: str, params: dict[str, Any]) -> dict[str, Any]:
        # Always inject API key as query param (2GIS Catalog API requirement)
        if self._settings.twogis_api_key:
            params = {**params, "key": self._settings.twogis_api_key}
        try:
            response = await self._client.get(
                f"{self._settings.twogis_base_url.rstrip('/')}/{path.lstrip('/')}",
                params=params,
                timeout=self._settings.twogis_timeout_seconds,
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as exc:
            raise ExternalServiceError(f"2GIS request failed: {exc}") from exc

    async def search_places(self, intent: SearchIntent) -> list[PlaceCandidate]:
        sort_value = _SORT_MAP.get(intent.sort_by, "relevance")
        query_text = self._clean_query(intent.query)

        # Only use cuisine if query_text is empty
        if not query_text and intent.cuisine:
            query_text = self._clean_query(intent.cuisine)

        params: dict[str, Any] = {
            "q": query_text,
            "page_size": min(10, max(1, self._settings.search_max_candidates)),
            "sort": sort_value,
            "fields": "items.point,items.rubrics,items.schedule,items.reviews,items.address,items.full_name,items.photos",
        }
        if intent.coordinates:
            params["point"] = f"{intent.coordinates.longitude},{intent.coordinates.latitude}"
            params["radius"] = intent.radius_m
        else:
            # Default to Astana city center so bare queries return results
            params["point"] = _ASTANA_DEFAULT_POINT
            params["radius"] = _ASTANA_DEFAULT_RADIUS

        # 2GIS API 'type' parameter accepts 'branch', 'building', 'adm_div', 'street', etc.
        if intent.place_type and intent.place_type in {
            "branch",
            "building",
            "adm_div",
            "street",
            "station",
            "attraction",
        }:
            params["type"] = intent.place_type

        payload = await self._request_json("3.0/items", params)
        items = payload.get("result", {}).get("items", []) or payload.get("items", [])
        return [self._item_to_candidate(item) for item in items]

    # Map of common Russian transliterations / typos → canonical search terms
    _TRANSLITERATION_MAP: dict[str, str] = {
        # Venues / exhibition
        "экспо": "expo",
        "ekspo": "expo",
        "экспа": "expo",
        # Food / restaurants
        "суши": "суши",
        "суши": "суши",
        "сушы": "суши",
        "роллы": "роллы",
        "ролы": "роллы",
        "ролл": "роллы",
        "пицца": "пицца",
        "пица": "пицца",
        "pitsa": "пицца",
        "pitssa": "пицца",
        "бургер": "бургер",
        "burgер": "бургер",
        "борger": "бургер",
        "хинкали": "хинкали",
        "хинкале": "хинкали",
        "шаурма": "шаурма",
        "шаурмa": "шаурма",
        "шаурмя": "шаурма",
        "shawarma": "шаурма",
        "лагман": "лагман",
        "ламан": "лагман",
        "плов": "плов",
        "плоф": "плов",
        "манты": "манты",
        "манты": "манты",
        "самса": "самса",
        "самсa": "самса",
        "кофе": "кофе",
        "кафе": "кафе",
        "кофейня": "кофейня",
        "ресторан": "ресторан",
        "рестаран": "ресторан",
        "рестаурант": "ресторан",
        # Entertainment / services
        "кинотеатр": "кинотеатр",
        "кино": "кинотеатр",
        "кинатеатр": "кинотеатр",
        "парикмахер": "парикмахерская",
        "парикмахерскяа": "парикмахерская",
        "аптека": "аптека",
        "аптека": "аптека",
        "больница": "больница",
        "болница": "больница",
        "гостиница": "гостиница",
        "гастиница": "гостиница",
        "отель": "отель",
        "банк": "банк",
        "банкомат": "банкомат",
        "супермаркет": "супермаркет",
        "супермаркет": "супермаркет",
        "магазин": "магазин",
        "магaзин": "магазин",
        "парк": "парк",
        "паркинг": "парковка",
        "фитнес": "фитнес",
        "спортзал": "фитнес",
        "салон": "салон красоты",
    }

    def _normalize_transliterations(self, query: str) -> str:
        """Replace known transliterations/typos word-by-word."""
        words = query.split()
        normalized = []
        for word in words:
            key = word.lower().strip(".,!?\"'")
            replacement = self._TRANSLITERATION_MAP.get(key)
            normalized.append(replacement if replacement else word)
        return " ".join(normalized)

    def _clean_query(self, query: str) -> str:
        # First normalize known transliterations
        query = self._normalize_transliterations(query)
        stop_words = {
            "best",
            "top",
            "good",
            "cheap",
            "near",
            "under",
            "kzt",
            "₸",
            "tenge",
            "самый",
            "самые",
            "лучший",
            "лучшие",
            "хороший",
            "дешевый",
            "дешевые",
            "недорогой",
            "возле",
            "около",
            "рядом",
            "до",
            "тенге",
            "рублей",
            "руб",
            "в",
            "in",
            "near",
        }
        words = [w for w in query.split() if w.lower().strip(".,!?\"'") not in stop_words]
        cleaned = " ".join(words).strip()
        return cleaned if cleaned else query

    async def geocode_location(self, location_text: str) -> Coordinates | None:
        if not location_text or not location_text.strip():
            return None
        try:
            # For short single-word location names (e.g. "аэропорт"), append city context to improve accuracy
            query_text = location_text.strip()
            if (
                len(query_text.split()) <= 2
                and "астана" not in query_text.lower()
                and "нур-султан" not in query_text.lower()
            ):
                query_text = f"{query_text} Астана"

            params: dict[str, Any] = {
                "q": query_text,
                "page_size": 1,
                "fields": "items.point",
                # Search near Astana default point to bias results toward the city
                "point": _ASTANA_DEFAULT_POINT,
                "radius": 50000,
            }
            payload = await self._request_json("3.0/items", params)
            items = payload.get("result", {}).get("items", []) or payload.get("items", [])
            if not items:
                # Retry without the city context if no results
                params2: dict[str, Any] = {
                    "q": location_text.strip(),
                    "page_size": 1,
                    "fields": "items.point",
                }
                payload = await self._request_json("3.0/items", params2)
                items = payload.get("result", {}).get("items", []) or payload.get("items", [])
            if not items:
                return None
            point = items[0].get("point") or {}
            lat = self._as_float(point.get("lat") if isinstance(point, dict) else None)
            lon = self._as_float(point.get("lon") if isinstance(point, dict) else None)
            if lat is None and isinstance(point, dict):
                lat = self._as_float(point.get("latitude"))
            if lon is None and isinstance(point, dict):
                lon = self._as_float(point.get("longitude"))
            if lat is not None and lon is not None:
                return Coordinates(latitude=lat, longitude=lon)
        except Exception:
            pass
        return None

    async def get_reviews(self, place_id: str) -> list[PlaceReview]:
        payload = await self._request_json(f"3.0/items/{place_id}/reviews", params={})
        items = payload.get("result", {}).get("items", []) or payload.get("items", [])
        reviews: list[PlaceReview] = []
        for item in items:
            reviews.append(
                PlaceReview(
                    author=item.get("author", {}).get("name")
                    if isinstance(item.get("author"), dict)
                    else item.get("author"),
                    rating=self._as_float(item.get("rating")),
                    text=str(item.get("text") or item.get("comment") or "").strip(),
                )
            )
        return reviews

    def _item_to_candidate(self, item: dict[str, Any]) -> PlaceCandidate:
        point = item.get("point") or item.get("geometry", {}).get("coordinates", {})
        latitude = self._as_float(point.get("lat") if isinstance(point, dict) else None)
        longitude = self._as_float(point.get("lon") if isinstance(point, dict) else None)
        if latitude is None and isinstance(point, dict):
            latitude = self._as_float(point.get("latitude"))
        if longitude is None and isinstance(point, dict):
            longitude = self._as_float(point.get("longitude"))

        reviews_data = item.get("reviews") if isinstance(item.get("reviews"), dict) else {}
        rating = self._as_float(reviews_data.get("general_rating"))
        if rating is None:
            rating = self._as_float(item.get("rating"))

        reviews_count = self._as_int(reviews_data.get("general_review_count"))
        if reviews_count is None:
            reviews_count = self._as_int(item.get("review_count") or item.get("reviews_count"))

        photos = self._photos(item)
        return PlaceCandidate(
            place_id=str(item.get("id") or item.get("uid") or item.get("external_id") or ""),
            name=str(item.get("name") or item.get("title") or "Unnamed place"),
            address=self._address(item),
            rating=rating,
            reviews_count=reviews_count,
            distance_m=self._as_int(item.get("distance")),
            latitude=latitude,
            longitude=longitude,
            categories=self._categories(item),
            price_category=self._price_category(item),
            opening_hours=self._opening_hours(item),
            phone=self._phone(item),
            url=item.get("url")
            or item.get("link")
            or (f"https://2gis.kz/firm/{item.get('id')}" if item.get("id") else None),
            is_open_now=self._is_open_now(item),
            has_parking=self._has_parking(item),
            photos=photos,
            raw=item,
        )

    async def suggest(self, query: str, limit: int = 5) -> list[str]:
        """Return autocomplete suggestions for a partial query."""
        if not query or not query.strip():
            return []
        try:
            params: dict[str, Any] = {
                "q": query.strip(),
                "page_size": limit,
                "fields": "items.full_name",
                "point": _ASTANA_DEFAULT_POINT,
                "radius": _ASTANA_DEFAULT_RADIUS,
            }
            payload = await self._request_json("3.0/items", params)
            items = payload.get("result", {}).get("items", []) or payload.get("items", [])
            seen: set[str] = set()
            suggestions: list[str] = []
            for item in items:
                name = str(item.get("name") or item.get("full_name") or "").strip()
                if name and name not in seen:
                    seen.add(name)
                    suggestions.append(name)
            return suggestions[:limit]
        except Exception:
            return []

    async def get_popular(self, limit: int = 6) -> list[PlaceCandidate]:
        """Return popular places in Astana by rating."""
        try:
            params: dict[str, Any] = {
                "q": "кафе ресторан",
                "page_size": limit,
                "sort": "rating",
                "fields": "items.point,items.rubrics,items.schedule,items.reviews,items.address,items.full_name,items.photos",
                "point": _ASTANA_DEFAULT_POINT,
                "radius": _ASTANA_DEFAULT_RADIUS,
            }
            payload = await self._request_json("3.0/items", params)
            items = payload.get("result", {}).get("items", []) or payload.get("items", [])
            return [self._item_to_candidate(item) for item in items]
        except Exception:
            return []

    def _address(self, item: dict[str, Any]) -> str | None:
        if item.get("address_name") and isinstance(item["address_name"], str):
            return item["address_name"]
        if item.get("full_name") and isinstance(item["full_name"], str):
            return item["full_name"]
        address = item.get("address") or item.get("full_address")
        if isinstance(address, str):
            return address
        if isinstance(address, dict):
            if address.get("address_name"):
                return str(address["address_name"])
            components = address.get("components")
            if isinstance(components, list):
                parts = []
                for c in components:
                    if isinstance(c, dict):
                        street = c.get("street")
                        number = c.get("number")
                        if street and number:
                            parts.append(f"{street}, {number}")
                        elif street:
                            parts.append(str(street))
                if parts:
                    return ", ".join(parts)
            return address.get("formatted_address") or address.get("name")
        return None

    def _categories(self, item: dict[str, Any]) -> list[str]:
        categories = item.get("rubrics") or item.get("categories") or []
        output: list[str] = []
        for category in categories:
            if isinstance(category, dict):
                output.append(str(category.get("name") or category.get("title") or "").strip())
            else:
                output.append(str(category))
        return [category for category in output if category]

    def _price_category(self, item: dict[str, Any]) -> str | None:
        value = item.get("price_level") or item.get("price_category")
        return None if value is None else str(value)

    def _photos(self, item: dict[str, Any]) -> list[str]:
        """Extract photo URLs from 2GIS item."""
        photos_data = item.get("photos") or item.get("photo_preview") or []
        urls: list[str] = []
        if isinstance(photos_data, list):
            for photo in photos_data[:6]:  # max 6 photos per place
                if isinstance(photo, dict):
                    url = photo.get("url") or photo.get("uri") or photo.get("preview_url")
                    if url:
                        urls.append(str(url))
                elif isinstance(photo, str) and photo.startswith("http"):
                    urls.append(photo)
        return urls

    def _opening_hours(self, item: dict[str, Any]) -> str | None:
        hours = item.get("working_hours") or item.get("opening_hours")
        if isinstance(hours, dict):
            return hours.get("text") or hours.get("working_hours_text")
        return None if hours is None else str(hours)

    def _phone(self, item: dict[str, Any]) -> str | None:
        phones = item.get("phones") or []
        if phones and isinstance(phones, list):
            first = phones[0]
            if isinstance(first, dict):
                return first.get("number") or first.get("formatted")
            return str(first)
        return item.get("phone")

    def _is_open_now(self, item: dict[str, Any]) -> bool | None:
        value = item.get("is_open_now") or item.get("isOpenNow")
        if value is None:
            return None
        return bool(value)

    def _has_parking(self, item: dict[str, Any]) -> bool | None:
        value = item.get("has_parking") or item.get("parking")
        if value is None:
            return None
        return bool(value)

    def _as_float(self, value: Any) -> float | None:
        try:
            return None if value is None else float(value)
        except (TypeError, ValueError):
            return None

    def _as_int(self, value: Any) -> int | None:
        try:
            return None if value is None else int(value)
        except (TypeError, ValueError):
            return None
