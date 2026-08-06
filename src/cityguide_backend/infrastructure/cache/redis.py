from __future__ import annotations

import json
from typing import Any

from redis.asyncio import Redis, from_url


class RedisCache:
    def __init__(self, client: Redis) -> None:
        self._client = client

    @classmethod
    def from_url(cls, redis_url: str) -> RedisCache:
        return cls(from_url(redis_url, decode_responses=True))

    async def get_json(self, key: str) -> dict[str, Any] | None:
        payload = await self._client.get(key)
        return None if payload is None else json.loads(payload)

    async def set_json(self, key: str, value: dict[str, Any], ttl_seconds: int) -> None:
        await self._client.set(key, json.dumps(value, ensure_ascii=False), ex=ttl_seconds)

    async def delete(self, key: str) -> None:
        await self._client.delete(key)

    async def incr_window(self, key: str, ttl_seconds: int) -> int:
        value = await self._client.incr(key)
        if value == 1:
            await self._client.expire(key, ttl_seconds)
        return int(value)

    async def ping(self) -> bool:
        return bool(await self._client.ping())

    async def close(self) -> None:
        await self._client.aclose()
