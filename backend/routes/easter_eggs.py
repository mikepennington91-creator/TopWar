"""Easter egg page management routes."""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone

from database import db
from models.schemas import EasterEggPage, EasterEggPageCreate, EasterEggPageUpdate
from utils.auth import get_current_moderator, require_admin

router = APIRouter(prefix="/easter-eggs", tags=["Easter Eggs"])

# Default easter egg pages configuration
DEFAULT_EASTER_EGGS = [
    {
        "page_key": "troll",
        "username": "Troll",
        "password": "FunnyGuy",
        "title": "Troll Page",
        "content": {
            "header_text": "NICE TRY, FUNNY GUY!",
            "sub_header": "We see what you did there... 👀",
            "status_text": "Application Status: TROLL DETECTED 🚨",
            "message": "We regret to inform you that your \"application\" will not be considered for the prestigious position of Top War Moderator.",
            "funny_reasons": [
                "Your application contained 47 uses of the word 'lol'",
                "We noticed you listed 'Professional Troll' as previous experience",
                "Your Discord handle was 'xX_TrollMaster_Xx'",
                "You answered every question with 'ur mom'",
                "Your essay was just the bee movie script",
                "You claimed to be 420 years old",
                "Your server number was '69420'",
                "You attached a picture of a potato as your ID"
            ],
            "roast_text": "Your troll attempt was slightly less funny than you thought it was 😬",
            "encouragement": "But hey, at least you found our secret page! That's gotta count for something, right? ...Right? 🦗",
            "troll_score": "3/10 - needs work 📝"
        },
        "is_active": True
    },
    {
        "page_key": "valentine",
        "username": "Valentine",
        "password": "Iloveyou",
        "title": "Valentine Proposal",
        "content": {
            "intro_text": "In all the stars across the universe, my heart found its way to you. Every moment with you feels like a dream I never want to wake from.",
            "proposal_text": "Will you Marry me?",
            "button_yes": "💍 Yes",
            "button_alt": "💖 I thought you'd never ask"
        },
        "is_active": True
    },
    {
        "page_key": "mediocre",
        "username": "medioCre",
        "password": "Password123",
        "title": "Secret Proposal",
        "content": {
            "intro_text": "I heard you don't like reading and can only manage 1 Question.",
            "proposal_text": "Therefore, will you Marry Evil?",
            "button_yes": "💍 Yes",
            "button_alt": "💖 I thought you'd never ask"
        },
        "is_active": True
    },
    {
        "page_key": "developer",
        "username": "Developer",
        "password": "TWDev3",
        "title": "Developer Secrets",
        "content": {
            "warning_text": "This information is for authorized personnel only. Unauthorized disclosure is prohibited.",
            "upcoming_heroes": [
                {
                    "name": "Shadow Reaper",
                    "type": "SSR",
                    "class": "Assassin",
                    "ability": "Phase Strike - Teleport behind enemy and deal damage directly to back row of units",
                    "releaseDate": "Q1 2026"
                },
                {
                    "name": "Storm Titan",
                    "type": "SSSR",
                    "class": "Tank",
                    "ability": "Thunder Aegis - Absorb 80% damage and reflect as lightning",
                    "releaseDate": "Q2 2026"
                },
                {
                    "name": "Phoenix Queen",
                    "type": "SSR",
                    "class": "Support",
                    "ability": "Rebirth Flame - Revive fallen units with 50% of stack health",
                    "releaseDate": "Q1 2026"
                },
                {
                    "name": "Void Emperor",
                    "type": "SSSR",
                    "class": "Mage",
                    "ability": "Reality Tear - Create black hole dealing 600% AoE damage",
                    "releaseDate": "Q3 2026"
                }
            ],
            "heavy_troopers": [
                {
                    "name": "Siege Breaker MK-IV",
                    "attack": 2850,
                    "defense": 3200,
                    "speed": 45,
                    "special": "Fortification Destroyer - +200% damage vs buildings",
                    "status": "In Testing"
                },
                {
                    "name": "Plasma Artillery Unit",
                    "attack": 4200,
                    "defense": 1800,
                    "speed": 25,
                    "special": "Ion Bombardment - Long range AoE with burn effect",
                    "status": "Final Review"
                },
                {
                    "name": "Stealth Mech Alpha",
                    "attack": 3100,
                    "defense": 2400,
                    "speed": 85,
                    "special": "Cloaking Field - Invisible for first 10 seconds of battle",
                    "status": "Concept"
                }
            ],
            "game_mechanics": [
                {
                    "name": "Alliance Wars 2.0",
                    "description": "Cross-server alliance battles with territory control. Capture zones to gain resource bonuses.",
                    "status": "Development",
                    "eta": "March 2026"
                },
                {
                    "name": "Dynamic Weather System",
                    "description": "Rain affects air unit accuracy. Snow reduces land unit attack speed. Fog reduces naval crit rate.",
                    "status": "Testing",
                    "eta": "Q2 2026"
                },
                {
                    "name": "Mercenary System",
                    "description": "Hire NPC commanders for temporary boosts. Cost scales with power level.",
                    "status": "Approved",
                    "eta": "January 2026"
                }
            ],
            "collaborations": [
                {
                    "name": "50 Shades of Grey",
                    "partner": "Dulux Paints",
                    "description": "Transform your base with 50 exclusive paint schemes! From 'Tactical Taupe' to 'Battlefield Beige', customize your headquarters with premium designer colors.",
                    "status": "Negotiation",
                    "eta": "Q3 2026"
                },
                {
                    "name": "Fast & Furious: War Edition",
                    "partner": "Universal Studios",
                    "description": "Dom Toretto brings the family to Top War! Unlock exclusive muscle car units with nitro boost abilities.",
                    "status": "Contract Signed",
                    "eta": "Q2 2026"
                },
                {
                    "name": "Gordon Ramsay's War Kitchen",
                    "partner": "Hell's Kitchen",
                    "description": "Chef Ramsay joins as a legendary commander! His 'It's RAW!' ability debuffs enemy troops with food poisoning.",
                    "status": "In Development",
                    "eta": "Q4 2026"
                },
                {
                    "name": "IKEA Fortress Builder",
                    "partner": "IKEA",
                    "description": "Flat-pack your way to victory! Unlock Swedish-designed fortifications with confusing assembly instructions.",
                    "status": "Concept",
                    "eta": "2027"
                }
            ]
        },
        "is_active": True
    },
    {
        "page_key": "garuda",
        "username": "Garuda",
        "password": "Talkingbouy",
        "title": "Garuda Tribute",
        "content": {
            "tribute_text": "A special tribute page"
        },
        "is_active": True
    }
]


async def initialize_easter_eggs():
    """Initialize default easter egg pages if they don't exist."""
    for egg in DEFAULT_EASTER_EGGS:
        existing = await db.easter_eggs.find_one({"page_key": egg["page_key"]}, {"_id": 0})
        if not existing:
            page = EasterEggPage(**egg)
            doc = page.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            doc['updated_at'] = doc['updated_at'].isoformat()
            await db.easter_eggs.insert_one(doc)


@router.get("", response_model=List[dict])
async def get_easter_eggs(current_user: dict = Depends(require_admin)):
    """Get all easter egg pages (admin only)."""
    eggs = await db.easter_eggs.find({}, {"_id": 0}).to_list(100)
    return eggs


@router.get("/{page_key}")
async def get_easter_egg(page_key: str, current_user: dict = Depends(require_admin)):
    """Get a specific easter egg page (admin only)."""
    egg = await db.easter_eggs.find_one({"page_key": page_key}, {"_id": 0})
    if not egg:
        raise HTTPException(status_code=404, detail="Easter egg page not found")
    return egg


@router.post("/verify")
async def verify_easter_egg_credentials(username: str, password: str):
    """Verify easter egg credentials and return page key if valid."""
    egg = await db.easter_eggs.find_one(
        {"username": username, "password": password, "is_active": True},
        {"_id": 0}
    )
    if not egg:
        return {"valid": False, "page_key": None}
    return {"valid": True, "page_key": egg["page_key"], "content": egg.get("content", {})}


@router.post("")
async def create_easter_egg(egg_data: EasterEggPageCreate, current_user: dict = Depends(require_admin)):
    """Create a new easter egg page (admin only)."""
    # Check if page_key already exists
    existing = await db.easter_eggs.find_one({"page_key": egg_data.page_key}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Page key already exists")
    
    page = EasterEggPage(**egg_data.model_dump(), updated_by=current_user["username"])
    doc = page.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.easter_eggs.insert_one(doc)
    return {"message": "Easter egg page created successfully", "id": page.id}


@router.patch("/{page_key}")
async def update_easter_egg(page_key: str, update: EasterEggPageUpdate, current_user: dict = Depends(require_admin)):
    """Update an easter egg page (admin only)."""
    existing = await db.easter_eggs.find_one({"page_key": page_key}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Easter egg page not found")
    
    update_data = {}
    if update.username is not None:
        update_data["username"] = update.username
    if update.password is not None:
        update_data["password"] = update.password
    if update.title is not None:
        update_data["title"] = update.title
    if update.content is not None:
        update_data["content"] = update.content
    if update.is_active is not None:
        update_data["is_active"] = update.is_active
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = current_user["username"]
    
    await db.easter_eggs.update_one(
        {"page_key": page_key},
        {"$set": update_data}
    )
    
    return {"message": f"Easter egg page '{page_key}' updated successfully"}


@router.delete("/{page_key}")
async def delete_easter_egg(page_key: str, current_user: dict = Depends(require_admin)):
    """Delete an easter egg page (admin only)."""
    result = await db.easter_eggs.delete_one({"page_key": page_key})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Easter egg page not found")
    return {"message": f"Easter egg page '{page_key}' deleted successfully"}
