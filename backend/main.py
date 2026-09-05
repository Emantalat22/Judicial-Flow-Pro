from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, SessionLocal, Base
from models.user import User
from models.case import Case
from models.hearing import Hearing
from models.document import Document
from models.task import Task
from models.notification import Notification

from routers import auth, users, cases, hearings, documents, tasks, notifications, ai
from services.notification_service import check_and_generate_hearing_notifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist, seed demo data if empty, and check notifications
    try:
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            user_count = db.query(User).count()
            if user_count == 0:
                from seed_demo_data import seed_demo_data
                seed_demo_data()
            check_and_generate_hearing_notifications(db)
    except Exception as e:
        print(f"Startup initialization warning: {e}")
    yield


app = FastAPI(title="Judicial Flow Pro API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://judicial-flow-pro-kappa.vercel.app",
        "https://judicial-flow-pro.vercel.app",
    ],
    allow_origin_regex=r"https:\/\/judicial-flow-pro.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,          prefix="/api/auth",          tags=["auth"])
app.include_router(users.router,         prefix="/api/users",         tags=["users"])
app.include_router(cases.router,         prefix="/api/cases",         tags=["cases"])
app.include_router(hearings.router,      prefix="/api/hearings",      tags=["hearings"])
app.include_router(documents.router,     prefix="/api/documents",     tags=["documents"])
app.include_router(tasks.router,         prefix="/api/tasks",         tags=["tasks"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(ai.router,            prefix="/api/ai",            tags=["ai"])


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
