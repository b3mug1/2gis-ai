# AI City Guide

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-FF4438?logo=redis&logoColor=white)](https://redis.io)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-AI_LLM-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Docker](https://img.shields.io/badge/Docker_ready-2496ED?logo=docker&logoColor=white)](./docker-compose.yml)

An AI-powered city guide that understands natural language queries, extracts structured search intent via Gemini AI, queries the 2GIS catalog API, scores and ranks places, and returns detailed recommendations with review summaries.

## Architecture

The project is a full-stack monorepo with two main components:

- **Backend** (`src/cityguide_backend`) — Python 3.13 / FastAPI async REST API with PostgreSQL, Redis caching, JWT authentication, and Gemini AI integration for intent extraction and review summarization.
- **Frontend** (`2gis-frontend`) — Next.js 16 / TypeScript application with a chat-based search interface and an embedded 2GIS interactive map.

The entire stack runs locally via Docker Compose with Gemini API integration.

## Tech Stack

### Backend

| Layer | Technology |
|---|---|
| Runtime | Python 3.13 |
| Framework | FastAPI + Uvicorn |
| ORM | SQLAlchemy 2.0 async |
| Migrations | Alembic |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT (access + refresh tokens) |
| AI / LLM | Gemini AI (`google-genai`) |
| Places API | 2GIS Catalog API |
| HTTP client | httpx (async) |
| Package manager | uv |

### Frontend

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| State / Data | TanStack Query |
| Maps | 2GIS Maps JS API |
| HTTP client | Axios |

## Quick Start

**Prerequisites:** Docker Desktop, Docker Compose.

1. Copy the example environment file and fill in your API keys:

   ```bash
   cp .env.example .env
   ```

2. Set your 2GIS API key and Gemini API key in `.env`:

   ```
   TWOGIS_API_KEY=your_twogis_key
   GEMINI_API_KEY=your_gemini_key
   ```

3. Start the full stack:

   ```bash
   docker compose up --build
   ```

4. Open the application at [http://localhost:7000](http://localhost:7000).

The backend API is available at [http://localhost:8001](http://localhost:8001).

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://...` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379/0` |
| `JWT_SECRET_KEY` | Secret key for signing JWT tokens | — |
| `TWOGIS_API_KEY` | 2GIS Catalog API key | — |
| `GEMINI_API_KEY` | Google Gemini API Key | — |
| `GEMINI_MODEL` | Gemini AI model name | `gemini-flash-lite-latest` |
| `FRONTEND_ORIGINS` | Allowed CORS origins for the frontend | `http://localhost:7000` |

## API Endpoints

### Authentication

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Obtain access and refresh tokens |
| POST | `/auth/refresh` | Refresh the access token |
| POST | `/auth/logout` | Revoke the refresh token |

### User

| Method | Path | Description |
|---|---|---|
| GET | `/me` | Get the authenticated user profile |

### Search

| Method | Path | Description |
|---|---|---|
| POST | `/search` | Run an AI-powered place search |
| GET | `/history` | Retrieve the user search history |

### Favorites

| Method | Path | Description |
|---|---|---|
| GET | `/favorites` | List saved favorite places |
| POST | `/favorites` | Save a place to favorites |
| DELETE | `/favorites/{id}` | Remove a place from favorites |

### Analytics & Health

| Method | Path | Description |
|---|---|---|
| GET | `/statistics` | Get user search statistics |
| GET | `/health` | Service health check |

## Development

Install backend dependencies locally with `uv`:

```bash
uv sync --dev
```

Install frontend dependencies:

```bash
cd 2gis-frontend && npm install
```

Run backend tests:

```bash
uv run pytest
```