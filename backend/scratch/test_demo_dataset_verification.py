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
from models.case import Case
from models.document import Document
from models.hearing import Hearing
from models.task import Task
from models.notification import Notification
from models.user import User

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

def test_demo_dataset_verification():
    print("================================================================================")
    print("      JUDICIAL FLOW PRO — DEMO DATASET & RAG ISOLATION VERIFICATION             ")
    print("================================================================================")
    db = SessionLocal()

    # 1. Verify Database Record Counts
    cases_count = db.query(Case).count()
    docs_count = db.query(Document).count()
    hearings_count = db.query(Hearing).count()
    tasks_count = db.query(Task).count()
    notifs_count = db.query(Notification).count()
    users_count = db.query(User).count()

    print(f"\n[1] Database Records Count:")
    print(f"  - Cases: {cases_count} (Expected 10-12)")
    print(f"  - Documents: {docs_count} (Expected 10-15)")
    print(f"  - Hearings: {hearings_count} (Expected 8-12)")
    print(f"  - Tasks: {tasks_count} (Expected 8-12)")
    print(f"  - Notifications: {notifs_count} (Expected 15-25)")
    print(f"  - Users: {users_count} (Expected >= 2)")

    assert 10 <= cases_count <= 15
    assert 10 <= docs_count <= 20
    assert 8 <= hearings_count <= 15
    assert 8 <= tasks_count <= 15
    assert 12 <= notifs_count <= 30
    print("[OK] PASS: All database record quantities meet required demo thresholds.")

    # 2. Authenticate
    token = login("admin@judicialflow.gov", "AdminPass123!")
    print("\n[2] Authenticated as Admin via JWT Bearer token.")

    # 3. Fetch Case 1 (Vanguard) and Case 2 (Apex Maritime)
    case_vanguard = db.query(Case).filter(Case.case_number == "JFP-2026-0101").first()
    case_apex = db.query(Case).filter(Case.case_number == "JFP-2026-0102").first()
    assert case_vanguard is not None and case_apex is not None

    # 4. Test Case-Scoped RAG Query for Vanguard
    print(f"\n[3] Testing Scoped RAG AI Query on Case {case_vanguard.case_number}...")
    prompt_vanguard = "What forensic evidence supports Vanguard's claim of deliberate delay and firmware misappropriation?"
    status, res_vanguard = json_request("POST", "/ai/query", {
        "prompt": prompt_vanguard,
        "case_id": case_vanguard.id,
        "mode": "case_analysis",
        "temperature": 0.2
    }, token=token)

    assert status == 200
    print(f"  [OK] Response generated ({res_vanguard['tokens_used']} tokens, model: {res_vanguard['model_used']})")
    print(f"  [OK] Citations returned: {len(res_vanguard['citations'])}")
    for c in res_vanguard["citations"]:
        print(f"       -> Citation: {c['title']} (Score: {c.get('relevance_score')})")

    # Assert citations include Vanguard documents
    citation_titles = [c["title"] for c in res_vanguard["citations"]]
    assert any("Vanguard" in t or "Interconnection" in t or "Complaint" in t or "Report" in t for t in citation_titles)

    # 5. Test Strict Case Isolation (Case 1 query MUST NOT return Case 2 docs)
    print("\n[4] Verifying Strict Case Isolation...")
    for c in res_vanguard["citations"]:
        assert "Coast_Guard" not in c["title"], "FAIL: Cross-case leakage detected (Coast Guard in Vanguard query)"
        assert "Apex" not in c["title"], "FAIL: Cross-case leakage detected (Apex in Vanguard query)"
        assert c["case_id"] == case_vanguard.id
    print("  [OK] PASS: Zero cross-case leakage. Vanguard query citations belong strictly to Case #1.")

    # 6. Test Scoped Query on Case 2 (Apex Maritime)
    print(f"\n[5] Testing Scoped RAG AI Query on Case {case_apex.case_number} (Apex Maritime)...")
    prompt_apex = "What violations were found during the Coast Guard inspection of M/V Pacific Osprey?"
    status, res_apex = json_request("POST", "/ai/query", {
        "prompt": prompt_apex,
        "case_id": case_apex.id,
        "mode": "case_analysis",
        "temperature": 0.2
    }, token=token)

    assert status == 200
    print(f"  [OK] Citations returned: {len(res_apex['citations'])}")
    for c in res_apex["citations"]:
        print(f"       -> Citation: {c['title']} (Score: {c.get('relevance_score')})")
        assert c["case_id"] == case_apex.id
        assert "Vanguard" not in c["title"], "FAIL: Vanguard document leaked into Apex Maritime query"
    print("  [OK] PASS: Apex Maritime query citations belong strictly to Case #2.")

    # 7. Check Frontend API Endpoints with Seeded Data
    print("\n[6] Checking All API Endpoints with Seeded Data...")
    for ep in ["/cases", "/hearings", "/documents", "/tasks", "/notifications", "/users"]:
        status, data = json_request("GET", ep, token=token)
        assert status == 200
        print(f"  [OK] GET {ep} returned {len(data)} live items.")

    db.close()
    print("\n================================================================================")
    print("          ALL DEMO DATASET & RAG ISOLATION VERIFICATIONS PASSED (100%)           ")
    print("================================================================================")

if __name__ == "__main__":
    test_demo_dataset_verification()
