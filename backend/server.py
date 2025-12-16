from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
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
    status: str = "pending"  # pending, approved, rejected
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

class Moderator(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ModeratorCreate(BaseModel):
    username: str
    password: str

class ModeratorLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


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
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


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
    mod_obj = Moderator(username=moderator.username, hashed_password=hashed_password)
    doc = mod_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.moderators.insert_one(doc)
    return {"message": "Moderator registered successfully", "username": moderator.username}

@api_router.post("/auth/login", response_model=Token)
async def login_moderator(credentials: ModeratorLogin):
    # Find moderator
    moderator = await db.moderators.find_one({"username": credentials.username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Verify password
    if not pwd_context.verify(credentials.password, moderator["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Create token
    access_token = create_access_token(data={"sub": credentials.username})
    return {"access_token": access_token, "token_type": "bearer"}

# Application Routes
@api_router.post("/applications", response_model=Application)
async def submit_application(app_data: ApplicationCreate):
    app_obj = Application(**app_data.model_dump())
    doc = app_obj.model_dump()
    doc['submitted_at'] = doc['submitted_at'].isoformat()
    
    await db.applications.insert_one(doc)
    return app_obj

@api_router.get("/applications", response_model=List[Application])
async def get_applications(search: Optional[str] = None, current_user: str = Depends(get_current_moderator)):
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
    
    return applications

@api_router.get("/applications/{application_id}", response_model=Application)
async def get_application(application_id: str, current_user: str = Depends(get_current_moderator)):
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Convert ISO string timestamps back to datetime objects
    if isinstance(application.get('submitted_at'), str):
        application['submitted_at'] = datetime.fromisoformat(application['submitted_at'])
    if application.get('reviewed_at') and isinstance(application['reviewed_at'], str):
        application['reviewed_at'] = datetime.fromisoformat(application['reviewed_at'])
    
    return application

@api_router.patch("/applications/{application_id}", response_model=Application)
async def update_application_status(application_id: str, update: ApplicationUpdate, current_user: str = Depends(get_current_moderator)):
    if update.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    
    # Update the application
    result = await db.applications.update_one(
        {"id": application_id},
        {
            "$set": {
                "status": update.status,
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
                "reviewed_by": current_user
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