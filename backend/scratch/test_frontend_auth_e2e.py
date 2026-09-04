import json
import urllib.request
import urllib.error
from datetime import timedelta
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path("c:/Users/LEN/Desktop/judicial Flow Pro/backend")
sys.path.insert(0, str(backend_dir))

from database import SessionLocal
from models.user import User
from core.security import hash_password, create_access_token

BASE_URL = "http://127.0.0.1:8000/api"

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

def test_frontend_auth_e2e():
    print("=== TASK 7 - PHASE 4: FRONTEND AUTHENTICATION INTEGRATION TEST ===")
    db = SessionLocal()

    # 1. Ensure admin user exists
    admin = db.query(User).filter(User.email == "admin@judicialflow.gov").first()
    if not admin:
        admin = User(
            email="admin@judicialflow.gov",
            hashed_password=hash_password("AdminPass123!"),
            full_name="System Administrator",
            role="ADMIN",
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    # 2. Test Invalid Login
    status, bad_res = json_request("POST", "/auth/login", {
        "email": "admin@judicialflow.gov",
        "password": "WrongPassword123!"
    })
    assert status == 401
    assert "Invalid email or password" in bad_res.get("detail", "")
    print("PASS [1]: Invalid login credentials rejected with HTTP 401 and clean error message")

    # 3. Test Valid Admin Login (Simulates Login.jsx submission)
    status, login_res = json_request("POST", "/auth/login", {
        "email": "admin@judicialflow.gov",
        "password": "AdminPass123!"
    })
    assert status == 200
    assert "access_token" in login_res
    assert login_res["token_type"] == "bearer"
    admin_token = login_res["access_token"]
    print("PASS [2]: Valid login returned access_token")

    # 4. Test Session Restore (Simulates AuthContext initial load / refresh)
    status, me_res = json_request("GET", "/auth/me", token=admin_token)
    assert status == 200
    assert me_res["email"] == "admin@judicialflow.gov"
    assert me_res["role"] == "ADMIN"
    assert me_res["full_name"] == "System Administrator"
    assert "hashed_password" not in me_res
    print("PASS [3]: GET /auth/me successfully restored user session without exposing password hash")

    # 5. Test Role-Aware Scenarios: Create Judge and Clerk users
    judge_email = "judge.e2e@court.gov"
    clerk_email = "clerk.e2e@court.gov"
    
    db.query(User).filter(User.email.in_([judge_email, clerk_email])).delete(synchronize_session=False)
    db.commit()

    judge = User(
        email=judge_email,
        hashed_password=hash_password("JudgeSecret123!"),
        full_name="Hon. Sarah Jenkins",
        role="JUDGE",
        is_active=True
    )
    clerk = User(
        email=clerk_email,
        hashed_password=hash_password("ClerkSecret123!"),
        full_name="Clerk Michael Scott",
        role="CLERK",
        is_active=True
    )
    db.add_all([judge, clerk])
    db.commit()

    # Judge Login
    status, judge_login = json_request("POST", "/auth/login", {
        "email": judge_email,
        "password": "JudgeSecret123!"
    })
    assert status == 200
    judge_token = judge_login["access_token"]

    status, judge_me = json_request("GET", "/auth/me", token=judge_token)
    assert status == 200
    assert judge_me["role"] == "JUDGE"
    assert judge_me["full_name"] == "Hon. Sarah Jenkins"
    print("PASS [4]: Judge session verified with role 'JUDGE'")

    # Clerk Login
    status, clerk_login = json_request("POST", "/auth/login", {
        "email": clerk_email,
        "password": "ClerkSecret123!"
    })
    assert status == 200
    clerk_token = clerk_login["access_token"]

    status, clerk_me = json_request("GET", "/auth/me", token=clerk_token)
    assert status == 200
    assert clerk_me["role"] == "CLERK"
    assert clerk_me["full_name"] == "Clerk Michael Scott"
    print("PASS [5]: Clerk session verified with role 'CLERK'")

    # 6. Test RBAC protection
    status, judge_users_res = json_request("GET", "/users", token=judge_token)
    assert status == 403
    print("PASS [6]: Judge cannot access user management (HTTP 403)")

    status, admin_users_res = json_request("GET", "/users", token=admin_token)
    assert status == 200
    print(f"PASS [7]: Admin can access user management ({len(admin_users_res)} users returned)")

    # 7. Test Expired and Malformed Tokens (Simulates 401 interceptor trigger)
    expired_token = create_access_token(
        data={"sub": "admin@judicialflow.gov", "user_id": admin.id, "role": "ADMIN"},
        expires_delta=timedelta(seconds=-10)
    )
    status, exp_res = json_request("GET", "/auth/me", token=expired_token)
    assert status == 401
    print("PASS [8]: Expired token correctly rejected with HTTP 401")

    # Clean up test users
    db.query(User).filter(User.email.in_([judge_email, clerk_email])).delete(synchronize_session=False)
    db.commit()
    db.close()
    print("PASS [9]: Cleaned up test users")

    # 8. Regression: Cases, Hearings, Documents endpoints
    print("\n--- Running System Regression Tests ---")
    for endpoint in ["/cases", "/hearings", "/documents"]:
        status, res = json_request("GET", endpoint)
        assert status == 200
        print(f"PASS: {endpoint} returned HTTP 200")

    print("\nALL TASK 7 - PHASE 4 FRONTEND AUTHENTICATION INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_frontend_auth_e2e()
