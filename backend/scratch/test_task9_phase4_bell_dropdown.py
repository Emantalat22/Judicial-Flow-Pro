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

def test_task9_phase4_bell_dropdown():
    print("=== TASK 9 - PHASE 4: HEADER NOTIFICATION BELL & LIVE BADGE VERIFICATION ===")
    db = SessionLocal()

    admin = db.query(User).filter(User.email == "admin@judicialflow.gov").first()
    assert admin is not None, "Admin user must exist"

    # 1. Login
    token = login("admin@judicialflow.gov", "AdminPass123!")
    print("PASS [1]: Authenticated as Admin via JWT Bearer token")

    # 2. Check initial unread count
    status, count_data = json_request("GET", "/notifications/unread-count", token=token)
    assert status == 200
    print(f"PASS [2]: Initial unread count: {count_data['unread_count']} (Badge hidden when 0)")

    # 3. Create simulated notifications to test Bell Popover dropdown
    notif_payloads = [
        {
            "user_id": admin.id,
            "title": "Docket Hearing Added: City v. Apex",
            "message": "Docket hearing entered for courtroom 3B on Oct 4, 2026",
            "type": "HEARING_SCHEDULED",
            "priority": "URGENT",
            "link": "/hearings"
        },
        {
            "user_id": admin.id,
            "title": "Judicial Assignment: Case JFP-2026-0004",
            "message": "Assigned presiding judge for commercial arbitration dispute",
            "type": "CASE_ALERT",
            "priority": "INFO",
            "link": "/cases"
        },
        {
            "user_id": admin.id,
            "title": "Action Item: Review Evidence Submission",
            "message": "Clerk uploaded forensic audit report to case files",
            "type": "DOCUMENT_UPLOADED",
            "priority": "WARNING",
            "link": "/documents"
        }
    ]

    created_ids = []
    for payload in notif_payloads:
        status, res = json_request("POST", "/notifications", payload, token=token)
        assert status == 201
        created_ids.append(res["id"])
    print(f"PASS [3]: Created 3 test alerts for bell popover feed (IDs: {created_ids})")

    # 4. Verify unread count badge value
    status, count_data = json_request("GET", "/notifications/unread-count", token=token)
    assert status == 200 and count_data["unread_count"] >= 3
    print(f"PASS [4]: Bell badge count updated to {count_data['unread_count']}")

    # 5. Verify dropdown recent notifications query (limit=5)
    status, dropdown_feed = json_request("GET", "/notifications?limit=5", token=token)
    assert status == 200 and len(dropdown_feed) >= 3
    assert dropdown_feed[0]["id"] == created_ids[-1], "Newest alert should be at top of dropdown"
    print(f"PASS [5]: Dropdown feed retrieved {len(dropdown_feed)} recent items, newest first")

    # 6. Test Mark Single Notification as Read via Dropdown click
    target_id = created_ids[-1]
    status, read_res = json_request("PUT", f"/notifications/{target_id}/read", token=token)
    assert status == 200 and read_res["is_read"] is True

    status, count_data_after_single = json_request("GET", "/notifications/unread-count", token=token)
    assert count_data_after_single["unread_count"] == count_data["unread_count"] - 1
    print(f"PASS [6]: Marked item #{target_id} read; badge decremented to {count_data_after_single['unread_count']}")

    # 7. Test Mark All as Read via Dropdown header action
    status, read_all_res = json_request("PUT", "/notifications/read-all", token=token)
    assert status == 200 and read_all_res["unread_count"] == 0

    status, count_data_zero = json_request("GET", "/notifications/unread-count", token=token)
    assert count_data_zero["unread_count"] == 0
    print("PASS [7]: Mark All Read executed; badge count = 0 (Badge hidden)")

    # 8. Clean up created alerts
    for nid in created_ids:
        json_request("DELETE", f"/notifications/{nid}", token=token)
    print("PASS [8]: Cleaned up all temporary bell test notifications")

    # 9. System-wide Regression Verification
    print("\n--- 9. Running Full System-wide Regression Verification ---")
    regression_endpoints = ["/cases", "/hearings", "/documents", "/users", "/tasks", "/notifications", "/auth/me"]
    for ep in regression_endpoints:
        status, _ = json_request("GET", ep, token=token)
        assert status == 200, f"Expected 200 for {ep}, got {status}"
        print(f"PASS: {ep} returned HTTP 200")

    db.close()
    print("\nALL TASK 9 - PHASE 4 BELL & DROPDOWN INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_task9_phase4_bell_dropdown()
