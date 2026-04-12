"""Audit log routes."""
from fastapi import APIRouter, HTTPException, Depends

from database import db
from utils.auth import get_current_moderator

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("")
async def get_audit_logs(current_user: dict = Depends(get_current_moderator)):
    """Get all audit logs."""
    if current_user["role"] not in ["admin", "mmod"]:
        raise HTTPException(status_code=403, detail="Only Admin and MMOD can view audit logs")
    
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return logs
