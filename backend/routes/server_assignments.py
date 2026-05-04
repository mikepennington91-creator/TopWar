"""Server assignment routes."""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime

from database import db
from models.schemas import ServerAssignment, ServerAssignmentCreate, ServerAssignmentUpdate
from utils.auth import get_current_moderator, require_admin

router = APIRouter(prefix="/server-assignments", tags=["Server Assignments"])


@router.post("", response_model=ServerAssignment)
async def create_server_assignment(assignment: ServerAssignmentCreate, current_user: dict = Depends(get_current_moderator)):
    """Create a new server assignment."""
    assignment_obj = ServerAssignment(**assignment.model_dump(), created_by=current_user['username'])
    doc = assignment_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.server_assignments.insert_one(doc)
    return assignment_obj


@router.get("", response_model=List[ServerAssignment])
async def get_server_assignments(current_user: dict = Depends(get_current_moderator)):
    """Get all server assignments."""
    assignments = await db.server_assignments.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for assignment in assignments:
        if isinstance(assignment.get('created_at'), str):
            assignment['created_at'] = datetime.fromisoformat(assignment['created_at'])
    
    return assignments


@router.patch("/{assignment_id}")
async def update_server_assignment(assignment_id: str, update: ServerAssignmentUpdate, current_user: dict = Depends(get_current_moderator)):
    """Update server assignment end date."""
    assignment = await db.server_assignments.find_one({"id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Server assignment not found")
    
    await db.server_assignments.update_one(
        {"id": assignment_id},
        {"$set": {"end_date": update.end_date}}
    )
    
    return {"message": "End date updated successfully"}


@router.delete("/{assignment_id}")
async def delete_server_assignment(assignment_id: str, current_user: dict = Depends(require_admin)):
    """Delete a server assignment."""
    result = await db.server_assignments.delete_one({"id": assignment_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Server assignment not found")
    
    return {"message": "Server assignment deleted successfully"}
