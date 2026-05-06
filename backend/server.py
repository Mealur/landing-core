from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.responses import StreamingResponse
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

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="MEALUR — Coming Soon API")

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


@api_router.post("/waitlist", response_model=SubscribeResponse)
async def subscribe_waitlist(payload: WaitlistSubscribe):
    email_norm = payload.email.strip().lower()

    existing = await db.waitlist.find_one(
        {"email": email_norm}, {"_id": 0, "id": 1}
    )
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

    count = await db.waitlist.count_documents({})
    return SubscribeResponse(ok=True, already_subscribed=already, count=count)


@api_router.get("/waitlist/stats", response_model=WaitlistStats)
async def waitlist_stats():
    count = await db.waitlist.count_documents({})
    return WaitlistStats(count=count)


# --------------------------- Admin Routes ---------------------------
@api_router.get("/admin/waitlist", response_model=AdminListResponse)
async def admin_list_waitlist(_: bool = Depends(require_admin)):
    docs = (
        await db.waitlist.find({}, {"_id": 0, "email": 1, "source": 1, "created_at": 1})
        .sort("created_at", -1)
        .to_list(length=10000)
    )
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
    docs = (
        await db.waitlist.find({}, {"_id": 0, "email": 1, "source": 1, "created_at": 1})
        .sort("created_at", -1)
        .to_list(length=100000)
    )

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

cors_origins = [
    origin.strip()
    for origin in os.environ.get('CORS_ORIGINS', '').split(',')
    if origin.strip()
]

if not cors_origins:
    cors_origins = ['http://localhost:3000', 'http://localhost:5173']

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_indexes():
    # Ensure unique-ish indexing on email for fast lookup
    try:
        await db.waitlist.create_index("email", unique=True)
    except Exception:
        logger.warning("Could not create index on waitlist.email", exc_info=True)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
