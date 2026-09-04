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
from models.case import Case

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

def test_task10_phase1_ai_foundation():
    print("=== TASK 10 - PHASE 1: AI ASSISTANT BACKEND FOUNDATION VERIFICATION ===")
    db = SessionLocal()

    admin = db.query(User).filter(User.email == "admin@judicialflow.gov").first()
    case = db.query(Case).first()
    assert admin is not None and case is not None

    # 1. Test Unauthenticated Access Protection (401)
    print("\n--- 1. Testing Unauthenticated Route Protection (401) ---")
    endpoints = [
        ("GET", "/ai/status"),
        ("POST", "/ai/query"),
        ("POST", "/ai/summarize-case"),
        ("POST", "/ai/draft-ruling"),
    ]
    for method, ep in endpoints:
        status, _ = json_request(method, ep, body={"prompt": "test", "case_id": 1} if method == "POST" else None)
        assert status == 401, f"Expected 401 for {method} {ep}, got {status}"
        print(f"PASS: Unauthenticated {method} {ep} rejected with HTTP 401")

    # 2. Login as Admin
    token = login("admin@judicialflow.gov", "AdminPass123!")
    print("\n--- 2. Authenticated Admin Session ---")
    print("PASS: Logged in successfully")

    # 3. Test AI Status Endpoint (GET /api/ai/status)
    print("\n--- 3. Testing AI Status Endpoint (GET /api/ai/status) ---")
    status, status_res = json_request("GET", "/ai/status", token=token)
    assert status == 200
    assert status_res["status"] == "ready"
    assert "case_analysis" in status_res["supported_modes"]
    assert status_res["rag_indexing_ready"] is True
    print(f"PASS: AI Status -> Engine: {status_res['engine']}, Ready: {status_res['status']}")

    # 4. Test General AI Query (POST /api/ai/query)
    print("\n--- 4. Testing General AI Query (POST /api/ai/query) ---")
    query_payload = {
        "prompt": "What are the key standards for issuing a preliminary injunction?",
        "mode": "general"
    }
    status, res = json_request("POST", "/ai/query", query_payload, token=token)
    assert status == 200
    assert "response" in res and len(res["response"]) > 20
    assert res["mode"] == "general"
    print("PASS: General AI query returned structured response")

    # 5. Test Case-Scoped AI Query (POST /api/ai/query with case_id)
    print("\n--- 5. Testing Case-Scoped AI Query ---")
    case_query_payload = {
        "prompt": "Summarize the legal claims and evidence in this dispute.",
        "case_id": case.id,
        "mode": "case_analysis"
    }
    status, case_res = json_request("POST", "/ai/query", case_query_payload, token=token)
    assert status == 200
    assert case_res["case_id"] == case.id
    assert len(case_res["citations"]) >= 1
    assert case_res["citations"][0]["source_type"] == "case"
    print(f"PASS: Case-scoped query returned analysis with {len(case_res['citations'])} citation(s)")

    # 6. Test Invalid Case Error (404)
    print("\n--- 6. Testing Non-existent Case ID (404) ---")
    status, err_res = json_request("POST", "/ai/query", {"prompt": "test", "case_id": 999999}, token=token)
    assert status == 404
    print("PASS: Query with non-existent case ID rejected with HTTP 404")

    # 7. Test Case Summarization (POST /api/ai/summarize-case)
    print("\n--- 7. Testing Case Summarization (POST /api/ai/summarize-case) ---")
    status, summary_res = json_request("POST", "/ai/summarize-case", {"case_id": case.id}, token=token)
    assert status == 200
    assert case.case_number in summary_res["response"]
    assert summary_res["mode"] == "summarization"
    print(f"PASS: Case summary generated for {case.case_number}")

    # 8. Test Court Ruling Drafting (POST /api/ai/draft-ruling)
    print("\n--- 8. Testing Court Ruling Drafting (POST /api/ai/draft-ruling) ---")
    draft_payload = {
        "case_id": case.id,
        "ruling_type": "summary_judgment",
        "judicial_notes": "Granting partial summary judgment on liability.",
        "findings": [
            "Plaintiff established prima facie breach of contractual covenants.",
            "Defendant failed to proffer genuine issues of material fact regarding notice."
        ]
    }
    status, ruling_res = json_request("POST", "/ai/draft-ruling", draft_payload, token=token)
    assert status == 200
    assert "ORDER ON MOTION FOR SUMMARY JUDGMENT" in ruling_res["response"]
    assert "findings" in ruling_res["response"].lower()
    print(f"PASS: Ruling drafted successfully ({ruling_res['mode']})")

    # 9. Full Regression Verification Across Modules
    print("\n--- 9. Running Full System-wide Regression Verification ---")
    regression_endpoints = ["/cases", "/hearings", "/documents", "/users", "/tasks", "/notifications", "/auth/me"]
    for ep in regression_endpoints:
        status, _ = json_request("GET", ep, token=token)
        assert status == 200, f"Expected 200 for {ep}, got {status}"
        print(f"PASS: {ep} returned HTTP 200")

    db.close()
    print("\nALL TASK 10 - PHASE 1 AI ASSISTANT FOUNDATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_task10_phase1_ai_foundation()
