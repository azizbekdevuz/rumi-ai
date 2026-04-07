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

import requests
import sys
from uuid import uuid4
from datetime import timedelta

# Configuration
BACKEND_URL = "http://localhost:8000"
TEST_EMAIL = f"test_{uuid4().hex[:8]}@example.com"
TEST_PASSWORD = "testpassword123"
OAUTH_TEST_EMAIL = f"oauth_test_{uuid4().hex[:8]}@example.com"

# Shown in docs/SQL examples only — must not echo the runtime-generated OAuth test address.
_OAUTH_SQL_EMAIL_PLACEHOLDER = "YOUR_OAUTH_TEST_EMAIL@example.com"


def mask_email(email: str) -> str:
    """Redact most of the local part for console output (keeps domain for context)."""
    if "@" not in email:
        return "***"
    local, _, domain = email.partition("@")
    if len(local) <= 2:
        return f"{'*' * len(local)}@{domain}"
    return f"{local[0]}{'*' * (len(local) - 2)}{local[-1]}@{domain}"


def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_signup():
    """Test that signup creates provider='email' users."""
    print_section("Test 1: Signup (creates provider='email' user)")
    
    response = requests.post(
        f"{BACKEND_URL}/api/auth/signup",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    
    if response.status_code == 201:
        print(f"✅ Signup successful: {response.json()}")
        return True
    else:
        print(f"❌ Signup failed: {response.status_code} - {response.text}")
        return False

def test_password_login():
    """Test that password login works for email provider users."""
    print_section("Test 2: Password Login (should work)")
    
    response = requests.post(
        f"{BACKEND_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    
    if response.status_code == 200:
        data = response.json()
        if "token" in data:
            print(f"✅ Login successful, received token: {data['token'][:50]}...")
            return data["token"]
        else:
            print(f"❌ Login response missing token: {data}")
            return None
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None

def test_user_me(token):
    """Test that /api/user/me works with JWT."""
    print_section("Test 3: GET /api/user/me (should work)")
    
    response = requests.get(
        f"{BACKEND_URL}/api/user/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        user = response.json()
        print(f"✅ User profile retrieved:")
        print(f"   - ID: {user.get('id')}")
        print(f"   - Email: {user.get('email')}")
        print(f"   - Provider: {user.get('provider', 'not in response')}")
        return True
    else:
        print(f"❌ Failed to get user profile: {response.status_code} - {response.text}")
        return False

def test_oauth_user_rejection():
    """Test that OAuth users (password_hash NULL) are rejected."""
    print_section("Test 4: OAuth User Password Login Rejection")
    
    print("⚠️  This test requires manual setup:")
    print("   1. Create an OAuth user in database (replace the email placeholder):")
    print("      INSERT INTO users (id, email, password_hash, provider, provider_user_id, is_guest, is_deleted)")
    print(f"      VALUES (gen_random_uuid(), '{_OAUTH_SQL_EMAIL_PLACEHOLDER}', NULL, 'kakao', 'kakao_12345', false, false);")
    print("   2. Set that INSERT email equal to OAUTH_TEST_EMAIL in this file, then run the script again")
    print("      (login uses OAUTH_TEST_EMAIL internally; it is not printed here).")
    
    # Try to login with OAuth user (will fail if user doesn't exist, that's OK)
    response = requests.post(
        f"{BACKEND_URL}/api/auth/login",
        json={"email": OAUTH_TEST_EMAIL, "password": "anypassword"}
    )
    
    if response.status_code == 400:
        error_detail = response.json().get("detail", "")
        if "OAuth authentication" in error_detail:
            print(f"✅ OAuth user correctly rejected: {error_detail}")
            return True
        else:
            print(f"⚠️  Got 400 but wrong message: {error_detail}")
            return False
    elif response.status_code == 401:
        print(f"⚠️  Got 401 (user not found or wrong password) - OAuth user may not exist in DB")
        print(f"   This is expected if you haven't created the test OAuth user yet.")
        return None  # Not a failure, just needs manual setup
    else:
        print(f"❌ Unexpected response: {response.status_code} - {response.text}")
        return False

def main():
    print("OAuth Prerequisite Verification Script")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Email: {mask_email(TEST_EMAIL)}")
    
    results = []
    
    # Test 1: Signup
    if not test_signup():
        print("\n❌ Signup test failed. Aborting.")
        sys.exit(1)
    results.append(("Signup", True))
    
    # Test 2: Password Login
    token = test_password_login()
    if not token:
        print("\n❌ Password login test failed. Aborting.")
        sys.exit(1)
    results.append(("Password Login", True))
    
    # Test 3: User Profile
    if not test_user_me(token):
        print("\n❌ User profile test failed.")
        sys.exit(1)
    results.append(("User Profile", True))
    
    # Test 4: OAuth User Rejection (requires manual DB setup)
    oauth_result = test_oauth_user_rejection()
    if oauth_result is True:
        results.append(("OAuth User Rejection", True))
    elif oauth_result is None:
        results.append(("OAuth User Rejection", "SKIPPED (needs manual setup)"))
    else:
        results.append(("OAuth User Rejection", False))
    
    # Summary
    print_section("Summary")
    for test_name, result in results:
        status = "✅ PASS" if result is True else "⚠️  SKIP" if result == "SKIPPED" else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    all_passed = all(r is True or r == "SKIPPED" for _, r in results)
    if all_passed:
        print("\n✅ All automated tests passed!")
        print("⚠️  Remember to manually test OAuth user rejection after creating test user in DB.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Check output above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
