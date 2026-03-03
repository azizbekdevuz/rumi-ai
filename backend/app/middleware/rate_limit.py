"""
Rate limiting middleware for API Gateway.
Uses in-memory storage (can be replaced with Redis for distributed systems).
"""
from fastapi import Request
from fastapi.responses import JSONResponse
from typing import Dict, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import time


class RateLimiter:
    """Simple rate limiter using sliding window algorithm."""
    
    def __init__(self):
        # Store: {identifier: [(timestamp, count), ...]}
        self.requests: Dict[str, list] = defaultdict(list)
        self.cleanup_interval = 300  # Clean up old entries every 5 minutes
        self.last_cleanup = time.time()
    
    def _cleanup_old_entries(self):
        """Remove entries older than 1 hour."""
        current_time = time.time()
        if current_time - self.last_cleanup < self.cleanup_interval:
            return
        
        cutoff_time = current_time - 3600  # 1 hour
        for key in list(self.requests.keys()):
            self.requests[key] = [
                (ts, count) for ts, count in self.requests[key]
                if ts > cutoff_time
            ]
            if not self.requests[key]:
                del self.requests[key]
        
        self.last_cleanup = current_time
    
    def _get_identifier(self, request: Request) -> str:
        """Get identifier for rate limiting (IP address or user ID)."""
        # Try to get user ID from request state if available
        if hasattr(request.state, "user_id"):
            return f"user:{request.state.user_id}"
        # Fall back to IP address
        client_ip = request.client.host if request.client else "unknown"
        return f"ip:{client_ip}"
    
    def check_rate_limit(
        self,
        request: Request,
        max_requests: int = 100,
        window_seconds: int = 60
    ) -> Tuple[bool, int]:
        """
        Check if request is within rate limit.
        Returns: (is_allowed, remaining_requests)
        """
        self._cleanup_old_entries()
        
        identifier = self._get_identifier(request)
        current_time = time.time()
        window_start = current_time - window_seconds
        
        # Filter requests within the window
        recent_requests = [
            ts for ts, _ in self.requests[identifier]
            if ts > window_start
        ]
        
        # Count requests in window
        request_count = len(recent_requests)
        
        if request_count >= max_requests:
            return False, 0
        
        # Add current request
        self.requests[identifier].append((current_time, 1))
        
        remaining = max_requests - request_count - 1
        return True, remaining


# Global rate limiter instance
rate_limiter = RateLimiter()


async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware.

    NOTE: We return a ``JSONResponse`` instead of raising ``HTTPException``
    because Starlette's ``BaseHTTPMiddleware`` does not let FastAPI's
    exception handlers intercept exceptions — an ``HTTPException`` raised
    here would surface as a raw 500 to the client.
    """
    # Skip rate limiting for health checks & docs
    if request.url.path in ["/health", "/docs", "/openapi.json", "/redoc"]:
        return await call_next(request)

    # ── Per-endpoint limits ──────────────────────────────────────
    path = request.url.path
    if path.startswith("/api/chat/sessions"):
        # Session/history listing — read-only, allow generous limit
        max_requests = 120
    elif "/api/chat" in path:
        # Chat generation — heavier, keep tight
        max_requests = 30
    elif "/api/search" in path:
        max_requests = 60
    else:
        max_requests = 100  # Default

    is_allowed, remaining = rate_limiter.check_rate_limit(
        request,
        max_requests=max_requests,
        window_seconds=60,
    )

    if not is_allowed:
        # Return a proper JSON response — never raise inside middleware
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Please try again later."},
            headers={
                "X-RateLimit-Limit": str(max_requests),
                "X-RateLimit-Remaining": "0",
                "Retry-After": "60",
            },
        )

    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(max_requests)
    response.headers["X-RateLimit-Remaining"] = str(remaining)

    return response
