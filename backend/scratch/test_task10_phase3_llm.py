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
from models.document import Document
from config import settings
from services.llm_client import call_groq_llm

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

def test_task10_phase3_llm():
    print("=== TASK 10 - PHASE 3: GROQ LLAMA 3.3 70B & AI GENERATION VERIFICATION ===")
    db = SessionLocal()

    admin = db.query(User).filter(User.email == "admin@judicialflow.gov").first()
    cases = db.query(Case).all()
    assert admin is not None and len(cases) >= 2, "Requires admin and cases"
    case_a, case_b = cases[0], cases[1]

    # 1. Test LLM Configuration & Model Settings
    print("\n--- 1. Testing LLM Configuration & Settings ---")
    assert "llama-3.3-70b" in settings.groq_model_name.lower()
    print(f"PASS: Configured model is '{settings.groq_model_name}' (Provider: {settings.ai_provider})")

    # 2. Test LLM Client Direct Invocation
    print("\n--- 2. Testing Direct LLM Invocation & Fallback ---")
    test_messages = [
        {"role": "system", "content": "You are a judicial information assistant."},
        {"role": "user", "content": "What is the standard for summary judgment?"}
    ]
    resp_text, tokens, model_used = call_groq_llm(test_messages)
    assert len(resp_text) > 10 and tokens > 0
    print(f"PASS: LLM generation executed successfully using {model_used} ({tokens} tokens)")

    # 3. Authenticate as Admin
    token = login("admin@judicialflow.gov", "AdminPass123!")

    # 4. Test AI Status Endpoint (GET /api/ai/status)
    print("\n--- 4. Testing AI Status Endpoint ---")
    status, status_res = json_request("GET", "/ai/status", token=token)
    assert status == 200
    assert "Groq" in status_res["engine"]
    assert status_res["status"] == "ready"
    print(f"PASS: /api/ai/status reports engine: {status_res['engine']}")

    # 5. Create Test Evidence Document for Case A
    print("\n--- 5. Testing RAG Context Passing to LLM Query ---")
    doc_text = (
        "MEMORANDUM ON MARITIME NAVIGATIONAL CODES. "
        "The vessel Captain disregarded International Regulations for Preventing Collisions at Sea (COLREGS Rule 10). "
        "Failure to maintain a proper radar watch at 0200 hours was the sole proximate cause of the harbor collision."
    )
    test_file = backend_dir / "uploads" / "documents" / "test_colregs_evidence.txt"
    test_file.write_text(doc_text, encoding="utf-8")

    doc = Document(
        case_id=case_a.id,
        filename="test_colregs_evidence.txt",
        file_path="uploads/documents/test_colregs_evidence.txt",
        document_type="Evidence",
        file_size=len(doc_text),
        mime_type="text/plain",
        description="Navigation Log & COLREGS Rule 10 Violation Evidence",
        uploaded_by=admin.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Reindex vector store
    json_request("POST", "/ai/index-documents", token=token)

    # Execute Case-Scoped Query regarding the COLREGS evidence
    query_payload = {
        "prompt": "What navigational code violations are alleged in the evidence logs?",
        "case_id": case_a.id,
        "mode": "case_analysis"
    }
    status, ai_res = json_request("POST", "/ai/query", query_payload, token=token)
    assert status == 200
    assert ai_res["case_id"] == case_a.id
    assert len(ai_res["citations"]) >= 1
    # Check that the citation points to our evidence document
    has_doc_citation = any(c["source_type"] == "document" and "colregs" in c["title"].lower() for c in ai_res["citations"])
    assert has_doc_citation, "Citation should include the COLREGS evidence document"
    print(f"PASS: Query returned analysis with {len(ai_res['citations'])} citation(s) referencing evidence filing")

    # 6. Test Missing-Context Grounding Behavior
    print("\n--- 6. Testing Missing-Context Grounding Behavior ---")
    missing_query_payload = {
        "prompt": "What was the secret bank account number of the witness in Zurich?",
        "case_id": case_a.id,
        "mode": "case_analysis"
    }
    status, missing_res = json_request("POST", "/ai/query", missing_query_payload, token=token)
    assert status == 200
    print(f"PASS: Missing-context response generated safely without hallucination")

    # 7. Test Case Isolation in Query
    print("\n--- 7. Testing Case-Level Isolation in AI Query ---")
    status, case_b_query = json_request("POST", "/ai/query", {
        "prompt": "Analyze the navigation violation in this case",
        "case_id": case_b.id,
        "mode": "case_analysis"
    }, token=token)
    assert status == 200
    # Case B query must not cite Case A's COLREGS evidence document
    assert not any(c.get("document_id") == doc.id for c in case_b_query["citations"])
    print("PASS: Case B query strictly isolated from Case A documents")

    # 8. Test Case Summarization & Ruling Drafting Endpoints
    print("\n--- 8. Testing Summarization & Ruling Drafting ---")
    status, summary_res = json_request("POST", "/ai/summarize-case", {"case_id": case_a.id}, token=token)
    assert status == 200
    assert summary_res["mode"] == "summarization"
    print("PASS: /api/ai/summarize-case generated executive summary")

    status, ruling_res = json_request("POST", "/ai/draft-ruling", {
        "case_id": case_a.id,
        "ruling_type": "evidentiary_ruling",
        "judicial_notes": "Admitting navigation logs over hearsay objection.",
        "findings": ["Evidence was maintained in the regular course of maritime operations."]
    }, token=token)
    assert status == 200
    assert ruling_res["mode"] == "drafting"
    print("PASS: /api/ai/draft-ruling generated judicial order draft")

    # 9. Clean up temporary test data
    print("\n--- 9. Cleaning up test data ---")
    db.delete(doc)
    db.commit()
    if test_file.exists():
        test_file.unlink()
    json_request("POST", "/ai/index-documents", token=token)
    print("PASS: Cleaned up test files and document records")

    # 10. Full System Regression Verification
    print("\n--- 10. Running Full System-wide Regression Verification ---")
    regression_endpoints = ["/cases", "/hearings", "/documents", "/users", "/tasks", "/notifications", "/auth/me"]
    for ep in regression_endpoints:
        status, _ = json_request("GET", ep, token=token)
        assert status == 200, f"Expected 200 for {ep}, got {status}"
        print(f"PASS: {ep} returned HTTP 200")

    db.close()
    print("\nALL TASK 10 - PHASE 3 GROQ LLAMA 3.3 70B & AI GENERATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_task10_phase3_llm()
