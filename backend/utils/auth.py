"""Authentication utilities."""
import os
from datetime import datetime, timezone, timedelta
from typing import List, Iterable
from passlib.context import CryptContext
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'topwar-moderator-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour

# Security settings
MAX_LOGIN_ATTEMPTS = 3
PASSWORD_HISTORY_COUNT = 10

security = HTTPBearer()

# Role hierarchy - higher number = higher rank
ROLE_HIERARCHY = {
    'moderator': 0,
    'in_game_leader': 1,
    'discord_leader': 1,
    'lmod': 2,
    'smod': 3,
    'mmod': 4,
    'developer': 5,
    'admin': 6
}


def normalize_roles(role: str = "moderator", roles: list | None = None) -> list:
    """Normalize and deduplicate roles while preserving a fallback role."""
    merged = []
    if role:
        merged.append(role)
    if roles:
        merged.extend(roles)

    normalized = []
    for item in merged:
        if item in ROLE_HIERARCHY and item not in normalized:
            normalized.append(item)

    return normalized or ["moderator"]


def get_highest_role(roles: Iterable[str]) -> str:
    """Get the highest-ranking role in the provided roles list."""
    valid_roles = [item for item in roles if item in ROLE_HIERARCHY]
    if not valid_roles:
        return "moderator"
    return max(valid_roles, key=get_role_rank)


def has_any_role(user: dict, allowed_roles: Iterable[str]) -> bool:
    """Check if a user has any role from allowed_roles."""
    user_roles = set(normalize_roles(user.get("role", "moderator"), user.get("roles", [])))
    return bool(user_roles.intersection(set(allowed_roles)))


def create_access_token(data: dict):
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_moderator(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get the current authenticated moderator from JWT token."""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role", "moderator")
        roles: list = normalize_roles(role, payload.get("roles", []))
        role = get_highest_role(roles)
        is_admin: bool = payload.get("is_admin", False)
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return {"username": username, "role": role, "roles": roles, "is_admin": is_admin}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


async def require_admin(current_user: dict = Depends(get_current_moderator)):
    """Require admin or MMOD role."""
    if not has_any_role(current_user, ["admin", "mmod"]) and not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin or MMOD access required")
    return current_user


async def require_admin_role(current_user: dict = Depends(get_current_moderator)):
    """Require admin role."""
    if not has_any_role(current_user, ["admin"]):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def get_role_rank(role: str) -> int:
    """Get the rank of a role."""
    return ROLE_HIERARCHY.get(role, 0)


def can_modify_role(current_role: str, target_role: str, is_self: bool = False) -> bool:
    """Check if current user can modify target user's role."""
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
    """Get roles that current user can assign."""
    if current_role == 'admin':
        return ['admin', 'developer', 'mmod', 'smod', 'lmod', 'in_game_leader', 'discord_leader', 'moderator']
    current_rank = get_role_rank(current_role)
    return [role for role, rank in ROLE_HIERARCHY.items() if rank < current_rank and role != 'admin']


def validate_password_strength(password: str) -> tuple:
    """Validate password meets security requirements."""
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
    """Check if password was used in last 10 passwords."""
    for old_hash in password_history:
        if pwd_context.verify(new_password, old_hash):
            return False
    return True
