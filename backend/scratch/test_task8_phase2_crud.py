import json
import urllib.request
import urllib.error
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path("c:/Users/LEN/Desktop/judicial Flow Pro/backend")
sys.path.insert(0, str(backend_dir))

from database import SessionLocal
import models.hearing
import models.document
from models.user import User
from models.case import Case
from models.task import Task
from core.security import hash_password

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

def test_task8_phase2_crud():
    print("=== TASK 8 - PHASE 2: TASK BACKEND API VERIFICATION ===")
    db = SessionLocal()

    admin = db.query(User).filter(User.email == "admin@judicialflow.gov").first()
    case = db.query(Case).first()
    assert admin is not None, "Admin user must exist"
    assert case is not None, "Case must exist"

    # 1. Test Unauthenticated Access
    print("\n--- 1. Testing Unauthenticated Request Protection (401) ---")
    status, _ = json_request("GET", "/tasks")
    assert status == 401
    status, _ = json_request("POST", "/tasks", {"title": "Test Unauth"})
    assert status == 401
    print("PASS: Unauthenticated requests to /api/tasks rejected with HTTP 401")

    token = get_admin_token()

    # 2. Test Foreign Key Validation on POST
    print("\n--- 2. Testing Foreign Key & Active User Validation ---")
    status, res = json_request("POST", "/tasks", {"title": "Bad Case", "case_id": 999999}, token=token)
    assert status == 404
    print("PASS: Non-existent case_id rejected with HTTP 404")

    status, res = json_request("POST", "/tasks", {"title": "Bad User", "assigned_to": 999999}, token=token)
    assert status == 404
    print("PASS: Non-existent assigned_to rejected with HTTP 404")

    # Inactive user check
    inactive_user = User(
        email="inactive_clerk_test@court.gov",
        hashed_password=hash_password("Pass123!"),
        full_name="Inactive Clerk",
        role="CLERK",
        is_active=False
    )
    db.add(inactive_user)
    db.commit()
    db.refresh(inactive_user)

    status, res = json_request("POST", "/tasks", {"title": "Inactive Assignee", "assigned_to": inactive_user.id}, token=token)
    assert status == 400
    print("PASS: Assigning to inactive user rejected with HTTP 400")

    db.delete(inactive_user)
    db.commit()

    # 3. Test Task Creation (POST /api/tasks)
    print("\n--- 3. Testing Task Creation (POST /api/tasks) ---")
    due_date_iso = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    task_payload = {
        "title": "Review plaintiff's summary judgment motion",
        "description": "Cross-reference filed affidavits with judicial precedent",
        "case_id": case.id,
        "assigned_to": admin.id,
        "priority": "urgent",
        "status": "in_progress",
        "due_date": due_date_iso
    }
    status, created_task = json_request("POST", "/tasks", task_payload, token=token)
    assert status == 201
    task_id = created_task["id"]
    assert created_task["title"] == task_payload["title"]
    assert created_task["priority"] == "URGENT"
    assert created_task["status"] == "IN_PROGRESS"
    assert created_task["case_number"] == case.case_number
    assert created_task["case_title"] == case.title
    assert created_task["assignee_name"] == admin.full_name
    print(f"PASS: Created Task #{task_id} with joined Case ({created_task['case_number']}) and Assignee ({created_task['assignee_name']})")

    # 4. Test Single Task Retrieval (GET /api/tasks/{id})
    print("\n--- 4. Testing Single Task Retrieval (GET /api/tasks/{id}) ---")
    status, single_task = json_request("GET", f"/tasks/{task_id}", token=token)
    assert status == 200
    assert single_task["id"] == task_id
    assert single_task["case_number"] == case.case_number

    status, _ = json_request("GET", "/tasks/999999", token=token)
    assert status == 404
    print(f"PASS: GET /api/tasks/{task_id} returned task details; non-existent ID returned 404")

    # 5. Test List & Filter Endpoints (GET /api/tasks)
    print("\n--- 5. Testing List & Filtering (GET /api/tasks) ---")
    # By case_id
    status, tasks_by_case = json_request("GET", f"/tasks?case_id={case.id}", token=token)
    assert status == 200 and any(t["id"] == task_id for t in tasks_by_case)
    print(f"PASS: Filter by case_id={case.id} returned {len(tasks_by_case)} tasks")

    # By assigned_to
    status, tasks_by_user = json_request("GET", f"/tasks?assigned_to={admin.id}", token=token)
    assert status == 200 and any(t["id"] == task_id for t in tasks_by_user)
    print(f"PASS: Filter by assigned_to={admin.id} returned {len(tasks_by_user)} tasks")

    # By status
    status, tasks_by_status = json_request("GET", "/tasks?status=IN_PROGRESS", token=token)
    assert status == 200 and any(t["id"] == task_id for t in tasks_by_status)
    print(f"PASS: Filter by status=IN_PROGRESS returned {len(tasks_by_status)} tasks")

    # By priority
    status, tasks_by_priority = json_request("GET", "/tasks?priority=URGENT", token=token)
    assert status == 200 and any(t["id"] == task_id for t in tasks_by_priority)
    print(f"PASS: Filter by priority=URGENT returned {len(tasks_by_priority)} tasks")

    # By search
    status, tasks_by_search = json_request("GET", "/tasks?search=summary%20judgment", token=token)
    assert status == 200 and any(t["id"] == task_id for t in tasks_by_search)
    print(f"PASS: Filter by search term returned {len(tasks_by_search)} tasks")

    # 6. Test Task Update (PUT /api/tasks/{id})
    print("\n--- 6. Testing Task Update (PUT /api/tasks/{id}) ---")
    update_payload = {
        "status": "completed",
        "description": "Completed review of summary judgment motion. Ruling drafted."
    }
    status, updated_task = json_request("PUT", f"/tasks/{task_id}", update_payload, token=token)
    assert status == 200
    assert updated_task["status"] == "COMPLETED"
    assert updated_task["description"] == update_payload["description"]
    print(f"PASS: Updated Task #{task_id} status to COMPLETED")

    # 7. Test Task Deletion (DELETE /api/tasks/{id})
    print("\n--- 7. Testing Task Deletion (DELETE /api/tasks/{id}) ---")
    status, _ = json_request("DELETE", f"/tasks/{task_id}", token=token)
    assert status == 204

    # Verify 404 after deletion
    status, _ = json_request("GET", f"/tasks/{task_id}", token=token)
    assert status == 404
    print(f"PASS: DELETE /api/tasks/{task_id} returned HTTP 204; subsequent GET returned 404")

    # 8. Regression Tests on Existing APIs
    print("\n--- 8. Running Regression Tests on Existing APIs ---")
    for endpoint in ["/cases", "/hearings", "/documents", "/users", "/auth/me"]:
        status, _ = json_request("GET", endpoint, token=token)
        assert status == 200, f"Expected 200 for {endpoint}, got {status}"
        print(f"PASS: {endpoint} returned HTTP 200")

    db.close()
    print("\nALL TASK 8 - PHASE 2 BACKEND API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_task8_phase2_crud()
