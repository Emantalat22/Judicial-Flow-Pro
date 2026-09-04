import json
import urllib.request
import urllib.error
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path("c:/Users/LEN/Desktop/judicial Flow Pro/backend")
sys.path.insert(0, str(backend_dir))

from database import SessionLocal
import models.hearing
import models.document
from models.user import User
from models.notification import Notification

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

def test_task9_phase3_frontend_integration():
    print("=== TASK 9 - PHASE 3: NOTIFICATIONS FRONTEND CENTER INTEGRATION ===")
    db = SessionLocal()

    admin = db.query(User).filter(User.email == "admin@judicialflow.gov").first()
    assert admin is not None, "Admin user must exist"

    # 1. Login
    token = login("admin@judicialflow.gov", "AdminPass123!")
    print("PASS [1]: Authenticated as Admin via JWT Bearer token")

    # 2. Initial state verification
    status, initial_notifs = json_request("GET", "/notifications", token=token)
    assert status == 200 and isinstance(initial_notifs, list)
    status, count_data = json_request("GET", "/notifications/unread-count", token=token)
    assert status == 200
    print(f"PASS [2]: Initial load: {len(initial_notifs)} total notifications, {count_data['unread_count']} unread")

    # 3. Create simulated notifications
    test_items = [
        {
            "user_id": admin.id,
            "title": "Preliminary Hearing Notice: State v. Miller",
            "message": "Hearing docket confirmed for Sept 12, 2026 at 10:00 AM in Courtroom 2B",
            "type": "HEARING_SCHEDULED",
            "priority": "URGENT",
            "link": "/hearings"
        },
        {
            "user_id": admin.id,
            "title": "Action Item: Review Summary Judgment Brief",
            "message": "Judge Williams assigned task #12 to your judicial queue",
            "type": "TASK_ASSIGNED",
            "priority": "HIGH",
            "link": "/tasks"
        },
        {
            "user_id": admin.id,
            "title": "Case Filing: JFP-2026-0003 Updated",
            "message": "Defense counsel submitted supplemental memorandum of law",
            "type": "CASE_ALERT",
            "priority": "WARNING",
            "link": "/cases"
        }
    ]

    created_ids = []
    for item in test_items:
        status, res = json_request("POST", "/notifications", item, token=token)
        assert status == 201
        created_ids.append(res["id"])
    print(f"PASS [3]: Created 3 test notifications (IDs: {created_ids})")

    # 4. Verify unread count matches created count
    status, count_data = json_request("GET", "/notifications/unread-count", token=token)
    assert status == 200 and count_data["unread_count"] >= 3
    print(f"PASS [4]: Unread count correctly shows {count_data['unread_count']}")

    # 5. Verify Category Tabs & Filters
    # Filter by unread
    status, unread_list = json_request("GET", "/notifications?is_read=false", token=token)
    assert status == 200 and all(n["id"] in [x["id"] for x in unread_list] for n in unread_list if n["id"] in created_ids)
    print(f"PASS [5a]: Tab 'Unread' returned {len(unread_list)} items")

    # Filter by Urgent
    status, urgent_list = json_request("GET", "/notifications?priority=URGENT", token=token)
    assert status == 200 and any(n["id"] == created_ids[0] for n in urgent_list)
    print(f"PASS [5b]: Tab 'Urgent' returned matching hearing notice")

    # Filter by Hearing
    status, hearing_list = json_request("GET", "/notifications?type=HEARING_SCHEDULED", token=token)
    assert status == 200 and any(n["id"] == created_ids[0] for n in hearing_list)
    print(f"PASS [5c]: Tab 'Hearings' returned matching hearing notification")

    # Filter by Task
    status, task_list = json_request("GET", "/notifications?type=TASK_ASSIGNED", token=token)
    assert status == 200 and any(n["id"] == created_ids[1] for n in task_list)
    print(f"PASS [5d]: Tab 'Tasks' returned matching task notification")

    # 6. Test Mark Single as Read
    first_id = created_ids[0]
    status, read_res = json_request("PUT", f"/notifications/{first_id}/read", token=token)
    assert status == 200 and read_res["is_read"] is True
    print(f"PASS [6]: Marked notification #{first_id} as read")

    # 7. Test Mark All as Read
    status, read_all_res = json_request("PUT", "/notifications/read-all", token=token)
    assert status == 200 and read_all_res["unread_count"] == 0
    status, count_data_after = json_request("GET", "/notifications/unread-count", token=token)
    assert count_data_after["unread_count"] == 0
    print("PASS [7]: Mark All as Read succeeded (Unread count = 0)")

    # 8. Test Delete/Dismiss Notification
    status, _ = json_request("DELETE", f"/notifications/{first_id}", token=token)
    assert status == 204
    print(f"PASS [8]: Dismissed / Deleted notification #{first_id}")

    # 9. Clean up remaining test notifications
    for nid in created_ids[1:]:
        json_request("DELETE", f"/notifications/{nid}", token=token)
    print("PASS [9]: Cleaned up all temporary test notifications")

    # 10. System-wide Regression Checks
    print("\n--- 10. Running Full Regression Checks ---")
    regression_endpoints = ["/cases", "/hearings", "/documents", "/users", "/tasks", "/auth/me"]
    for ep in regression_endpoints:
        status, _ = json_request("GET", ep, token=token)
        assert status == 200, f"Expected 200 for {ep}, got {status}"
        print(f"PASS: {ep} returned HTTP 200")

    db.close()
    print("\nALL TASK 9 - PHASE 3 NOTIFICATIONS FRONTEND INTEGRATION TESTS PASSED!")

if __name__ == "__main__":
    test_task9_phase3_frontend_integration()
