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

def create_multipart_data(fields, files):
    boundary = "----WebKitFormBoundaryFinalSecurityTest999"
    body = bytearray()
    
    for name, value in fields.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"))
        body.extend(f"{value}\r\n".encode("utf-8"))
        
    for name, (filename, content, content_type) in files.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode("utf-8"))
        body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
        body.extend(content)
        body.extend(b"\r\n")
        
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))
    content_type_header = f"multipart/form-data; boundary={boundary}"
    return bytes(body), content_type_header

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

def upload_request(fields, files, token=None):
    url = f"{BASE_URL}/documents/upload"
    data, content_type = create_multipart_data(fields, files)
    headers = {"Content-Type": content_type}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
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

def download_request(doc_id, token=None):
    url = f"{BASE_URL}/documents/{doc_id}/download"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req) as response:
            content = response.read()
            content_type = response.headers.get("Content-Type")
            disposition = response.headers.get("Content-Disposition")
            return response.status, content, content_type, disposition
    except urllib.error.HTTPError as e:
        return e.code, e.read(), None, None

def test_final_security_and_e2e_verification():
    print("=== TASK 7 - PHASE 5: FINAL SECURITY INTEGRATION & E2E VERIFICATION ===")
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

    # 2. Test Unauthenticated Requests (Must all return 401 Unauthorized)
    print("\n--- 1. Testing Unauthenticated Access Protection (401) ---")
    protected_endpoints = [
        ("GET", "/cases"),
        ("POST", "/cases"),
        ("GET", "/hearings"),
        ("POST", "/hearings"),
        ("GET", "/documents"),
        ("POST", "/documents/upload"),
        ("GET", "/users"),
        ("GET", "/auth/me"),
    ]
    for method, endpoint in protected_endpoints:
        status, res = json_request(method, endpoint)
        assert status == 401, f"Expected 401 for unauthenticated {method} {endpoint}, got {status}"
        print(f"PASS: Unauthenticated {method} {endpoint} -> HTTP 401")

    # Document download unauthenticated check
    status, _, _, _ = download_request(1)
    assert status == 401
    print("PASS: Unauthenticated GET /documents/{id}/download -> HTTP 401")

    # 3. Test Invalid & Expired Tokens (401)
    print("\n--- 2. Testing Invalid and Expired Token Rejection (401) ---")
    status, res = json_request("GET", "/cases", token="invalid.bearer.token")
    assert status == 401
    print("PASS: Malformed JWT token rejected with HTTP 401")

    expired_token = create_access_token(
        data={"sub": "admin@judicialflow.gov", "user_id": admin.id, "role": "ADMIN"},
        expires_delta=timedelta(seconds=-10)
    )
    status, exp_res = json_request("GET", "/cases", token=expired_token)
    assert status == 401
    print("PASS: Expired JWT token rejected with HTTP 401")

    # 4. Test Authentication & Session Flow
    print("\n--- 3. Testing Valid Login and Identity Session ---")
    status, login_res = json_request("POST", "/auth/login", {
        "email": "admin@judicialflow.gov",
        "password": "AdminPass123!"
    })
    assert status == 200
    admin_token = login_res["access_token"]
    print("PASS: Admin login returned valid JWT access token")

    status, me_res = json_request("GET", "/auth/me", token=admin_token)
    assert status == 200
    assert me_res["email"] == "admin@judicialflow.gov"
    assert me_res["role"] == "ADMIN"
    assert "hashed_password" not in me_res
    print("PASS: /auth/me returned authenticated user profile (password hash omitted)")

    # 5. Full Authenticated CRUD Operations
    print("\n--- 4. Testing Complete Authenticated Cases, Hearings & Documents Flow ---")
    # A. Create Case
    status, case_res = json_request("POST", "/cases", {
        "title": "Federal Maritime Security v. Pacific Logistics",
        "case_type": "Maritime",
        "status": "FILED",
        "priority": "HIGH",
        "filing_date": "2026-08-28"
    }, token=admin_token)
    assert status == 201
    case_id = case_res["id"]
    case_number = case_res["case_number"]
    print(f"PASS: Authenticated POST /cases created Case #{case_id} ({case_number})")

    # B. List Cases
    status, cases_list = json_request("GET", "/cases", token=admin_token)
    assert status == 200 and any(c["id"] == case_id for c in cases_list)
    print(f"PASS: Authenticated GET /cases listed {len(cases_list)} cases")

    # C. Create Hearing
    status, hearing_res = json_request("POST", "/hearings", {
        "case_id": case_id,
        "hearing_type": "Preliminary Hearing",
        "scheduled_at": "2026-09-15T10:00:00Z",
        "judge": "Hon. Sarah Jenkins",
        "location": "Courtroom 4A",
        "status": "SCHEDULED"
    }, token=admin_token)
    assert status == 201
    hearing_id = hearing_res["id"]
    print(f"PASS: Authenticated POST /hearings created Hearing #{hearing_id}")

    # D. Upload Document
    doc_bytes = b"%PDF-1.4 Official Maritime Compliance Filing Directives"
    status, doc_res = upload_request(
        {"case_id": str(case_id), "document_type": "Order", "description": "Court Scheduling Directives"},
        {"file": ("maritime_directives.pdf", doc_bytes, "application/pdf")},
        token=admin_token
    )
    assert status == 201
    doc_id = doc_res["id"]
    print(f"PASS: Authenticated POST /documents/upload uploaded Document #{doc_id}")

    # E. Download Document
    status, dl_bytes, dl_mime, dl_disp = download_request(doc_id, token=admin_token)
    assert status == 200
    assert dl_bytes == doc_bytes
    assert "maritime_directives.pdf" in dl_disp
    print(f"PASS: Authenticated GET /documents/{doc_id}/download streamed exact file ({len(dl_bytes)} bytes)")

    # F. Delete Document
    status, _ = json_request("DELETE", f"/documents/{doc_id}", token=admin_token)
    assert status == 204
    print(f"PASS: Authenticated DELETE /documents/{doc_id} -> HTTP 204")

    # G. Delete Hearing
    status, _ = json_request("DELETE", f"/hearings/{hearing_id}", token=admin_token)
    assert status == 204
    print(f"PASS: Authenticated DELETE /hearings/{hearing_id} -> HTTP 204")

    # H. Delete Case
    status, _ = json_request("DELETE", f"/cases/{case_id}", token=admin_token)
    assert status == 204
    print(f"PASS: Authenticated DELETE /cases/{case_id} -> HTTP 204")

    # 6. Test RBAC & Inactive Accounts
    print("\n--- 5. Testing RBAC and Account Deactivation ---")
    staff_user = User(
        email="test_staff_final@court.gov",
        hashed_password=hash_password("StaffPass123!"),
        full_name="Staff Test User",
        role="STAFF",
        is_active=True
    )
    db.add(staff_user)
    db.commit()
    db.refresh(staff_user)

    status, staff_login = json_request("POST", "/auth/login", {
        "email": "test_staff_final@court.gov",
        "password": "StaffPass123!"
    })
    assert status == 200
    staff_token = staff_login["access_token"]

    # Staff can access cases
    status, _ = json_request("GET", "/cases", token=staff_token)
    assert status == 200
    print("PASS: Staff can view cases (HTTP 200)")

    # Staff CANNOT access user management (403)
    status, _ = json_request("GET", "/users", token=staff_token)
    assert status == 403
    print("PASS: Staff cannot access administrative user management (HTTP 403)")

    # Deactivate staff user
    staff_user.is_active = False
    db.commit()

    # Deactivated staff user cannot access cases (403)
    status, _ = json_request("GET", "/cases", token=staff_token)
    assert status == 403
    print("PASS: Deactivated account rejected on protected routes (HTTP 403)")

    # Clean up test staff user
    db.delete(staff_user)
    db.commit()
    db.close()
    print("PASS: Cleaned up test staff user")

    print("\nALL TASK 7 - PHASE 5 FINAL SECURITY & E2E TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_final_security_and_e2e_verification()
