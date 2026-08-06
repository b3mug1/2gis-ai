from __future__ import annotations

import json
from typing import Any

from google import genai
from google.genai import types

from cityguide_backend.core.config import Settings
from cityguide_backend.core.exceptions import ExternalServiceError, ValidationAppError
from cityguide_backend.domain.entities import Coordinates, PlaceCandidate, ReviewSummary, SearchIntent


class GeminiAIClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = genai.Client(api_key=settings.gemini_api_key)

    async def extract_intent(self, query: str, *, user_location: Coordinates | None = None) -> SearchIntent:
        loc = None if user_location is None else {"lat": user_location.latitude, "lon": user_location.longitude}
        prompt = (
            f'Extract search intent from this query and return JSON only.\n'
            f'Query: "{query}"\n'
            f'User location: {loc}\n'
            f'CRITICAL INSTRUCTIONS FOR "query" FIELD:\n'
            f'- The "query" field MUST contain ONLY the target search keywords in Russian or English suitable for map catalog search (e.g. "суши" for "best sushi near...", "пицца" for "cheap pizza").\n'
            f'- NEVER include subjective adjectives ("best", "good", "cheap", "top"), price amounts, distance/location phrases ("near...", "under 10000") in the "query" field!\n'
            f'- "cuisine": e.g. "sushi", "japanese", "italian", "burger", or null.\n'
            f'- "place_type": e.g. "restaurant", "cafe", "bar", "fast_food", or null.\n'
            f'Return JSON with these fields (use null for unknown):\n'
            f'{{"query":"","location_text":null,"coordinates":null,"radius_m":2000,"budget_kzt":null,'
            f'"party_size":1,"cuisine":null,"place_type":null,"amenities":[],"mood":null,'
            f'"sort_by":"relevance","open_now":false,"min_rating":0,"price_category":null,'
            f'"requires_parking":false,"requires_quiet":false,"laptop_friendly":false,"romantic":false}}'
        )
        data = await self._generate_json(prompt, operation="intent_extraction")
        coordinates = None
        if isinstance(data.get("coordinates"), dict):
            lat = data["coordinates"].get("latitude") or data["coordinates"].get("lat")
            lon = data["coordinates"].get("longitude") or data["coordinates"].get("lon")
            if lat is not None and lon is not None:
                coordinates = Coordinates(latitude=float(lat), longitude=float(lon))
        extracted_query = str(data.get("query") or "").strip() or query
        return SearchIntent(
            query=extracted_query,
            location_text=data.get("location_text"),
            coordinates=coordinates,
            radius_m=int(data.get("radius_m") or 2000),
            budget_kzt=self._as_int(data.get("budget_kzt")),
            party_size=max(1, int(data.get("party_size") or 1)),
            cuisine=data.get("cuisine"),
            place_type=data.get("place_type"),
            amenities=[str(item) for item in data.get("amenities", []) if item],
            mood=data.get("mood"),
            sort_by=str(data.get("sort_by") or "relevance"),
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
        
        # Build rich intent context for Gemini
        user_wants = intent.query
        details = []
        if intent.romantic or (intent.mood and "romantic" in intent.mood.lower()):
            details.append("romantic atmosphere for a date")
        if intent.party_size and intent.party_size > 1:
            details.append(f"party size: {intent.party_size} people")
        if intent.budget_kzt:
            details.append(f"budget under {intent.budget_kzt} KZT")
        if intent.cuisine:
            details.append(f"cuisine: {intent.cuisine}")
        
        req_summary = f"{user_wants} ({', '.join(details)})" if details else user_wants
        
        prompt = (
            f'Analyze business "{place.name}" for user request: "{req_summary}".\n'
            f'Business Info:\n'
            f'- Rating: {place.rating or "N/A"}/5 ({place.reviews_count or 0} reviews)\n'
            f'- Categories: {", ".join(place.categories) if place.categories else "N/A"}\n'
            f'- Address: {place.address or "N/A"}\n'
            f'- Opening Hours: {place.opening_hours or "N/A"}\n'
            f'Sample Reviews: {json.dumps(top_reviews, ensure_ascii=False)}\n\n'
            f'CRITICAL INSTRUCTIONS:\n'
            f'1. "reason": Write a helpful, specific, natural 1-2 sentence recommendation in Russian or English (matching user language) explaining WHY this place fits "{req_summary}". Mention atmosphere, food style, rating, or date/group suitability. NEVER write dry lazy tautologies like "The name says restaurant".\n'
            f'2. "pros": 2-3 specific positive highlights.\n'
            f'3. "cons": 1-2 notes or drawbacks.\n'
            f'4. "confidence": Float 0.0 to 1.0. Set to 0.0 if this business is NOT a food/dining venue when user wants dining, or if it is synthetic/invalid.\n'
            f'5. "sentiment_score": Float -1.0 to 1.0.\n'
            f'6. JSON FORMATTING: Do NOT use inner double quotes inside JSON string values. Use single quotes (\') or guillemets («») for names inside text.\n\n'
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

    async def _generate_json(self, prompt: str, *, operation: str) -> dict[str, Any]:
        try:
            response = self._client.models.generate_content(
                model=self._settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                    max_output_tokens=1024,
                ),
            )
            raw_text = (response.text or "").strip()
        except Exception as exc:
            raise ExternalServiceError(f"Gemini {operation} request failed: {exc}") from exc

        if not raw_text:
            raise ExternalServiceError("Gemini returned an empty response")

        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            pass

        import re
        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if match:
            candidate = match.group()
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                # Try replacing unescaped inner quotes inside Russian strings
                sanitized = re.sub(r'(?<=\w)"(?=\w)', "'", candidate)
                try:
                    return json.loads(sanitized)
                except json.JSONDecodeError:
                    pass

        raise ValidationAppError(f"Gemini returned invalid JSON: {raw_text[:200]}")

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
