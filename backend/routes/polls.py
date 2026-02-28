"""Poll routes."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

from database import db
from models.schemas import Poll, PollCreate, ArchivedPoll
from utils.auth import get_current_moderator

router = APIRouter(prefix="/polls", tags=["Polls"])


async def close_and_archive_poll(poll_id: str):
    """Close a poll and archive it."""
    poll = await db.polls.find_one({"id": poll_id}, {"_id": 0})
    if not poll:
        return
    
    # Find winning option
    max_votes = 0
    winning_options = []
    for opt in poll.get("options", []):
        vote_count = len(opt.get("votes", []))
        if vote_count > max_votes:
            max_votes = vote_count
            winning_options = [opt["text"]]
        elif vote_count == max_votes:
            winning_options.append(opt["text"])
    
    # Create outcome string
    if len(winning_options) == 1:
        outcome = f"{winning_options[0]} ({max_votes} votes)"
    else:
        outcome = f"Tie: {', '.join(winning_options)} ({max_votes} votes each)"
    
    # Archive the poll
    archived = ArchivedPoll(
        question=poll["question"],
        outcome=outcome,
        created_by=poll["created_by"]
    )
    archived_doc = archived.model_dump()
    archived_doc['closed_at'] = archived_doc['closed_at'].isoformat()
    await db.archived_polls.insert_one(archived_doc)
    
    # Mark poll as inactive
    await db.polls.update_one({"id": poll_id}, {"$set": {"is_active": False}})


@router.get("")
async def get_polls(current_user: dict = Depends(get_current_moderator)):
    """Get all active polls."""
    polls = await db.polls.find({"is_active": True}, {"_id": 0}).sort("created_at", -1).to_list(10)
    return polls


@router.get("/check-new")
async def check_new_polls(current_user: dict = Depends(get_current_moderator)):
    """Check if there are polls the user hasn't viewed yet."""
    username = current_user["username"]
    unviewed_polls = await db.polls.count_documents({
        "is_active": True,
        "viewed_by": {"$ne": username}
    })
    return {"has_new_polls": unviewed_polls > 0, "count": unviewed_polls}


@router.post("/{poll_id}/mark-viewed")
async def mark_poll_viewed(poll_id: str, current_user: dict = Depends(get_current_moderator)):
    """Mark a poll as viewed by the current user."""
    username = current_user["username"]
    await db.polls.update_one(
        {"id": poll_id},
        {"$addToSet": {"viewed_by": username}}
    )
    return {"message": "Poll marked as viewed"}


@router.post("")
async def create_poll(poll_data: PollCreate, current_user: dict = Depends(get_current_moderator)):
    """Create a new poll."""
    if current_user["role"] not in ["smod", "mmod", "developer", "admin"]:
        raise HTTPException(status_code=403, detail="Only SMod, MMOD, Developer can create polls")
    
    if len(poll_data.options) < 2:
        raise HTTPException(status_code=400, detail="Poll must have at least 2 options")
    if len(poll_data.options) > 6:
        raise HTTPException(status_code=400, detail="Poll cannot have more than 6 options")
    
    active_polls_count = await db.polls.count_documents({"is_active": True})
    if active_polls_count >= 2:
        raise HTTPException(status_code=400, detail="Maximum of 2 active polls allowed. Please wait for an existing poll to close.")
    
    options = [{"text": opt, "votes": []} for opt in poll_data.options]
    
    new_poll = Poll(
        question=poll_data.question,
        options=options,
        show_voters=poll_data.show_voters,
        created_by=current_user["username"]
    )
    
    poll_doc = new_poll.model_dump()
    poll_doc['created_at'] = poll_doc['created_at'].isoformat()
    poll_doc['expires_at'] = poll_doc['expires_at'].isoformat()
    
    await db.polls.insert_one(poll_doc)
    return {"message": "Poll created successfully", "id": new_poll.id}


@router.post("/{poll_id}/vote")
async def vote_on_poll(poll_id: str, option_index: int, current_user: dict = Depends(get_current_moderator)):
    """Vote on a poll."""
    username = current_user["username"]
    
    poll = await db.polls.find_one({"id": poll_id, "is_active": True}, {"_id": 0})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found or already closed")
    
    # Check if user already voted
    for opt in poll.get("options", []):
        if username in opt.get("votes", []):
            raise HTTPException(status_code=400, detail="You have already voted on this poll")
    
    if option_index < 0 or option_index >= len(poll.get("options", [])):
        raise HTTPException(status_code=400, detail="Invalid option")
    
    # Add vote
    await db.polls.update_one(
        {"id": poll_id},
        {"$push": {f"options.{option_index}.votes": username}}
    )
    
    # Check if all moderators have voted (auto-close)
    updated_poll = await db.polls.find_one({"id": poll_id}, {"_id": 0})
    all_moderators = await db.moderators.find({"status": "active"}, {"_id": 0, "username": 1}).to_list(1000)
    all_usernames = {mod["username"] for mod in all_moderators}
    
    voted_users = set()
    for opt in updated_poll.get("options", []):
        voted_users.update(opt.get("votes", []))
    
    if all_usernames == voted_users:
        await close_and_archive_poll(poll_id)
    
    return {"message": "Vote recorded successfully"}


@router.delete("/{poll_id}")
async def delete_poll(poll_id: str, current_user: dict = Depends(get_current_moderator)):
    """Delete a poll."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only Admin can delete polls")
    
    result = await db.polls.delete_one({"id": poll_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Poll not found")
    return {"message": "Poll deleted successfully"}


@router.get("/archived")
async def get_archived_polls(current_user: dict = Depends(get_current_moderator)):
    """Get all archived polls."""
    archived = await db.archived_polls.find({}, {"_id": 0}).sort("closed_at", -1).to_list(100)
    return archived


@router.post("/check-expired")
async def check_expired_polls():
    """Check and close expired polls."""
    now = datetime.now(timezone.utc).isoformat()
    expired_polls = await db.polls.find({
        "is_active": True,
        "expires_at": {"$lte": now}
    }, {"_id": 0}).to_list(10)
    
    for poll in expired_polls:
        await close_and_archive_poll(poll["id"])
    
    return {"message": f"Checked and closed {len(expired_polls)} expired polls"}
