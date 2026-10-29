"""Regression tests for auth - get_current_user returns 401 when user missing."""
import base64
import json
import uuid
from datetime import timedelta
from unittest.mock import MagicMock

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.config import settings
from app.database import get_db
from app.middleware.auth import create_access_token, get_current_user
from app.models import User


@pytest.fixture
def app_with_auth():
    """Create FastAPI app with get_current_user dependency."""
    app = FastAPI()

    @app.get("/protected")
    async def protected_route(current_user: User = Depends(get_current_user)):
        return {"user_id": str(current_user.id)}

    return app


def test_get_current_user_returns_401_when_user_missing(app_with_auth):
    """Valid JWT but user not in DB -> 401, not 500 RuntimeError."""
    fake_user_id = str(uuid.uuid4())
    token = create_access_token({"sub": fake_user_id})

    mock_db = MagicMock()
    mock_filter = MagicMock()
    mock_filter.first.return_value = None  # User not found
    mock_query = MagicMock()
    mock_query.filter.return_value = mock_filter
    mock_db.query.return_value = mock_query

    def get_db_override():
        yield mock_db

    app_with_auth.dependency_overrides[get_db] = get_db_override

    try:
        client = TestClient(app_with_auth)
        resp = client.get("/protected", headers={"Authorization": f"Bearer {token}"})

        assert resp.status_code == 401
        data = resp.json()
        # FastAPI may return detail as str or in error.message
        msg = data.get("detail", data.get("message", str(data)))
        if isinstance(msg, dict):
            msg = msg.get("message", str(msg))
        assert "User not found" in msg or "user" in msg.lower()
    finally:
        app_with_auth.dependency_overrides.clear()


def _client(app, user=None):
    mock_db = MagicMock()
    mock_filter = MagicMock()
    mock_filter.first.return_value = user
    mock_query = MagicMock()
    mock_query.filter.return_value = mock_filter
    mock_db.query.return_value = mock_query

    def get_db_override():
        yield mock_db

    app.dependency_overrides[get_db] = get_db_override
    return TestClient(app)


def _b64(data: dict) -> str:
    raw = json.dumps(data, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def test_valid_hs256_token_is_accepted(app_with_auth):
    user = MagicMock()
    user.id = uuid.uuid4()
    token = create_access_token({"sub": str(user.id)})
    client = _client(app_with_auth, user)
    try:
        resp = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["user_id"] == str(user.id)
    finally:
        app_with_auth.dependency_overrides.clear()


def test_invalid_signature_is_rejected(app_with_auth):
    token = create_access_token({"sub": str(uuid.uuid4())})
    header, payload, signature = token.split(".")
    mutated = ("A" if signature[0] != "A" else "B") + signature[1:]
    flipped = f"{header}.{payload}.{mutated}"
    client = _client(app_with_auth)
    try:
        resp = client.get("/protected", headers={"Authorization": f"Bearer {flipped}"})
        assert resp.status_code == 401
    finally:
        app_with_auth.dependency_overrides.clear()


def test_expired_token_is_rejected(app_with_auth):
    token = create_access_token({"sub": str(uuid.uuid4())}, expires_delta=timedelta(seconds=-30))
    client = _client(app_with_auth)
    try:
        resp = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 401
    finally:
        app_with_auth.dependency_overrides.clear()


def test_non_hs256_algorithm_is_rejected(app_with_auth):
    """Header algorithm is not taken from the caller. Only HS256 is allowed."""
    body = _b64({"sub": str(uuid.uuid4())})
    header = _b64({"alg": "none", "typ": "JWT"})
    token = f"{header}.{body}."
    client = _client(app_with_auth)
    try:
        resp = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 401
    finally:
        app_with_auth.dependency_overrides.clear()


def test_token_signed_with_other_key_is_rejected(app_with_auth):
    import jwt as pyjwt

    token = pyjwt.encode({"sub": str(uuid.uuid4())}, "not-the-server-secret", algorithm="HS256")
    assert settings.SECRET_KEY != "not-the-server-secret"
    client = _client(app_with_auth)
    try:
        resp = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 401
    finally:
        app_with_auth.dependency_overrides.clear()
