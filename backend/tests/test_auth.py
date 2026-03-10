"""Regression tests for auth - get_current_user returns 401 when user missing."""
import uuid
from unittest.mock import MagicMock

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

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
