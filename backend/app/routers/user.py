"""
User router - GET /api/user/me and PATCH /api/user/settings
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserResponse, UserSettingsUpdate, SettingsResponse
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/me", response_model=UserResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user's profile data.
    Returns: id, email, preferred_lang, theme, created_at
    """
    return current_user


@router.patch("/settings", response_model=SettingsResponse)
async def update_user_settings(
    settings_data: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user preferences (language or theme).
    Input: preferred_lang (fa/en/kr), theme (light/dark)
    Output: status confirmation
    """
    # Update preferred language if provided
    if settings_data.preferred_lang is not None:
        current_user.preferred_lang = settings_data.preferred_lang
    
    # Update theme if provided
    if settings_data.theme is not None:
        current_user.theme = settings_data.theme
    
    db.commit()
    db.refresh(current_user)
    
    return SettingsResponse(status="Settings updated")
