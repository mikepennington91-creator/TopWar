"""Organogram (org chart) management routes."""
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, ConfigDict

from database import db
from utils.auth import get_current_moderator

router = APIRouter(prefix="/organogram", tags=["Organogram"])


# ============ Models ============
ORG_RANKS = ["CMod", "MMod", "SMod", "LMod", "Mod"]
ORG_TEAMS = ["in_game", "discord", "both"]


class OrgNode(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    display_name: Optional[str] = None
    rank: str  # One of ORG_RANKS
    team: Optional[str] = None  # One of ORG_TEAMS
    bio: Optional[str] = None
    parent_id: Optional[str] = None
    profile_picture: Optional[str] = None  # base64 data URL
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None


class OrgNodeCreate(BaseModel):
    username: str
    rank: str
    parent_id: Optional[str] = None
    display_name: Optional[str] = None
    profile_picture: Optional[str] = None
    team: Optional[str] = None
    bio: Optional[str] = None


class OrgNodeUpdate(BaseModel):
    rank: Optional[str] = None
    parent_id: Optional[str] = None
    display_name: Optional[str] = None
    profile_picture: Optional[str] = None
    team: Optional[str] = None
    bio: Optional[str] = None


# ============ Helpers ============
async def can_edit_organogram(current_user: dict) -> bool:
    """Admin or any user assigned as CMod in the organogram can edit."""
    if current_user.get("is_admin") or current_user.get("role") == "admin":
        return True
    # Check if current user is a CMod in the organogram
    cmod_node = await db.organogram_nodes.find_one(
        {"username": current_user["username"], "rank": "CMod"},
        {"_id": 0}
    )
    return cmod_node is not None


async def require_org_editor(current_user: dict = Depends(get_current_moderator)):
    """Require admin or CMod (in organogram) to edit."""
    if not await can_edit_organogram(current_user):
        raise HTTPException(
            status_code=403,
            detail="Only Admins or organogram CMods can manage the organogram"
        )
    return current_user


def serialize_node(node: dict) -> dict:
    """Convert datetimes for response."""
    if isinstance(node.get("created_at"), str):
        try:
            node["created_at"] = datetime.fromisoformat(node["created_at"])
        except ValueError:
            pass
    if isinstance(node.get("updated_at"), str):
        try:
            node["updated_at"] = datetime.fromisoformat(node["updated_at"])
        except ValueError:
            pass
    return node


# ============ Routes ============
@router.get("/can-edit")
async def get_can_edit(current_user: dict = Depends(get_current_moderator)):
    """Returns whether the current user can edit the organogram."""
    return {"can_edit": await can_edit_organogram(current_user)}


@router.get("/nodes", response_model=List[OrgNode])
async def list_nodes(current_user: dict = Depends(get_current_moderator)):
    """List all organogram nodes."""
    nodes = await db.organogram_nodes.find({}, {"_id": 0}).to_list(1000)
    return [serialize_node(n) for n in nodes]


@router.get("/portal-users")
async def list_portal_users(current_user: dict = Depends(get_current_moderator)):
    """List portal users (moderators) available for assignment."""
    mods = await db.moderators.find(
        {"status": {"$ne": "disabled"}},
        {"_id": 0, "username": 1, "role": 1, "roles": 1}
    ).to_list(1000)
    # Find which usernames are already in the organogram
    existing = await db.organogram_nodes.find({}, {"_id": 0, "username": 1}).to_list(1000)
    assigned_usernames = {e["username"] for e in existing}
    result = []
    for m in mods:
        result.append({
            "username": m["username"],
            "role": m.get("role", "moderator"),
            "is_assigned": m["username"] in assigned_usernames,
        })
    return result


@router.post("/nodes", response_model=OrgNode)
async def create_node(payload: OrgNodeCreate, current_user: dict = Depends(require_org_editor)):
    """Create a new organogram node."""
    if payload.rank not in ORG_RANKS:
        raise HTTPException(status_code=400, detail=f"Rank must be one of {ORG_RANKS}")

    if payload.team is not None and payload.team not in ORG_TEAMS:
        raise HTTPException(status_code=400, detail=f"Team must be one of {ORG_TEAMS}")

    # Verify portal user exists
    mod = await db.moderators.find_one({"username": payload.username}, {"_id": 0, "username": 1})
    if not mod:
        raise HTTPException(status_code=400, detail="Portal user not found")

    # Verify username not already assigned
    existing = await db.organogram_nodes.find_one({"username": payload.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail=f"{payload.username} is already in the organogram")

    # Verify parent rank is higher (lower index)
    if payload.parent_id:
        parent = await db.organogram_nodes.find_one({"id": payload.parent_id}, {"_id": 0})
        if not parent:
            raise HTTPException(status_code=400, detail="Parent node not found")
        if ORG_RANKS.index(parent["rank"]) >= ORG_RANKS.index(payload.rank):
            raise HTTPException(
                status_code=400,
                detail=f"Parent rank ({parent['rank']}) must be higher than child rank ({payload.rank})"
            )

    node = OrgNode(
        username=payload.username,
        rank=payload.rank,
        parent_id=payload.parent_id,
        display_name=payload.display_name,
        profile_picture=payload.profile_picture,
        team=payload.team,
        bio=payload.bio,
        updated_by=current_user["username"],
    )
    doc = node.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db.organogram_nodes.insert_one(doc)
    return node


@router.patch("/nodes/{node_id}", response_model=OrgNode)
async def update_node(node_id: str, payload: OrgNodeUpdate, current_user: dict = Depends(require_org_editor)):
    """Update an organogram node (rank, parent, display name, profile picture)."""
    node = await db.organogram_nodes.find_one({"id": node_id}, {"_id": 0})
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    updates = {}
    new_rank = payload.rank if payload.rank is not None else node["rank"]

    if payload.rank is not None:
        if payload.rank not in ORG_RANKS:
            raise HTTPException(status_code=400, detail=f"Rank must be one of {ORG_RANKS}")
        updates["rank"] = payload.rank

    if payload.parent_id is not None:
        # Empty string means remove parent
        new_parent_id = payload.parent_id or None
        if new_parent_id:
            if new_parent_id == node_id:
                raise HTTPException(status_code=400, detail="A node cannot be its own parent")
            parent = await db.organogram_nodes.find_one({"id": new_parent_id}, {"_id": 0})
            if not parent:
                raise HTTPException(status_code=400, detail="Parent node not found")
            if ORG_RANKS.index(parent["rank"]) >= ORG_RANKS.index(new_rank):
                raise HTTPException(
                    status_code=400,
                    detail=f"Parent rank ({parent['rank']}) must be higher than child rank ({new_rank})"
                )
            # Prevent cycles: walk up parent chain
            current = parent
            while current:
                if current["id"] == node_id:
                    raise HTTPException(status_code=400, detail="Cycle detected in parent chain")
                pid = current.get("parent_id")
                if not pid:
                    break
                current = await db.organogram_nodes.find_one({"id": pid}, {"_id": 0})
        updates["parent_id"] = new_parent_id

    if payload.display_name is not None:
        updates["display_name"] = payload.display_name or None

    if payload.profile_picture is not None:
        updates["profile_picture"] = payload.profile_picture or None

    if payload.team is not None:
        if payload.team and payload.team not in ORG_TEAMS:
            raise HTTPException(status_code=400, detail=f"Team must be one of {ORG_TEAMS}")
        updates["team"] = payload.team or None

    if payload.bio is not None:
        updates["bio"] = payload.bio or None

    if not updates:
        return serialize_node(node)

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    updates["updated_by"] = current_user["username"]

    # If rank was changed, ensure children of this node still have lower rank
    if "rank" in updates:
        children = await db.organogram_nodes.find({"parent_id": node_id}, {"_id": 0}).to_list(1000)
        new_rank_idx = ORG_RANKS.index(updates["rank"])
        for child in children:
            if ORG_RANKS.index(child["rank"]) <= new_rank_idx:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot set rank to {updates['rank']}: child '{child['username']}' has rank {child['rank']} which would be invalid"
                )

    await db.organogram_nodes.update_one({"id": node_id}, {"$set": updates})
    updated = await db.organogram_nodes.find_one({"id": node_id}, {"_id": 0})
    return serialize_node(updated)


@router.delete("/nodes/{node_id}")
async def delete_node(node_id: str, current_user: dict = Depends(require_org_editor)):
    """Delete an organogram node. Children become orphans (parent_id cleared)."""
    node = await db.organogram_nodes.find_one({"id": node_id}, {"_id": 0})
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    # Reparent children to this node's parent (preserving structure) or null
    new_parent = node.get("parent_id")
    await db.organogram_nodes.update_many(
        {"parent_id": node_id},
        {"$set": {"parent_id": new_parent, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await db.organogram_nodes.delete_one({"id": node_id})
    return {"message": f"Node {node['username']} removed from organogram"}
