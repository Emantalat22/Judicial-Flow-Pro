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

def test_tasks_frontend_flow():
    print("=== TASK 8 - PHASE 3: TASKS FRONTEND INTEGRATION TEST ===")
    db = SessionLocal()

    admin = db.query(User).filter(User.email == "admin@judicialflow.gov").first()
    case = db.query(Case).first()
    assert admin is not None, "Admin user must exist"
    assert case is not None, "Case must exist"

    # 1. Login and get JWT token
    token = get_admin_token()
    print("PASS [1]: Logged in successfully and obtained JWT Bearer token")

    # 2. Test Initial Tasks Load (GET /api/tasks)
    status, initial_tasks = json_request("GET", "/tasks", token=token)
    assert status == 200 and isinstance(initial_tasks, list)
    print(f"PASS [2]: Initial GET /tasks returned {len(initial_tasks)} tasks")

    # 3. Test Create Task Modal Flow (POST /api/tasks)
    due_date = (datetime.now(timezone.utc) + timedelta(days=4)).isoformat()
    new_task_payload = {
        "title": "Prepare Preliminary Hearing Exhibits",
        "description": "Ensure defense exhibit binder is submitted to clerk 48 hours prior to hearing",
        "case_id": case.id,
        "assigned_to": admin.id,
        "priority": "HIGH",
        "status": "PENDING",
        "due_date": due_date
    }
    status, created_task = json_request("POST", "/tasks", new_task_payload, token=token)
    assert status == 201
    task_id = created_task["id"]
    assert created_task["title"] == new_task_payload["title"]
    assert created_task["priority"] == "HIGH"
    assert created_task["status"] == "PENDING"
    assert created_task["case_number"] == case.case_number
    assert created_task["assignee_name"] == admin.full_name
    print(f"PASS [3]: Created Task #{task_id} with Case ({created_task['case_number']}) and Assignee ({created_task['assignee_name']})")

    # 4. Test Search & Filter Toolbar Options
    # Search by keyword
    status, search_results = json_request("GET", "/tasks?search=Exhibit%20binder", token=token)
    assert status == 200 and any(t["id"] == task_id for t in search_results)
    print(f"PASS [4a]: Search by keyword returned matching task #{task_id}")

    # Filter by priority
    status, priority_results = json_request("GET", "/tasks?priority=HIGH", token=token)
    assert status == 200 and any(t["id"] == task_id for t in priority_results)
    print(f"PASS [4b]: Filter by priority=HIGH returned matching task #{task_id}")

    # Filter by status
    status, status_results = json_request("GET", "/tasks?status=PENDING", token=token)
    assert status == 200 and any(t["id"] == task_id for t in status_results)
    print(f"PASS [4c]: Filter by status=PENDING returned matching task #{task_id}")

    # Filter by case_id
    status, case_results = json_request("GET", f"/tasks?case_id={case.id}", token=token)
    assert status == 200 and any(t["id"] == task_id for t in case_results)
    print(f"PASS [4d]: Filter by case_id={case.id} returned matching task #{task_id}")

    # Filter by assigned_to
    status, assignee_results = json_request("GET", f"/tasks?assigned_to={admin.id}", token=token)
    assert status == 200 and any(t["id"] == task_id for t in assignee_results)
    print(f"PASS [4e]: Filter by assigned_to={admin.id} returned matching task #{task_id}")

    # 5. Test Quick Status Toggle (PUT /api/tasks/{id})
    status, toggled_task = json_request("PUT", f"/tasks/{task_id}", {"status": "COMPLETED"}, token=token)
    assert status == 200 and toggled_task["status"] == "COMPLETED"
    print(f"PASS [5]: Toggled Task #{task_id} status to COMPLETED")

    # 6. Test Edit Modal (PUT /api/tasks/{id})
    edit_payload = {
        "title": "Prepare Preliminary Hearing Exhibits (Updated)",
        "priority": "URGENT",
        "description": "Updated instructions: digital copies uploaded to case portal"
    }
    status, edited_task = json_request("PUT", f"/tasks/{task_id}", edit_payload, token=token)
    assert status == 200
    assert edited_task["title"] == edit_payload["title"]
    assert edited_task["priority"] == "URGENT"
    print(f"PASS [6]: Edited Task #{task_id} details via Edit Modal flow")

    # 7. Test Delete Task Modal (DELETE /api/tasks/{id})
    status, _ = json_request("DELETE", f"/tasks/{task_id}", token=token)
    assert status == 204
    print(f"PASS [7]: Deleted Task #{task_id} (HTTP 204)")

    # Confirm not found after deletion
    status, _ = json_request("GET", f"/tasks/{task_id}", token=token)
    assert status == 404
    print(f"PASS [8]: Verified Task #{task_id} no longer exists (HTTP 404)")

    # 8. Full Application Regression Check
    print("\n--- Running System-wide Regression Checks ---")
    for ep in ["/cases", "/hearings", "/documents", "/users", "/auth/me"]:
        status, data = json_request("GET", ep, token=token)
        assert status == 200, f"Failed on {ep}, got {status}"
        print(f"PASS: {ep} returned HTTP 200")

    db.close()
    print("\nALL TASK 8 - PHASE 3 FRONTEND & API INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_tasks_frontend_flow()
