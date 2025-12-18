from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks
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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


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
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour

# Security settings
MAX_LOGIN_ATTEMPTS = 3
PASSWORD_HISTORY_COUNT = 10

# Email settings
GMAIL_USER = os.environ.get('GMAIL_USER', '')
GMAIL_APP_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD', '')

security = HTTPBearer()

# ============= Email Utility =============

def send_email(to_email: str, subject: str, body: str):
    """Send email via Gmail SMTP"""
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        logging.warning("Email credentials not configured, skipping email send")
        return False
    
    try:
        msg = MIMEMultipart()
        msg['From'] = GMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.send_message(msg)
        
        logging.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logging.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

def send_application_confirmation_email(to_email: str, name: str):
    """Send confirmation email when application is submitted"""
    subject = "Top War - Application Received"
    body = f"""Hi {name},

Thank you for submitting your application to become a Top War Moderator. We have received your application and our team will review it shortly. You will receive an email once a decision has been made.

Kind regards,
Top War Moderation Team"""
    send_email(to_email, subject, body)

def send_application_approved_email(to_email: str, name: str):
    """Send email when application is approved"""
    subject = "Top War Moderator Application – Congratulations!"
    body = f"""Hi {name},

Congratulations! We're pleased to let you know that your application to become a Top War Moderator has been successful.

Please check your Discord DMs, where we've sent you the next steps and onboarding information.

Welcome to the team, we're excited to have you with us!

Kind regards,
Top War Moderation Team"""
    send_email(to_email, subject, body)

def send_application_rejected_email(to_email: str, name: str):
    """Send email when application is rejected"""
    subject = "Top War Moderator Application – Update"
    body = f"""Hi {name},

Thank you for taking the time to apply for a Top War Moderator position and for your interest in supporting the community.

After careful review, we regret to inform you that your application has not been successful on this occasion. We received a strong number of applications, and this decision was not an easy one.

This does not reflect negatively on your enthusiasm or commitment to the game. We actively encourage you to continue developing your game knowledge and community engagement, and you are welcome to reapply in three months should you wish to do so.

Thank you again for your interest in the role and for being part of the Top War community. We wish you the best of luck moving forward and hope to see your application again in the future.

Kind regards,
Top War Moderation Team"""
    send_email(to_email, subject, body)

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
    complex_mechanic: str
    unknown_question: str
    hero_development: str
    racist_r4: str
    moderator_swearing: str
    # Discord-specific questions
    discord_moderation_tools: str = "N/A"
    discord_spam_handling: str = "N/A"
    discord_bots_experience: str = "N/A"
    discord_harassment_handling: str = "N/A"
    discord_voice_channel_management: str = "N/A"
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
    complex_mechanic: str
    unknown_question: str
    hero_development: str
    racist_r4: str
    moderator_swearing: str
    # Discord-specific questions (optional, defaults to N/A for In-Game only applicants)
    discord_moderation_tools: str = "N/A"
    discord_spam_handling: str = "N/A"
    discord_bots_experience: str = "N/A"
    discord_harassment_handling: str = "N/A"
    discord_voice_channel_management: str = "N/A"

class ApplicationUpdate(BaseModel):
    status: str  # approved, rejected, pending, awaiting_review
    comment: str  # Required comment explaining the status change

class VoteCreate(BaseModel):
    vote: str  # "approve" or "reject"

class CommentCreate(BaseModel):
    comment: str

class Moderator(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    hashed_password: str
    password_history: List[str] = Field(default_factory=list)  # Store last 10 hashed passwords
    role: str = "moderator"  # admin, mmod, moderator, lmod, smod, developer
    status: str = "active"  # active, disabled
    is_training_manager: bool = False
    is_admin: bool = False
    can_view_applications: bool = True
    failed_login_attempts: int = 0
    locked_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServerAssignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    server: int
    tag: str  # "Tag 2", "Tag 5", or "Tag 8"
    start_date: str  # UK format DD/MM/YYYY
    end_date: Optional[str] = None  # UK format DD/MM/YYYY
    reason: str
    comments: str = ""
    moderator_name: str = ""  # The moderator on the server (selected from dropdown)
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Announcement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class AnnouncementCreate(BaseModel):
    title: str
    message: str

class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action: str  # approved, rejected, deleted, status_changed
    application_id: str
    application_name: str
    performed_by: str
    comment: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Poll Models
class PollOption(BaseModel):
    text: str
    votes: List[str] = Field(default_factory=list)  # List of usernames who voted

class Poll(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    options: List[Dict] = Field(default_factory=list)  # [{text: str, votes: [usernames]}]
    show_voters: bool = False  # Toggle to show who voted for what
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=7))
    is_active: bool = True
    viewed_by: List[str] = Field(default_factory=list)  # Track who has viewed the poll

class PollCreate(BaseModel):
    question: str
    options: List[str]  # 2-6 options
    show_voters: bool = False

class ArchivedPoll(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    outcome: str  # The winning option with vote count
    created_by: str
    closed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    is_admin: bool
    can_view_applications: bool
    created_at: datetime

class ModeratorStatusUpdate(BaseModel):
    status: str  # active or disabled

class ModeratorRoleUpdate(BaseModel):
    role: str  # admin, senior_moderator, moderator

class ModeratorUsernameUpdate(BaseModel):
    new_username: str

class ModeratorTrainingManagerUpdate(BaseModel):
    is_training_manager: bool

class ModeratorAdminUpdate(BaseModel):
    is_admin: bool

class ModeratorApplicationViewerUpdate(BaseModel):
    can_view_applications: bool

class ServerAssignmentCreate(BaseModel):
    server: int
    tag: str  # "Tag 2", "Tag 5", or "Tag 8"
    start_date: str
    end_date: Optional[str] = None
    reason: str
    comments: str = ""
    moderator_name: str = ""  # The moderator on the server

class ServerAssignmentUpdate(BaseModel):
    end_date: str


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
    if current_user["role"] not in ["admin", "mmod"]:
        raise HTTPException(status_code=403, detail="Admin or MMOD access required")
    return current_user

# Role hierarchy - higher number = higher rank
ROLE_HIERARCHY = {
    'moderator': 0,
    'lmod': 1,
    'smod': 2,
    'mmod': 3,
    'developer': 4,
    'admin': 5
}

def get_role_rank(role: str) -> int:
    return ROLE_HIERARCHY.get(role, 0)

def can_modify_role(current_role: str, target_role: str, is_self: bool = False) -> bool:
    """Check if current user can modify target user's role"""
    # Admin can change their own role
    if current_role == 'admin' and is_self:
        return True
    # No one else can change their own role
    if is_self:
        return False
    # Admin can modify anyone
    if current_role == 'admin':
        return True
    # Others can only modify users with lower rank
    return get_role_rank(current_role) > get_role_rank(target_role)

def get_assignable_roles(current_role: str) -> list:
    """Get roles that current user can assign"""
    if current_role == 'admin':
        return ['admin', 'developer', 'mmod', 'smod', 'lmod', 'moderator']
    current_rank = get_role_rank(current_role)
    return [role for role, rank in ROLE_HIERARCHY.items() if rank < current_rank and role != 'admin']

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password meets security requirements"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_symbol = any(not c.isalnum() for c in password)
    
    if not has_upper:
        return False, "Password must contain at least one uppercase letter"
    if not has_lower:
        return False, "Password must contain at least one lowercase letter"
    if not has_digit:
        return False, "Password must contain at least one number"
    if not has_symbol:
        return False, "Password must contain at least one special character"
    
    return True, "Password is valid"

def check_password_history(new_password: str, password_history: List[str]) -> bool:
    """Check if password was used in last 10 passwords"""
    for old_hash in password_history:
        if pwd_context.verify(new_password, old_hash):
            return False
    return True


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
    
    # Validate password strength
    is_valid, message = validate_password_strength(moderator.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
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
    
    # Check if account is disabled (401 because user can't authenticate)
    if moderator.get("status", "active") == "disabled":
        raise HTTPException(status_code=401, detail="Account has been disabled. Contact administrator.")
    
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
    
    # Validate password strength
    is_valid, message = validate_password_strength(password_data.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Check password history
    password_history = moderator.get("password_history", [])
    if not check_password_history(password_data.new_password, password_history):
        raise HTTPException(status_code=400, detail="Password has been used recently. Please choose a different password.")
    
    # Hash new password
    new_hashed = pwd_context.hash(password_data.new_password)
    
    # Update password history (keep last 10)
    new_history = [moderator["hashed_password"]] + password_history
    new_history = new_history[:PASSWORD_HISTORY_COUNT]
    
    # Update password
    await db.moderators.update_one(
        {"username": current_user["username"]},
        {"$set": {
            "hashed_password": new_hashed,
            "password_history": new_history
        }}
    )
    
    return {"message": "Password changed successfully"}

@api_router.patch("/auth/reset-password/{username}")
async def reset_password(username: str, password_data: PasswordReset, current_user: dict = Depends(require_admin)):
    # Check if target user exists
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    # Validate password strength
    is_valid, message = validate_password_strength(password_data.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Hash new password
    new_hashed = pwd_context.hash(password_data.new_password)
    
    # Update password history (keep last 10)
    password_history = moderator.get("password_history", [])
    new_history = [moderator["hashed_password"]] + password_history
    new_history = new_history[:PASSWORD_HISTORY_COUNT]
    
    # Update password
    await db.moderators.update_one(
        {"username": username},
        {"$set": {
            "hashed_password": new_hashed,
            "password_history": new_history
        }}
    )
    
    return {"message": f"Password reset successfully for {username}"}

@api_router.get("/moderators", response_model=List[ModeratorInfo])
async def get_moderators(current_user: dict = Depends(get_current_moderator)):
    # All authenticated moderators can view the list (needed for Server Assignments dropdown)
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
    
    # Check if this is the last admin
    if moderator.get("is_admin", False):
        admin_count = await db.moderators.count_documents({"is_admin": True})
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last admin. System must have at least one admin.")
    
    # Delete moderator
    result = await db.moderators.delete_one({"username": username})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    return {"message": f"Moderator {username} has been deleted successfully"}

@api_router.patch("/moderators/{username}/role")
async def update_moderator_role(username: str, role_update: ModeratorRoleUpdate, current_user: dict = Depends(get_current_moderator)):
    if role_update.role not in ["admin", "mmod", "moderator", "lmod", "smod", "developer"]:
        raise HTTPException(status_code=400, detail="Role must be 'admin', 'mmod', 'moderator', 'lmod', 'smod', or 'developer'")
    
    # Check if user exists
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    is_self = current_user["username"] == username
    target_role = moderator.get("role", "moderator")
    
    # Check if current user can modify the target's role
    if not can_modify_role(current_user["role"], target_role, is_self):
        raise HTTPException(status_code=403, detail="You do not have permission to modify this user's role")
    
    # Check if the new role is assignable by current user
    assignable_roles = get_assignable_roles(current_user["role"])
    if role_update.role not in assignable_roles:
        raise HTTPException(status_code=403, detail=f"You cannot assign the '{role_update.role}' role")
    
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

@api_router.patch("/moderators/{username}/admin")
async def update_admin(username: str, admin_update: ModeratorAdminUpdate, current_user: dict = Depends(require_admin)):
    # Check if user exists
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    # If disabling admin, check if this is the last admin
    if not admin_update.is_admin and moderator.get("is_admin", False):
        admin_count = await db.moderators.count_documents({"is_admin": True})
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot disable the last admin. System must have at least one admin.")
    
    # Update admin status
    await db.moderators.update_one(
        {"username": username},
        {"$set": {"is_admin": admin_update.is_admin}}
    )
    
    status = "enabled" if admin_update.is_admin else "disabled"
    return {"message": f"Admin status {status} for {username}"}

@api_router.patch("/moderators/{username}/unlock")
async def unlock_account(username: str, current_user: dict = Depends(require_admin)):
    # Check if user exists
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    # Unlock account
    await db.moderators.update_one(
        {"username": username},
        {"$set": {
            "locked_at": None,
            "failed_login_attempts": 0
        }}
    )
    
    return {"message": f"Account unlocked for {username}"}

@api_router.patch("/moderators/{username}/application-viewer")
async def update_application_viewer(username: str, viewer_update: ModeratorApplicationViewerUpdate, current_user: dict = Depends(require_admin)):
    # Check if user exists
    moderator = await db.moderators.find_one({"username": username}, {"_id": 0})
    if not moderator:
        raise HTTPException(status_code=404, detail="Moderator not found")
    
    # Update application viewer status
    await db.moderators.update_one(
        {"username": username},
        {"$set": {"can_view_applications": viewer_update.can_view_applications}}
    )
    
    status = "enabled" if viewer_update.can_view_applications else "disabled"
    return {"message": f"Application Viewer status {status} for {username}"}

# Server Assignments Routes
@api_router.post("/server-assignments", response_model=ServerAssignment)
async def create_server_assignment(assignment: ServerAssignmentCreate, current_user: dict = Depends(get_current_moderator)):
    assignment_obj = ServerAssignment(**assignment.model_dump(), created_by=current_user['username'])
    doc = assignment_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.server_assignments.insert_one(doc)
    return assignment_obj

@api_router.get("/server-assignments", response_model=List[ServerAssignment])
async def get_server_assignments(current_user: dict = Depends(get_current_moderator)):
    assignments = await db.server_assignments.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for assignment in assignments:
        if isinstance(assignment.get('created_at'), str):
            assignment['created_at'] = datetime.fromisoformat(assignment['created_at'])
    
    return assignments

@api_router.patch("/server-assignments/{assignment_id}")
async def update_server_assignment(assignment_id: str, update: ServerAssignmentUpdate, current_user: dict = Depends(get_current_moderator)):
    # Check if assignment exists
    assignment = await db.server_assignments.find_one({"id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Server assignment not found")
    
    # Update end date
    await db.server_assignments.update_one(
        {"id": assignment_id},
        {"$set": {"end_date": update.end_date}}
    )
    
    return {"message": "End date updated successfully"}

@api_router.delete("/server-assignments/{assignment_id}")
async def delete_server_assignment(assignment_id: str, current_user: dict = Depends(require_admin)):
    result = await db.server_assignments.delete_one({"id": assignment_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Server assignment not found")
    
    return {"message": "Server assignment deleted successfully"}

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
    # Check if user can view applications
    moderator = await db.moderators.find_one({"username": current_user['username']}, {"_id": 0})
    if moderator and not moderator.get('can_view_applications', True):
        raise HTTPException(status_code=403, detail="You do not have permission to view applications")
    
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
    if update.status not in ["approved", "rejected", "pending", "awaiting_review"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved', 'rejected', 'pending', or 'awaiting_review'")
    
    if not update.comment or not update.comment.strip():
        raise HTTPException(status_code=400, detail="A comment is required when changing application status")
    
    # Get existing application to check old status
    existing_app = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not existing_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    old_status = existing_app.get('status', 'awaiting_review')
    
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
    
    # Add the required comment to the application
    comment = {
        "moderator": current_user['username'],
        "comment": f"[STATUS CHANGE: {old_status.upper()} → {update.status.upper()}] {update.comment}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.applications.update_one(
        {"id": application_id},
        {"$push": {"comments": comment}}
    )
    
    # Create audit log entry
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

@api_router.delete("/applications/{application_id}")
async def delete_application(application_id: str, current_user: dict = Depends(require_admin)):
    # Get existing application
    existing_app = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not existing_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Create audit log entry before deletion
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
    
    # Delete the application
    result = await db.applications.delete_one({"id": application_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {"message": f"Application from {existing_app.get('name', 'Unknown')} deleted successfully"}

# Audit Log endpoints
@api_router.get("/audit-logs")
async def get_audit_logs(current_user: dict = Depends(get_current_moderator)):
    # Only MMODs and Admins can view audit logs
    if current_user["role"] not in ["admin", "mmod"]:
        raise HTTPException(status_code=403, detail="Only Admin and MMOD can view audit logs")
    
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return logs


# Announcement endpoints
@api_router.get("/announcements")
async def get_announcements():
    """Get all active announcements - accessible to everyone"""
    announcements = await db.announcements.find({"is_active": True}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return announcements

@api_router.get("/announcements/all")
async def get_all_announcements(current_user: dict = Depends(get_current_moderator)):
    """Get all announcements including inactive - requires login"""
    if current_user["role"] not in ["admin", "mmod"]:
        raise HTTPException(status_code=403, detail="Only Admin and MMOD can view all announcements")
    announcements = await db.announcements.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return announcements

@api_router.post("/announcements")
async def create_announcement(announcement: AnnouncementCreate, current_user: dict = Depends(get_current_moderator)):
    """Create a new announcement - MMOD and Admin only"""
    if current_user["role"] not in ["admin", "mmod"]:
        raise HTTPException(status_code=403, detail="Only Admin and MMOD can create announcements")
    
    new_announcement = Announcement(
        title=announcement.title,
        message=announcement.message,
        created_by=current_user["username"]
    )
    await db.announcements.insert_one(new_announcement.model_dump())
    return {"message": "Announcement created successfully", "id": new_announcement.id}

@api_router.delete("/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str, current_user: dict = Depends(get_current_moderator)):
    """Delete an announcement - MMOD and Admin only"""
    if current_user["role"] not in ["admin", "mmod"]:
        raise HTTPException(status_code=403, detail="Only Admin and MMOD can delete announcements")
    
    result = await db.announcements.delete_one({"id": announcement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"message": "Announcement deleted successfully"}

@api_router.patch("/announcements/{announcement_id}/toggle")
async def toggle_announcement(announcement_id: str, current_user: dict = Depends(get_current_moderator)):
    """Toggle announcement active status - MMOD and Admin only"""
    if current_user["role"] not in ["admin", "mmod"]:
        raise HTTPException(status_code=403, detail="Only Admin and MMOD can toggle announcements")
    
    announcement = await db.announcements.find_one({"id": announcement_id}, {"_id": 0})
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    new_status = not announcement.get("is_active", True)
    await db.announcements.update_one({"id": announcement_id}, {"$set": {"is_active": new_status}})
    return {"message": f"Announcement {'activated' if new_status else 'deactivated'} successfully"}


# Poll endpoints
@api_router.get("/polls")
async def get_polls(current_user: dict = Depends(get_current_moderator)):
    """Get all active polls"""
    polls = await db.polls.find({"is_active": True}, {"_id": 0}).sort("created_at", -1).to_list(10)
    return polls

@api_router.get("/polls/check-new")
async def check_new_polls(current_user: dict = Depends(get_current_moderator)):
    """Check if there are polls the user hasn't viewed yet"""
    username = current_user["username"]
    # Find active polls that user hasn't viewed
    unviewed_polls = await db.polls.count_documents({
        "is_active": True,
        "viewed_by": {"$ne": username}
    })
    return {"has_new_polls": unviewed_polls > 0, "count": unviewed_polls}

@api_router.post("/polls/{poll_id}/mark-viewed")
async def mark_poll_viewed(poll_id: str, current_user: dict = Depends(get_current_moderator)):
    """Mark a poll as viewed by the current user"""
    username = current_user["username"]
    await db.polls.update_one(
        {"id": poll_id},
        {"$addToSet": {"viewed_by": username}}
    )
    return {"message": "Poll marked as viewed"}

@api_router.post("/polls")
async def create_poll(poll_data: PollCreate, current_user: dict = Depends(get_current_moderator)):
    """Create a new poll - SMod, MMOD, Developer only"""
    if current_user["role"] not in ["smod", "mmod", "developer", "admin"]:
        raise HTTPException(status_code=403, detail="Only SMod, MMOD, Developer can create polls")
    
    # Validate options count
    if len(poll_data.options) < 2:
        raise HTTPException(status_code=400, detail="Poll must have at least 2 options")
    if len(poll_data.options) > 6:
        raise HTTPException(status_code=400, detail="Poll cannot have more than 6 options")
    
    # Check active polls limit (max 2)
    active_polls_count = await db.polls.count_documents({"is_active": True})
    if active_polls_count >= 2:
        raise HTTPException(status_code=400, detail="Maximum of 2 active polls allowed. Please wait for an existing poll to close.")
    
    # Create poll with structured options
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

@api_router.post("/polls/{poll_id}/vote")
async def vote_on_poll(poll_id: str, option_index: int, current_user: dict = Depends(get_current_moderator)):
    """Vote on a poll - all authenticated users can vote"""
    username = current_user["username"]
    
    poll = await db.polls.find_one({"id": poll_id, "is_active": True}, {"_id": 0})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found or already closed")
    
    # Check if user already voted
    for opt in poll.get("options", []):
        if username in opt.get("votes", []):
            raise HTTPException(status_code=400, detail="You have already voted on this poll")
    
    # Validate option index
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
        # All moderators have voted - close and archive the poll
        await close_and_archive_poll(poll_id)
    
    return {"message": "Vote recorded successfully"}

async def close_and_archive_poll(poll_id: str):
    """Close a poll and archive it"""
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

@api_router.delete("/polls/{poll_id}")
async def delete_poll(poll_id: str, current_user: dict = Depends(get_current_moderator)):
    """Delete a poll - Admin only"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only Admin can delete polls")
    
    result = await db.polls.delete_one({"id": poll_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Poll not found")
    return {"message": "Poll deleted successfully"}

@api_router.get("/polls/archived")
async def get_archived_polls(current_user: dict = Depends(get_current_moderator)):
    """Get all archived polls"""
    archived = await db.archived_polls.find({}, {"_id": 0}).sort("closed_at", -1).to_list(100)
    return archived

@api_router.post("/polls/check-expired")
async def check_expired_polls():
    """Check and close expired polls - can be called periodically"""
    now = datetime.now(timezone.utc).isoformat()
    expired_polls = await db.polls.find({
        "is_active": True,
        "expires_at": {"$lte": now}
    }, {"_id": 0}).to_list(10)
    
    for poll in expired_polls:
        await close_and_archive_poll(poll["id"])
    
    return {"message": f"Checked and closed {len(expired_polls)} expired polls"}


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