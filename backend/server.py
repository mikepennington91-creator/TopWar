"""Main FastAPI application - Top War Moderator Portal."""
import os
import logging
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

from database import db, close_db_connection
from routes import auth, moderators, applications, polls, announcements, server_assignments, audit_logs, easter_eggs, feature_requests, image_generation

# Create the main app
app = FastAPI(title="Top War Moderator Application API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Top War Moderator Application API"}


# Include all route modules
api_router.include_router(auth.router)
api_router.include_router(moderators.router)
api_router.include_router(applications.router)
api_router.include_router(polls.router)
api_router.include_router(announcements.router)
api_router.include_router(server_assignments.router)
api_router.include_router(audit_logs.router)
api_router.include_router(easter_eggs.router)
api_router.include_router(feature_requests.router)
api_router.include_router(image_generation.router)

# Include the API router in the main app
app.include_router(api_router)

# CORS middleware
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


@app.on_event("startup")
async def startup_event():
    """Initialize easter egg pages on startup."""
    from routes.easter_eggs import initialize_easter_eggs
    await initialize_easter_eggs()
    logger.info("Easter egg pages initialized")


@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown."""
    await close_db_connection()
