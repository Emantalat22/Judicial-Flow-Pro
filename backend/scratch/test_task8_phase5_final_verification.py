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

BASE_URL = "http://127.0.0.1:8000/api"

def json_request(method, path, body=None, token=None):
    if path.startswith("http"):
        url = path
    else:
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

def test_task8_phase5_final():
    print("=== TASK 8 - PHASE 5: FINAL POLISH & END-TO-END VERIFICATION ===")
    db = SessionLocal()

    # 1. Health check
    status, health = json_request("GET", "http://127.0.0.1:8000/health")
    assert status == 200 and health.get("status") == "ok"
    print("PASS [1]: GET /health returned 200 OK")

    # 2. Unauthenticated protection
    print("\n--- 1. Testing Unauthenticated Route Protection (401) ---")
    protected_paths = ["/tasks", "/cases", "/hearings", "/documents", "/users", "/auth/me"]
    for path in protected_paths:
        status, _ = json_request("GET", path)
        assert status == 401, f"Expected 401 for unauthenticated GET {path}, got {status}"
        print(f"PASS: Unauthenticated GET {path} -> HTTP 401")

    # 3. Authentication & Session Verification
    print("\n--- 2. Testing Authentication & Session Retrieval ---")
    status, login_res = json_request("POST", "/auth/login", {
        "email": "admin@judicialflow.gov",
        "password": "AdminPass123!"
    })
    assert status == 200 and "access_token" in login_res
    token = login_res["access_token"]
    print("PASS: POST /auth/login successfully authenticated administrator")

    status, me = json_request("GET", "/auth/me", token=token)
    assert status == 200 and me["email"] == "admin@judicialflow.gov"
    print(f"PASS: GET /auth/me restored session for {me['full_name']} ({me['role']})")

    # 4. End-to-End Task Lifecycle
    print("\n--- 3. Testing Complete Task Lifecycle ---")
    admin = db.query(User).filter(User.email == "admin@judicialflow.gov").first()
    case = db.query(Case).first()
    assert admin and case

    # Step A: Create Task
    due_date = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    task_payload = {
        "title": "Review Amicus Curiae Brief on Environmental Protocol",
        "description": "Cross-examine brief submitted by Department of Natural Resources with maritime statute",
        "case_id": case.id,
        "assigned_to": admin.id,
        "priority": "HIGH",
        "status": "PENDING",
        "due_date": due_date
    }
    status, created_task = json_request("POST", "/tasks", task_payload, token=token)
    assert status == 201
    task_id = created_task["id"]
    assert created_task["title"] == task_payload["title"]
    assert created_task["case_number"] == case.case_number
    assert created_task["assignee_name"] == admin.full_name
    print(f"PASS: [Create] Created Task #{task_id} linked to Case #{case.id} and Assignee #{admin.id}")

    # Step B: Get Task Detail
    status, task_detail = json_request("GET", f"/tasks/{task_id}", token=token)
    assert status == 200 and task_detail["id"] == task_id
    print(f"PASS: [View] GET /tasks/{task_id} returned full task record with joined metadata")

    # Step C: Search & Filter
    status, search_res = json_request("GET", "/tasks?search=Amicus%20Curiae", token=token)
    assert status == 200 and any(t["id"] == task_id for t in search_res)
    print(f"PASS: [Search] GET /tasks?search=Amicus Curiae found matching task")

    status, priority_res = json_request("GET", "/tasks?priority=HIGH", token=token)
    assert status == 200 and any(t["id"] == task_id for t in priority_res)
    print(f"PASS: [Filter] GET /tasks?priority=HIGH returned matching task")

    # Step D: Edit Task
    edit_payload = {
        "title": "Review Amicus Curiae Brief on Environmental Protocol (Expedited)",
        "priority": "URGENT",
        "description": "Expedited review: schedule bench memo by tomorrow noon."
    }
    status, updated_task = json_request("PUT", f"/tasks/{task_id}", edit_payload, token=token)
    assert status == 200
    assert updated_task["title"] == edit_payload["title"]
    assert updated_task["priority"] == "URGENT"
    print(f"PASS: [Edit] PUT /tasks/{task_id} updated title and elevated priority to URGENT")

    # Step E: Complete Task (Dashboard Action)
    status, comp_task = json_request("PUT", f"/tasks/{task_id}", {"status": "COMPLETED"}, token=token)
    assert status == 200 and comp_task["status"] == "COMPLETED"
    print(f"PASS: [Complete] Marked Task #{task_id} as COMPLETED")

    # Verify task is excluded from pending filter
    status, pending_list = json_request("GET", "/tasks?status=PENDING", token=token)
    assert status == 200 and not any(t["id"] == task_id for t in pending_list)
    print(f"PASS: [State] Verified Task #{task_id} is excluded from PENDING list")

    # Step F: Delete Task
    status, _ = json_request("DELETE", f"/tasks/{task_id}", token=token)
    assert status == 204
    print(f"PASS: [Delete] DELETE /tasks/{task_id} returned HTTP 204")

    status, _ = json_request("GET", f"/tasks/{task_id}", token=token)
    assert status == 404
    print(f"PASS: [Confirm] GET /tasks/{task_id} confirmed 404 Not Found after deletion")

    # 5. Validation & Edge Cases
    print("\n--- 4. Testing Validation and Edge Cases ---")
    status, _ = json_request("POST", "/tasks", {"title": "Invalid Case Task", "case_id": 999999}, token=token)
    assert status == 404
    print("PASS: Invalid case_id rejected with HTTP 404")

    status, _ = json_request("POST", "/tasks", {"title": "Invalid User Task", "assigned_to": 999999}, token=token)
    assert status == 404
    print("PASS: Invalid assigned_to rejected with HTTP 404")

    status, _ = json_request("POST", "/tasks", {"title": "Invalid Priority Task", "priority": "NOT_A_PRIORITY"}, token=token)
    assert status in (400, 422)
    print(f"PASS: Invalid priority value rejected with HTTP {status}")

    # 6. System-wide Regression Verification
    print("\n--- 5. Running System-wide Regression Verification ---")
    regression_endpoints = [
        ("GET", "/cases"),
        ("GET", "/hearings"),
        ("GET", "/documents"),
        ("GET", "/users"),
        ("GET", "/tasks"),
        ("GET", "/auth/me")
    ]
    for method, path in regression_endpoints:
        status, data = json_request(method, path, token=token)
        assert status == 200, f"Regression failed for {method} {path}, got {status}"
        print(f"PASS: {method} {path} returned HTTP 200")

    # 7. Confirm database cleanup
    db_tasks_count = db.query(Task).count()
    assert db_tasks_count == 0, f"Expected 0 lingering test tasks, found {db_tasks_count}"
    print(f"PASS [Clean]: Database contains {db_tasks_count} test tasks (100% clean)")

    db.close()
    print("\nALL TASK 8 - PHASE 5 FINAL VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_task8_phase5_final()
