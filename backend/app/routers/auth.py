"""
Authentication router - User registration and login.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import bcrypt
from datetime import timedelta, datetime
import httpx
from typing import Optional

from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserResponse, UserLogin, SignupRequest, SignupResponse, LoginResponse, KakaoOAuthRequest, GoogleOAuthRequest
from app.middleware.auth import create_access_token
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["authentication"])


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


@router.post("/signup", response_model=SignupResponse, status_code=201)
async def signup(
    user_data: SignupRequest,
    db: Session = Depends(get_db)
):
    """Create a new user account."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user with provider='email' (password-based authentication)
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        provider='email',
        provider_user_id=None,
        preferred_lang=None,
        theme=None
    )
    db.add(user)
    db.commit()
    
    return SignupResponse(status="User created")


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Authenticate user and provide JWT token."""
    # Find user
    user = db.query(User).filter(
        User.email == credentials.email,
        User.is_deleted == False
    ).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Reject OAuth users (users without password_hash) attempting password login
    if user.password_hash is None:
        raise HTTPException(
            status_code=400,
            detail="This account uses OAuth authentication. Please use the OAuth login method."
        )
    
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update last login
    from datetime import datetime
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    
    return LoginResponse(token=access_token)


@router.post("/kakao", response_model=LoginResponse)
async def kakao_oauth(
    oauth_data: KakaoOAuthRequest,
    db: Session = Depends(get_db)
):
    """Handle Kakao OAuth callback and authenticate user."""
    if not settings.KAKAO_REST_API_KEY:
        raise HTTPException(status_code=500, detail="Kakao OAuth not configured")
    
    # Step 1: Exchange authorization code for access token (use server config, not request body)
    if not settings.KAKAO_REDIRECT_URI:
        raise HTTPException(status_code=500, detail="Kakao redirect URI not configured")
    token_url = "https://kauth.kakao.com/oauth/token"
    token_data = {
        "grant_type": "authorization_code",
        "client_id": settings.KAKAO_REST_API_KEY,
        "redirect_uri": settings.KAKAO_REDIRECT_URI,
        "code": oauth_data.code,
    }
    
    # Add client_secret if configured (required for some Kakao app types)
    if settings.KAKAO_CLIENT_SECRET:
        token_data["client_secret"] = settings.KAKAO_CLIENT_SECRET
    
    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(
                token_url,
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=10.0
            )
            token_response.raise_for_status()
            token_result = token_response.json()
            access_token = token_result.get("access_token")
            
            if not access_token:
                raise HTTPException(status_code=400, detail="Kakao authentication failed")
        except httpx.HTTPStatusError as e:
            logger.warning("Kakao token exchange failed: %s", e.response.text)
            raise HTTPException(status_code=400, detail="Kakao authentication failed") from e
        except httpx.RequestError as e:
            logger.warning("Failed to connect to Kakao: %s", e)
            raise HTTPException(status_code=503, detail="Unable to reach Kakao. Please try again later.") from e

        # Step 2: Fetch user info from Kakao
        user_info_url = "https://kapi.kakao.com/v2/user/me"
        try:
            user_info_response = await client.get(
                user_info_url,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10.0
            )
            user_info_response.raise_for_status()
            kakao_user_data = user_info_response.json()
        except httpx.HTTPStatusError as e:
            logger.warning("Kakao user info fetch failed: %s", e.response.text)
            raise HTTPException(status_code=400, detail="Kakao authentication failed") from e
        except httpx.RequestError as e:
            logger.warning("Failed to connect to Kakao: %s", e)
            raise HTTPException(status_code=503, detail="Unable to reach Kakao. Please try again later.") from e

    # Step 3: Extract Kakao user ID and email
    kakao_user_id = str(kakao_user_data.get("id"))
    if not kakao_user_id:
        raise HTTPException(status_code=400, detail="Kakao user ID not found")
    
    # Extract email from kakao_account if available
    kakao_account = kakao_user_data.get("kakao_account", {})
    kakao_email: Optional[str] = None
    if kakao_account.get("has_email") and kakao_account.get("email"):
        kakao_email = kakao_account.get("email")
    
    # Extract profile image URL and display name from Kakao
    kakao_avatar_url: Optional[str] = None
    kakao_display_name: Optional[str] = None
    kakao_profile = kakao_account.get("profile", {})
    if kakao_profile.get("profile_image_url"):
        kakao_avatar_url = kakao_profile.get("profile_image_url")
    elif kakao_user_data.get("properties", {}).get("profile_image"):
        kakao_avatar_url = kakao_user_data.get("properties", {}).get("profile_image")
    if kakao_profile.get("nickname"):
        kakao_display_name = kakao_profile.get("nickname")

    # Step 4: Look up or create user
    # First, check if user exists with provider='kakao' and provider_user_id
    user = db.query(User).filter(
        User.provider == 'kakao',
        User.provider_user_id == kakao_user_id,
        User.is_deleted == False
    ).first()
    
    if user:
        # Existing Kakao user - update last_login, avatar_url, display_name if provided
        user.last_login = datetime.utcnow()
        if kakao_avatar_url:
            user.avatar_url = kakao_avatar_url
        if kakao_display_name:
            user.display_name = kakao_display_name
        db.commit()
    else:
        # New user - check for email conflict with any existing account
        if kakao_email:
            existing_email_user = db.query(User).filter(
                User.email == kakao_email,
                User.is_deleted == False,
            ).first()
            if existing_email_user:
                _provider = existing_email_user.provider
                display = {"email": "email", "kakao": "Kakao", "google": "Google"}.get(
                    _provider, _provider
                )
                raise HTTPException(
                    status_code=409,
                    detail=f"Email already registered. Please log in with {display} first.",
                )

        # Create new Kakao user
        user_email = kakao_email if kakao_email else f"kakao_{kakao_user_id}@kakao.local"
        
        user = User(
            email=user_email,
            password_hash=None,  # OAuth users don't have passwords
            provider='kakao',
            provider_user_id=kakao_user_id,
            avatar_url=kakao_avatar_url,
            display_name=kakao_display_name,
            preferred_lang=None,
            theme=None,
            is_guest=False,
            is_deleted=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Step 5: Create and return JWT token
    access_token_expires = timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    jwt_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )

    return LoginResponse(token=jwt_token)


@router.post("/google", response_model=LoginResponse)
async def google_oauth(
    oauth_data: GoogleOAuthRequest,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback and authenticate user."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    # Step 1: Exchange authorization code for access token (use server config, not request body)
    if not settings.GOOGLE_REDIRECT_URI:
        raise HTTPException(status_code=500, detail="Google redirect URI not configured")
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "grant_type": "authorization_code",
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "code": oauth_data.code,
    }

    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(
                token_url,
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=10.0,
            )
            token_response.raise_for_status()
            token_result = token_response.json()
            google_access_token = token_result.get("access_token")

            if not google_access_token:
                raise HTTPException(status_code=400, detail="Google authentication failed")
        except httpx.HTTPStatusError as e:
            logger.warning("Google token exchange failed: %s", e.response.text)
            raise HTTPException(status_code=400, detail="Google authentication failed") from e
        except httpx.RequestError as e:
            logger.warning("Failed to connect to Google: %s", e)
            raise HTTPException(status_code=503, detail="Unable to reach Google. Please try again later.") from e

        # Step 2: Fetch user info from Google
        user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        try:
            user_info_response = await client.get(
                user_info_url,
                headers={"Authorization": f"Bearer {google_access_token}"},
                timeout=10.0,
            )
            user_info_response.raise_for_status()
            google_user_data = user_info_response.json()
        except httpx.HTTPStatusError as e:
            logger.warning("Google user info fetch failed: %s", e.response.text)
            raise HTTPException(status_code=400, detail="Google authentication failed") from e
        except httpx.RequestError as e:
            logger.warning("Failed to connect to Google: %s", e)
            raise HTTPException(status_code=503, detail="Unable to reach Google. Please try again later.") from e

    # Step 3: Extract Google user ID, email, and avatar
    google_user_id = google_user_data.get("id")
    if not google_user_id:
        raise HTTPException(status_code=400, detail="Google user ID not found")

    google_email: Optional[str] = google_user_data.get("email")
    google_avatar_url: Optional[str] = google_user_data.get("picture")
    google_display_name: Optional[str] = google_user_data.get("name")

    # Step 4: Look up or create user
    user = db.query(User).filter(
        User.provider == "google",
        User.provider_user_id == str(google_user_id),
        User.is_deleted == False,
    ).first()

    if user:
        # Existing Google user — refresh last_login, avatar, display_name
        user.last_login = datetime.utcnow()
        if google_avatar_url:
            user.avatar_url = google_avatar_url
        if google_display_name:
            user.display_name = google_display_name
        db.commit()
    else:
        # New Google user — guard against email conflict with any existing account
        if google_email:
            existing_email_user = db.query(User).filter(
                User.email == google_email,
                User.is_deleted == False,
            ).first()
            if existing_email_user:
                _provider = existing_email_user.provider
                display = {"email": "email", "kakao": "Kakao", "google": "Google"}.get(
                    _provider, _provider
                )
                raise HTTPException(
                    status_code=409,
                    detail=f"Email already registered. Please log in with {display} first.",
                )

        user_email = google_email if google_email else f"google_{google_user_id}@google.local"

        user = User(
            email=user_email,
            password_hash=None,  # OAuth users don't have passwords
            provider="google",
            provider_user_id=str(google_user_id),
            avatar_url=google_avatar_url,
            display_name=google_display_name,
            preferred_lang=None,
            theme=None,
            is_guest=False,
            is_deleted=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Step 5: Create and return JWT token
    access_token_expires = timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    jwt_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires,
    )

    return LoginResponse(token=jwt_token)
