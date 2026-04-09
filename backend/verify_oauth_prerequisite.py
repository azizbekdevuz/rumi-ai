#!/usr/bin/env python3
"""
Verification script for OAuth prerequisite implementation.

Run this after applying the migration to verify:
1. Existing password login still works
2. OAuth users are rejected with 400 error
3. /api/user/me works for OAuth users with JWT

Usage:
    python verify_oauth_prerequisite.py
"""

import re
import sys
from typing import Any, Optional
from uuid import uuid4

import requests

# Configuration
BACKEND_URL = "http://localhost:8000"
TEST_EMAIL = f"test_{uuid4().hex[:8]}@example.com"
TEST_PASSWORD = "testpassword123"
# For Test 4: replace with a fixed address that matches an OAuth-only row you create in the DB
# (password unset / NULL per your schema). Random default avoids accidental reuse across runs.
OAUTH_TEST_EMAIL = f"oauth_test_{uuid4().hex[:8]}@example.com"

MAX_LOG_FRAGMENT = 200
_EMAIL_IN_TEXT = re.compile(r"\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b", re.IGNORECASE)
# Obvious JWT shape (three base64url segments); avoid logging bearer tokens if API echoes them.
_JWT_LIKE = re.compile(r"\bey[A-Za-z0-9_-]+\.ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b")


def mask_email(email: str) -> str:
    """Redact most of the local part for console output (keeps domain for context)."""
    if "@" not in email:
        return "***"
    local, _, domain = email.partition("@")
    if len(local) <= 2:
        return f"{'*' * len(local)}@{domain}"
    return f"{local[0]}{'*' * (len(local) - 2)}{local[-1]}@{domain}"


def _sanitize_log_text(text: str, max_len: int = MAX_LOG_FRAGMENT) -> str:
    """Single-line, truncated text safe for console (masks emails, redacts JWT-shaped substrings)."""
    if not isinstance(text, str):
        text = str(text)
    if not text.strip():
        return "(empty)"

    def _mask_m(match: re.Match) -> str:
        return mask_email(match.group(0))

    out = _EMAIL_IN_TEXT.sub(_mask_m, text)
    out = _JWT_LIKE.sub("[jwt redacted]", out)
    out = out.replace("\n", " ").replace("\r", " ").strip()
    if len(out) > max_len:
        out = out[: max_len - 3] + "..."
    return out


def _extract_detail_from_json(data: Any) -> Optional[str]:
    """Pull a human-readable message from typical FastAPI-style JSON error bodies."""
    if not isinstance(data, dict):
        return None
    detail = data.get("detail")
    if detail is None:
        return None
    if isinstance(detail, str):
        return detail
    if isinstance(detail, list):
        parts: list[str] = []
        for item in detail[:5]:
            if isinstance(item, dict):
                loc = item.get("loc", ())
                msg = item.get("msg", "")
                parts.append(f"{loc}: {msg}" if loc else str(msg))
            else:
                parts.append(str(item))
        return "; ".join(parts) if parts else None
    return str(detail)


def summarize_http_error(response: requests.Response) -> str:
    """
    Short, sanitized description of an error response. Never prints raw response.text.
    """
    status = response.status_code
    raw = response.text or ""
    ct = (response.headers.get("Content-Type") or "").lower()

    if "html" in ct or raw.lstrip().lower().startswith("<!doctype") or raw.lstrip().startswith("<"):
        return f"HTTP {status} (HTML body omitted, {len(raw)} bytes)"

    try:
        data = response.json()
    except ValueError:
        if not raw:
            return f"HTTP {status} (empty body)"
        return f"HTTP {status} (non-JSON body, {len(raw)} bytes omitted)"

    detail = _extract_detail_from_json(data)
    if detail:
        return f"HTTP {status}: {_sanitize_log_text(detail)}"

    keys = list(data.keys())[:8]
    return f"HTTP {status} (JSON without detail; keys: {keys})"


def format_request_exception(exc: requests.RequestException) -> str:
    """Concise operational message; avoids dumping long low-level tracebacks to stdout."""
    if isinstance(exc, requests.exceptions.ConnectionError):
        return "connection failed (is the backend running?)"
    if isinstance(exc, requests.exceptions.Timeout):
        return "request timed out"
    return f"request failed ({type(exc).__name__})"


def _detail_field_as_string(payload: dict) -> str:
    """Normalize FastAPI detail (str or list) to a single string for substring checks."""
    detail = payload.get("detail", "")
    if isinstance(detail, str):
        return detail
    if isinstance(detail, list):
        extracted = _extract_detail_from_json({"detail": detail})
        return extracted or ""
    if detail is None:
        return ""
    return str(detail)


def _is_skipped_result(result: Any) -> bool:
    return isinstance(result, str) and result.startswith("SKIPPED")


def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def test_signup():
    """Test that signup creates provider='email' users."""
    print_section("Test 1: Signup (creates provider='email' user)")

    try:
        response = requests.post(
            f"{BACKEND_URL}/api/auth/signup",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30,
        )
    except requests.RequestException as exc:
        print(f"❌ Signup failed: {format_request_exception(exc)}")
        return False

    if response.status_code == 201:
        try:
            body = response.json()
        except ValueError:
            print("✅ Signup successful (201)")
            return True
        created = body.get("email") or body.get("id")
        if isinstance(created, str) and "@" in created:
            print(f"✅ Signup successful (masked): {mask_email(created)}")
        else:
            print("✅ Signup successful (201)")
        return True

    print(f"❌ Signup failed: {summarize_http_error(response)}")
    return False


def test_password_login():
    """Test that password login works for email provider users."""
    print_section("Test 2: Password Login (should work)")

    try:
        response = requests.post(
            f"{BACKEND_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=30,
        )
    except requests.RequestException as exc:
        print(f"❌ Login failed: {format_request_exception(exc)}")
        return None

    if response.status_code == 200:
        try:
            data = response.json()
        except ValueError:
            print("❌ Login response: not valid JSON")
            return None
        if "token" in data:
            tok = data["token"]
            print(f"✅ Login successful (JWT length {len(tok)})")
            return data["token"]
        keys = list(data.keys())
        print(f"❌ Login response missing token (keys: {keys})")
        return None

    print(f"❌ Login failed: {summarize_http_error(response)}")
    return None


def test_user_me(token):
    """Test that /api/user/me works with JWT."""
    print_section("Test 3: GET /api/user/me (should work)")

    try:
        response = requests.get(
            f"{BACKEND_URL}/api/user/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30,
        )
    except requests.RequestException as exc:
        print(f"❌ Failed to get user profile: {format_request_exception(exc)}")
        return False

    if response.status_code == 200:
        try:
            user = response.json()
        except ValueError:
            print("❌ User profile: not valid JSON")
            return False
        email = user.get("email")
        email_out = mask_email(email) if isinstance(email, str) else "(none)"
        print("✅ User profile retrieved:")
        print(f"   - ID: {user.get('id')}")
        print(f"   - Email: {email_out}")
        print(f"   - Provider: {user.get('provider', 'not in response')}")
        return True

    print(f"❌ Failed to get user profile: {summarize_http_error(response)}")
    return False


def test_oauth_user_rejection():
    """Test that OAuth users (password_hash NULL) are rejected."""
    print_section("Test 4: OAuth User Password Login Rejection")

    print("⚠️  This test requires manual setup:")
    print("   1. Create an OAuth-only user in your database (no password login), using your usual")
    print("      admin tool or migration workflow — do not paste credentials or SQL into logs.")
    print("   2. In this file, set OAUTH_TEST_EMAIL to that user's email (constant near the top),")
    print("      then re-run. The script will attempt password login for that address; until the")
    print("      row exists, 401 is treated as skip.")

    try:
        response = requests.post(
            f"{BACKEND_URL}/api/auth/login",
            json={"email": OAUTH_TEST_EMAIL, "password": "anypassword"},
            timeout=30,
        )
    except requests.RequestException as exc:
        print(f"❌ OAuth rejection check request failed: {format_request_exception(exc)}")
        return False

    if response.status_code == 400:
        try:
            payload = response.json()
        except ValueError:
            print(f"❌ Got 400 with invalid JSON: {summarize_http_error(response)}")
            return False
        if not isinstance(payload, dict):
            print("❌ Got 400: JSON body is not an object")
            return False
        error_detail = _detail_field_as_string(payload)
        if "OAuth authentication" in error_detail:
            print(f"✅ OAuth user correctly rejected: {_sanitize_log_text(error_detail)}")
            return True
        print(f"⚠️  Got 400 but wrong message: {_sanitize_log_text(error_detail)}")
        return False
    if response.status_code == 401:
        print("⚠️  Got 401 (user not found or wrong password) - OAuth user may not exist in DB")
        print("   This is expected if you haven't created the test OAuth user yet.")
        return None
    print(f"❌ Unexpected response: {summarize_http_error(response)}")
    return False


def main():
    print("OAuth Prerequisite Verification Script")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Email: {mask_email(TEST_EMAIL)}")

    results = []

    if not test_signup():
        print("\n❌ Signup test failed. Aborting.")
        sys.exit(1)
    results.append(("Signup", True))

    token = test_password_login()
    if not token:
        print("\n❌ Password login test failed. Aborting.")
        sys.exit(1)
    results.append(("Password Login", True))

    if not test_user_me(token):
        print("\n❌ User profile test failed.")
        sys.exit(1)
    results.append(("User Profile", True))

    oauth_result = test_oauth_user_rejection()
    if oauth_result is True:
        results.append(("OAuth User Rejection", True))
    elif oauth_result is None:
        results.append(("OAuth User Rejection", "SKIPPED (needs manual setup)"))
    else:
        results.append(("OAuth User Rejection", False))

    print_section("Summary")
    for test_name, result in results:
        if result is True:
            status = "✅ PASS"
        elif _is_skipped_result(result):
            status = "⚠️  SKIP"
        else:
            status = "❌ FAIL"
        print(f"{status}: {test_name}")

    all_passed = all(r is True or _is_skipped_result(r) for _, r in results)
    if all_passed:
        print("\n✅ All automated tests passed!")
        print("⚠️  Remember to manually test OAuth user rejection after creating test user in DB.")
        sys.exit(0)
    print("\n❌ Some tests failed. Check output above.")
    sys.exit(1)


if __name__ == "__main__":
    main()
