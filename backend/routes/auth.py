"""Authentication routes."""
import uuid
from datetime import datetime, timezone, timedelta

from email_validator import EmailNotValidError, validate_email
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks

from database import db
from models.schemas import (
    ModeratorCreate, ModeratorLogin, PasswordChange, PasswordReset,
    PasswordResetRequest, PasswordResetByEmail, ModeratorEmailUpdate, Token, Moderator
)
from utils.auth import (
    pwd_context, create_access_token, get_current_moderator, require_admin,
    validate_password_strength, check_password_history, PASSWORD_HISTORY_COUNT,
    MAX_LOGIN_ATTEMPTS
)
from utils.email import send_moderator_email_confirmation

router = APIRouter(prefix="/auth", tags=["Authentication"])

def normalize_email_address(email: str) -> str:
    """Validate and normalize email address."""
    try:
        result = validate_email(email)
        return result.email.lower()
    except EmailNotValidError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/register", response_model=dict)
async def register_moderator(moderator: ModeratorCreate, background_tasks: BackgroundTasks):
    """Register a new moderator."""
    # Check if username already exists
    existing = await db.moderators.find_one({"username": moderator.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")

    normalized_email = normalize_email_address(moderator.email)

    existing_email = await db.moderators.find_one({"email": normalized_email}, {"_id": 0})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate password strength
    is_valid, message = validate_password_strength(moderator.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Hash password
    hashed_password = pwd_context.hash(moderator.password)
    
    # Create moderator with must_change_password=True for new users
    mod_obj = Moderator(
        username=moderator.username,
        email=normalized_email,
        hashed_password=hashed_password,
        role=moderator.role,
        must_change_password=True
    )
    doc = mod_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.moderators.insert_one(doc)
    background_tasks.add_task(send_moderator_email_confirmation, normalized_email, moderator.username)
    return {"message": "Moderator registered successfully", "username": moderator.username, "role": moderator.role}


@router.post("/login", response_model=Token)
async def login_moderator(credentials: ModeratorLogin):
    """Login a moderator."""
    # Find moderator
    moderator = await db.moderators.find_one({"username": credentials.username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if moderator.get("locked_at"):
        raise HTTPException(status_code=401, detail="Account is locked due to failed login attempts. Contact an admin.")
    
    # Check if account is disabled
    if moderator.get("status", "active") == "disabled":
        raise HTTPException(status_code=401, detail="Account has been disabled. Contact administrator.")
    
    # Verify password
    if not pwd_context.verify(credentials.password, moderator["hashed_password"]):
        failed_attempts = moderator.get("failed_login_attempts", 0) + 1
        updates = {"failed_login_attempts": failed_attempts}
        if failed_attempts >= MAX_LOGIN_ATTEMPTS:
            updates["locked_at"] = datetime.now(timezone.utc).isoformat()
        await db.moderators.update_one(
            {"username": credentials.username},
            {"$set": updates}
        )
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if moderator.get("failed_login_attempts", 0) > 0 or moderator.get("locked_at"):
        await db.moderators.update_one(
            {"username": credentials.username},
            {"$set": {"failed_login_attempts": 0, "locked_at": None}}
        )

    if credentials.email and moderator.get("email"):
        normalized_email = normalize_email_address(credentials.email)
        if moderator.get("email", "").lower() != normalized_email:
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
        "is_training_manager": moderator.get("is_training_manager", False),
        "needs_email": not bool(moderator.get("email"))
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


@router.post("/request-password-reset")
async def request_password_reset(request: PasswordResetRequest):
    """Request a password reset via email."""
    normalized_email = normalize_email_address(request.email)
    moderator = await db.moderators.find_one({"email": normalized_email}, {"_id": 0})
    if moderator:
        reset_token = str(uuid.uuid4())
        reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.moderators.update_one(
            {"email": normalized_email},
            {"$set": {
                "password_reset_token": reset_token,
                "password_reset_expires": reset_expires.isoformat()
            }}
        )
        # TODO: send reset_token via email integration.
    return {"message": "If the email exists, a reset link will be sent."}


@router.post("/reset-password-by-email")
async def reset_password_by_email(payload: PasswordResetByEmail):
    """Reset password using a token sent via email."""
    moderator = await db.moderators.find_one(
        {"password_reset_token": payload.token},
        {"_id": 0}
    )
    if not moderator:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    expires_raw = moderator.get("password_reset_expires")
    if not expires_raw:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    expires = datetime.fromisoformat(expires_raw)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    is_valid, message = validate_password_strength(payload.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)

    password_history = moderator.get("password_history", [])
    if not check_password_history(payload.new_password, password_history):
        raise HTTPException(status_code=400, detail="Password has been used recently. Please choose a different password.")

    new_hashed = pwd_context.hash(payload.new_password)
    new_history = [moderator["hashed_password"]] + password_history
    new_history = new_history[:PASSWORD_HISTORY_COUNT]

    await db.moderators.update_one(
        {"email": moderator["email"]},
        {"$set": {
            "hashed_password": new_hashed,
            "password_history": new_history,
            "must_change_password": False,
            "password_reset_token": None,
            "password_reset_expires": None
        }}
    )

    return {"message": "Password reset successfully"}


@router.post("/set-email")
async def set_moderator_email(payload: ModeratorEmailUpdate, current_user: dict = Depends(get_current_moderator), background_tasks: BackgroundTasks):
    """Set or update the current moderator's email."""
    normalized_email = normalize_email_address(payload.email)
    existing_email = await db.moderators.find_one({"email": normalized_email}, {"_id": 0})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    result = await db.moderators.update_one(
        {"username": current_user["username"]},
        {"$set": {"email": normalized_email}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Moderator not found")

    background_tasks.add_task(send_moderator_email_confirmation, normalized_email, current_user["username"])

    return {"message": "Email saved successfully"}
