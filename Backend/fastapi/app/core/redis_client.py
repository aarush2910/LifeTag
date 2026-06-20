"""Async Redis client and simple cache helpers.

Uses Upstash (TLS required). Values loaded from env via app.core.config.settings.
"""
import json
from typing import Optional, Any
from redis import asyncio as aioredis
from redis.exceptions import RedisError, ConnectionError as RedisConnectionError
from app.core.config import settings

# Global Redis client instance
_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> Optional[aioredis.Redis]:
    """Return a connected Redis client or None if disabled/unavailable."""
    global _redis_client
    if not settings.REDIS_ENABLED:
        return None
    if _redis_client is None:
        try:
            # Use rediss:// scheme for TLS. Do not pass unsupported 'ssl' kw.
            # Example Upstash URL: rediss://default:<PASSWORD>@<HOST>:6379
            _redis_client = await aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                max_connections=settings.REDIS_MAX_CONNECTIONS,
                socket_connect_timeout=5,
                socket_keepalive=True,
            )
            # verify connection
            await _redis_client.ping()
        except (RedisError, RedisConnectionError, Exception) as e:
            print(f"⚠ Redis connection failed: {e}")
            _redis_client = None
            return None
    return _redis_client


async def close_redis():
    """Close Redis connection on shutdown."""
    global _redis_client
    if _redis_client:
        try:
            await _redis_client.close()
            print("✓ Redis connection closed")
        except Exception as e:
            print(f"⚠ Error closing Redis: {e}")
        finally:
            _redis_client = None


async def cache_get(key: str) -> Optional[Any]:
    """Get JSON value from cache or None if missing/unavailable."""
    try:
        client = await get_redis()
        if client is None:
            return None
        data = await client.get(key)
        if data:
            return json.loads(data)
        return None
    except Exception as e:
        print(f"⚠ Redis GET error for key '{key}': {e}")
        return None


async def cache_set(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    """Set JSON value with TTL. Returns True on success."""
    try:
        client = await get_redis()
        if client is None:
            return False
        if ttl is None:
            ttl = settings.REDIS_CACHE_TTL
        serialized = json.dumps(value, default=str)
        await client.setex(key, ttl, serialized)
        return True
    except Exception as e:
        print(f"⚠ Redis SET error for key '{key}': {e}")
        return False


async def cache_delete(key: str) -> bool:
    """Delete a single cache key. Returns True if key existed."""
    try:
        client = await get_redis()
        if client is None:
            return False
        result = await client.delete(key)
        return result > 0
    except Exception as e:
        print(f"⚠ Redis DELETE error for key '{key}': {e}")
        return False


async def cache_delete_pattern(pattern: str) -> int:
    """Delete all keys matching pattern. Returns count deleted."""
    try:
        client = await get_redis()
        if client is None:
            return 0
        keys = []
        async for k in client.scan_iter(match=pattern, count=100):
            keys.append(k)
        return await client.delete(*keys) if keys else 0
    except Exception as e:
        print(f"⚠ Redis DELETE PATTERN error for '{pattern}': {e}")
        return 0


async def cache_exists(key: str) -> bool:
    """Check if a key exists in cache."""
    try:
        client = await get_redis()
        if client is None:
            return False
        return await client.exists(key) > 0
    except Exception:
        return False
