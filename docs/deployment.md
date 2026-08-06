# Deployment

## Local development

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL and Redis with `docker compose up -d postgres redis`.
3. Apply the database migration with `uv run alembic upgrade head`.
4. Run the API with `uv run cityguide-api`.

## Docker

Build and run the full stack with:

```bash
docker compose up --build
```

## Production notes

- Keep secrets in a secret manager, not in `.env`.
- Run Alembic migrations before deploying the API.
- Put the service behind a reverse proxy with TLS termination.
- Rotate JWT and API keys periodically.
