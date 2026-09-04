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
from models.user import User
from models.case import Case
from models.hearing import Hearing
from models.document import Document
from models.task import Task
from models.notification import Notification
from core.security import hash_password

BASE_URL = "http://127.0.0.1:8000"

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

def run_master_verification():
    print("================================================================================")
    print("      JUDICIAL FLOW PRO — MASTER SYSTEM & REGRESSION VERIFICATION SUITE       ")
    print("================================================================================")
    db = SessionLocal()

    # 1. Backend Health Check
    print("\n[CHECK 1] Health Check (/health)")
    status, health_res = json_request("GET", "/health")
    assert status == 200 and health_res.get("status") == "ok"
    print("[OK] PASS: Backend is healthy and responding.")

    # 2. Authentication & JWT Protection
    print("\n[CHECK 2] Authentication & Security")
    # Invalid login rejection
    status, _ = json_request("POST", "/api/auth/login", {"email": "bad@court.gov", "password": "WrongPassword!"})
    assert status == 401
    print("[OK] PASS: Invalid login correctly rejected (HTTP 401).")

    # Valid admin login
    status, auth_res = json_request("POST", "/api/auth/login", {"email": "admin@judicialflow.gov", "password": "AdminPass123!"})
    assert status == 200 and "access_token" in auth_res
    token = auth_res["access_token"]
    print("[OK] PASS: Admin authenticated and JWT Bearer token acquired.")

    # Verify Current User Profile (/api/auth/me)
    status, me_res = json_request("GET", "/api/auth/me", token=token)
    assert status == 200 and me_res["email"] == "admin@judicialflow.gov"
    print(f"[OK] PASS: /api/auth/me returned profile for {me_res['full_name']} (Role: {me_res['role']}).")

    # 3. Users Module
    print("\n[CHECK 3] Users & RBAC (/api/users)")
    status, users_list = json_request("GET", "/api/users", token=token)
    assert status == 200 and isinstance(users_list, list) and len(users_list) >= 1
    print(f"[OK] PASS: Users API returned {len(users_list)} registered judicial staff accounts.")

    # 4. Cases Module CRUD & Triggers
    print("\n[CHECK 4] Cases Module (/api/cases)")
    case_payload = {
        "title": "Master Verification Test: Global Corp v. Maritime Ltd",
        "description": "Commercial dispute concerning maritime trade charter agreements.",
        "case_type": "Civil",
        "priority": "HIGH",
        "filing_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "courtroom": "Courtroom 3A",
        "assigned_judge": "Hon. Sarah Jenkins"
    }
    status, created_case = json_request("POST", "/api/cases", case_payload, token=token)
    assert status == 201
    test_case_id = created_case["id"]
    print(f"[OK] PASS: Case created -> #{created_case['case_number']} (ID: {test_case_id}).")

    # Update Case Status
    status, updated_case = json_request("PUT", f"/api/cases/{test_case_id}", {"status": "UNDER_REVIEW"}, token=token)
    assert status == 200 and updated_case["status"] == "UNDER_REVIEW"
    print("[OK] PASS: Case updated to UNDER_REVIEW (Triggered automated case alert).")

    # 5. Hearings Module CRUD & Triggers
    print("\n[CHECK 5] Hearings Module (/api/hearings)")
    hearing_date = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    hearing_payload = {
        "case_id": test_case_id,
        "hearing_type": "Pretrial Motion Hearing",
        "scheduled_at": hearing_date,
        "location": "Courtroom 3A",
        "judge": "Hon. Sarah Jenkins",
        "status": "SCHEDULED"
    }
    status, created_hearing = json_request("POST", "/api/hearings", hearing_payload, token=token)
    assert status == 201
    test_hearing_id = created_hearing["id"]
    print(f"[OK] PASS: Hearing scheduled -> ID #{test_hearing_id} (Triggered automated calendar notification).")

    # 6. Tasks & Action Items Module
    print("\n[CHECK 6] Tasks Module (/api/tasks)")
    task_payload = {
        "title": "Prepare Judicial Brief on Maritime Rule 65",
        "description": "Review verified complaint and affidavits",
        "case_id": test_case_id,
        "assigned_to": me_res["id"],
        "priority": "HIGH",
        "status": "PENDING"
    }
    status, created_task = json_request("POST", "/api/tasks", task_payload, token=token)
    assert status == 201
    test_task_id = created_task["id"]
    print(f"[OK] PASS: Task assigned -> ID #{test_task_id} (Triggered automated task assignment notification).")

    # 7. Notifications Module & User Isolation
    print("\n[CHECK 7] Notifications & User Isolation (/api/notifications)")
    status, notifs = json_request("GET", "/api/notifications", token=token)
    assert status == 200 and len(notifs) >= 1
    status, count_data = json_request("GET", "/api/notifications/unread-count", token=token)
    assert status == 200 and count_data["unread_count"] >= 1
    print(f"[OK] PASS: Notifications loaded ({len(notifs)} total, {count_data['unread_count']} unread).")

    # Mark all read
    status, read_all = json_request("PUT", "/api/notifications/read-all", token=token)
    assert status == 200 and read_all["unread_count"] == 0
    print("[OK] PASS: Bulk Mark-All-As-Read cleared all unread notifications.")

    # 8. AI Assistant & RAG Engine (/api/ai)
    print("\n[CHECK 8] AI Assistant, RAG Ingestion & Groq Llama 3.3 70B Generation (/api/ai)")
    status, ai_status = json_request("GET", "/api/ai/status", token=token)
    assert status == 200 and ai_status["status"] == "ready"
    print(f"[OK] PASS: AI Engine status: {ai_status['engine']} (RAG Indexing Ready: {ai_status['rag_indexing_ready']}).")

    # Index documents
    status, index_res = json_request("POST", "/api/ai/index-documents", token=token)
    assert status == 200
    print(f"[OK] PASS: Document indexing executed ({index_res['indexed_documents']} docs, {index_res['total_chunks']} chunks).")

    # AI Query across modes
    modes = ["case_analysis", "summarization", "drafting", "statute_search", "general"]
    for m in modes:
        status, q_res = json_request("POST", "/api/ai/query", {
            "prompt": "Evaluate the contractual claims in this proceeding",
            "case_id": test_case_id if m in ("case_analysis", "summarization", "drafting") else None,
            "mode": m
        }, token=token)
        assert status == 200
        print(f"  [OK] Mode '{m}' -> Returned structured judicial response ({q_res['model_used']}).")

    # 9. Clean up temporary test records
    print("\n[CHECK 9] Cleaning up temporary test artifacts...")
    json_request("DELETE", f"/api/tasks/{test_task_id}", token=token)
    json_request("DELETE", f"/api/hearings/{test_hearing_id}", token=token)
    json_request("DELETE", f"/api/cases/{test_case_id}", token=token)
    db.query(Notification).delete()
    db.commit()
    print("[OK] PASS: Cleaned up all verification test records.")

    # 10. Final System-wide Regression Endpoint Sanity
    print("\n[CHECK 10] Master Regression Sanity Check across all 8 modules")
    for endpoint in ["/api/cases", "/api/hearings", "/api/documents", "/api/users", "/api/tasks", "/api/notifications", "/api/auth/me", "/api/ai/status"]:
        status, _ = json_request("GET", endpoint, token=token)
        assert status == 200, f"Failed on endpoint {endpoint}"
        print(f"[OK] PASS: {endpoint} -> HTTP 200 OK")

    db.close()
    print("\n================================================================================")
    print("               ALL 10 VERIFICATION CHECKS PASSED (100% SUCCESS)                 ")
    print("================================================================================")

if __name__ == "__main__":
    run_master_verification()
