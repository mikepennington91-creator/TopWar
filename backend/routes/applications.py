"""Application management routes."""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from datetime import datetime, timezone

from database import db
from models.schemas import (
    Application, ApplicationCreate, ApplicationUpdate,
    VoteCreate, CommentCreate, AuditLog, ApplicationSettings, ApplicationSettingsUpdate
)
from utils.auth import get_current_moderator, require_admin
from utils.email import (
    send_application_confirmation_email,
    send_application_approved_email,
    send_application_rejected_email,
    send_application_waitlist_email,
    send_application_waitlist_to_approved_email
)

router = APIRouter(prefix="/applications", tags=["Applications"])


def convert_application_timestamps(app: dict) -> dict:
    """Convert ISO string timestamps to datetime objects."""
    if isinstance(app.get('submitted_at'), str):
        app['submitted_at'] = datetime.fromisoformat(app['submitted_at'])
    if app.get('reviewed_at') and isinstance(app['reviewed_at'], str):
        app['reviewed_at'] = datetime.fromisoformat(app['reviewed_at'])
    for vote in app.get('votes', []):
        if isinstance(vote.get('timestamp'), str):
            vote['timestamp'] = datetime.fromisoformat(vote['timestamp'])
    for comment in app.get('comments', []):
        if isinstance(comment.get('timestamp'), str):
            comment['timestamp'] = datetime.fromisoformat(comment['timestamp'])
    return app


@router.post("", response_model=Application)
async def submit_application(app_data: ApplicationCreate, background_tasks: BackgroundTasks):
    """Submit a new application."""
    app_obj = Application(**app_data.model_dump())
    doc = app_obj.model_dump()
    doc['submitted_at'] = doc['submitted_at'].isoformat()
    
    await db.applications.insert_one(doc)
    
    # Send confirmation email in background
    background_tasks.add_task(send_application_confirmation_email, app_data.email, app_data.name)
    
    return app_obj


@router.get("", response_model=List[Application])
async def get_applications(search: Optional[str] = None, current_user: dict = Depends(get_current_moderator)):
    """Get all applications."""
    # Check if user can view applications
    moderator = await db.moderators.find_one({"username": current_user['username']}, {"_id": 0})
    if moderator and not moderator.get('can_view_applications', True):
        raise HTTPException(status_code=403, detail="You do not have permission to view applications")
    
    # Check if user is training manager (for name visibility)
    is_training_manager = moderator.get('is_training_manager', False) if moderator else False
    
    query = {}
    if search:
        query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"discord_handle": {"$regex": search, "$options": "i"}},
                {"ingame_name": {"$regex": search, "$options": "i"}},
                {"server": {"$regex": search, "$options": "i"}}
            ]
        }
    
    applications = await db.applications.find(query, {"_id": 0}).sort("submitted_at", -1).to_list(1000)
    
    for app in applications:
        convert_application_timestamps(app)
        # Hide real name if not training manager
        if not is_training_manager:
            app['name'] = "[Hidden - Training Manager Only]"
    
    return applications


@router.get("/{application_id}", response_model=Application)
async def get_application(application_id: str, current_user: dict = Depends(get_current_moderator)):
    """Get a specific application."""
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if user is training manager (for name visibility)
    moderator = await db.moderators.find_one({"username": current_user['username']}, {"_id": 0})
    is_training_manager = moderator.get('is_training_manager', False) if moderator else False
    
    # Track view
    username = current_user['username']
    if username not in application.get('viewed_by', []):
        await db.applications.update_one(
            {"id": application_id},
            {"$addToSet": {"viewed_by": username}}
        )
        if 'viewed_by' not in application:
            application['viewed_by'] = []
        application['viewed_by'].append(username)
    
    convert_application_timestamps(application)
    
    # Hide real name and email if not training manager
    if not is_training_manager:
        application['name'] = "[Hidden - Training Manager Only]"
        application['email'] = None
    
    return application


@router.post("/{application_id}/vote")
async def vote_on_application(application_id: str, vote_data: VoteCreate, current_user: dict = Depends(get_current_moderator)):
    """Vote on an application."""
    if vote_data.vote not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Vote must be 'approve' or 'reject'")
    
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    votes = application.get('votes', [])
    existing_vote = next((v for v in votes if v['moderator'] == current_user['username']), None)
    
    # Change status from awaiting_review to pending when first vote is cast
    update_fields = {}
    if application.get('status') == 'awaiting_review':
        update_fields['status'] = 'pending'
    
    if existing_vote:
        await db.applications.update_one(
            {"id": application_id, "votes.moderator": current_user['username']},
            {"$set": {
                "votes.$.vote": vote_data.vote,
                "votes.$.timestamp": datetime.now(timezone.utc).isoformat(),
                **update_fields
            }}
        )
    else:
        vote = {
            "moderator": current_user['username'],
            "vote": vote_data.vote,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        update_query = {"$push": {"votes": vote}}
        if update_fields:
            update_query["$set"] = update_fields
        
        await db.applications.update_one({"id": application_id}, update_query)
    
    return {"message": "Vote recorded successfully"}


@router.post("/{application_id}/comment")
async def comment_on_application(application_id: str, comment_data: CommentCreate, current_user: dict = Depends(get_current_moderator)):
    """Add a comment to an application."""
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    comment = {
        "moderator": current_user['username'],
        "comment": comment_data.comment,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.applications.update_one(
        {"id": application_id},
        {"$push": {"comments": comment}}
    )
    
    return {"message": "Comment added successfully", "comment": comment}


@router.patch("/{application_id}", response_model=Application)
async def update_application_status(application_id: str, update: ApplicationUpdate, background_tasks: BackgroundTasks, current_user: dict = Depends(require_admin)):
    """Update application status."""
    if update.status not in ["approved", "rejected", "pending", "awaiting_review", "waiting"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved', 'rejected', 'pending', 'awaiting_review', or 'waiting'")
    
    if not update.comment or not update.comment.strip():
        raise HTTPException(status_code=400, detail="A comment is required when changing application status")
    
    existing_app = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not existing_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    old_status = existing_app.get('status', 'awaiting_review')
    
    await db.applications.update_one(
        {"id": application_id},
        {"$set": {
            "status": update.status,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "reviewed_by": current_user['username']
        }}
    )
    
    # Add status change comment
    comment = {
        "moderator": current_user['username'],
        "comment": f"[STATUS CHANGE: {old_status.upper()} → {update.status.upper()}] {update.comment}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.applications.update_one(
        {"id": application_id},
        {"$push": {"comments": comment}}
    )
    
    # Create audit log
    audit_log = AuditLog(
        action="status_changed",
        application_id=application_id,
        application_name=existing_app.get('name', 'Unknown'),
        performed_by=current_user['username'],
        comment=update.comment,
        old_status=old_status,
        new_status=update.status
    )
    audit_doc = audit_log.model_dump()
    audit_doc['created_at'] = audit_doc['created_at'].isoformat()
    await db.audit_logs.insert_one(audit_doc)
    
    # Send email notification
    applicant_email = existing_app.get('email')
    applicant_name = existing_app.get('name', 'Applicant')
    if applicant_email:
        if update.status == "approved":
            # Check if coming from waiting list
            if old_status == "waiting":
                background_tasks.add_task(send_application_waitlist_to_approved_email, applicant_email, applicant_name, update.comment)
            else:
                # Include the manager's comment in the approval email
                background_tasks.add_task(send_application_approved_email, applicant_email, applicant_name, update.comment)
        elif update.status == "rejected":
            background_tasks.add_task(send_application_rejected_email, applicant_email, applicant_name)
        elif update.status == "waiting":
            background_tasks.add_task(send_application_waitlist_email, applicant_email, applicant_name)
    
    # Get updated application
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    convert_application_timestamps(application)
    
    return application


@router.delete("/{application_id}")
async def delete_application(application_id: str, current_user: dict = Depends(require_admin)):
    """Delete an application."""
    existing_app = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not existing_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Create audit log
    audit_log = AuditLog(
        action="deleted",
        application_id=application_id,
        application_name=existing_app.get('name', 'Unknown'),
        performed_by=current_user['username'],
        comment=f"Application deleted by {current_user['username']}",
        old_status=existing_app.get('status', 'unknown'),
        new_status="deleted"
    )
    audit_doc = audit_log.model_dump()
    audit_doc['created_at'] = audit_doc['created_at'].isoformat()
    await db.audit_logs.insert_one(audit_doc)
    
    result = await db.applications.delete_one({"id": application_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {"message": f"Application from {existing_app.get('name', 'Unknown')} deleted successfully"}
