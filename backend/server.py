from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'topwar-moderator-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============= Models =============

class Vote(BaseModel):
    moderator: str
    vote: str  # "approve" or "reject"
    timestamp: datetime

class Comment(BaseModel):
    moderator: str
    comment: str
    timestamp: datetime

class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    position: str
    discord_handle: str
    ingame_name: str
    age: int
    country: str
    activity_times: str
    server: str
    native_language: str
    other_languages: str
    previous_experience: str
    basic_qualities: str
    favourite_event: str
    free_gems: str
    heroes_mutated: str
    discord_tools_comfort: str
    guidelines_rating: str
    high_profile_violation: str
    complex_mechanic: str
    unknown_question: str
    hero_development: str
    racist_r4: str
    moderator_swearing: str
    status: str = "awaiting_review"  # awaiting_review, pending, approved, rejected
    votes: List[Dict] = Field(default_factory=list)
    comments: List[Dict] = Field(default_factory=list)
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None

class ApplicationCreate(BaseModel):
    name: str
    position: str
    discord_handle: str
    ingame_name: str
    age: int
    country: str
    activity_times: str
    server: str
    native_language: str
    other_languages: str
    previous_experience: str
    basic_qualities: str
    favourite_event: str
    free_gems: str
    heroes_mutated: str
    discord_tools_comfort: str
    guidelines_rating: str
    high_profile_violation: str
    complex_mechanic: str
    unknown_question: str
    hero_development: str
    racist_r4: str
    moderator_swearing: str

class ApplicationUpdate(BaseModel):
    status: str  # approved or rejected

class VoteCreate(BaseModel):
    vote: str  # "approve" or "reject"

class CommentCreate(BaseModel):
    comment: str

class Moderator(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    hashed_password: str
    role: str = "moderator"  # admin, senior_moderator, moderator
    status: str = "active"  # active, disabled
    is_training_manager: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ModeratorCreate(BaseModel):
    username: str
    password: str
    role: str = "moderator"

class ModeratorLogin(BaseModel):
    username: str
    password: str

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class PasswordReset(BaseModel):
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class ModeratorInfo(BaseModel):
    username: str
    role: str
    status: str
    is_training_manager: bool
    created_at: datetime

class ModeratorStatusUpdate(BaseModel):
    status: str  # active or disabled

class ModeratorRoleUpdate(BaseModel):
    role: str  # admin, senior_moderator, moderator

class ModeratorUsernameUpdate(BaseModel):
    new_username: str

class ModeratorTrainingManagerUpdate(BaseModel):
    is_training_manager: bool


# ============= Auth Helpers =============

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_moderator(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role", "moderator")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return {"username": username, "role": role}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

async def require_admin(current_user: dict = Depends(get_current_moderator)):
    if current_user["role"] not in ["admin", "senior_moderator"]:
        raise HTTPException(status_code=403, detail="Admin or Senior Moderator access required")
    return current_user


# ============= Routes =============

@api_router.get("/")
async def root():
    return {"message": "Top War Moderator Application API"}

# Auth Routes
@api_router.post("/auth/register", response_model=dict)
async def register_moderator(moderator: ModeratorCreate):
    # Check if username already exists
    existing = await db.moderators.find_one({"username": moderator.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Hash password
    hashed_password = pwd_context.hash(moderator.password)
    
    # Create moderator
    mod_obj = Moderator(username=moderator.username, hashed_password=hashed_password, role=moderator.role)
    doc = mod_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.moderators.insert_one(doc)
    return {"message": "Moderator registered successfully", "username": moderator.username, "role": moderator.role}

@api_router.post("/auth/login", response_model=Token)
async def login_moderator(credentials: ModeratorLogin):
    # Find moderator
    moderator = await db.moderators.find_one({"username": credentials.username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Check if account is disabled
    if moderator.get("status", "active") == "disabled":
        raise HTTPException(status_code=403, detail="Account has been disabled. Contact administrator.")
    
    # Verify password
    if not pwd_context.verify(credentials.password, moderator["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Create token
    access_token = create_access_token(data={"sub": credentials.username, "role": moderator.get("role", "moderator")})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": moderator.get("role", "moderator"),
        "username": credentials.username
    }

@api_router.patch("/auth/change-password")
async def change_password(password_data: PasswordChange, current_user: dict = Depends(get_current_moderator)):
    # Get current moderator
    moderator = await db.moderators.find_one({"username": current_user["username"]}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    # Verify old password
    if not pwd_context.verify(password_data.old_password, moderator["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    new_hashed = pwd_context.hash(password_data.new_password)
    await db.moderators.update_one(
        {"username": current_user["username"]},
        {"$set": {"hashed_password": new_hashed}}
    )
    
    return {"message": "Password changed successfully"}

@api_router.patch("/auth/reset-password/{username}")
async def reset_password(username: str, password_data: PasswordReset, current_user: dict = Depends(require_admin)):
    # Check if target user exists
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    # Update password
    new_hashed = pwd_context.hash(password_data.new_password)
    await db.moderators.update_one(
        {"username": username},
        {"$set": {"hashed_password": new_hashed}}
    )
    
    return {"message": f"Password reset successfully for {username}"}

@api_router.get("/moderators", response_model=List[ModeratorInfo])
async def get_moderators(current_user: dict = Depends(require_admin)):
    moderators = await db.moderators.find({}, {"_id": 0, "hashed_password": 0}).to_list(1000)
    
    for mod in moderators:
        if isinstance(mod.get('created_at'), str):
            mod['created_at'] = datetime.fromisoformat(mod['created_at'])
    
    return moderators

@api_router.patch("/moderators/{username}/status")
async def update_moderator_status(username: str, status_update: ModeratorStatusUpdate, current_user: dict = Depends(require_admin)):
    if status_update.status not in ["active", "disabled"]:
        raise HTTPException(status_code=400, detail="Status must be 'active' or 'disabled'")
    
    # Prevent admin from disabling themselves
    if username == current_user["username"]:
        raise HTTPException(status_code=400, detail="You cannot disable your own account")
    
    # Check if user exists
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    # Update status
    await db.moderators.update_one(
        {"username": username},
        {"$set": {"status": status_update.status}}
    )
    
    action = "enabled" if status_update.status == "active" else "disabled"
    return {"message": f"Moderator {username} has been {action}"}

@api_router.delete("/moderators/{username}")
async def delete_moderator(username: str, current_user: dict = Depends(require_admin)):
    # Prevent admin from deleting themselves
    if username == current_user["username"]:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    
    # Check if user exists
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    # Delete moderator
    result = await db.moderators.delete_one({"username": username})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    return {"message": f"Moderator {username} has been deleted successfully"}

@api_router.patch("/moderators/{username}/role")
async def update_moderator_role(username: str, role_update: ModeratorRoleUpdate, current_user: dict = Depends(require_admin)):
    if role_update.role not in ["admin", "senior_moderator", "moderator"]:
        raise HTTPException(status_code=400, detail="Role must be 'admin', 'senior_moderator', or 'moderator'")
    
    # Check if user exists
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    # Update role
    await db.moderators.update_one(
        {"username": username},
        {"$set": {"role": role_update.role}}
    )
    
    return {"message": f"Moderator {username} role updated to {role_update.role}"}

@api_router.patch("/moderators/{username}/username")
async def update_moderator_username(username: str, username_update: ModeratorUsernameUpdate, current_user: dict = Depends(require_admin)):
    # Check if user exists
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    # Check if new username already exists
    existing = await db.moderators.find_one({"username": username_update.new_username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Update username
    await db.moderators.update_one(
        {"username": username},
        {"$set": {"username": username_update.new_username}}
    )
    
    return {"message": f"Username changed from {username} to {username_update.new_username}"}

@api_router.patch("/moderators/{username}/training-manager")
async def update_training_manager(username: str, tm_update: ModeratorTrainingManagerUpdate, current_user: dict = Depends(require_admin)):
    # Check if user exists
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    # Update training manager status
    await db.moderators.update_one(
        {"username": username},
        {"$set": {"is_training_manager": tm_update.is_training_manager}}
    )
    
    status = "enabled" if tm_update.is_training_manager else "disabled"
    return {"message": f"Training Manager status {status} for {username}"}

# Application Routes
@api_router.post("/applications", response_model=Application)
async def submit_application(app_data: ApplicationCreate):
    app_obj = Application(**app_data.model_dump())
    doc = app_obj.model_dump()
    doc['submitted_at'] = doc['submitted_at'].isoformat()
    
    await db.applications.insert_one(doc)
    return app_obj

@api_router.get("/applications", response_model=List[Application])
async def get_applications(search: Optional[str] = None, current_user: dict = Depends(get_current_moderator)):
    query = {}
    if search:
        # Search in name, discord_handle, ingame_name, server
        query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"discord_handle": {"$regex": search, "$options": "i"}},
                {"ingame_name": {"$regex": search, "$options": "i"}},
                {"server": {"$regex": search, "$options": "i"}}
            ]
        }
    
    applications = await db.applications.find(query, {"_id": 0}).sort("submitted_at", -1).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for app in applications:
        if isinstance(app.get('submitted_at'), str):
            app['submitted_at'] = datetime.fromisoformat(app['submitted_at'])
        if app.get('reviewed_at') and isinstance(app['reviewed_at'], str):
            app['reviewed_at'] = datetime.fromisoformat(app['reviewed_at'])
        # Convert vote and comment timestamps
        for vote in app.get('votes', []):
            if isinstance(vote.get('timestamp'), str):
                vote['timestamp'] = datetime.fromisoformat(vote['timestamp'])
        for comment in app.get('comments', []):
            if isinstance(comment.get('timestamp'), str):
                comment['timestamp'] = datetime.fromisoformat(comment['timestamp'])
    
    return applications

@api_router.get("/applications/{application_id}", response_model=Application)
async def get_application(application_id: str, current_user: dict = Depends(get_current_moderator)):
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Convert ISO string timestamps back to datetime objects
    if isinstance(application.get('submitted_at'), str):
        application['submitted_at'] = datetime.fromisoformat(application['submitted_at'])
    if application.get('reviewed_at') and isinstance(application['reviewed_at'], str):
        application['reviewed_at'] = datetime.fromisoformat(application['reviewed_at'])
    # Convert vote and comment timestamps
    for vote in application.get('votes', []):
        if isinstance(vote.get('timestamp'), str):
            vote['timestamp'] = datetime.fromisoformat(vote['timestamp'])
    for comment in application.get('comments', []):
        if isinstance(comment.get('timestamp'), str):
            comment['timestamp'] = datetime.fromisoformat(comment['timestamp'])
    
    return application

@api_router.post("/applications/{application_id}/vote")
async def vote_on_application(application_id: str, vote_data: VoteCreate, current_user: dict = Depends(get_current_moderator)):
    if vote_data.vote not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Vote must be 'approve' or 'reject'")
    
    # Check if application exists
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if user already voted
    votes = application.get('votes', [])
    existing_vote = next((v for v in votes if v['moderator'] == current_user['username']), None)
    
    # Change status from awaiting_review to pending when first vote is cast
    update_fields = {}
    if application.get('status') == 'awaiting_review':
        update_fields['status'] = 'pending'
    
    if existing_vote:
        # Update existing vote
        await db.applications.update_one(
            {"id": application_id, "votes.moderator": current_user['username']},
            {"$set": {
                "votes.$.vote": vote_data.vote,
                "votes.$.timestamp": datetime.now(timezone.utc).isoformat(),
                **update_fields
            }}
        )
    else:
        # Add new vote
        vote = {
            "moderator": current_user['username'],
            "vote": vote_data.vote,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        update_query = {"$push": {"votes": vote}}
        if update_fields:
            update_query["$set"] = update_fields
        
        await db.applications.update_one(
            {"id": application_id},
            update_query
        )
    
    return {"message": "Vote recorded successfully"}

@api_router.post("/applications/{application_id}/comment")
async def comment_on_application(application_id: str, comment_data: CommentCreate, current_user: dict = Depends(get_current_moderator)):
    # Check if application exists
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Add comment
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

@api_router.patch("/applications/{application_id}", response_model=Application)
async def update_application_status(application_id: str, update: ApplicationUpdate, current_user: dict = Depends(require_admin)):
    if update.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    
    # Update the application
    result = await db.applications.update_one(
        {"id": application_id},
        {
            "$set": {
                "status": update.status,
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
                "reviewed_by": current_user['username']
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Get updated application
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    
    # Convert ISO string timestamps back to datetime objects
    if isinstance(application.get('submitted_at'), str):
        application['submitted_at'] = datetime.fromisoformat(application['submitted_at'])
    if application.get('reviewed_at') and isinstance(application['reviewed_at'], str):
        application['reviewed_at'] = datetime.fromisoformat(application['reviewed_at'])
    # Convert vote and comment timestamps
    for vote in application.get('votes', []):
        if isinstance(vote.get('timestamp'), str):
            vote['timestamp'] = datetime.fromisoformat(vote['timestamp'])
    for comment in application.get('comments', []):
        if isinstance(comment.get('timestamp'), str):
            comment['timestamp'] = datetime.fromisoformat(comment['timestamp'])
    
    return application


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()