"""Authentication routes."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

from database import db
from models.schemas import (
    ModeratorCreate, ModeratorLogin, PasswordChange, PasswordReset,
    Token, Moderator
)
from utils.auth import (
    pwd_context, create_access_token, get_current_moderator, require_admin,
    validate_password_strength, check_password_history, PASSWORD_HISTORY_COUNT
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=dict)
async def register_moderator(moderator: ModeratorCreate):
    """Register a new moderator."""
    # Check if username already exists
    existing = await db.moderators.find_one({"username": moderator.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Validate password strength
    is_valid, message = validate_password_strength(moderator.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Hash password
    hashed_password = pwd_context.hash(moderator.password)
    
    # Create moderator with must_change_password=True for new users
    mod_obj = Moderator(
        username=moderator.username,
        hashed_password=hashed_password,
        role=moderator.role,
        must_change_password=True
    )
    doc = mod_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.moderators.insert_one(doc)
    return {"message": "Moderator registered successfully", "username": moderator.username, "role": moderator.role}


@router.post("/login", response_model=Token)
async def login_moderator(credentials: ModeratorLogin):
    """Login a moderator."""
    # Find moderator
    moderator = await db.moderators.find_one({"username": credentials.username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Check if account is disabled
    if moderator.get("status", "active") == "disabled":
        raise HTTPException(status_code=401, detail="Account has been disabled. Contact administrator.")
    
    # Verify password
    if not pwd_context.verify(credentials.password, moderator["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Update last_login timestamp
    await db.moderators.update_one(
        {"username": credentials.username},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Create token - include is_admin flag in token data
    is_admin = moderator.get("is_admin", False)
    access_token = create_access_token(data={
        "sub": credentials.username, 
        "role": moderator.get("role", "moderator"),
        "is_admin": is_admin
    })
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": moderator.get("role", "moderator"),
        "username": credentials.username,
        "must_change_password": moderator.get("must_change_password", False),
        "is_admin": is_admin,
        "is_training_manager": moderator.get("is_training_manager", False)
    }


@router.patch("/change-password")
async def change_password(password_data: PasswordChange, current_user: dict = Depends(get_current_moderator)):
    """Change current user's password."""
    # Get current moderator
    moderator = await db.moderators.find_one({"username": current_user["username"]}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    # Verify old password
    if not pwd_context.verify(password_data.old_password, moderator["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Validate password strength
    is_valid, message = validate_password_strength(password_data.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Check password history
    password_history = moderator.get("password_history", [])
    if not check_password_history(password_data.new_password, password_history):
        raise HTTPException(status_code=400, detail="Password has been used recently. Please choose a different password.")
    
    # Hash new password
    new_hashed = pwd_context.hash(password_data.new_password)
    
    # Update password history (keep last 10)
    new_history = [moderator["hashed_password"]] + password_history
    new_history = new_history[:PASSWORD_HISTORY_COUNT]
    
    # Update password and clear must_change_password flag
    await db.moderators.update_one(
        {"username": current_user["username"]},
        {"$set": {
            "hashed_password": new_hashed,
            "password_history": new_history,
            "must_change_password": False
        }}
    )
    
    return {"message": "Password changed successfully"}


@router.patch("/reset-password/{username}")
async def reset_password(username: str, password_data: PasswordReset, current_user: dict = Depends(require_admin)):
    """Reset another user's password (admin only)."""
    # Check if target user exists
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    # Validate password strength
    is_valid, message = validate_password_strength(password_data.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Hash new password
    new_hashed = pwd_context.hash(password_data.new_password)
    
    # Update password history (keep last 10)
    password_history = moderator.get("password_history", [])
    new_history = [moderator["hashed_password"]] + password_history
    new_history = new_history[:PASSWORD_HISTORY_COUNT]
    
    # Update password and set must_change_password to true
    await db.moderators.update_one(
        {"username": username},
        {"$set": {
            "hashed_password": new_hashed,
            "password_history": new_history,
            "must_change_password": True
        }}
    )
    
    return {"message": f"Password reset successfully for {username}"}
