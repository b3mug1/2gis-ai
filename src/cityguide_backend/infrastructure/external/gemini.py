from __future__ import annotations

import json
from typing import Any

from google import genai
from google.genai import types

from cityguide_backend.core.config import Settings
from cityguide_backend.core.exceptions import ExternalServiceError, ValidationAppError
from cityguide_backend.domain.entities import (
    Coordinates,
    PlaceCandidate,
    PlaceComparisonItem,
    PlaceComparisonResult,
    ReviewSummary,
    SearchIntent,
)


class GeminiAIClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = genai.Client(api_key=settings.gemini_api_key)

    async def compare_places(
        self,
        places: list[PlaceCandidate],
        *,
        user_query: str | None = None,
        locale: str = "ru",
    ) -> PlaceComparisonResult:
        target_language = self._target_language(locale)
        places_data = []
        for p in places:
            places_data.append(
                {
                    "place_id": p.place_id,
                    "name": p.name,
                    "rating": p.rating,
                    "address": p.address,
                    "categories": p.categories,
                    "price_category": p.price_category,
                    "sample_reviews": [rv.text[:150] for rv in p.reviews[:3] if rv.text],
                }
            )

        prompt = (
            f"Compare these places for the user request: '{user_query or 'General Comparison'}'\n"
            f"Target Language: {target_language}\n"
            f"Places:\n{json.dumps(places_data, ensure_ascii=False, indent=2)}\n\n"
            f"CRITICAL INSTRUCTIONS:\n"
            f"1. ALL text in the response MUST be written strictly in {target_language}.\n"
            f"2. Provide an insightful 2-3 sentence 'verdict' declaring which place is best suited and why.\n"
            f"3. Select 'winner_place_id' (one of the given place_ids).\n"
            f"4. For each place, provide a concise 'best_for' phrase (e.g. 'Ideal for romantic dates', 'Great for quick lunch'), 2 pros, 1 con.\n"
            f"5. Provide 2-3 'key_differences' bullet points comparing price, atmosphere, or audience.\n\n"
            f"Return JSON only:\n"
            f'{{\n'
            f'  "verdict": "",\n'
            f'  "winner_place_id": "",\n'
            f'  "comparisons": [\n'
            f'    {{\n'
            f'      "place_id": "",\n'
            f'      "name": "",\n'
            f'      "best_for": "",\n'
            f'      "pros": [],\n'
            f'      "cons": [],\n'
            f'      "rating": 4.5,\n'
            f'      "price_category": "mid",\n'
            f'      "address": ""\n'
            f'    }}\n'
            f'  ],\n'
            f'  "key_differences": []\n'
            f'}}\n'
        )

        try:
            data = await self._generate_json(prompt, operation="place_comparison")
            comp_items = []
            for item in data.get("comparisons", []):
                comp_items.append(
                    PlaceComparisonItem(
                        place_id=str(item.get("place_id") or ""),
                        name=str(item.get("name") or ""),
                        best_for=str(item.get("best_for") or ""),
                        pros=[str(x) for x in item.get("pros", []) if x],
                        cons=[str(x) for x in item.get("cons", []) if x],
                        rating=float(item["rating"]) if item.get("rating") is not None else None,
                        price_category=item.get("price_category"),
                        address=item.get("address"),
                    )
                )

            return PlaceComparisonResult(
                verdict=str(data.get("verdict") or "Сравнение мест выявило интересные различия."),
                winner_place_id=data.get("winner_place_id"),
                comparisons=comp_items,
                key_differences=[str(x) for x in data.get("key_differences", []) if x],
            )
        except Exception:
            # Fallback mock comparison if Gemini call fails
            comp_items = [
                PlaceComparisonItem(
                    place_id=p.place_id,
                    name=p.name,
                    best_for="Общие критерии поиска",
                    pros=["Хороший рейтинг" if p.rating and p.rating > 4.0 else "Удобное расположение"],
                    cons=["Заполняемость в пиковые часы"],
                    rating=p.rating,
                    price_category=p.price_category,
                    address=p.address,
                )
                for p in places
            ]
            return PlaceComparisonResult(
                verdict="Оба места заслуживают внимания. Выберите то, что находится ближе к вам.",
                winner_place_id=places[0].place_id if places else None,
                comparisons=comp_items,
                key_differences=["Различаются по расположению и атмосфере"],
            )

    async def extract_intent(
        self,
        query: str,
        *,
        user_location: Coordinates | None = None,
        locale: str = "en",
    ) -> SearchIntent:
        target_language = self._target_language(locale)
        loc = (
            None
            if user_location is None
            else {"lat": user_location.latitude, "lon": user_location.longitude}
        )
        prompt = (
            f"Extract search intent from this query and return JSON only.\n"
            f"Preferred user language: {target_language}\n"
            f'Query: "{query}"\n'
            f"User location: {loc}\n"
            f"IMPORTANT PRE-PROCESSING RULES:\n"
            f"- Users may write with typos, grammatical errors, or Russian transliterations of foreign words.\n"
            f"- Normalize and correct the query before extracting intent. Examples:\n"
            f'  * "экспо" or "ekspo" or "ekspo" -> "expo" or "EXPO" (venue/exhibition center)\n'
            f'  * "пицца" or "pitsa" -> "пицца"\n'
            f'  * "суши" or "sushi" -> "суши"\n'
            f'  * "кофейня" or "кафе" or "кофе" -> "кофейня"\n'
            f'  * "ресторан" or "рестаран" -> "ресторан"\n'
            f'  * "бургер" or "burger" -> "бургер"\n'
            f'  * "роллы" or "ролы" -> "роллы"\n'
            f'  * "хинкали" -> "хинкали"\n'
            f"  Recognize ANY Russian phonetic spelling of foreign brand/venue names and normalize them.\n"
            f'CRITICAL INSTRUCTIONS FOR "query" FIELD:\n'
            f'- The "query" field MUST contain ONLY the target search keywords in Russian or English suitable for map catalog search.\n'
            f'- NEVER include subjective adjectives, price amounts, or distance/location phrases in the "query" field.\n'
            f'- "cuisine": e.g. "sushi", "japanese", "italian", "burger", or null.\n'
            f'- "place_type": e.g. "restaurant", "cafe", "bar", "fast_food", or null.\n'
            f"Return JSON with these fields (use null for unknown):\n"
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

    async def summarize_reviews(
        self, intent: SearchIntent, place: PlaceCandidate, *, locale: str = "en"
    ) -> ReviewSummary:
        top_reviews = [
            {"r": rv.rating, "t": rv.text[:200] if rv.text else ""} for rv in place.reviews[:3]
        ]

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
        target_language = self._target_language(locale)

        prompt = (
            f'Analyze business "{place.name}" for user request: "{req_summary}".\n'
            f"Business Info:\n"
            f"- Rating: {place.rating or 'N/A'}/5 ({place.reviews_count or 0} reviews)\n"
            f"- Categories: {', '.join(place.categories) if place.categories else 'N/A'}\n"
            f"- Address: {place.address or 'N/A'}\n"
            f"- Opening Hours: {place.opening_hours or 'N/A'}\n"
            f"Sample Reviews: {json.dumps(top_reviews, ensure_ascii=False)}\n\n"
            f"CRITICAL INSTRUCTIONS:\n"
            f'1. LANGUAGE REQUIREMENT: ALL text fields ("reason", "summary", "pros", "cons") MUST BE WRITTEN STRICTLY IN {target_language}.\n'
            f'2. "reason": Write a helpful, specific, natural 1-2 sentence recommendation in {target_language} explaining WHY this place fits "{req_summary}". Mention atmosphere, food style, rating, or date/group suitability.\n'
            f'3. "pros": 2-3 specific positive highlights in {target_language}.\n'
            f'4. "cons": 1-2 notes or drawbacks in {target_language}.\n'
            f'5. "confidence": Float 0.0 to 1.0. Set to 0.0 if this business is NOT a food/dining venue when user wants dining, or if it is synthetic/invalid.\n'
            f'6. "sentiment_score": Float -1.0 to 1.0.\n'
            f"7. JSON FORMATTING: Keep strings concise. Do NOT use inner double quotes inside JSON string values.\n\n"
            f'Return JSON only: {{"summary":"","pros":[],"cons":[],"reason":"","confidence":0.8,"sentiment_score":0.5}}'
        )
        try:
            data = await self._generate_json(prompt, operation="review_summarization")
        except Exception:
            return ReviewSummary(
                summary=f'Place "{place.name}" matches your request.',
                pros=["Matches the main criteria", "Has basic catalog data"],
                cons=["AI review summary is temporarily unavailable"],
                reason=f'"{place.name}" looks like a reasonable match for the current request.',
                confidence=0.15,
                sentiment_score=0.0,
            )

        return ReviewSummary(
            summary=str(data.get("summary") or ""),
            pros=[str(item) for item in data.get("pros", []) if item],
            cons=[str(item) for item in data.get("cons", []) if item],
            reason=str(
                data.get("reason")
                or f'"{place.name}" looks like a reasonable match for the current request.'
            ),
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
                    max_output_tokens=2048,
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

        repaired = self._repair_json(raw_text)
        if repaired is not None:
            return repaired

        raise ValidationAppError(f"Gemini returned invalid JSON: {raw_text[:200]}")

    def _repair_json(self, raw_text: str) -> dict[str, Any] | None:
        import re

        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        candidate = match.group() if match else raw_text

        sanitized = re.sub(r'(?<=\w)"(?=\w)', "'", candidate)
        try:
            return json.loads(sanitized)
        except json.JSONDecodeError:
            pass

        suffixes = ['"]}', '"]}', '"}]}', '"}}', '"]}', "}"]
        for suffix in suffixes:
            try:
                return json.loads(sanitized + suffix)
            except json.JSONDecodeError:
                pass

        return None

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

    def _target_language(self, locale: str) -> str:
        normalized = (locale or "en").lower()
        return {
            "ru": "Russian",
            "en": "English",
            "kz": "Kazakh",
            "kk": "Kazakh",
        }.get(normalized, "English")
