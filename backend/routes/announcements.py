"""Announcement routes."""
from fastapi import APIRouter, HTTPException, Depends
from typing import List

from database import db
from models.schemas import Announcement, AnnouncementCreate
from utils.auth import get_current_moderator

router = APIRouter(prefix="/announcements", tags=["Announcements"])


@router.get("")
async def get_announcements():
    """Get all active announcements - accessible to everyone."""
    announcements = await db.announcements.find({"is_active": True}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return announcements


@router.get("/all")
async def get_all_announcements(current_user: dict = Depends(get_current_moderator)):
    """Get all announcements including inactive - requires login."""
    if current_user["role"] not in ["admin", "mmod"]:
        raise HTTPException(status_code=403, detail="Only Admin and MMOD can view all announcements")
    announcements = await db.announcements.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return announcements


@router.get("/dismissed")
async def get_dismissed_announcements(current_user: dict = Depends(get_current_moderator)):
    """Get list of announcement IDs the current user has dismissed."""
    user_prefs = await db.user_preferences.find_one(
        {"username": current_user["username"]}, 
        {"_id": 0, "dismissed_announcements": 1}
    )
    if user_prefs and "dismissed_announcements" in user_prefs:
        return user_prefs["dismissed_announcements"]
    return []


@router.post("/{announcement_id}/dismiss")
async def dismiss_announcement(announcement_id: str, current_user: dict = Depends(get_current_moderator)):
    """Mark an announcement as dismissed/seen by the current user."""
    # Verify announcement exists
    announcement = await db.announcements.find_one({"id": announcement_id}, {"_id": 0})
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Add to user's dismissed list
    await db.user_preferences.update_one(
        {"username": current_user["username"]},
        {"$addToSet": {"dismissed_announcements": announcement_id}},
        upsert=True
    )
    
    return {"message": "Announcement dismissed"}


@router.post("/{announcement_id}/undismiss")
async def undismiss_announcement(announcement_id: str, current_user: dict = Depends(get_current_moderator)):
    """Remove an announcement from the dismissed list."""
    await db.user_preferences.update_one(
        {"username": current_user["username"]},
        {"$pull": {"dismissed_announcements": announcement_id}}
    )
    
    return {"message": "Announcement restored"}


@router.post("")
async def create_announcement(announcement: AnnouncementCreate, current_user: dict = Depends(get_current_moderator)):
    """Create a new announcement."""
    if current_user["role"] not in ["admin", "mmod"]:
        raise HTTPException(status_code=403, detail="Only Admin and MMOD can create announcements")
    
    new_announcement = Announcement(
        title=announcement.title,
        message=announcement.message,
        created_by=current_user["username"]
    )
    await db.announcements.insert_one(new_announcement.model_dump())
    return {"message": "Announcement created successfully", "id": new_announcement.id}


@router.delete("/{announcement_id}")
async def delete_announcement(announcement_id: str, current_user: dict = Depends(get_current_moderator)):
    """Delete an announcement."""
    if current_user["role"] not in ["admin", "mmod"]:
        raise HTTPException(status_code=403, detail="Only Admin and MMOD can delete announcements")
    
    result = await db.announcements.delete_one({"id": announcement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"message": "Announcement deleted successfully"}


@router.patch("/{announcement_id}/toggle")
async def toggle_announcement(announcement_id: str, current_user: dict = Depends(get_current_moderator)):
    """Toggle announcement active status."""
    if current_user["role"] not in ["admin", "mmod"]:
        raise HTTPException(status_code=403, detail="Only Admin and MMOD can toggle announcements")
    
    announcement = await db.announcements.find_one({"id": announcement_id}, {"_id": 0})
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    new_status = not announcement.get("is_active", True)
    await db.announcements.update_one({"id": announcement_id}, {"$set": {"is_active": new_status}})
    return {"message": f"Announcement {'activated' if new_status else 'deactivated'} successfully"}
