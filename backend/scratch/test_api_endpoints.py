import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

def get_token():
    login_data = json.dumps({"email": "demo@judicialflow.gov", "password": "JudicialDemo123!"}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/auth/login", data=login_data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["access_token"]

def test_api():
    token = get_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    print("=== API Test 1: List notifications ===")
    req = urllib.request.Request(f"{BASE_URL}/api/notifications", headers=headers)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        notifs = json.loads(resp.read().decode("utf-8"))
        print(f"Loaded {len(notifs)} notifications from API.")

    print("\n=== API Test 2: Unread count ===")
    req = urllib.request.Request(f"{BASE_URL}/api/notifications/unread-count", headers=headers)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        count_data = json.loads(resp.read().decode("utf-8"))
        print(f"Unread count: {count_data['unread_count']}")

    print("\n=== API Test 3: Create manual notification via POST ===")
    create_payload = json.dumps({
        "title": "Study Case CF-2026-015",
        "message": "Review the case documents and previous judgments before the upcoming hearing.",
        "type": "CASE_ALERT",
        "priority": "WARNING",
        "reminder_at": "2026-09-08T14:30:00Z",
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/notifications", data=create_payload, headers=headers)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 201
        created = json.loads(resp.read().decode("utf-8"))
        notif_id = created["id"]
        print(f"Created notification ID: {notif_id}, Title: {created['title']}, Type: {created['type']}, Priority: {created['priority']}")

    print("\n=== API Test 4: Mark as read via PUT ===")
    req = urllib.request.Request(f"{BASE_URL}/api/notifications/{notif_id}/read", data=b"", headers=headers, method="PUT")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        updated = json.loads(resp.read().decode("utf-8"))
        assert updated["is_read"] == True
        print(f"Notification {notif_id} is_read: {updated['is_read']}")

    print("\n=== API Test 5: Delete notification via DELETE ===")
    req = urllib.request.Request(f"{BASE_URL}/api/notifications/{notif_id}", headers=headers, method="DELETE")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 204
        print(f"Notification {notif_id} deleted successfully.")

    print("\n=== ALL API TESTS PASSED! ===")

if __name__ == "__main__":
    test_api()
