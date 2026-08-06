# Architecture

The backend follows Clean Architecture with strict direction of dependencies:

- `domain` holds the core entities and repository/client interfaces.
- `application` contains orchestration services and request/response schemas.
- `infrastructure` implements persistence, cache, and external providers.
- `api` adapts FastAPI requests into application service calls.

## Request flow

1. The API receives a natural-language search request.
2. `SearchService` asks Gemini to extract structured intent.
3. The 2GIS client searches places using the extracted intent.
4. The service fetches reviews, summarizes them with Gemini, and scores candidates.
5. The best recommendation plus alternatives are returned as structured JSON.

## Data model

The schema includes users, refresh tokens, search history, favorites, cached AI results, search sessions, search statistics, and AI usage logs. PostgreSQL is the source of truth; Redis is used for operational caching and rate limiting.
