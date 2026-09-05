from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import SessionLocal
from routers import auth, users, cases, hearings, documents, tasks, notifications, ai
from services.notification_service import check_and_generate_hearing_notifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: execute automatic hearing notification checks
    try:
        with SessionLocal() as db:
            check_and_generate_hearing_notifications(db)
    except Exception as e:
        print(f"Startup hearing notification check: {e}")
    yield


app = FastAPI(title="Judicial Flow Pro API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://judicial-flow-pro-kappa.vercel.app",
    ],
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
