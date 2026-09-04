import json
import urllib.request
import urllib.error
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from pydantic import ValidationError

# Add backend directory to sys.path
backend_dir = Path("c:/Users/LEN/Desktop/judicial Flow Pro/backend")
sys.path.insert(0, str(backend_dir))

from database import SessionLocal
import models.hearing
import models.document
from models.user import User
from models.case import Case
from models.task import Task
from schemas.task import TaskCreate, TaskUpdate, TaskResponse

BASE_URL = "http://127.0.0.1:8000/api"

def get_admin_token():
    url = f"{BASE_URL}/auth/login"
    body = {"email": "admin@judicialflow.gov", "password": "AdminPass123!"}
    req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))["access_token"]

def json_request(method, path, body=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            resp_body = response.read().decode("utf-8")
            return response.status, json.loads(resp_body) if resp_body else None
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(resp_body)
        except Exception:
            return e.code, resp_body

def test_task_phase1():
    print("=== TASK 8 - PHASE 1: BACKEND FOUNDATION & MODEL/SCHEMA VERIFICATION ===")
    db = SessionLocal()

    # 1. Test Pydantic Schema Validation
    print("\n--- 1. Testing Pydantic Schema Validation ---")
    
    # Valid Task creation schema
    t_in = TaskCreate(
        title="Draft summary judgment order",
        description="Review motion from plaintiff and draft response",
        priority="high",  # tests case normalization
        status="pending",
        due_date=datetime.now(timezone.utc) + timedelta(days=3)
    )
    assert t_in.priority == "HIGH"
    assert t_in.status == "PENDING"
    print("PASS: TaskCreate schema successfully normalized priority and status")

    # Invalid priority check
    try:
        TaskCreate(title="Invalid Task", priority="SUPER_URGENT")
        assert False, "Should have raised ValidationError for invalid priority"
    except ValidationError:
        print("PASS: Schema correctly rejected invalid priority 'SUPER_URGENT'")

    # Invalid status check
    try:
        TaskCreate(title="Invalid Task", status="UNKNOWN")
        assert False, "Should have raised ValidationError for invalid status"
    except ValidationError:
        print("PASS: Schema correctly rejected invalid status 'UNKNOWN'")

    # 2. Test SQLAlchemy Model Creation and Persistence in PostgreSQL
    print("\n--- 2. Testing Database CRUD & Foreign Key Relationships ---")
    admin = db.query(User).filter(User.email == "admin@judicialflow.gov").first()
    case = db.query(Case).first()
    assert admin is not None, "Admin user must exist"
    assert case is not None, "At least one case must exist"

    # Create task attached to case and admin
    task = Task(
        title="Verify evidence submissions for Case",
        description="Check documentary evidence filed by defense",
        case_id=case.id,
        assigned_to=admin.id,
        priority="HIGH",
        status="IN_PROGRESS",
        due_date=datetime.now(timezone.utc) + timedelta(days=2)
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    task_id = task.id
    assert task.id is not None
    assert task.created_at is not None
    assert task.updated_at is not None
    assert task.case.id == case.id
    assert task.assignee.id == admin.id
    print(f"PASS: Task #{task_id} successfully created with relations to Case #{case.id} and Assignee User #{admin.id}")

    # Check reverse relationships
    db.refresh(case)
    db.refresh(admin)
    assert any(t.id == task_id for t in case.tasks)
    assert any(t.id == task_id for t in admin.tasks)
    print("PASS: Reverse relationships Case.tasks and User.tasks populated correctly")

    # Test TaskResponse serialization with joined metadata
    resp_obj = TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        case_id=task.case_id,
        assigned_to=task.assigned_to,
        priority=task.priority,
        status=task.status,
        due_date=task.due_date,
        created_at=task.created_at,
        updated_at=task.updated_at,
        case_number=case.case_number,
        case_title=case.title,
        assignee_name=admin.full_name,
        assignee_role=admin.role
    )
    assert resp_obj.case_number == case.case_number
    assert resp_obj.assignee_name == admin.full_name
    print("PASS: TaskResponse schema serialization with joined case and assignee metadata succeeded")

    # Clean up test task
    db.delete(task)
    db.commit()
    db.close()
    print("PASS: Cleaned up test task from PostgreSQL")

    # 3. System Regression Tests with Live API
    print("\n--- 3. Running Regression Tests for Existing APIs ---")
    token = get_admin_token()

    # GET /api/cases
    status, cases = json_request("GET", "/cases", token=token)
    assert status == 200 and isinstance(cases, list)
    print(f"PASS: GET /api/cases returned HTTP 200 ({len(cases)} cases)")

    # GET /api/hearings
    status, hearings = json_request("GET", "/hearings", token=token)
    assert status == 200 and isinstance(hearings, list)
    print(f"PASS: GET /api/hearings returned HTTP 200 ({len(hearings)} hearings)")

    # GET /api/documents
    status, documents = json_request("GET", "/documents", token=token)
    assert status == 200 and isinstance(documents, list)
    print(f"PASS: GET /api/documents returned HTTP 200 ({len(documents)} documents)")

    # GET /api/auth/me
    status, profile = json_request("GET", "/auth/me", token=token)
    assert status == 200 and profile["email"] == "admin@judicialflow.gov"
    print(f"PASS: GET /api/auth/me returned HTTP 200 ({profile['email']})")

    print("\nALL TASK 8 - PHASE 1 TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_task_phase1()
