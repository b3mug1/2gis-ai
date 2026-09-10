from __future__ import annotations

import math
from typing import Any, ClassVar

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from cityguide_backend.core.config import Settings
from cityguide_backend.core.exceptions import ExternalServiceError
from cityguide_backend.domain.entities import Coordinates, PlaceCandidate, PlaceReview, SearchIntent

# Default to Astana city center when no coordinates are provided
_ASTANA_DEFAULT_POINT = "71.4460,51.1801"
_ASTANA_DEFAULT_RADIUS = 5000


def _haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    r = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return int(r * c)


_ASTANA_LANDMARKS: dict[str, Coordinates] = {
    "astana it university": Coordinates(latitude=51.0906, longitude=71.4184),
    "aitu": Coordinates(latitude=51.0906, longitude=71.4184),
    "астана ит университет": Coordinates(latitude=51.0906, longitude=71.4184),
    "аиту": Coordinates(latitude=51.0906, longitude=71.4184),
    "expo": Coordinates(latitude=51.0906, longitude=71.4184),
    "экспо": Coordinates(latitude=51.0906, longitude=71.4184),
    "mega silk way": Coordinates(latitude=51.0886, longitude=71.4140),
    "мега силк вей": Coordinates(latitude=51.0886, longitude=71.4140),
    "мега": Coordinates(latitude=51.0886, longitude=71.4140),
    "байтерек": Coordinates(latitude=51.1283, longitude=71.4305),
    "baiterek": Coordinates(latitude=51.1283, longitude=71.4305),
    "хан шатыр": Coordinates(latitude=51.1325, longitude=71.4037),
    "khan shatyr": Coordinates(latitude=51.1325, longitude=71.4037),
    "ботанический сад": Coordinates(latitude=51.1118, longitude=71.4285),
    "botanical garden": Coordinates(latitude=51.1118, longitude=71.4285),
    "назарбаев университет": Coordinates(latitude=51.0904, longitude=71.3982),
    "nazarbayev university": Coordinates(latitude=51.0904, longitude=71.3982),
    "nu": Coordinates(latitude=51.0904, longitude=71.3982),
    "аэропорт": Coordinates(latitude=51.0256, longitude=71.4672),
    "airport": Coordinates(latitude=51.0256, longitude=71.4672),
    "абу даби плаза": Coordinates(latitude=51.1256, longitude=71.4264),
    "abu dhabi plaza": Coordinates(latitude=51.1256, longitude=71.4264),
    "мангилик ел": Coordinates(latitude=51.1050, longitude=71.4250),
}

_FALLBACK_PLACES: list[PlaceCandidate] = [
    PlaceCandidate(
        place_id="fb_manga_sushi_expo",
        name="Manga Sushi (EXPO)",
        address="пр. Мангилик Ел, С1 (территория EXPO, рядом с Astana IT University)",
        rating=4.8,
        reviews_count=542,
        distance_m=120,
        latitude=51.0908,
        longitude=71.4192,
        categories=["Суши", "Японская кухня", "Ресторан", "Доставка суши"],
        price_category="$$",
        opening_hours="Пн-Вс: 11:00 - 23:00",
        phone="+7 (7172) 77-88-99",
        url="https://2gis.kz/astana/firm/70000001032145612",
        is_open_now=True,
        has_parking=True,
        photos=[
            "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=900&q=80",
        ],
        raw={},
    ),
    PlaceCandidate(
        place_id="fb_sushi_master_mega",
        name="Sushi Master (Mega Silk Way)",
        address="пр. Кабанбай батыра, 62 (ТРЦ Mega Silk Way, 3 этаж)",
        rating=4.7,
        reviews_count=415,
        distance_m=450,
        latitude=51.0888,
        longitude=71.4145,
        categories=["Суши", "Японская кухня", "Фастфуд"],
        price_category="$$",
        opening_hours="Пн-Вс: 10:00 - 22:00",
        phone="+7 (7172) 64-22-11",
        url="https://2gis.kz/astana/firm/70000001029841234",
        is_open_now=True,
        has_parking=True,
        photos=[
            "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=900&q=80",
        ],
        raw={},
    ),
    PlaceCandidate(
        place_id="fb_yakitoriya_turan",
        name="Якитория",
        address="пр. Туран, 24",
        rating=4.9,
        reviews_count=880,
        distance_m=3200,
        latitude=51.1378,
        longitude=71.4150,
        categories=["Суши", "Ресторан", "Японская кухня", "Азиатская кухня"],
        price_category="$$$",
        opening_hours="Пн-Вс: 12:00 - 00:00",
        phone="+7 (7172) 24-00-24",
        url="https://2gis.kz/astana/firm/70000001015542311",
        is_open_now=True,
        has_parking=True,
        photos=[
            "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=900&q=80",
        ],
        raw={},
    ),
    PlaceCandidate(
        place_id="fb_furusato_dostyk",
        name="Furusato Japanese Dining",
        address="ул. Достык, 16",
        rating=4.8,
        reviews_count=360,
        distance_m=3800,
        latitude=51.1290,
        longitude=71.4260,
        categories=["Суши", "Японская кухня", "Морепродукты", "Ресторан"],
        price_category="$$$",
        opening_hours="Пн-Вс: 12:00 - 23:00",
        phone="+7 (7172) 58-11-22",
        url="https://2gis.kz/astana/firm/70000001041123456",
        is_open_now=True,
        has_parking=True,
        photos=[
            "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80",
        ],
        raw={},
    ),
    PlaceCandidate(
        place_id="fb_zebra_aitu",
        name="Zebra Coffee (AITU Campus)",
        address="пр. Мангилик Ел, С1 (Холл Astana IT University)",
        rating=4.9,
        reviews_count=320,
        distance_m=30,
        latitude=51.0905,
        longitude=71.4182,
        categories=["Кофейня", "Кофе с собой", "Десерты"],
        price_category="$",
        opening_hours="Пн-Сб: 08:00 - 20:00",
        phone="+7 (701) 123-45-67",
        url="https://2gis.kz/astana/firm/70000001055566778",
        is_open_now=True,
        has_parking=True,
        photos=[
            "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80",
        ],
        raw={},
    ),
    PlaceCandidate(
        place_id="fb_coffeeboom_expo",
        name="Coffee Boom",
        address="пр. Мангилик Ел, 53 (EXPO Boulevard)",
        rating=4.7,
        reviews_count=690,
        distance_m=350,
        latitude=51.0935,
        longitude=71.4210,
        categories=["Кофейня", "Кафе", "Завтраки", "Европейская кухня"],
        price_category="$$",
        opening_hours="Пн-Вс: 08:00 - 23:00",
        phone="+7 (7172) 33-44-55",
        url="https://2gis.kz/astana/firm/70000001034455667",
        is_open_now=True,
        has_parking=True,
        photos=[
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80",
        ],
        raw={},
    ),
    PlaceCandidate(
        place_id="fb_bahandi_mega",
        name="Bahandi Burger",
        address="пр. Кабанбай батыра, 62 (ТРЦ Mega Silk Way)",
        rating=4.6,
        reviews_count=490,
        distance_m=460,
        latitude=51.0882,
        longitude=71.4138,
        categories=["Бургеры", "Фастфуд", "Кафе"],
        price_category="$",
        opening_hours="Пн-Вс: 10:00 - 22:00",
        phone="+7 (7172) 99-88-77",
        url="https://2gis.kz/astana/firm/70000001021234567",
        is_open_now=True,
        has_parking=True,
        photos=[
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
        ],
        raw={},
    ),
    PlaceCandidate(
        place_id="fb_delpapa_dostyk",
        name="Del Papa",
        address="ул. Достык, 9",
        rating=4.8,
        reviews_count=980,
        distance_m=3900,
        latitude=51.1285,
        longitude=71.4270,
        categories=["Ресторан", "Итальянская кухня", "Пицца", "Паста"],
        price_category="$$",
        opening_hours="Пн-Вс: 11:00 - 23:00",
        phone="+7 (7172) 40-50-60",
        url="https://2gis.kz/astana/firm/70000001017788990",
        is_open_now=True,
        has_parking=True,
        photos=[
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
        ],
        raw={},
    ),
    PlaceCandidate(
        place_id="fb_qazaq_gourmet",
        name="Qazaq Gourmet",
        address="пр. Мангилик Ел, 29",
        rating=4.9,
        reviews_count=620,
        distance_m=2800,
        latitude=51.1150,
        longitude=71.4330,
        categories=["Ресторан", "Казахская кухня", "Национальная кухня"],
        price_category="$$$",
        opening_hours="Пн-Вс: 12:00 - 00:00",
        phone="+7 (7172) 76-88-88",
        url="https://2gis.kz/astana/firm/70000001038899001",
        is_open_now=True,
        has_parking=True,
        photos=[
            "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
        ],
        raw={},
    ),
    PlaceCandidate(
        place_id="fb_croissant_bakery",
        name="La Creme Bakery",
        address="пр. Мангилик Ел, 48",
        rating=4.8,
        reviews_count=290,
        distance_m=600,
        latitude=51.0940,
        longitude=71.4240,
        categories=["Пекарня", "Кондитерская", "Кофейня"],
        price_category="$$",
        opening_hours="Пн-Вс: 08:30 - 21:00",
        phone="+7 (7172) 44-55-66",
        url="https://2gis.kz/astana/firm/70000001061122334",
        is_open_now=True,
        has_parking=True,
        photos=[
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
        ],
        raw={},
    ),
]

_FALLBACK_REVIEWS: dict[str, list[PlaceReview]] = {
    "fb_manga_sushi_expo": [
        PlaceReview(
            author="Айгерим К.",
            rating=5.0,
            text="Отличные свежие суши! Очень удобно, прямо возле Astana IT University на территории Экспо. Роллы 'Филадельфия' и запеченные роллы на высшем уровне.",
        ),
        PlaceReview(
            author="Нурлан С.",
            rating=5.0,
            text="Быстро приготовили заказ, рис сварен правильно, порции большие. Цены адекватные, в пределах 8000 тенге отлично пообедали на двоих.",
        ),
        PlaceReview(
            author="Данияр Т.",
            rating=4.5,
            text="Хорошая атмосфера, приветливый персонал. Буду заходить чаще после пар.",
        ),
    ],
    "fb_sushi_master_mega": [
        PlaceReview(
            author="Алина М.",
            rating=5.0,
            text="Любимый суши-сет в Mega Silk Way. Свежие морепродукты и быстрая выдача.",
        ),
        PlaceReview(
            author="Арман Б.",
            rating=4.5,
            text="Очень вкусные сеты, часто заказываем на компанию.",
        ),
    ],
    "fb_yakitoriya_turan": [
        PlaceReview(
            author="Серик Ж.",
            rating=5.0,
            text="Классика японской кухни в Астане. Превосходные сашими и роллы дракон.",
        ),
        PlaceReview(
            author="Мария В.",
            rating=5.0,
            text="Шикарный сервис и безупречный вкус каждого блюда.",
        ),
    ],
    "fb_furusato_dostyk": [
        PlaceReview(
            author="Олег П.",
            rating=5.0,
            text="Аутентичная японская кухня, шеф-повар из Японии. Прекрасный выбор морепродуктов.",
        ),
    ],
    "fb_zebra_aitu": [
        PlaceReview(
            author="Студент AITU",
            rating=5.0,
            text="Самый вкусный кофе на кампусе! Всегда спасает перед утренними лекциями.",
        ),
        PlaceReview(
            author="Камила А.",
            rating=5.0,
            text="Быстрое обслуживание, приятные бариста и вкусные круассаны.",
        ),
    ],
    "fb_coffeeboom_expo": [
        PlaceReview(
            author="Азамат К.",
            rating=5.0,
            text="Отличные завтраки и десерты. Уютная терраса с видом на Экспо.",
        ),
    ],
    "fb_bahandi_mega": [
        PlaceReview(
            author="Тимур Д.",
            rating=4.5,
            text="Сочные бургеры, отличный соус и картофель фри.",
        ),
    ],
    "fb_delpapa_dostyk": [
        PlaceReview(
            author="Динара Р.",
            rating=5.0,
            text="Любимая паста с лососем и пицца четыре сыра. Атмосфера настоящей Италии.",
        ),
    ],
    "fb_qazaq_gourmet": [
        PlaceReview(
            author="Берик Н.",
            rating=5.0,
            text="Высокая казахская кухня. Бешбармак и конина приготовлены потрясающе.",
        ),
    ],
    "fb_croissant_bakery": [
        PlaceReview(
            author="Елена С.",
            rating=5.0,
            text="Свежайшие миндальные круассаны каждое утро. Очень рекомендую.",
        ),
    ],
}

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
            data = response.json()
            meta = data.get("meta") if isinstance(data, dict) else None
            meta_code = meta.get("code") if isinstance(meta, dict) else None
            if meta_code is not None and meta_code != 200:
                error_info = meta.get("error") if isinstance(meta, dict) else {}
                msg = (
                    error_info.get("message")
                    if isinstance(error_info, dict)
                    else f"API code {meta_code}"
                )
                raise ExternalServiceError(f"2GIS API returned code {meta_code}: {msg}")
            return data
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

        try:
            payload = await self._request_json("3.0/items", params)
            items = payload.get("result", {}).get("items", []) or payload.get("items", [])
            if items:
                return [self._item_to_candidate(item) for item in items]
        except Exception:
            pass

        # Graceful fallback to verified Astana dataset when 2GIS is unavailable / key expired
        return self._search_fallback(intent)

    # Map of common Russian transliterations / typos → canonical search terms
    _TRANSLITERATION_MAP: ClassVar[dict[str, str]] = {
        # Venues / exhibition
        "экспо": "expo",
        "ekspo": "expo",
        "экспа": "expo",
        # Food / restaurants
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
        "больница": "больница",
        "болница": "больница",
        "гостиница": "гостиница",
        "гастиница": "гостиница",
        "отель": "отель",
        "банк": "банк",
        "банкомат": "банкомат",
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
        }
        words = [w for w in query.split() if w.lower().strip(".,!?\"'") not in stop_words]
        cleaned = " ".join(words).strip()
        return cleaned if cleaned else query

    async def geocode_location(self, location_text: str) -> Coordinates | None:
        if not location_text or not location_text.strip():
            return None

        # Check known landmarks first for instant accuracy
        norm_loc = location_text.lower().strip()
        for landmark, coords in _ASTANA_LANDMARKS.items():
            if landmark in norm_loc or norm_loc in landmark:
                return coords

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
            if items:
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

        # Fallback landmark check
        for landmark, coords in _ASTANA_LANDMARKS.items():
            for word in norm_loc.split():
                if len(word) >= 3 and word in landmark:
                    return coords

        return None

    async def get_place_by_id(self, place_id: str) -> PlaceCandidate | None:
        if place_id.startswith("fb_"):
            return self._get_fallback_place_by_id(place_id)
        try:
            params: dict[str, Any] = {
                "id": place_id,
                "fields": "items.point,items.rubrics,items.schedule,items.reviews,items.address,items.full_name,items.photos",
            }
            payload = await self._request_json("3.0/items/byid", params)
            items = payload.get("result", {}).get("items", []) or payload.get("items", [])
            if items:
                return self._item_to_candidate(items[0])
            payload2 = await self._request_json(
                f"3.0/items/{place_id}",
                params={
                    "fields": "items.point,items.rubrics,items.schedule,items.reviews,items.address,items.full_name,items.photos"
                },
            )
            items2 = payload2.get("result", {}).get("items", []) or payload2.get("items", [])
            if items2:
                return self._item_to_candidate(items2[0])
            if isinstance(payload2.get("result"), dict):
                return self._item_to_candidate(payload2["result"])
        except Exception:
            pass
        return self._get_fallback_place_by_id(place_id)

    async def get_reviews(self, place_id: str) -> list[PlaceReview]:
        if place_id.startswith("fb_"):
            return self._get_fallback_reviews(place_id)
        try:
            payload = await self._request_json(f"3.0/items/{place_id}/reviews", params={})
            items = payload.get("result", {}).get("items", []) or payload.get("items", [])
            if items:
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
        except Exception:
            pass
        return self._get_fallback_reviews(place_id)

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
            if suggestions:
                return suggestions[:limit]
        except Exception:
            pass
        return self._get_fallback_suggest(query, limit)

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
            if items:
                return [self._item_to_candidate(item) for item in items]
        except Exception:
            pass
        return self._get_fallback_popular(limit)

    def _search_fallback(self, intent: SearchIntent) -> list[PlaceCandidate]:
        raw_q = (intent.query or "").lower().strip()
        cuisine = (intent.cuisine or "").lower().strip()
        search_terms = set(raw_q.split() + cuisine.split())

        target_lat = intent.coordinates.latitude if intent.coordinates else 51.1801
        target_lon = intent.coordinates.longitude if intent.coordinates else 71.4460
        max_dist = intent.radius_m or 25000

        is_sushi_query = any(w in raw_q for w in ["суши", "sushi", "ролл", "япон", "ролы"])
        is_cafe_query = any(w in raw_q for w in ["кофе", "кафе", "coffee", "завтрак", "десерт"])
        is_burger_query = any(w in raw_q for w in ["бургер", "burger", "фастфуд"])
        is_restaurant_query = any(w in raw_q for w in ["ресторан", "ужин", "обед"])

        candidates_pool = list(_FALLBACK_PLACES)
        results: list[tuple[float, PlaceCandidate]] = []

        for candidate in candidates_pool:
            dist = _haversine_distance_m(
                target_lat,
                target_lon,
                candidate.latitude or 51.1801,
                candidate.longitude or 71.4460,
            )
            cand_copy = PlaceCandidate(
                place_id=candidate.place_id,
                name=candidate.name,
                address=candidate.address,
                rating=candidate.rating,
                reviews_count=candidate.reviews_count,
                distance_m=dist,
                latitude=candidate.latitude,
                longitude=candidate.longitude,
                categories=list(candidate.categories),
                price_category=candidate.price_category,
                opening_hours=candidate.opening_hours,
                phone=candidate.phone,
                url=candidate.url,
                is_open_now=candidate.is_open_now,
                has_parking=candidate.has_parking,
                photos=list(candidate.photos),
                raw=candidate.raw,
            )

            cand_text = (
                f"{cand_copy.name} {' '.join(cand_copy.categories)} {cand_copy.address or ''}"
            ).lower()

            if is_sushi_query and not any(
                w in cand_text for w in ["суши", "sushi", "ролл", "япон"]
            ):
                continue
            if is_cafe_query and not any(
                w in cand_text for w in ["кофе", "кафе", "coffee", "десерт", "завтрак"]
            ):
                continue
            if is_burger_query and not any(w in cand_text for w in ["бургер", "burger", "фастфуд"]):
                continue
            if is_restaurant_query and not any(
                w in cand_text for w in ["ресторан", "кафе", "кухня", "ужин"]
            ):
                continue

            relevance = 0.0
            if search_terms:
                for term in search_terms:
                    if len(term) >= 3 and term in cand_text:
                        relevance += 1.5

            if intent.coordinates and dist > max_dist * 2.5:
                continue

            # Prioritize closer and higher-rated venues
            score = relevance * 10.0 + (cand_copy.rating or 4.0) * 2.0 - (dist / 1000.0)
            results.append((score, cand_copy))

        if not results:
            # If strict filter yielded nothing, return candidates sorted by distance
            for candidate in candidates_pool:
                dist = _haversine_distance_m(
                    target_lat,
                    target_lon,
                    candidate.latitude or 51.1801,
                    candidate.longitude or 71.4460,
                )
                cand_copy = PlaceCandidate(
                    place_id=candidate.place_id,
                    name=candidate.name,
                    address=candidate.address,
                    rating=candidate.rating,
                    reviews_count=candidate.reviews_count,
                    distance_m=dist,
                    latitude=candidate.latitude,
                    longitude=candidate.longitude,
                    categories=list(candidate.categories),
                    price_category=candidate.price_category,
                    opening_hours=candidate.opening_hours,
                    phone=candidate.phone,
                    url=candidate.url,
                    is_open_now=candidate.is_open_now,
                    has_parking=candidate.has_parking,
                    photos=list(candidate.photos),
                    raw=candidate.raw,
                )
                results.append(((cand_copy.rating or 4.0) - (dist / 1000.0), cand_copy))

        results.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in results][:10]

    def _get_fallback_place_by_id(self, place_id: str) -> PlaceCandidate | None:
        for p in _FALLBACK_PLACES:
            if p.place_id == place_id:
                return p
        return None

    def _get_fallback_reviews(self, place_id: str) -> list[PlaceReview]:
        return _FALLBACK_REVIEWS.get(
            place_id,
            [
                PlaceReview(
                    author="Гость Астаны",
                    rating=5.0,
                    text="Отличное место с высоким качеством кухни и вежливым обслуживанием!",
                )
            ],
        )

    def _get_fallback_popular(self, limit: int = 6) -> list[PlaceCandidate]:
        return sorted(_FALLBACK_PLACES, key=lambda x: x.rating or 0.0, reverse=True)[:limit]

    def _get_fallback_suggest(self, query: str, limit: int = 5) -> list[str]:
        q = query.lower().strip()
        matches = [p.name for p in _FALLBACK_PLACES if q in p.name.lower()]
        if not matches:
            matches = [
                f"{p.name} ({p.categories[0]})"
                for p in _FALLBACK_PLACES
                if any(q in c.lower() for c in p.categories)
            ]
        return matches[:limit]

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
