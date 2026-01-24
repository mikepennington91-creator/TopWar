"""Moderator management routes."""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List
from datetime import datetime
from email_validator import EmailNotValidError, validate_email

from database import db
from models.schemas import (
    ModeratorInfo, ModeratorStatusUpdate, ModeratorRoleUpdate,
    ModeratorUsernameUpdate, ModeratorTrainingManagerUpdate,
    ModeratorAdminUpdate, ModeratorApplicationViewerUpdate,
    ModeratorEmailUpdate
)
from utils.auth import (
    get_current_moderator, require_admin, require_admin_role, get_role_rank,
    can_modify_role, get_assignable_roles
)
from utils.email import send_moderator_email_confirmation

router = APIRouter(prefix="/moderators", tags=["Moderators"])


def normalize_email_address(email: str) -> str:
    """Validate and normalize email address."""
    try:
        result = validate_email(email)
        return result.email.lower()
    except EmailNotValidError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=List[ModeratorInfo])
async def get_moderators(current_user: dict = Depends(get_current_moderator)):
    """Get all moderators."""
    moderators = await db.moderators.find({}, {"_id": 0, "hashed_password": 0}).to_list(1000)
    
    for mod in moderators:
        if isinstance(mod.get('created_at'), str):
            mod['created_at'] = datetime.fromisoformat(mod['created_at'])
        if isinstance(mod.get('last_login'), str):
            mod['last_login'] = datetime.fromisoformat(mod['last_login'])
    
    return moderators


@router.patch("/{username}/status")
async def update_moderator_status(username: str, status_update: ModeratorStatusUpdate, current_user: dict = Depends(require_admin)):
    """Update moderator status (enable/disable)."""
    if status_update.status not in ["active", "disabled"]:
        raise HTTPException(status_code=400, detail="Status must be 'active' or 'disabled'")
    
    if username == current_user["username"]:
        raise HTTPException(status_code=400, detail="You cannot disable your own account")
    
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    # MMODs can only modify users with lower rank
    if current_user["role"] != "admin":
        current_rank = get_role_rank(current_user["role"])
        target_rank = get_role_rank(moderator.get("role", "moderator"))
        if current_rank <= target_rank:
            raise HTTPException(status_code=403, detail="You can only modify users with lower rank than yours")
    
    await db.moderators.update_one(
        {"username": username},
        {"$set": {"status": status_update.status}}
    )
    
    action = "enabled" if status_update.status == "active" else "disabled"
    return {"message": f"Moderator {username} has been {action}"}


@router.delete("/{username}")
async def delete_moderator(username: str, current_user: dict = Depends(require_admin)):
    """Delete a moderator."""
    if username == current_user["username"]:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    if moderator.get("is_admin", False):
        admin_count = await db.moderators.count_documents({"is_admin": True})
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last admin. System must have at least one admin.")
    
    result = await db.moderators.delete_one({"username": username})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    return {"message": f"Moderator {username} has been deleted successfully"}


@router.patch("/{username}/role")
async def update_moderator_role(username: str, role_update: ModeratorRoleUpdate, current_user: dict = Depends(get_current_moderator)):
    """Update moderator role."""
    if role_update.role not in ["admin", "mmod", "moderator", "lmod", "smod", "developer"]:
        raise HTTPException(status_code=400, detail="Role must be 'admin', 'mmod', 'moderator', 'lmod', 'smod', or 'developer'")
    
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    is_self = current_user["username"] == username
    target_role = moderator.get("role", "moderator")
    
    if not can_modify_role(current_user["role"], target_role, is_self):
        raise HTTPException(status_code=403, detail="You do not have permission to modify this user's role")
    
    assignable_roles = get_assignable_roles(current_user["role"])
    if role_update.role not in assignable_roles:
        raise HTTPException(status_code=403, detail=f"You cannot assign the '{role_update.role}' role")
    
    await db.moderators.update_one(
        {"username": username},
        {"$set": {"role": role_update.role}}
    )
    
    return {"message": f"Moderator {username} role updated to {role_update.role}"}


@router.patch("/{username}/username")
async def update_moderator_username(username: str, username_update: ModeratorUsernameUpdate, current_user: dict = Depends(require_admin)):
    """Change a moderator's username."""
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    existing = await db.moderators.find_one({"username": username_update.new_username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    await db.moderators.update_one(
        {"username": username},
        {"$set": {"username": username_update.new_username}}
    )
    
    return {"message": f"Username changed from {username} to {username_update.new_username}"}


async def require_mmod_or_admin(current_user: dict = Depends(get_current_moderator)):
    """Require MMOD or Admin role to update another user's email."""
    if current_user["role"] not in ["admin", "mmod"] and not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="MMOD or Admin access required to change emails")
    return current_user


@router.patch("/{username}/email")
async def update_moderator_email(
    username: str,
    email_update: ModeratorEmailUpdate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_mmod_or_admin)
):
    """Change a moderator's email address. MMODs and Admins can change emails."""
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")

    normalized_email = normalize_email_address(email_update.email)
    existing_email = await db.moderators.find_one({"email": normalized_email}, {"_id": 0})
    if existing_email and existing_email.get("username") != username:
        raise HTTPException(status_code=400, detail="Email already registered")

    await db.moderators.update_one(
        {"username": username},
        {"$set": {"email": normalized_email}}
    )

    background_tasks.add_task(send_moderator_email_confirmation, normalized_email, username)

    return {"message": f"Email updated for {username}"}


@router.patch("/{username}/training-manager")
async def update_training_manager(username: str, tm_update: ModeratorTrainingManagerUpdate, current_user: dict = Depends(require_admin)):
    """Toggle training manager status."""
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    await db.moderators.update_one(
        {"username": username},
        {"$set": {"is_training_manager": tm_update.is_training_manager}}
    )
    
    status = "enabled" if tm_update.is_training_manager else "disabled"
    return {"message": f"Training Manager status {status} for {username}"}


@router.patch("/{username}/admin")
async def update_admin(username: str, admin_update: ModeratorAdminUpdate, current_user: dict = Depends(require_admin)):
    """Toggle admin status."""
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    if not admin_update.is_admin and moderator.get("is_admin", False):
        admin_count = await db.moderators.count_documents({"is_admin": True})
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot disable the last admin. System must have at least one admin.")
    
    await db.moderators.update_one(
        {"username": username},
        {"$set": {"is_admin": admin_update.is_admin}}
    )
    
    status = "enabled" if admin_update.is_admin else "disabled"
    return {"message": f"Admin status {status} for {username}"}


@router.patch("/{username}/unlock")
async def unlock_account(username: str, current_user: dict = Depends(require_admin_role)):
    """Unlock a locked account."""
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    await db.moderators.update_one(
        {"username": username},
        {"$set": {"locked_at": None, "failed_login_attempts": 0}}
    )
    
    return {"message": f"Account unlocked for {username}"}


@router.patch("/{username}/application-viewer")
async def update_application_viewer(username: str, viewer_update: ModeratorApplicationViewerUpdate, current_user: dict = Depends(require_admin)):
    """Toggle application viewer permission."""
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    await db.moderators.update_one(
        {"username": username},
        {"$set": {"can_view_applications": viewer_update.can_view_applications}}
    )
    
    status = "enabled" if viewer_update.can_view_applications else "disabled"
    return {"message": f"Application Viewer status {status} for {username}"}
