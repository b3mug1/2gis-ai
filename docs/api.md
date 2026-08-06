# API

## Authentication

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me`

## Search

- `POST /search`

Request body:

```json
{
  "query": "I want delicious sushi near Astana IT University under 10000 KZT.",
  "coordinates": {"latitude": 51.1694, "longitude": 71.4491},
  "locale": "en"
}
```

## User data

- `GET /history`
- `GET /favorites`
- `POST /favorites`
- `DELETE /favorites/{id}`
- `GET /statistics`

## Operational

- `GET /health`
