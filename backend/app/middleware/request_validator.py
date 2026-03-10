"""
Request validation middleware for API Gateway.

NOTE: We return JSONResponse instead of raising HTTPException because
Starlette's HTTP middleware does not let FastAPI's exception handlers
intercept exceptions — an HTTPException raised here would surface as
a raw 500 to the client. See rate_limit_middleware for the same pattern.
"""
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from starlette.responses import JSONResponse


async def request_validator_middleware(request: Request, call_next):
    """Validate incoming requests."""
    # Check content type for POST/PUT/PATCH requests
    if request.method in ["POST", "PUT", "PATCH"]:
        content_type = request.headers.get("content-type", "")
        if "application/json" not in content_type and "multipart/form-data" not in content_type:
            if request.url.path not in ["/docs", "/openapi.json"]:
                return JSONResponse(
                    status_code=415,
                    content={
                        "detail": "Unsupported Media Type. Expected application/json or multipart/form-data"
                    },
                )

    # Check request size (basic validation)
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            size = int(content_length)
            max_size = 10 * 1024 * 1024  # 10MB
            if size > max_size:
                return JSONResponse(
                    status_code=413,
                    content={"detail": f"Request entity too large. Maximum size is {max_size} bytes"},
                )
        except ValueError:
            pass
    
    try:
        response = await call_next(request)
        return response
    except RequestValidationError as e:
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed",
                    "details": e.errors()
                }
            }
        )
