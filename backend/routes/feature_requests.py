"""Feature request routes."""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid

from database import db
from utils.auth import get_current_moderator

router = APIRouter(prefix="/feature-requests", tags=["Feature Requests"])


class FeatureRequestCreate(BaseModel):
    title: str
    description: str
    category: str = "general"  # general, ui, functionality, bug, other


class FeatureRequestUpdate(BaseModel):
    status: Optional[str] = None  # pending, reviewed, approved, rejected, implemented
    admin_notes: Optional[str] = None


class FeatureRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: str
    submitted_by: str
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"
    admin_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None


@router.post("")
async def create_feature_request(request: FeatureRequestCreate, current_user: dict = Depends(get_current_moderator)):
    """Submit a new feature request."""
    feature_request = FeatureRequest(
        title=request.title,
        description=request.description,
        category=request.category,
        submitted_by=current_user["username"]
    )
    
    doc = feature_request.model_dump()
    doc['submitted_at'] = doc['submitted_at'].isoformat()
    
    await db.feature_requests.insert_one(doc)
    
    return {"message": "Feature request submitted successfully", "id": feature_request.id}


@router.get("")
async def get_feature_requests(current_user: dict = Depends(get_current_moderator)):
    """Get feature requests. All users see their own, admins/mmods/developers see all."""
    can_view_all = current_user["role"] in ["admin", "mmod", "developer"]
    
    if can_view_all:
        requests = await db.feature_requests.find({}, {"_id": 0}).sort("submitted_at", -1).to_list(500)
    else:
        # Regular users only see their own requests
        requests = await db.feature_requests.find(
            {"submitted_by": current_user["username"]}, 
            {"_id": 0}
        ).sort("submitted_at", -1).to_list(100)
    
    return requests


@router.get("/all")
async def get_all_feature_requests(current_user: dict = Depends(get_current_moderator)):
    """Get all feature requests (admin/mmod/developer only)."""
    if current_user["role"] not in ["admin", "mmod", "developer"]:
        raise HTTPException(status_code=403, detail="Only Admin, MMOD, and Developer can view all feature requests")
    
    requests = await db.feature_requests.find({}, {"_id": 0}).sort("submitted_at", -1).to_list(500)
    return requests


@router.patch("/{request_id}")
async def update_feature_request(request_id: str, update: FeatureRequestUpdate, current_user: dict = Depends(get_current_moderator)):
    """Update a feature request status (admin/mmod/developer only)."""
    if current_user["role"] not in ["admin", "mmod", "developer"]:
        raise HTTPException(status_code=403, detail="Only Admin, MMOD, and Developer can update feature requests")
    
    existing = await db.feature_requests.find_one({"id": request_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Feature request not found")
    
    update_data = {}
    if update.status:
        if update.status not in ["pending", "reviewed", "approved", "rejected", "implemented"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        update_data["status"] = update.status
    if update.admin_notes is not None:
        update_data["admin_notes"] = update.admin_notes
    
    update_data["reviewed_by"] = current_user["username"]
    update_data["reviewed_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.feature_requests.update_one(
        {"id": request_id},
        {"$set": update_data}
    )
    
    return {"message": "Feature request updated successfully"}


@router.delete("/{request_id}")
async def delete_feature_request(request_id: str, current_user: dict = Depends(get_current_moderator)):
    """Delete a feature request (admin only or own request)."""
    existing = await db.feature_requests.find_one({"id": request_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Feature request not found")
    
    # Allow deletion if admin or if it's their own request
    if current_user["role"] != "admin" and existing["submitted_by"] != current_user["username"]:
        raise HTTPException(status_code=403, detail="You can only delete your own feature requests")
    
    await db.feature_requests.delete_one({"id": request_id})
    return {"message": "Feature request deleted successfully"}
