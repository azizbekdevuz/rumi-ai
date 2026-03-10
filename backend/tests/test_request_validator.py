"""Regression tests for request_validator middleware - 415/413 as JSON responses."""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware.request_validator import request_validator_middleware


@pytest.fixture
def app_with_validator():
    """Create FastAPI app with request_validator middleware."""
    app = FastAPI()

    @app.middleware("http")
    async def add_validator(request, call_next):
        return await request_validator_middleware(request, call_next)

    @app.post("/api/feedback")
    async def feedback_endpoint():
        return {"ok": True}

    return app


def test_415_wrong_content_type_returns_json(app_with_validator):
    """POST with wrong Content-Type returns 415 with JSON body, not 500."""
    client = TestClient(app_with_validator)
    resp = client.post(
        "/api/feedback",
        content="not json",
        headers={"Content-Type": "text/plain"},
    )
    assert resp.status_code == 415
    data = resp.json()
    assert "detail" in data
    assert "Unsupported Media Type" in data["detail"]


def test_413_oversized_body_returns_json(app_with_validator):
    """POST with Content-Length > 10MB returns 413 with JSON body."""
    client = TestClient(app_with_validator)
    # Middleware checks Content-Length header; use header to trigger 413
    resp = client.post(
        "/api/feedback",
        content="{}",
        headers={
            "Content-Type": "application/json",
            "Content-Length": "11534336",  # 11MB
        },
    )
    assert resp.status_code == 413
    data = resp.json()
    assert "detail" in data
    assert "too large" in data["detail"].lower()


def test_valid_json_request_proceeds(app_with_validator):
    """POST with valid JSON proceeds to route."""
    client = TestClient(app_with_validator)
    resp = client.post(
        "/api/feedback",
        json={"issue_type": "bug", "comment": "test"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}
