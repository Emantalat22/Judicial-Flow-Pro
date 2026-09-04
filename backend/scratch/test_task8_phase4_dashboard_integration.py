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

def test_dashboard_tasks_integration():
    print("=== TASK 8 - PHASE 4: JUDGE DASHBOARD TASK INTEGRATION TEST ===")
    db = SessionLocal()

    admin = db.query(User).filter(User.email == "admin@judicialflow.gov").first()
    case = db.query(Case).first()
    assert admin is not None, "Admin user must exist"
    assert case is not None, "Case must exist"

    # 1. Login and get token
    token = get_admin_token()
    print("PASS [1]: Authenticated successfully with JWT Bearer token")

    # 2. Create sample priority action items for the dashboard
    due_tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    urgent_task_payload = {
        "title": "Emergency Injunction Ruling Draft",
        "description": "Review environmental preservation injunction request",
        "case_id": case.id,
        "assigned_to": admin.id,
        "priority": "URGENT",
        "status": "PENDING",
        "due_date": due_tomorrow
    }
    status, urgent_task = json_request("POST", "/tasks", urgent_task_payload, token=token)
    assert status == 201
    urgent_task_id = urgent_task["id"]
    print(f"PASS [2]: Created Urgent Dashboard Task #{urgent_task_id} ({urgent_task['title']})")

    # 3. Test Dashboard Priority Actions query (GET /api/tasks)
    status, active_tasks = json_request("GET", "/tasks", token=token)
    assert status == 200
    matching = [t for t in active_tasks if t["id"] == urgent_task_id]
    assert len(matching) == 1
    assert matching[0]["priority"] == "URGENT"
    assert matching[0]["case_number"] == case.case_number
    print(f"PASS [3]: GET /tasks successfully returned actionable task #{urgent_task_id} with Case Number {matching[0]['case_number']}")

    # 4. Simulate Judge Dashboard Quick-Complete action (PUT /api/tasks/{id} with status=COMPLETED)
    status, completed_task = json_request("PUT", f"/tasks/{urgent_task_id}", {"status": "COMPLETED"}, token=token)
    assert status == 200
    assert completed_task["status"] == "COMPLETED"
    print(f"PASS [4]: Quick-completed Task #{urgent_task_id} via Dashboard action")

    # 5. Verify task is no longer in pending list
    status, pending_tasks = json_request("GET", "/tasks?status=PENDING", token=token)
    assert status == 200
    assert not any(t["id"] == urgent_task_id for t in pending_tasks)
    print(f"PASS [5]: Verified Task #{urgent_task_id} is no longer in PENDING list")

    # 6. Clean up created task
    status, _ = json_request("DELETE", f"/tasks/{urgent_task_id}", token=token)
    assert status == 204
    print(f"PASS [6]: Cleaned up test task (HTTP 204)")

    # 7. System-wide Regression Verification
    print("\n--- Running System-wide Regression Verification ---")
    endpoints = ["/cases", "/hearings", "/documents", "/users", "/tasks", "/auth/me"]
    for ep in endpoints:
        status, _ = json_request("GET", ep, token=token)
        assert status == 200, f"Failed on {ep}, got {status}"
        print(f"PASS: {ep} returned HTTP 200")

    db.close()
    print("\nALL TASK 8 - PHASE 4 DASHBOARD TASK INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_dashboard_tasks_integration()
