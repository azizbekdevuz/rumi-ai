#!/usr/bin/env python3
"""
Create a test OAuth user in the database for testing OAuth login rejection.

This script uses Python's uuid.uuid4() instead of PostgreSQL's gen_random_uuid()
to avoid requiring the pgcrypto extension.

Usage:
    python create_test_oauth_user.py
"""

import sys
import os
from uuid import uuid4

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import User

def create_test_oauth_user():
    """Create a test OAuth user with password_hash=NULL."""
    db = SessionLocal()
    try:
        test_email = f"oauth_test_{uuid4().hex[:8]}@example.com"
        test_provider_user_id = f"kakao_{uuid4().hex[:12]}"
        
        # Check if user already exists
        existing = db.query(User).filter(User.email == test_email).first()
        if existing:
            print(f"⚠️  User with email {test_email} already exists.")
            print(f"   ID: {existing.id}")
            print(f"   Provider: {existing.provider}")
            print(f"   Provider User ID: {existing.provider_user_id}")
            return existing
        
        # Create OAuth user (password_hash is NULL)
        oauth_user = User(
            id=uuid4(),
            email=test_email,
            password_hash=None,  # OAuth users don't have passwords
            provider='kakao',
            provider_user_id=test_provider_user_id,
            is_guest=False,
            is_deleted=False,
        )
        
        db.add(oauth_user)
        db.commit()
        db.refresh(oauth_user)
        
        print(f"✅ Created test OAuth user:")
        print(f"   ID: {oauth_user.id}")
        print(f"   Email: {oauth_user.email}")
        print(f"   Provider: {oauth_user.provider}")
        print(f"   Provider User ID: {oauth_user.provider_user_id}")
        print(f"   Password Hash: {oauth_user.password_hash}")
        print(f"\n📝 Test password login rejection:")
        print(f"   curl -X POST http://localhost:8000/api/auth/login \\")
        print(f"     -H 'Content-Type: application/json' \\")
        print(f"     -d '{{\"email\": \"{test_email}\", \"password\": \"anypassword\"}}'")
        print(f"\n   Expected: 400 Bad Request")
        print(f"   Expected message: 'This account uses OAuth authentication. Please use the OAuth login method.'")
        
        return oauth_user
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating test OAuth user: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_test_oauth_user()
