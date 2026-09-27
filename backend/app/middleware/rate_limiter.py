import time
import logging
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import RATE_LIMIT_PER_MINUTE

logger = logging.getLogger("RateLimiter")

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    In-memory sliding window rate limiter middleware for FastAPI.
    Tracks requests per client IP within a rolling 60-second window.
    Protects Groq LLM tokens and server resources from abuse.
    """

    def __init__(self, app, requests_per_minute: int = RATE_LIMIT_PER_MINUTE):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        # Map IP -> List of timestamps
        self._request_history: Dict[str, List[float]] = defaultdict(list)

    def _get_client_ip(self, request: Request) -> str:
        """Extracts client IP, handling proxies and x-forwarded-for headers."""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()
        return request.client.host if request.client else "127.0.0.1"

    async def dispatch(self, request: Request, call_next):
        # Exclude static assets, docs, health check and CORS OPTIONS preflights from rate limiting
        if request.method == "OPTIONS" or request.url.path in ["/docs", "/openapi.json", "/redoc", "/api/v1/health", "/"]:
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        current_time = time.time()
        window_start = current_time - self.window_seconds

        # Clean old timestamps outside the current 60s window
        timestamps = self._request_history[client_ip]
        self._request_history[client_ip] = [ts for ts in timestamps if ts > window_start]
        recent_requests = self._request_history[client_ip]

        if len(recent_requests) >= self.requests_per_minute:
            oldest_timestamp = recent_requests[0]
            retry_after = int(self.window_seconds - (current_time - oldest_timestamp)) + 1
            logger.warning(f"Rate limit exceeded for IP {client_ip} on {request.url.path}. Retry after {retry_after}s.")

            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded: Maximum {self.requests_per_minute} requests per minute allowed. Please wait {retry_after} seconds before retrying.",
                    "error": "rate_limit_exceeded",
                    "retry_after_seconds": retry_after
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(self.requests_per_minute),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(current_time + retry_after))
                }
            )

        # Record this request timestamp
        self._request_history[client_ip].append(current_time)
        remaining = self.requests_per_minute - len(self._request_history[client_ip])

        response: Response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        return response
