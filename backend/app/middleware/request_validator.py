"""
Request validation middleware for API Gateway.
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
                        "error": {
                            "code": "UNSUPPORTED_MEDIA_TYPE",
                            "message": "Unsupported Media Type. Expected application/json or multipart/form-data",
                            "details": {}
                        }
                    }
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
                    content={
                        "error": {
                            "code": "REQUEST_TOO_LARGE",
                            "message": f"Request entity too large. Maximum size is {max_size} bytes",
                            "details": {}
                        }
                    }
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
