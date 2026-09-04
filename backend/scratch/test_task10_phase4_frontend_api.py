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

def test_task10_phase4_frontend_api():
    print("=== TASK 10 - PHASE 4: AI ASSISTANT FRONTEND & API INTEGRATION VERIFICATION ===")
    db = SessionLocal()

    admin = db.query(User).filter(User.email == "admin@judicialflow.gov").first()
    cases = db.query(Case).all()
    assert admin is not None and len(cases) >= 1

    target_case = cases[0]

    # 1. Authenticate as Admin
    token = login("admin@judicialflow.gov", "AdminPass123!")
    print("PASS [1]: Authenticated as Admin via JWT Bearer token")

    # 2. Verify Case Listing Endpoint for AIAssistant Dropdown
    status, case_list = json_request("GET", "/cases", token=token)
    assert status == 200 and isinstance(case_list, list) and len(case_list) >= 1
    print(f"PASS [2]: Case selector loaded {len(case_list)} case(s)")

    # 3. Test AI Status Endpoint (Drives UI status pill)
    status, status_res = json_request("GET", "/ai/status", token=token)
    assert status == 200
    assert status_res["status"] == "ready"
    assert "Groq" in status_res["engine"] or "llama" in status_res["engine"].lower()
    print(f"PASS [3]: Engine status verified: {status_res['engine']}")

    # 4. Test RAG Indexing Trigger from UI Button
    status, index_res = json_request("POST", "/ai/index-documents", token=token)
    assert status == 200
    assert index_res["status"] == "success"
    print(f"PASS [4]: 'Sync Index' API call succeeded ({index_res['indexed_documents']} docs, {index_res['total_chunks']} chunks)")

    # 5. Test Interactive Chat Queries Across Multiple Modes
    modes_to_test = [
        ("case_analysis", "Analyze the procedural background and key disputes in this proceeding.", target_case.id),
        ("summarization", "Provide an executive summary of this case.", target_case.id),
        ("drafting", "Draft a pretrial scheduling order.", target_case.id),
        ("statute_search", "What evidence rules govern preliminary injunction motions?", None),
        ("general", "Explain the role of the Judicial AI assistant.", None),
    ]

    for mode, prompt, cid in modes_to_test:
        payload = {
            "prompt": prompt,
            "case_id": cid,
            "mode": mode,
            "temperature": 0.2
        }
        status, res = json_request("POST", "/ai/query", payload, token=token)
        assert status == 200, f"Failed for mode {mode}: {res}"
        assert res["mode"] == mode
        assert len(res["response"]) > 10
        print(f"PASS [5 - {mode}]: Query returned structured response (Citations: {len(res['citations'])})")

    # 6. Full System-wide Regression Verification
    print("\n--- 6. Running Full System-wide Regression Verification ---")
    regression_endpoints = ["/cases", "/hearings", "/documents", "/users", "/tasks", "/notifications", "/auth/me"]
    for ep in regression_endpoints:
        status, _ = json_request("GET", ep, token=token)
        assert status == 200, f"Expected 200 for {ep}, got {status}"
        print(f"PASS: {ep} returned HTTP 200")

    db.close()
    print("\nALL TASK 10 - PHASE 4 AI ASSISTANT FRONTEND & API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_task10_phase4_frontend_api()
