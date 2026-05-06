from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from fastapi.responses import StreamingResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import csv
import io
import secrets
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging FIRST so it's available in route handlers
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# -------------------- MongoDB connection (resilient) --------------------
mongo_url = os.environ.get('MONGO_URL', '')
db_name = os.environ.get('DB_NAME', 'test_database')

if not mongo_url:
    logger.error("MONGO_URL environment variable is NOT set!")

# Set a server selection timeout so we fail fast instead of hanging
client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    socketTimeoutMS=10000,
)
db = client[db_name]

logger.info("MongoDB client created for DB: %s", db_name)

# Create the main app without a prefix
app = FastAPI(title="MEALUR — Coming Soon API")

# ---------------------- CORS (must be set up BEFORE routes) ----------------------
default_cors_origins = [
    'https://mealur.in',
    'https://www.mealur.in',
    'http://localhost:3000',
    'http://localhost:5173',
]

env_cors_origins = [
    origin.strip()
    for origin in os.environ.get('CORS_ORIGINS', '').split(',')
    if origin.strip() and origin.strip() != '*'
]

cors_origins = list(dict.fromkeys(default_cors_origins + env_cors_origins))

logger.info("=== CORS allowed origins: %s", cors_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ------------- Global exception handler (keeps CORS on errors) ---------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch ANY unhandled exception and return a proper JSON 500 response.
    This ensures the CORS middleware can still add headers to the response
    instead of letting Uvicorn generate a plain-text error with no CORS headers.
    """
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check server logs."},
    )


# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ------------------------------ Models ------------------------------
class WaitlistSubscribe(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    source: Optional[str] = Field(default="coming_soon")


class WaitlistEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    source: str = "coming_soon"
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class SubscribeResponse(BaseModel):
    ok: bool
    already_subscribed: bool
    count: int


class WaitlistStats(BaseModel):
    count: int


class AdminSubscriber(BaseModel):
    email: EmailStr
    source: str
    created_at: datetime


class AdminListResponse(BaseModel):
    count: int
    subscribers: List[AdminSubscriber]


# --------------------------- Auth dependency ---------------------------
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")


async def require_admin(
    authorization: Optional[str] = Header(default=None),
    x_admin_token: Optional[str] = Header(default=None, alias="X-Admin-Token"),
    token: Optional[str] = None,  # query param fallback for CSV download
):
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=500, detail="Admin token not configured.")

    provided = None
    if authorization and authorization.lower().startswith("bearer "):
        provided = authorization.split(" ", 1)[1].strip()
    elif x_admin_token:
        provided = x_admin_token.strip()
    elif token:
        provided = token.strip()

    if not provided or not secrets.compare_digest(provided, ADMIN_TOKEN):
        raise HTTPException(status_code=401, detail="Unauthorized.")
    return True


# ------------------------------ Routes ------------------------------
@api_router.get("/")
async def root():
    return {"service": "MEALUR", "status": "still cooking"}


@api_router.get("/health")
async def health_check():
    """Health check that also tests MongoDB connectivity."""
    mongo_ok = False
    mongo_error = None
    try:
        result = await client.admin.command("ping")
        mongo_ok = result.get("ok") == 1.0
    except Exception as e:
        mongo_error = f"{type(e).__name__}: {e}"
        logger.error("Health check — MongoDB ping failed: %s", mongo_error)

    status = "healthy" if mongo_ok else "unhealthy"
    return JSONResponse(
        status_code=200 if mongo_ok else 503,
        content={
            "status": status,
            "mongo": "connected" if mongo_ok else "disconnected",
            "mongo_error": mongo_error,
            "db_name": db_name,
            "cors_origins": cors_origins,
            "mongo_url_set": bool(mongo_url),
        },
    )


@api_router.post("/waitlist", response_model=SubscribeResponse)
async def subscribe_waitlist(payload: WaitlistSubscribe):
    email_norm = payload.email.strip().lower()

    try:
        existing = await db.waitlist.find_one(
            {"email": email_norm}, {"_id": 0, "id": 1}
        )
    except Exception as e:
        logger.exception("MongoDB query failed in subscribe_waitlist")
        raise HTTPException(
            status_code=503,
            detail=f"Database unavailable: {type(e).__name__}"
        ) from e

    already = existing is not None

    if not already:
        entry = WaitlistEntry(email=email_norm, source=payload.source or "coming_soon")
        doc = entry.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        try:
            await db.waitlist.insert_one(doc)
        except Exception as e:
            logger.exception("Failed to insert waitlist entry")
            raise HTTPException(status_code=500, detail="Could not save email.") from e

    try:
        count = await db.waitlist.count_documents({})
    except Exception:
        count = 0

    return SubscribeResponse(ok=True, already_subscribed=already, count=count)


@api_router.get("/waitlist/stats", response_model=WaitlistStats)
async def waitlist_stats():
    try:
        count = await db.waitlist.count_documents({})
    except Exception as e:
        logger.exception("MongoDB query failed in waitlist_stats")
        raise HTTPException(
            status_code=503,
            detail=f"Database unavailable: {type(e).__name__}"
        ) from e
    return WaitlistStats(count=count)


# --------------------------- Admin Routes ---------------------------
@api_router.get("/admin/waitlist", response_model=AdminListResponse)
async def admin_list_waitlist(_: bool = Depends(require_admin)):
    try:
        docs = (
            await db.waitlist.find({}, {"_id": 0, "email": 1, "source": 1, "created_at": 1})
            .sort("created_at", -1)
            .to_list(length=10000)
        )
    except Exception as e:
        logger.exception("MongoDB query failed in admin_list_waitlist")
        raise HTTPException(
            status_code=503,
            detail=f"Database unavailable: {type(e).__name__}"
        ) from e

    subscribers = []
    for d in docs:
        created = d.get("created_at")
        if isinstance(created, str):
            try:
                created = datetime.fromisoformat(created)
            except ValueError:
                created = datetime.now(timezone.utc)
        subscribers.append(
            AdminSubscriber(
                email=d["email"],
                source=d.get("source", "coming_soon"),
                created_at=created,
            )
        )
    return AdminListResponse(count=len(subscribers), subscribers=subscribers)


@api_router.get("/admin/waitlist.csv")
async def admin_export_csv(_: bool = Depends(require_admin)):
    try:
        docs = (
            await db.waitlist.find({}, {"_id": 0, "email": 1, "source": 1, "created_at": 1})
            .sort("created_at", -1)
            .to_list(length=100000)
        )
    except Exception as e:
        logger.exception("MongoDB query failed in admin_export_csv")
        raise HTTPException(
            status_code=503,
            detail=f"Database unavailable: {type(e).__name__}"
        ) from e

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["email", "source", "created_at"])
    for d in docs:
        created = d.get("created_at", "")
        if isinstance(created, datetime):
            created = created.isoformat()
        writer.writerow([d.get("email", ""), d.get("source", ""), created])

    buffer.seek(0)
    filename = f"mealur-waitlist-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# Include the router in the main app
app.include_router(api_router)


@app.on_event("startup")
async def startup_indexes():
    # Log environment state for debugging on Render
    logger.info("=== STARTUP: MONGO_URL set = %s", bool(mongo_url))
    logger.info("=== STARTUP: DB_NAME = %s", db_name)
    logger.info("=== STARTUP: ADMIN_TOKEN set = %s", bool(ADMIN_TOKEN))
    logger.info("=== STARTUP: CORS origins = %s", cors_origins)

    # Test MongoDB connectivity
    try:
        result = await client.admin.command("ping")
        logger.info("=== STARTUP: MongoDB ping OK: %s", result)
    except Exception:
        logger.exception("=== STARTUP: MongoDB connection FAILED! Check MONGO_URL and Atlas IP whitelist.")

    # Ensure unique-ish indexing on email for fast lookup
    try:
        await db.waitlist.create_index("email", unique=True)
    except Exception:
        logger.warning("Could not create index on waitlist.email", exc_info=True)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
