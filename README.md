# Judicial Flow Pro

A modern full-stack judicial case management and workflow platform.

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS v4 |
| Backend   | Python 3.11+ + FastAPI            |
| Database  | PostgreSQL                        |
| ORM       | SQLAlchemy + Alembic              |
| API comms | Axios (frontend → backend via proxy) |

---

## Project Structure

```
judicial-flow-pro/
├── frontend/                  # React + Vite application
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js      # Axios instance (base URL: /api)
│   │   ├── components/
│   │   │   └── Layout.jsx     # App shell: sidebar + topbar
│   │   ├── pages/             # One stub page per route
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Cases.jsx
│   │   │   ├── CaseDetail.jsx
│   │   │   ├── Hearings.jsx
│   │   │   ├── Documents.jsx
│   │   │   ├── AIAssistant.jsx
│   │   │   └── Notifications.jsx
│   │   ├── App.jsx            # Route definitions
│   │   ├── main.jsx           # React root
│   │   └── index.css          # Tailwind CSS v4 import
│   ├── index.html
│   ├── vite.config.js         # Proxies /api → http://localhost:8000
│   └── package.json
│
├── backend/                   # FastAPI application
│   ├── routers/               # One FastAPI router per domain
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── cases.py
│   │   ├── hearings.py
│   │   ├── documents.py
│   │   ├── tasks.py
│   │   ├── notifications.py
│   │   └── ai.py
│   ├── models/                # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── case.py
│   │   ├── hearing.py
│   │   ├── document.py
│   │   ├── task.py
│   │   └── notification.py
│   ├── schemas/               # Pydantic request/response schemas
│   │   ├── user.py
│   │   ├── case.py
│   │   ├── hearing.py
│   │   ├── document.py
│   │   ├── task.py
│   │   └── notification.py
│   ├── alembic/               # Database migrations
│   │   └── versions/          # Auto-generated migration files go here
│   ├── main.py                # FastAPI app entry point
│   ├── config.py              # Settings loaded from .env
│   ├── database.py            # SQLAlchemy engine + session
│   ├── alembic.ini            # Alembic configuration
│   ├── .env.example           # Environment variable template
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

---

## Running Locally

### Prerequisites
- Node.js 18+
- Python 3.12 (recommended — pre-built wheels for all dependencies require Python ≤ 3.12)
- PostgreSQL running locally (or a hosted instance)

---

### 1. Start the Backend

```bash
cd backend

# Create and activate a virtual environment (use Python 3.12 explicitly)
py -3.12 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set your DATABASE_URL and SECRET_KEY

# Run database migrations (once models are defined)
# alembic upgrade head

# Start the development server
uvicorn main:app --reload
```

Backend will be available at: **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/docs**

---

### 2. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend will be available at: **http://localhost:5173**

> The Vite dev server proxies all `/api/*` requests to `http://localhost:8000`, so no CORS issues during development.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/judicial_flow_pro
SECRET_KEY=your-secret-key-here
```

---

## Routes Overview

| Path            | Page           |
|-----------------|----------------|
| `/login`        | Authentication |
| `/`             | Dashboard      |
| `/cases`        | Case list      |
| `/cases/:id`    | Case detail    |
| `/hearings`     | Hearings       |
| `/documents`    | Documents      |
| `/ai`           | AI Assistant   |
| `/notifications`| Notifications  |

---

## API Endpoints (Stub)

| Method | Path                  | Description         |
|--------|-----------------------|---------------------|
| GET    | `/health`             | Health check        |
| GET    | `/api/auth/`          | Auth router stub    |
| GET    | `/api/users/`         | Users router stub   |
| GET    | `/api/cases/`         | Cases router stub   |
| GET    | `/api/hearings/`      | Hearings stub       |
| GET    | `/api/documents/`     | Documents stub      |
| GET    | `/api/tasks/`         | Tasks stub          |
| GET    | `/api/notifications/` | Notifications stub  |
| GET    | `/api/ai/`            | AI router stub      |
