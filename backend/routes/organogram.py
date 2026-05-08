"""Organogram (org chart) management routes."""
import base64
import binascii
import io
import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional

import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, ConfigDict

from database import db
from utils.auth import get_current_moderator, require_admin_role

router = APIRouter(prefix="/organogram", tags=["Organogram"])


# ============ Models ============
ORG_RANKS = ["CMod", "MMod", "SMod", "LMod", "Mod"]
ORG_CHARTS = ["in_game", "discord", "training"]
ORG_TEAMS = ["in_game", "discord", "training"]


def normalize_teams(value) -> List[str]:
    """Accept legacy single-string team or list; return clean list of valid teams."""
    if value is None:
        return []
    if isinstance(value, str):
        # Legacy: 'both' meant in_game + discord
        if value == "both":
            return ["in_game", "discord"]
        if value in ORG_TEAMS:
            return [value]
        return []
    if isinstance(value, list):
        out = []
        for v in value:
            if v == "both":
                for t in ("in_game", "discord"):
                    if t not in out:
                        out.append(t)
            elif v in ORG_TEAMS and v not in out:
                out.append(v)
        return out
    return []


class OrgNode(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    chart: str = "in_game"  # one of ORG_CHARTS - which organogram this node belongs to
    display_name: Optional[str] = None
    rank: str  # One of ORG_RANKS
    teams: List[str] = Field(default_factory=list)  # legacy, kept for back-compat
    bio: Optional[str] = None
    parent_ids: List[str] = Field(default_factory=list)  # supports multiple parents
    profile_picture: Optional[str] = None  # base64 data URL
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None


class OrgNodeCreate(BaseModel):
    username: str
    rank: str
    chart: str  # required: which organogram to add to
    parent_ids: Optional[List[str]] = None
    parent_id: Optional[str] = None  # legacy
    display_name: Optional[str] = None
    profile_picture: Optional[str] = None
    teams: Optional[List[str]] = None  # legacy, ignored on create
    bio: Optional[str] = None


class OrgNodeUpdate(BaseModel):
    rank: Optional[str] = None
    chart: Optional[str] = None
    parent_ids: Optional[List[str]] = None
    parent_id: Optional[str] = None  # legacy
    display_name: Optional[str] = None
    profile_picture: Optional[str] = None
    teams: Optional[List[str]] = None  # legacy, ignored
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


def resolve_parent_ids(payload_parent_ids, payload_parent_id) -> Optional[List[str]]:
    """Pick the multi-parent value if provided, otherwise fall back to legacy single-parent.

    Returns None if neither was provided (no change). Returns a (possibly empty) list otherwise.
    """
    if payload_parent_ids is not None:
        # de-duplicate while preserving order, drop empties
        out = []
        for pid in payload_parent_ids:
            if pid and pid not in out:
                out.append(pid)
        return out
    if payload_parent_id is not None:
        # empty string explicitly clears parent
        if payload_parent_id == "" or payload_parent_id is False:
            return []
        return [payload_parent_id]
    return None


async def validate_parents(parent_ids: List[str], child_id: Optional[str], child_rank: str, child_chart: str):
    """Ensure each parent exists, has a higher rank, is in the same chart, and would not create a cycle."""
    for pid in parent_ids:
        if child_id and pid == child_id:
            raise HTTPException(status_code=400, detail="A node cannot be its own parent")
        parent = await db.organogram_nodes.find_one({"id": pid}, {"_id": 0})
        if not parent:
            raise HTTPException(status_code=400, detail=f"Parent node {pid} not found")
        parent = serialize_node(parent)
        if parent.get("chart") != child_chart:
            raise HTTPException(
                status_code=400,
                detail=f"Parent must be in the same organogram ({child_chart})"
            )
        if ORG_RANKS.index(parent["rank"]) >= ORG_RANKS.index(child_rank):
            raise HTTPException(
                status_code=400,
                detail=f"Parent rank ({parent['rank']}) must be higher than child rank ({child_rank})"
            )
    if not child_id:
        return
    visited = set()
    stack = list(parent_ids)
    while stack:
        nid = stack.pop()
        if nid in visited:
            continue
        visited.add(nid)
        if nid == child_id:
            raise HTTPException(status_code=400, detail="Cycle detected in parent chain")
        n = await db.organogram_nodes.find_one({"id": nid}, {"_id": 0})
        if not n:
            continue
        ps = n.get("parent_ids")
        if not ps:
            single = n.get("parent_id")
            ps = [single] if single else []
        for p in ps:
            if p and p not in visited:
                stack.append(p)


def serialize_node(node: dict) -> dict:
    """Convert datetimes + migrate legacy single-team/single-parent fields for response."""
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
    # Migrate legacy single-team field on the fly for the response
    if "teams" not in node or not node.get("teams"):
        legacy = node.get("team")
        node["teams"] = normalize_teams(legacy) if legacy else []
    else:
        node["teams"] = normalize_teams(node["teams"])
    # Migrate legacy single-parent field on the fly
    if "parent_ids" not in node or node.get("parent_ids") is None:
        legacy_parent = node.get("parent_id")
        node["parent_ids"] = [legacy_parent] if legacy_parent else []
    elif not isinstance(node["parent_ids"], list):
        node["parent_ids"] = []
    # Migrate legacy nodes without a chart: pick first team or default to in_game
    if "chart" not in node or not node.get("chart") or node["chart"] not in ORG_CHARTS:
        teams_list = node.get("teams") or []
        node["chart"] = teams_list[0] if teams_list and teams_list[0] in ORG_CHARTS else "in_game"
    return node


# ============ Routes ============
@router.get("/can-edit")
async def get_can_edit(current_user: dict = Depends(get_current_moderator)):
    """Returns whether the current user can edit the organogram."""
    return {"can_edit": await can_edit_organogram(current_user)}


@router.get("/nodes", response_model=List[OrgNode])
async def list_nodes(chart: Optional[str] = None, current_user: dict = Depends(get_current_moderator)):
    """List organogram nodes. Optionally filter by chart (in_game | discord | training)."""
    if chart is not None and chart not in ORG_CHARTS:
        raise HTTPException(status_code=400, detail=f"chart must be one of {ORG_CHARTS}")

    # One-time migration: backfill `chart` on any doc missing it
    missing = await db.organogram_nodes.find(
        {"$or": [{"chart": {"$exists": False}}, {"chart": None}, {"chart": ""}]},
        {"_id": 0, "id": 1, "teams": 1}
    ).to_list(2000)
    for doc in missing:
        teams_list = doc.get("teams") or []
        new_chart = teams_list[0] if teams_list and teams_list[0] in ORG_CHARTS else "in_game"
        await db.organogram_nodes.update_one({"id": doc["id"]}, {"$set": {"chart": new_chart}})

    query = {"chart": chart} if chart else {}
    nodes = await db.organogram_nodes.find(query, {"_id": 0}).to_list(2000)
    return [serialize_node(n) for n in nodes]


@router.get("/portal-users")
async def list_portal_users(chart: Optional[str] = None, current_user: dict = Depends(get_current_moderator)):
    """List portal users (moderators) available for assignment.
    If chart is provided, is_assigned reflects whether the user is already in THAT chart.
    """
    if chart is not None and chart not in ORG_CHARTS:
        raise HTTPException(status_code=400, detail=f"chart must be one of {ORG_CHARTS}")
    mods = await db.moderators.find(
        {"status": {"$ne": "disabled"}},
        {"_id": 0, "username": 1, "role": 1, "roles": 1}
    ).to_list(1000)
    # Find which usernames are already in this chart (or any, if chart not specified)
    if chart:
        existing = await db.organogram_nodes.find(
            {"$or": [
                {"chart": chart},
                {"chart": {"$exists": False}, "teams.0": chart},
            ]},
            {"_id": 0, "username": 1}
        ).to_list(2000)
    else:
        existing = await db.organogram_nodes.find({}, {"_id": 0, "username": 1}).to_list(2000)
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
    if payload.chart not in ORG_CHARTS:
        raise HTTPException(status_code=400, detail=f"chart must be one of {ORG_CHARTS}")

    # Verify portal user exists
    mod = await db.moderators.find_one({"username": payload.username}, {"_id": 0, "username": 1})
    if not mod:
        raise HTTPException(status_code=400, detail="Portal user not found")

    # Verify username not already assigned in THIS chart
    existing = await db.organogram_nodes.find_one(
        {"username": payload.username, "$or": [{"chart": payload.chart}, {"chart": {"$exists": False}, "teams.0": payload.chart}]},
        {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=400, detail=f"{payload.username} is already in the {payload.chart.replace('_', '-')} organogram")

    # Resolve parent_ids (supports multi or legacy single)
    parent_ids = resolve_parent_ids(payload.parent_ids, payload.parent_id) or []
    if parent_ids:
        await validate_parents(parent_ids, None, payload.rank, payload.chart)

    node = OrgNode(
        username=payload.username,
        chart=payload.chart,
        rank=payload.rank,
        parent_ids=parent_ids,
        display_name=payload.display_name,
        profile_picture=payload.profile_picture,
        teams=[],
        bio=payload.bio,
        updated_by=current_user["username"],
    )
    doc = node.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    doc["parent_id"] = None
    await db.organogram_nodes.insert_one(doc)
    return node


@router.patch("/nodes/{node_id}", response_model=OrgNode)
async def update_node(node_id: str, payload: OrgNodeUpdate, current_user: dict = Depends(require_org_editor)):
    """Update an organogram node (rank, parent, display name, profile picture)."""
    node = await db.organogram_nodes.find_one({"id": node_id}, {"_id": 0})
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    updates = {}
    current = serialize_node(dict(node))
    new_rank = payload.rank if payload.rank is not None else current["rank"]
    new_chart = current["chart"]

    if payload.chart is not None:
        if payload.chart not in ORG_CHARTS:
            raise HTTPException(status_code=400, detail=f"chart must be one of {ORG_CHARTS}")
        if payload.chart != current["chart"]:
            # ensure no duplicate in destination chart
            dup = await db.organogram_nodes.find_one(
                {"username": current["username"], "chart": payload.chart, "id": {"$ne": node_id}},
                {"_id": 0}
            )
            if dup:
                raise HTTPException(status_code=400, detail=f"{current['username']} is already in the {payload.chart.replace('_', '-')} organogram")
            updates["chart"] = payload.chart
            new_chart = payload.chart
            # When moving charts, parents from old chart no longer apply
            if payload.parent_ids is None and payload.parent_id is None:
                updates["parent_ids"] = []
                updates["parent_id"] = None

    if payload.rank is not None:
        if payload.rank not in ORG_RANKS:
            raise HTTPException(status_code=400, detail=f"Rank must be one of {ORG_RANKS}")
        updates["rank"] = payload.rank

    if payload.parent_ids is not None or payload.parent_id is not None:
        new_parent_ids = resolve_parent_ids(payload.parent_ids, payload.parent_id) or []
        if new_parent_ids:
            await validate_parents(new_parent_ids, node_id, new_rank, new_chart)
        updates["parent_ids"] = new_parent_ids
        # Clear legacy field so it doesn't shadow on read
        updates["parent_id"] = None

    if payload.display_name is not None:
        updates["display_name"] = payload.display_name or None

    if payload.profile_picture is not None:
        updates["profile_picture"] = payload.profile_picture or None

    if payload.teams is not None:
        invalid = [t for t in payload.teams if t not in ORG_TEAMS]
        if invalid:
            raise HTTPException(status_code=400, detail=f"Invalid team(s): {invalid}. Allowed: {ORG_TEAMS}")
        updates["teams"] = normalize_teams(payload.teams)
        # Clear legacy single-team field so it doesn't override on read
        updates["team"] = None

    if payload.bio is not None:
        updates["bio"] = payload.bio or None

    if not updates:
        return serialize_node(node)

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    updates["updated_by"] = current_user["username"]

    # If rank was changed, ensure children of this node still have lower rank
    if "rank" in updates:
        children = await db.organogram_nodes.find(
            {"$or": [{"parent_ids": node_id}, {"parent_id": node_id}]},
            {"_id": 0}
        ).to_list(1000)
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

    # Remove this node's id from any children's parent lists; also clear legacy parent_id pointers.
    surviving_parents = [p for p in (node.get("parent_ids") or []) if p and p != node_id]
    legacy_parent = node.get("parent_id")
    if not surviving_parents and legacy_parent and legacy_parent != node_id:
        surviving_parents = [legacy_parent]
    now = datetime.now(timezone.utc).isoformat()

    # Children referencing via parent_ids array
    children_multi = await db.organogram_nodes.find(
        {"parent_ids": node_id}, {"_id": 0}
    ).to_list(1000)
    for child in children_multi:
        new_parents = [p for p in (child.get("parent_ids") or []) if p != node_id]
        # Inherit deleted node's parents so the chain isn't broken
        for sp in surviving_parents:
            if sp not in new_parents and sp != child["id"]:
                new_parents.append(sp)
        await db.organogram_nodes.update_one(
            {"id": child["id"]},
            {"$set": {"parent_ids": new_parents, "updated_at": now}}
        )

    # Children referencing via legacy parent_id
    await db.organogram_nodes.update_many(
        {"parent_id": node_id},
        {"$set": {
            "parent_id": surviving_parents[0] if surviving_parents else None,
            "updated_at": now,
        }}
    )
    await db.organogram_nodes.delete_one({"id": node_id})
    return {"message": f"Node {node['username']} removed from organogram"}



# ============ Discord Webhook Sharing ============
WEBHOOK_SETTINGS_ID = "organogram_webhook"
DISCORD_WEBHOOK_REGEX = re.compile(
    r"^https://(?:ptb\.|canary\.)?discord(?:app)?\.com/api/webhooks/\d+/[A-Za-z0-9_\-]+/?$"
)


class WebhookConfig(BaseModel):
    webhook_url: str  # raw URL


class WebhookConfigResponse(BaseModel):
    configured: bool
    masked_url: Optional[str] = None
    updated_by: Optional[str] = None
    updated_at: Optional[datetime] = None


class ShareRequest(BaseModel):
    image_data_url: str  # data:image/png;base64,...
    message: Optional[str] = None  # optional extra text


def mask_webhook_url(url: str) -> str:
    """Return a partially obscured webhook URL safe for display."""
    if not url:
        return ""
    parts = url.rstrip("/").split("/")
    if len(parts) < 2:
        return "***"
    token = parts[-1]
    masked_token = token[:4] + "…" + token[-4:] if len(token) > 8 else "…"
    parts[-1] = masked_token
    return "/".join(parts)


@router.get("/webhook", response_model=WebhookConfigResponse)
async def get_webhook_config(current_user: dict = Depends(require_admin_role)):
    """Get masked webhook config (admin only)."""
    doc = await db.app_settings.find_one({"id": WEBHOOK_SETTINGS_ID}, {"_id": 0})
    if not doc or not doc.get("webhook_url"):
        return WebhookConfigResponse(configured=False)
    updated_at = doc.get("updated_at")
    if isinstance(updated_at, str):
        try:
            updated_at = datetime.fromisoformat(updated_at)
        except ValueError:
            updated_at = None
    return WebhookConfigResponse(
        configured=True,
        masked_url=mask_webhook_url(doc["webhook_url"]),
        updated_by=doc.get("updated_by"),
        updated_at=updated_at,
    )


@router.put("/webhook")
async def set_webhook_config(payload: WebhookConfig, current_user: dict = Depends(require_admin_role)):
    """Set or update the Discord webhook URL (admin only)."""
    url = payload.webhook_url.strip()
    if not DISCORD_WEBHOOK_REGEX.match(url):
        raise HTTPException(
            status_code=400,
            detail="Invalid Discord webhook URL. Expected format: https://discord.com/api/webhooks/<id>/<token>"
        )
    await db.app_settings.update_one(
        {"id": WEBHOOK_SETTINGS_ID},
        {"$set": {
            "id": WEBHOOK_SETTINGS_ID,
            "webhook_url": url,
            "updated_by": current_user["username"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )
    return {"message": "Webhook configured", "masked_url": mask_webhook_url(url)}


@router.delete("/webhook")
async def delete_webhook_config(current_user: dict = Depends(require_admin_role)):
    """Remove the Discord webhook URL (admin only)."""
    await db.app_settings.delete_one({"id": WEBHOOK_SETTINGS_ID})
    return {"message": "Webhook removed"}


@router.get("/webhook/status")
async def get_webhook_status(current_user: dict = Depends(require_org_editor)):
    """Lightweight check used by editors to know if Share is available."""
    doc = await db.app_settings.find_one({"id": WEBHOOK_SETTINGS_ID}, {"_id": 0, "webhook_url": 1})
    return {"configured": bool(doc and doc.get("webhook_url"))}


@router.post("/share")
async def share_to_discord(payload: ShareRequest, current_user: dict = Depends(require_org_editor)):
    """Post the org chart PNG to the configured Discord webhook."""
    doc = await db.app_settings.find_one({"id": WEBHOOK_SETTINGS_ID}, {"_id": 0})
    if not doc or not doc.get("webhook_url"):
        raise HTTPException(status_code=400, detail="Discord webhook is not configured. Ask an admin to set it up.")

    # Decode base64 PNG
    data_url = payload.image_data_url or ""
    if not data_url.startswith("data:image/"):
        raise HTTPException(status_code=400, detail="image_data_url must be a data:image/...;base64 URL")
    try:
        _, b64 = data_url.split(",", 1)
        image_bytes = base64.b64decode(b64)
    except (ValueError, binascii.Error):
        raise HTTPException(status_code=400, detail="Could not decode image data")

    if len(image_bytes) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image exceeds Discord's 8 MB upload limit")

    # Count nodes for embed metadata
    node_count = await db.organogram_nodes.count_documents({})
    cmod_count = await db.organogram_nodes.count_documents({"rank": "CMod"})

    embed = {
        "title": "Top War Moderator Organogram",
        "description": payload.message or f"Updated by **{current_user['username']}**",
        "color": 0xF59E0B,  # amber
        "fields": [
            {"name": "Total Members", "value": str(node_count), "inline": True},
            {"name": "CMods", "value": str(cmod_count), "inline": True},
        ],
        "image": {"url": "attachment://organogram.png"},
        "footer": {"text": "Top War Moderator Portal"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    files = {
        "files[0]": ("organogram.png", io.BytesIO(image_bytes), "image/png"),
        "payload_json": (None, _json_dump({"username": "Top War Org Chart", "embeds": [embed]}), "application/json"),
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client_http:
            resp = await client_http.post(doc["webhook_url"], files=files)
        if resp.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Discord rejected the upload ({resp.status_code}): {resp.text[:200]}")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Failed to reach Discord: {exc}") from exc

    return {"message": "Posted to Discord", "size_bytes": len(image_bytes)}


def _json_dump(obj: dict) -> str:
    """Local helper to keep imports tidy."""
    import json
    return json.dumps(obj)
