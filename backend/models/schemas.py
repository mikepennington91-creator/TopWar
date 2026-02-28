"""Pydantic models for all API schemas."""
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict
from pydantic import BaseModel, Field, ConfigDict, conint


# ============= Application Models =============

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
    email: Optional[str] = None
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
    highest_character_level: Optional[conint(ge=1, le=9999)] = None
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
    # In-Game specific questions
    time_playing_topwar: str = "N/A"
    why_good_moderator: str = "N/A"
    status: str = "awaiting_review"
    discord_approved: bool = False
    in_game_approved: bool = False
    discord_approved_by: Optional[str] = None
    in_game_approved_by: Optional[str] = None
    votes: List[Dict] = Field(default_factory=list)
    comments: List[Dict] = Field(default_factory=list)
    viewed_by: List[str] = Field(default_factory=list)
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None


class ApplicationCreate(BaseModel):
    name: str
    email: str
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
    highest_character_level: conint(ge=1, le=9999)
    discord_tools_comfort: str
    guidelines_rating: str
    complex_mechanic: str
    unknown_question: str
    hero_development: str
    racist_r4: str
    moderator_swearing: str
    discord_moderation_tools: str = "N/A"
    discord_spam_handling: str = "N/A"
    discord_bots_experience: str = "N/A"
    discord_harassment_handling: str = "N/A"
    discord_voice_channel_management: str = "N/A"
    time_playing_topwar: str = "N/A"
    why_good_moderator: str = "N/A"


class ApplicationUpdate(BaseModel):
    status: str
    comment: str


class TeamApprovalUpdate(BaseModel):
    approval_type: str  # "discord" or "in_game"
    comment: str


# ============= Application Settings Models =============

class ApplicationSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = "app_settings"
    applications_enabled: bool = True
    updated_by: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ApplicationSettingsUpdate(BaseModel):
    applications_enabled: bool


class VoteCreate(BaseModel):
    vote: str


class CommentCreate(BaseModel):
    comment: str


# ============= Moderator Models =============

class Moderator(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: Optional[str] = None
    hashed_password: str
    password_history: List[str] = Field(default_factory=list)
    role: str = "moderator"
    roles: List[str] = Field(default_factory=lambda: ["moderator"])
    status: str = "active"
    is_training_manager: bool = False
    is_in_game_leader: bool = False
    is_discord_leader: bool = False
    is_admin: bool = False
    can_view_applications: bool = True
    failed_login_attempts: int = 0
    locked_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None
    must_change_password: bool = True


class ModeratorCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: str
    role: str = "moderator"
    roles: Optional[List[str]] = None
    is_in_game_leader: bool = False
    is_discord_leader: bool = False


class ModeratorLogin(BaseModel):
    username: str
    password: str
    email: Optional[str] = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str


class PasswordReset(BaseModel):
    new_password: str


class PasswordResetRequest(BaseModel):
    username: str
    email: str


class PasswordResetByEmail(BaseModel):
    token: str
    new_password: str


class ModeratorEmailUpdate(BaseModel):
    email: str


class ModeratorProfile(BaseModel):
    username: str
    email: Optional[str] = None
    needs_email: bool = False


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    roles: List[str] = Field(default_factory=list)
    username: str
    must_change_password: bool = False
    is_admin: bool = False
    is_training_manager: bool = False
    is_in_game_leader: bool = False
    is_discord_leader: bool = False
    needs_email: bool = False


class ModeratorInfo(BaseModel):
    username: str
    role: str
    roles: List[str] = Field(default_factory=list)
    status: str
    is_training_manager: bool
    is_in_game_leader: bool = False
    is_discord_leader: bool = False
    is_admin: bool
    can_view_applications: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    email: Optional[str] = None  # Only populated for admins


class ModeratorStatusUpdate(BaseModel):
    status: str


class ModeratorRoleUpdate(BaseModel):
    role: Optional[str] = None
    roles: Optional[List[str]] = None


class ModeratorUsernameUpdate(BaseModel):
    new_username: str


class ModeratorTrainingManagerUpdate(BaseModel):
    is_training_manager: bool


class ModeratorAdminUpdate(BaseModel):
    is_admin: bool


class ModeratorApplicationViewerUpdate(BaseModel):
    can_view_applications: bool


class ModeratorLeaderUpdate(BaseModel):
    is_in_game_leader: bool
    is_discord_leader: bool


# ============= Server Assignment Models =============

class ServerAssignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    server: int
    tag: str
    start_date: str
    end_date: Optional[str] = None
    reason: str
    comments: str = ""
    moderator_name: str = ""
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ServerAssignmentCreate(BaseModel):
    server: int
    tag: str
    start_date: str
    end_date: Optional[str] = None
    reason: str
    comments: str = ""
    moderator_name: str = ""


class ServerAssignmentUpdate(BaseModel):
    end_date: str


# ============= Announcement Models =============

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


# ============= Audit Log Models =============

class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action: str
    application_id: str
    application_name: str
    performed_by: str
    comment: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============= Poll Models =============

class PollOption(BaseModel):
    text: str
    votes: List[str] = Field(default_factory=list)


class Poll(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    options: List[Dict] = Field(default_factory=list)
    show_voters: bool = False
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=7))
    is_active: bool = True
    viewed_by: List[str] = Field(default_factory=list)


class PollCreate(BaseModel):
    question: str
    options: List[str]
    show_voters: bool = False


class ArchivedPoll(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    outcome: str
    created_by: str
    closed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============= Easter Egg Models =============

class EasterEggPage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    page_key: str  # e.g., "troll", "valentine", "developer", "garuda"
    username: str
    password: str
    title: str
    content: Dict = Field(default_factory=dict)  # Flexible content storage
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None


class EasterEggPageCreate(BaseModel):
    page_key: str
    username: str
    password: str
    title: str
    content: Dict = Field(default_factory=dict)


class EasterEggPageUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    title: Optional[str] = None
    content: Optional[Dict] = None
    is_active: Optional[bool] = None
