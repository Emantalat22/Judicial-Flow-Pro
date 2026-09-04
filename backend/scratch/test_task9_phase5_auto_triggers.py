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
from models.hearing import Hearing
from models.notification import Notification
from core.security import hash_password

BASE_URL = "http://127.0.0.1:8000/api"

def login(email, password):
    url = f"{BASE_URL}/auth/login"
    body = {"email": email, "password": password}
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

def test_task9_phase5_auto_triggers():
    print("=== TASK 9 - PHASE 5: AUTOMATIC NOTIFICATION TRIGGERS VERIFICATION ===")
    db = SessionLocal()

    admin = db.query(User).filter(User.email == "admin@judicialflow.gov").first()
    case = db.query(Case).first()
    assert admin is not None and case is not None

    token = login("admin@judicialflow.gov", "AdminPass123!")
    print("PASS [1]: Authenticated as Admin via JWT Bearer token")

    # Clean existing notifications for baseline
    db.query(Notification).delete()
    db.commit()

    # 1. Test Task Assignment Automatic Trigger
    print("\n--- 1. Testing Task Assignment Automatic Trigger ---")
    due_date = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    task_payload = {
        "title": "Prepare Judicial Bench Brief on Maritime Jurisdiction",
        "description": "Examine relevant admiralty statutes",
        "case_id": case.id,
        "assigned_to": admin.id,
        "priority": "HIGH",
        "status": "PENDING",
        "due_date": due_date
    }
    status, task_res = json_request("POST", "/tasks", task_payload, token=token)
    assert status == 201
    task_id = task_res["id"]

    # Check notification was automatically created
    status, notifs = json_request("GET", "/notifications", token=token)
    assert status == 200
    task_notif = next((n for n in notifs if "Prepare Judicial Bench Brief" in n["title"]), None)
    assert task_notif is not None, "Task notification was NOT automatically generated"
    assert task_notif["type"] in ("TASK_ASSIGNED", "DEADLINE_URGENT")
    assert task_notif["link"] == "/tasks"
    print(f"PASS: Task creation triggered notification #{task_notif['id']} ('{task_notif['title']}')")

    # 2. Test Hearing Scheduled Automatic Trigger
    print("\n--- 2. Testing Hearing Scheduled Automatic Trigger ---")
    hearing_date = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    hearing_payload = {
        "case_id": case.id,
        "hearing_type": "Injunction",
        "scheduled_at": hearing_date,
        "location": "Courtroom 3A",
        "judge": "Hon. Williams",
        "status": "SCHEDULED"
    }
    status, hearing_res = json_request("POST", "/hearings", hearing_payload, token=token)
    assert status == 201
    hearing_id = hearing_res["id"]

    # Check hearing notification
    status, notifs = json_request("GET", "/notifications", token=token)
    hearing_notif = next((n for n in notifs if n["type"] == "HEARING_SCHEDULED" and "Hearing Scheduled" in n["title"]), None)
    assert hearing_notif is not None, "Hearing scheduled notification was NOT automatically generated"
    assert hearing_notif["link"] == "/hearings"
    print(f"PASS: Hearing creation triggered notification #{hearing_notif['id']} ('{hearing_notif['title']}')")

    # 3. Test Hearing Updated Automatic Trigger
    print("\n--- 3. Testing Hearing Rescheduled Automatic Trigger ---")
    new_hearing_date = (datetime.now(timezone.utc) + timedelta(days=9)).isoformat()
    update_payload = {
        "scheduled_at": new_hearing_date,
        "location": "Courtroom 4B"
    }
    status, updated_hearing = json_request("PUT", f"/hearings/{hearing_id}", update_payload, token=token)
    assert status == 200

    status, notifs = json_request("GET", "/notifications", token=token)
    rescheduled_notif = next((n for n in notifs if "Hearing Rescheduled" in n["title"]), None)
    assert rescheduled_notif is not None, "Hearing rescheduled notification was NOT automatically generated"
    assert rescheduled_notif["priority"] == "WARNING"
    print(f"PASS: Hearing update triggered notification #{rescheduled_notif['id']} ('{rescheduled_notif['title']}')")

    # 4. Test Case Status Change Automatic Trigger
    print("\n--- 4. Testing Case Status Change Automatic Trigger ---")
    old_status = case.status or "OPEN"
    target_status = "UNDER_REVIEW" if old_status != "UNDER_REVIEW" else "PENDING"
    status, updated_case = json_request("PUT", f"/cases/{case.id}", {"status": target_status}, token=token)
    assert status == 200

    status, notifs = json_request("GET", "/notifications", token=token)
    case_notif = next((n for n in notifs if n["type"] == "CASE_ALERT" and case.case_number in n["title"]), None)
    assert case_notif is not None, "Case status change notification was NOT automatically generated"
    print(f"PASS: Case status change triggered notification #{case_notif['id']} ('{case_notif['title']}')")

    # Reset case status
    json_request("PUT", f"/cases/{case.id}", {"status": old_status}, token=token)

    # 5. Test Duplicate Prevention
    print("\n--- 5. Testing Duplicate Notification Prevention ---")
    initial_count = db.query(Notification).filter(Notification.user_id == admin.id).count()
    from services.notification_service import create_system_notification
    # Attempt to create exact same notification
    dup_res = create_system_notification(
        db=db,
        user_id=admin.id,
        title=task_notif["title"],
        message=task_notif["message"],
        type=task_notif["type"],
        priority=task_notif["priority"],
        link=task_notif["link"]
    )
    final_count = db.query(Notification).filter(Notification.user_id == admin.id).count()
    assert final_count == initial_count, "Duplicate unread notification was erroneously added"
    print(f"PASS: Duplicate notification prevented (Count remained {final_count})")

    # 6. Test User-Level Notification Isolation
    print("\n--- 6. Testing User-Level Isolation ---")
    secondary_user = User(
        email="judge_iso_test@court.gov",
        hashed_password=hash_password("Pass123!"),
        full_name="Judge Isolation",
        role="JUDGE",
        is_active=True
    )
    db.add(secondary_user)
    db.commit()
    db.refresh(secondary_user)

    # Create task assigned specifically to secondary user
    status, sec_task = json_request("POST", "/tasks", {
        "title": "Private Chamber Task for Judge Isolation",
        "assigned_to": secondary_user.id,
        "priority": "LOW",
        "status": "PENDING"
    }, token=token)
    assert status == 201
    sec_task_id = sec_task["id"]

    # Verify secondary user sees their notification
    sec_token = login("judge_iso_test@court.gov", "Pass123!")
    status, sec_notifs = json_request("GET", "/notifications", token=sec_token)
    assert any("Private Chamber Task" in n["title"] for n in sec_notifs)

    # Verify admin does NOT see secondary user's private task assignment notification
    status, admin_notifs = json_request("GET", "/notifications", token=token)
    assert not any("Private Chamber Task" in n["title"] for n in admin_notifs)
    print("PASS: Private task assignment notification strictly delivered ONLY to the assigned user")

    # 7. Clean up all test data
    print("\n--- 7. Cleaning up test data ---")
    json_request("DELETE", f"/tasks/{task_id}", token=token)
    json_request("DELETE", f"/tasks/{sec_task_id}", token=token)
    json_request("DELETE", f"/hearings/{hearing_id}", token=token)
    db.delete(secondary_user)
    db.query(Notification).delete()
    db.commit()
    print("PASS: Cleaned up test tasks, hearings, secondary user, and notifications")

    # 8. Full Application Regression Check
    print("\n--- 8. Running Full System-wide Regression Verification ---")
    endpoints = ["/cases", "/hearings", "/documents", "/users", "/tasks", "/notifications", "/auth/me"]
    for ep in endpoints:
        status, _ = json_request("GET", ep, token=token)
        assert status == 200, f"Expected 200 for {ep}, got {status}"
        print(f"PASS: {ep} returned HTTP 200")

    db.close()
    print("\nALL TASK 9 - PHASE 5 AUTOMATIC TRIGGER & FINAL VERIFICATION TESTS PASSED!")

if __name__ == "__main__":
    test_task9_phase5_auto_triggers()
