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
from rag.extractor import extract_text_from_file
from rag.chunker import chunk_text
from rag.vector_store import vector_store

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

def test_task10_phase2_rag():
    print("=== TASK 10 - PHASE 2: RAG & DOCUMENT INDEXING VERIFICATION ===")
    db = SessionLocal()

    admin = db.query(User).filter(User.email == "admin@judicialflow.gov").first()
    cases = db.query(Case).all()
    assert admin is not None and len(cases) >= 2, "Requires admin and at least 2 cases for isolation testing"

    case_a = cases[0]
    case_b = cases[1]

    # 1. Test Unit Extraction & Chunking
    print("\n--- 1. Testing Document Extraction & Semantic Chunking ---")
    sample_text = (
        "PRELIMINARY INJUNCTION MEMORANDUM OF LAW. "
        "Plaintiff respectfully moves this Court under Rule 65 for an immediate injunction. "
        "The evidentiary record clearly establishes substantial likelihood of success on the merits. "
        "Defendant's continued patent infringement causes irreparable commercial harm and market foreclosure. "
        "The balance of equities strongly favors Plaintiff because Defendant had full notice of the patent rights. "
        "Furthermore, the public interest is served by upholding valid intellectual property rights in maritime navigation."
    )
    test_file = backend_dir / "uploads" / "documents" / "test_rag_injunction_brief.txt"
    test_file.parent.mkdir(parents=True, exist_ok=True)
    test_file.write_text(sample_text, encoding="utf-8")

    extracted = extract_text_from_file(test_file)
    assert "Rule 65" in extracted
    print(f"PASS: Extracted {len(extracted)} characters from test file")

    chunks = chunk_text(sample_text, chunk_size=200, overlap=40)
    assert len(chunks) >= 2
    print(f"PASS: Chunked into {len(chunks)} overlapping windows")

    # 2. Add Test Document Records to Database for Case A and Case B
    doc_a = Document(
        case_id=case_a.id,
        filename="test_rag_injunction_brief.txt",
        file_path="uploads/documents/test_rag_injunction_brief.txt",
        document_type="Motion",
        file_size=len(sample_text),
        mime_type="text/plain",
        description="Plaintiff Motion for Rule 65 Injunction and Maritime Patent Protection",
        uploaded_by=admin.id,
    )
    doc_b_text = (
        "CONFIDENTIAL SETTLEMENT AGREEMENT AND RELEASE. "
        "The parties in Case B hereby settle all employment and wage disputes. "
        "Payment of $50,000 shall be made within 30 days in full satisfaction of all claims."
    )
    test_file_b = backend_dir / "uploads" / "documents" / "test_case_b_settlement.txt"
    test_file_b.write_text(doc_b_text, encoding="utf-8")

    doc_b = Document(
        case_id=case_b.id,
        filename="test_case_b_settlement.txt",
        file_path="uploads/documents/test_case_b_settlement.txt",
        document_type="Agreement",
        file_size=len(doc_b_text),
        mime_type="text/plain",
        description="Confidential Settlement and Mutual Release",
        uploaded_by=admin.id,
    )
    db.add(doc_a)
    db.add(doc_b)
    db.commit()
    db.refresh(doc_a)
    db.refresh(doc_b)
    print(f"PASS: Created test documents: Doc #{doc_a.id} for Case A ({case_a.case_number}) and Doc #{doc_b.id} for Case B ({case_b.case_number})")

    # 3. Test Unauthenticated Access Protection (401)
    print("\n--- 3. Testing Authentication Security on RAG Endpoints (401) ---")
    status, _ = json_request("POST", "/ai/index-documents")
    assert status == 401
    status, _ = json_request("POST", "/ai/retrieve", {"query": "patent infringement"})
    assert status == 401
    print("PASS: Unauthenticated index and retrieve endpoints rejected with HTTP 401")

    # 4. Login as Admin
    token = login("admin@judicialflow.gov", "AdminPass123!")

    # 5. Test Document Ingestion & Indexing (POST /api/ai/index-documents)
    print("\n--- 5. Testing Document Ingestion & Vector Indexing ---")
    status, index_res = json_request("POST", "/ai/index-documents", token=token)
    assert status == 200
    assert index_res["indexed_documents"] >= 2
    assert index_res["total_chunks"] >= 2
    assert index_res["status"] == "success"
    print(f"PASS: Indexing succeeded -> {index_res['indexed_documents']} docs, {index_res['total_chunks']} chunks in vector store")

    # 6. Test Context Retrieval with Cosine Similarity (POST /api/ai/retrieve)
    print("\n--- 6. Testing Semantic Vector Retrieval ---")
    retrieval_payload = {
        "query": "preliminary injunction patent infringement Rule 65",
        "top_k": 3
    }
    status, ret_res = json_request("POST", "/ai/retrieve", retrieval_payload, token=token)
    assert status == 200
    assert ret_res["total_retrieved"] >= 1
    top_chunk = ret_res["chunks"][0]
    assert "injunction" in top_chunk["text"].lower() or "patent" in top_chunk["text"].lower()
    assert top_chunk["relevance_score"] > 0.0
    print(f"PASS: Retrieved top chunk from '{top_chunk['filename']}' (Score: {top_chunk['relevance_score']})")

    # 7. Test Strict Case Isolation
    print("\n--- 7. Testing Case-Scoped Retrieval Isolation ---")
    # Query case_a specifically for settlement keywords (present only in Case B)
    status, iso_res_a = json_request("POST", "/ai/retrieve", {
        "query": "settlement agreement wage release payment",
        "case_id": case_a.id,
        "top_k": 5
    }, token=token)
    assert status == 200
    # Chunks returned MUST all belong strictly to case_a
    assert all(c["case_id"] == case_a.id for c in iso_res_a["chunks"])
    # Case B's confidential settlement document must NOT be returned in Case A's scope!
    assert not any("settlement" in c["text"].lower() and c["case_id"] == case_b.id for c in iso_res_a["chunks"])
    print(f"PASS: Strict case isolation enforced. Case A query returned 0 chunks from Case B.")

    # Query case_b specifically
    status, iso_res_b = json_request("POST", "/ai/retrieve", {
        "query": "settlement agreement 50000",
        "case_id": case_b.id,
        "top_k": 3
    }, token=token)
    assert status == 200
    assert len(iso_res_b["chunks"]) >= 1
    assert iso_res_b["chunks"][0]["case_id"] == case_b.id
    print(f"PASS: Case B query returned Case B's settlement filing (Score: {iso_res_b['chunks'][0]['relevance_score']})")

    # 8. Test AI Query Integration with RAG Citations
    print("\n--- 8. Testing RAG Integration in AI Query Endpoint ---")
    status, ai_res = json_request("POST", "/ai/query", {
        "prompt": "Evaluate the merits of the Rule 65 injunction motion",
        "case_id": case_a.id,
        "mode": "case_analysis"
    }, token=token)
    assert status == 200
    assert any(c["source_type"] == "document" and "injunction" in c["title"].lower() for c in ai_res["citations"])
    print(f"PASS: AI Query response augmented with RAG citations from indexed filings")

    # 9. Clean up temporary test data
    print("\n--- 9. Cleaning up test data ---")
    db.delete(doc_a)
    db.delete(doc_b)
    db.commit()
    if test_file.exists():
        test_file.unlink()
    if test_file_b.exists():
        test_file_b.unlink()
    # Reindex clean state
    json_request("POST", "/ai/index-documents", token=token)
    print("PASS: Cleaned up test files and document records")

    # 10. Full System Regression Verification
    print("\n--- 10. Running Full System-wide Regression Verification ---")
    endpoints = ["/cases", "/hearings", "/documents", "/users", "/tasks", "/notifications", "/auth/me"]
    for ep in endpoints:
        status, _ = json_request("GET", ep, token=token)
        assert status == 200, f"Expected 200 for {ep}, got {status}"
        print(f"PASS: {ep} returned HTTP 200")

    db.close()
    print("\nALL TASK 10 - PHASE 2 RAG & DOCUMENT INDEXING TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_task10_phase2_rag()
