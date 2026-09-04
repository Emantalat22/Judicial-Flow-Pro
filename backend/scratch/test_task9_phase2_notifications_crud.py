import json
import urllib.request
import urllib.error
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path("c:/Users/LEN/Desktop/judicial Flow Pro/backend")
sys.path.insert(0, str(backend_dir))

from database import SessionLocal
import models.hearing
import models.document
from models.user import User
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

def test_task9_phase2():
    print("=== TASK 9 - PHASE 2: NOTIFICATIONS BACKEND API VERIFICATION ===")
    db = SessionLocal()

    admin = db.query(User).filter(User.email == "admin@judicialflow.gov").first()
    assert admin is not None, "Admin user must exist"

    # 1. Test Unauthenticated Access Protection (401)
    print("\n--- 1. Testing Unauthenticated Access (401) ---")
    endpoints = [
        ("GET", "/notifications"),
        ("GET", "/notifications/unread-count"),
        ("POST", "/notifications"),
        ("PUT", "/notifications/1/read"),
        ("PUT", "/notifications/read-all"),
        ("DELETE", "/notifications/1"),
    ]
    for method, ep in endpoints:
        status, _ = json_request(method, ep, body={"title": "test", "message": "test", "user_id": 1} if method == "POST" else None)
        assert status == 401, f"Expected 401 for {method} {ep}, got {status}"
        print(f"PASS: Unauthenticated {method} {ep} rejected with HTTP 401")

    # 2. Login as Admin
    admin_token = login("admin@judicialflow.gov", "AdminPass123!")
    print("\n--- 2. Authenticated Admin Session ---")
    print("PASS: Logged in as Admin")

    # 3. Create Notification
    print("\n--- 3. Testing Notification Creation (POST) ---")
    # Validation: Non-existent recipient
    status, _ = json_request("POST", "/notifications", {
        "user_id": 999999,
        "title": "Invalid Recipient",
        "message": "This should fail"
    }, token=admin_token)
    assert status == 404
    print("PASS: Non-existent recipient user rejected with HTTP 404")

    # Valid creation
    status, notif1 = json_request("POST", "/notifications", {
        "user_id": admin.id,
        "title": "Hearing Scheduled: State v. Sterling",
        "message": "Preliminary hearing scheduled for courtroom 4A on Sept 5, 2026",
        "type": "HEARING_SCHEDULED",
        "priority": "URGENT",
        "link": "/hearings"
    }, token=admin_token)
    assert status == 201
    assert notif1["id"] is not None
    assert notif1["title"] == "Hearing Scheduled: State v. Sterling"
    assert notif1["is_read"] is False
    notif1_id = notif1["id"]
    print(f"PASS: Created Notification #{notif1_id} for Admin")

    # 4. Test Unread Count & Listing
    print("\n--- 4. Testing Unread Count & Listing ---")
    status, count_data = json_request("GET", "/notifications/unread-count", token=admin_token)
    assert status == 200 and count_data["unread_count"] >= 1
    initial_unread = count_data["unread_count"]
    print(f"PASS: GET /notifications/unread-count returned {initial_unread}")

    status, notifs = json_request("GET", "/notifications", token=admin_token)
    assert status == 200
    assert any(n["id"] == notif1_id for n in notifs)
    print(f"PASS: GET /notifications returned {len(notifs)} notifications including #{notif1_id}")

    # Test Filters
    status, filtered_type = json_request("GET", "/notifications?type=HEARING_SCHEDULED", token=admin_token)
    assert status == 200 and any(n["id"] == notif1_id for n in filtered_type)
    print("PASS: Filter by type=HEARING_SCHEDULED works")

    status, filtered_priority = json_request("GET", "/notifications?priority=URGENT", token=admin_token)
    assert status == 200 and any(n["id"] == notif1_id for n in filtered_priority)
    print("PASS: Filter by priority=URGENT works")

    status, filtered_unread = json_request("GET", "/notifications?is_read=false", token=admin_token)
    assert status == 200 and any(n["id"] == notif1_id for n in filtered_unread)
    print("PASS: Filter by is_read=false works")

    # 5. Test Mark Single Notification as Read
    print("\n--- 5. Testing Mark as Read (PUT /{id}/read) ---")
    status, read_res = json_request("PUT", f"/notifications/{notif1_id}/read", token=admin_token)
    assert status == 200 and read_res["is_read"] is True
    print(f"PASS: Marked Notification #{notif1_id} as read")

    status, count_data2 = json_request("GET", "/notifications/unread-count", token=admin_token)
    assert count_data2["unread_count"] == initial_unread - 1
    print(f"PASS: Unread count decremented to {count_data2['unread_count']}")

    # 6. Test Mark All as Read (PUT /read-all)
    print("\n--- 6. Testing Mark All as Read (PUT /read-all) ---")
    # Add two new unread notifications
    json_request("POST", "/notifications", {"user_id": admin.id, "title": "Notif A", "message": "Msg A"}, token=admin_token)
    json_request("POST", "/notifications", {"user_id": admin.id, "title": "Notif B", "message": "Msg B"}, token=admin_token)

    status, count_before = json_request("GET", "/notifications/unread-count", token=admin_token)
    assert count_before["unread_count"] >= 2

    status, read_all_res = json_request("PUT", "/notifications/read-all", token=admin_token)
    assert status == 200 and read_all_res["unread_count"] == 0

    status, count_after = json_request("GET", "/notifications/unread-count", token=admin_token)
    assert count_after["unread_count"] == 0
    print("PASS: PUT /notifications/read-all marked all notifications as read (unread count = 0)")

    # 7. Test User-Level Isolation & Security
    print("\n--- 7. Testing User-Level Isolation & Security ---")
    # Create secondary user
    secondary_user = User(
        email="judge_turner_test@court.gov",
        hashed_password=hash_password("Pass123!"),
        full_name="Judge Turner Test",
        role="JUDGE",
        is_active=True
    )
    db.add(secondary_user)
    db.commit()
    db.refresh(secondary_user)

    # Login as secondary user
    turner_token = login("judge_turner_test@court.gov", "Pass123!")

    # Create a notification for Judge Turner
    status, turner_notif = json_request("POST", "/notifications", {
        "user_id": secondary_user.id,
        "title": "Private Chamber Notice",
        "message": "Bench briefing file ready for review"
    }, token=admin_token)
    assert status == 201
    turner_notif_id = turner_notif["id"]

    # Verify Turner sees their notification
    status, turner_list = json_request("GET", "/notifications", token=turner_token)
    assert status == 200
    assert any(n["id"] == turner_notif_id for n in turner_list)
    assert not any(n["id"] == notif1_id for n in turner_list), "User B must NOT see User A's notifications"
    print("PASS: User B can see their own notifications and NOT User A's notifications")

    # Verify Admin does NOT see Turner's notification in GET /notifications
    status, admin_list = json_request("GET", "/notifications", token=admin_token)
    assert not any(n["id"] == turner_notif_id for n in admin_list), "User A must NOT see User B's notifications"
    print("PASS: User A does NOT see User B's notifications")

    # Verify Admin cannot mark Turner's notification as read (must return 404)
    status, _ = json_request("PUT", f"/notifications/{turner_notif_id}/read", token=admin_token)
    assert status == 404
    print("PASS: User A attempting to mark User B's notification as read rejected with HTTP 404")

    # Verify Admin cannot delete Turner's notification (must return 404)
    status, _ = json_request("DELETE", f"/notifications/{turner_notif_id}", token=admin_token)
    assert status == 404
    print("PASS: User A attempting to delete User B's notification rejected with HTTP 404")

    # Verify Turner CAN delete their own notification
    status, _ = json_request("DELETE", f"/notifications/{turner_notif_id}", token=turner_token)
    assert status == 204
    print("PASS: User B successfully deleted their own notification (HTTP 204)")

    # Clean up secondary user
    db.delete(secondary_user)
    db.commit()

    # 8. Clean up all test notifications for admin
    print("\n--- 8. Cleaning up test data ---")
    db.query(Notification).filter(Notification.user_id == admin.id).delete()
    db.commit()
    remaining_count = db.query(Notification).count()
    assert remaining_count == 0
    print(f"PASS: Cleaned up all test notifications. Remaining in DB: {remaining_count}")

    # 9. System-wide Regression Checks
    print("\n--- 9. Running System-wide Regression Checks ---")
    regression_endpoints = ["/cases", "/hearings", "/documents", "/users", "/tasks", "/auth/me"]
    for ep in regression_endpoints:
        status, _ = json_request("GET", ep, token=admin_token)
        assert status == 200, f"Expected 200 for {ep}, got {status}"
        print(f"PASS: {ep} returned HTTP 200")

    db.close()
    print("\nALL TASK 9 - PHASE 2 NOTIFICATIONS BACKEND API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_task9_phase2()
