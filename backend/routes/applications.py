"""Application management routes."""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from datetime import datetime, timezone

from database import db
from models.schemas import (
    Application, ApplicationCreate, ApplicationUpdate, TeamApprovalUpdate,
    VoteCreate, CommentCreate, AuditLog, ApplicationSettings, ApplicationSettingsUpdate
)
from utils.auth import get_current_moderator, require_admin, has_any_role
from utils.email import (
    send_application_confirmation_email,
    send_application_approved_email,
    send_application_rejected_email,
    send_application_waitlist_email,
    send_application_waitlist_to_approved_email
)

router = APIRouter(prefix="/applications", tags=["Applications"])

async def require_application_status_manager(current_user: dict = Depends(get_current_moderator)):
    """Allow elevated moderators and leader-permission users to change application statuses."""
    allowed_roles = {"admin", "mmod"}
    has_leader_access = current_user.get("is_in_game_leader", False) or current_user.get("is_discord_leader", False)
    if current_user.get("role") not in allowed_roles and not current_user.get("is_admin") and not has_leader_access:
        raise HTTPException(status_code=403, detail="Not authorized to change application statuses")
    return current_user



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
    # Check if applications are enabled
    settings = await db.application_settings.find_one({"id": "app_settings"}, {"_id": 0})
    if settings and not settings.get("applications_enabled", True):
        raise HTTPException(
            status_code=403, 
            detail="Applications are currently closed. We do not have any open vacancies at this time. Please try again later."
        )
    
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
async def update_application_status(application_id: str, update: ApplicationUpdate, background_tasks: BackgroundTasks, current_user: dict = Depends(require_application_status_manager)):
    """Update application status."""
    if update.status not in ["approved", "rejected", "pending", "awaiting_review", "waiting", "in_game_approved", "discord_approved"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved', 'rejected', 'pending', 'awaiting_review', 'waiting', 'in_game_approved', or 'discord_approved'")
    
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


@router.post("/{application_id}/team-approve")
async def team_approve_application(application_id: str, update: TeamApprovalUpdate, current_user: dict = Depends(get_current_moderator)):
    """Discord or In-Game leader approves an application for their team."""
    if update.approval_type not in ["discord", "in_game"]:
        raise HTTPException(status_code=400, detail="approval_type must be 'discord' or 'in_game'")
    
    if not update.comment or not update.comment.strip():
        raise HTTPException(status_code=400, detail="A comment is required when approving")
    
    # Check permissions
    moderator = await db.moderators.find_one({"username": current_user['username']}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    is_discord_leader = moderator.get("is_discord_leader", False)
    is_in_game_leader = moderator.get("is_in_game_leader", False)
    is_admin = moderator.get("is_admin", False)
    
    if update.approval_type == "discord" and not is_discord_leader and not is_admin:
        raise HTTPException(status_code=403, detail="Only Discord Leaders can give Discord approval")
    if update.approval_type == "in_game" and not is_in_game_leader and not is_admin:
        raise HTTPException(status_code=403, detail="Only In-Game Leaders can give In-Game approval")
    
    existing_app = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not existing_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Set the appropriate approval flag
    update_fields = {}
    if update.approval_type == "discord":
        update_fields["discord_approved"] = True
        update_fields["discord_approved_by"] = current_user['username']
        approval_label = "DISCORD APPROVED"
    else:
        update_fields["in_game_approved"] = True
        update_fields["in_game_approved_by"] = current_user['username']
        approval_label = "IN-GAME APPROVED"
    
    await db.applications.update_one(
        {"id": application_id},
        {"$set": update_fields}
    )
    
    # Add comment
    comment = {
        "moderator": current_user['username'],
        "comment": f"[{approval_label}] {update.comment}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.applications.update_one(
        {"id": application_id},
        {"$push": {"comments": comment}}
    )
    
    # Create audit log
    audit_log = AuditLog(
        action="team_approved",
        application_id=application_id,
        application_name=existing_app.get('name', 'Unknown'),
        performed_by=current_user['username'],
        comment=update.comment,
        old_status=existing_app.get('status', 'unknown'),
        new_status=approval_label.lower().replace(" ", "_")
    )
    audit_doc = audit_log.model_dump()
    audit_doc['created_at'] = audit_doc['created_at'].isoformat()
    await db.audit_logs.insert_one(audit_doc)
    
    # Get updated application
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    convert_application_timestamps(application)
    
    return application


@router.post("/{application_id}/team-unapprove")
async def team_unapprove_application(application_id: str, update: TeamApprovalUpdate, current_user: dict = Depends(get_current_moderator)):
    """Discord or In-Game leader removes their team approval."""
    if update.approval_type not in ["discord", "in_game"]:
        raise HTTPException(status_code=400, detail="approval_type must be 'discord' or 'in_game'")
    
    # Check permissions
    moderator = await db.moderators.find_one({"username": current_user['username']}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    is_discord_leader = moderator.get("is_discord_leader", False)
    is_in_game_leader = moderator.get("is_in_game_leader", False)
    is_admin = moderator.get("is_admin", False)
    
    if update.approval_type == "discord" and not is_discord_leader and not is_admin:
        raise HTTPException(status_code=403, detail="Only Discord Leaders can remove Discord approval")
    if update.approval_type == "in_game" and not is_in_game_leader and not is_admin:
        raise HTTPException(status_code=403, detail="Only In-Game Leaders can remove In-Game approval")
    
    existing_app = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not existing_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Remove the appropriate approval flag
    update_fields = {}
    if update.approval_type == "discord":
        update_fields["discord_approved"] = False
        update_fields["discord_approved_by"] = None
        approval_label = "DISCORD APPROVAL REMOVED"
    else:
        update_fields["in_game_approved"] = False
        update_fields["in_game_approved_by"] = None
        approval_label = "IN-GAME APPROVAL REMOVED"
    
    await db.applications.update_one(
        {"id": application_id},
        {"$set": update_fields}
    )
    
    # Add comment
    comment = {
        "moderator": current_user['username'],
        "comment": f"[{approval_label}] {update.comment or 'Approval removed'}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.applications.update_one(
        {"id": application_id},
        {"$push": {"comments": comment}}
    )
    
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


# ============= Application Settings Endpoints =============

@router.get("/settings/status")
async def get_application_settings():
    """Get application settings (public endpoint for checking if applications are enabled)."""
    settings = await db.application_settings.find_one({"id": "app_settings"}, {"_id": 0})
    if not settings:
        # Return default settings if none exist
        return {"applications_enabled": True}
    return {"applications_enabled": settings.get("applications_enabled", True)}


@router.get("/settings/admin", response_model=ApplicationSettings)
async def get_application_settings_admin(current_user: dict = Depends(require_admin)):
    """Get full application settings (admin only)."""
    settings = await db.application_settings.find_one({"id": "app_settings"}, {"_id": 0})
    if not settings:
        # Create default settings
        default_settings = ApplicationSettings()
        doc = default_settings.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.application_settings.insert_one(doc)
        return default_settings
    
    # Convert timestamp if needed
    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    
    return ApplicationSettings(**settings)


@router.patch("/settings/admin")
async def update_application_settings(update: ApplicationSettingsUpdate, current_user: dict = Depends(require_admin)):
    """Update application settings (admin only)."""
    now = datetime.now(timezone.utc)
    
    await db.application_settings.update_one(
        {"id": "app_settings"},
        {
            "$set": {
                "applications_enabled": update.applications_enabled,
                "updated_by": current_user['username'],
                "updated_at": now.isoformat()
            }
        },
        upsert=True
    )
    
    return {
        "message": f"Applications {'enabled' if update.applications_enabled else 'disabled'} successfully",
        "applications_enabled": update.applications_enabled
    }
