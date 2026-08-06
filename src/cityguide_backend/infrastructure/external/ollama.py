from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from cityguide_backend.core.config import Settings
from cityguide_backend.core.exceptions import ExternalServiceError, ValidationAppError
from cityguide_backend.domain.entities import Coordinates, PlaceCandidate, ReviewSummary, SearchIntent


class OllamaAIClient:
    def __init__(self, client: httpx.AsyncClient, settings: Settings) -> None:
        self._client = client
        self._settings = settings

    @retry(reraise=True, stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=3), retry=retry_if_exception_type((httpx.HTTPError, ExternalServiceError)))
    async def _generate_json(self, prompt: str, *, operation: str) -> dict[str, Any]:
        url = f"{self._settings.ollama_base_url}/api/generate"
        payload = {
            "model": self._settings.ollama_model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.1,
                "num_predict": 512,
                "num_ctx": 2048,
            }
        }
        try:
            response = await self._client.post(url, json=payload, timeout=180)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise ExternalServiceError(f"Ollama {operation} request failed: {exc}") from exc
            
        body = response.json()
        raw_text = body.get("response", "").strip()

        if not raw_text:
            raise ExternalServiceError("Ollama returned an empty response")

        # qwen3 and similar "thinking" models prepend <think>...</think> blocks.
        # Strip them to extract only the final answer.
        import re
        text = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL).strip()

        # If nothing left after stripping, try the raw text
        if not text:
            text = raw_text

        # Try to parse the entire text as JSON first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Fallback: find the first JSON object in the text
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        raise ValidationAppError(f"Ollama returned invalid JSON: {text[:200]}")

    async def extract_intent(self, query: str, *, user_location: Coordinates | None = None) -> SearchIntent:
        loc = None if user_location is None else {"lat": user_location.latitude, "lon": user_location.longitude}
        prompt = (
            f'Extract search intent from this query and return JSON only.\n'
            f'Query: "{query}"\n'
            f'User location: {loc}\n'
            f'Return JSON with these fields (use null for unknown):\n'
            f'{{"query":"","location_text":null,"coordinates":null,"radius_m":2000,"budget_kzt":null,'
            f'"party_size":1,"cuisine":null,"place_type":null,"amenities":[],"mood":null,'
            f'"sort_by":"best_match","open_now":false,"min_rating":0,"price_category":null,'
            f'"requires_parking":false,"requires_quiet":false,"laptop_friendly":false,"romantic":false}}'
        )
        data = await self._generate_json(prompt, operation="intent_extraction")
        coordinates = None
        if isinstance(data.get("coordinates"), dict) and data["coordinates"].get("latitude") is not None and data["coordinates"].get("longitude") is not None:
            coordinates = Coordinates(latitude=float(data["coordinates"]["latitude"]), longitude=float(data["coordinates"]["longitude"]))
        return SearchIntent(
            query=query,
            location_text=data.get("location_text"),
            coordinates=coordinates,
            radius_m=int(data.get("radius_m") or 2000),
            budget_kzt=self._as_int(data.get("budget_kzt")),
            party_size=max(1, int(data.get("party_size") or 1)),
            cuisine=data.get("cuisine"),
            place_type=data.get("place_type"),
            amenities=[str(item) for item in data.get("amenities", []) if item],
            mood=data.get("mood"),
            sort_by=str(data.get("sort_by") or "best_match"),
            open_now=bool(data.get("open_now") or False),
            min_rating=float(data.get("min_rating") or 0),
            price_category=data.get("price_category"),
            requires_parking=bool(data.get("requires_parking") or False),
            requires_quiet=bool(data.get("requires_quiet") or False),
            laptop_friendly=bool(data.get("laptop_friendly") or False),
            romantic=bool(data.get("romantic") or False),
        )

    async def summarize_reviews(self, intent: SearchIntent, place: PlaceCandidate) -> ReviewSummary:
        top_reviews = [{"r": rv.rating, "t": rv.text[:200] if rv.text else ""} for rv in place.reviews[:3]]
        prompt = (
            f'Summarize reviews for "{place.name}" (user wants: "{intent.query}"). '
            f'Reviews: {json.dumps(top_reviews, ensure_ascii=False)}. '
            f'Return JSON only: {{"summary":"","pros":[],"cons":[],"reason":"","confidence":0.8,"sentiment_score":0.5}}'
        )
        data = await self._generate_json(prompt, operation="review_summarization")
        return ReviewSummary(
            summary=str(data.get("summary") or ""),
            pros=[str(item) for item in data.get("pros", []) if item],
            cons=[str(item) for item in data.get("cons", []) if item],
            reason=str(data.get("reason") or ""),
            confidence=self._bounded_float(data.get("confidence"), 0.0, 1.0),
            sentiment_score=self._bounded_float(data.get("sentiment_score"), -1.0, 1.0),
        )

    def _intent_payload(self, intent: SearchIntent) -> dict[str, Any]:
        return {
            "query": intent.query,
            "location_text": intent.location_text,
            "coordinates": None if intent.coordinates is None else {"latitude": intent.coordinates.latitude, "longitude": intent.coordinates.longitude},
            "radius_m": intent.radius_m,
            "budget_kzt": intent.budget_kzt,
            "party_size": intent.party_size,
            "cuisine": intent.cuisine,
            "place_type": intent.place_type,
            "amenities": intent.amenities,
            "mood": intent.mood,
            "sort_by": intent.sort_by,
            "open_now": intent.open_now,
            "min_rating": intent.min_rating,
            "price_category": intent.price_category,
            "requires_parking": intent.requires_parking,
            "requires_quiet": intent.requires_quiet,
            "laptop_friendly": intent.laptop_friendly,
            "romantic": intent.romantic,
        }

    def _place_payload(self, place: PlaceCandidate) -> dict[str, Any]:
        return {
            "place_id": place.place_id,
            "name": place.name,
            "address": place.address,
            "rating": place.rating,
            "reviews_count": place.reviews_count,
            "distance_m": place.distance_m,
            "latitude": place.latitude,
            "longitude": place.longitude,
            "categories": place.categories,
            "price_category": place.price_category,
            "opening_hours": place.opening_hours,
            "phone": place.phone,
            "url": place.url,
            "is_open_now": place.is_open_now,
            "has_parking": place.has_parking,
        }

    def _as_int(self, value: Any) -> int | None:
        try:
            return None if value is None else int(value)
        except (TypeError, ValueError):
            return None

    def _bounded_float(self, value: Any, lower: float, upper: float) -> float:
        try:
            number = float(value)
        except (TypeError, ValueError):
            number = lower
        return max(lower, min(upper, number))
