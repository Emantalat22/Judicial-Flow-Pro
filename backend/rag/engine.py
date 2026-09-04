from pathlib import Path
from typing import Any, Optional
from sqlalchemy.orm import Session

from models.document import Document
from rag.chunker import chunk_text
from rag.extractor import extract_text_from_file
from rag.vector_store import vector_store

BACKEND_DIR = Path(__file__).resolve().parent.parent


def index_single_document(db: Session, doc: Document) -> int:
    """Extract, chunk, and index a single document into the vector store."""
    file_path = BACKEND_DIR / doc.file_path

    # Extract text from physical file
    extracted_text = extract_text_from_file(file_path)

    # Fallback to document metadata if file is empty/unreadable
    if not extracted_text:
        extracted_text = f"Document: {doc.filename}. Type: {doc.document_type}. Description: {doc.description or ''}"

    chunks = chunk_text(extracted_text, chunk_size=500, overlap=80)
    if not chunks:
        chunks = [f"Document {doc.filename} of type {doc.document_type}"]

    for idx, chunk in enumerate(chunks):
        chunk_id = f"doc_{doc.id}_chunk_{idx}"
        vector_store.add_chunk(
            chunk_id=chunk_id,
            document_id=doc.id,
            case_id=doc.case_id,
            filename=doc.filename,
            document_type=doc.document_type or "Document",
            chunk_index=idx,
            text=chunk,
        )

    return len(chunks)


def index_all_documents(db: Session) -> dict[str, Any]:
    """Ingest and index all stored documents from PostgreSQL."""
    docs = db.query(Document).all()
    vector_store.clear()

    total_chunks = 0
    indexed_docs = 0

    for doc in docs:
        chunks_count = index_single_document(db, doc)
        total_chunks += chunks_count
        indexed_docs += 1

    vector_store.save_to_disk()
    return {
        "indexed_documents": indexed_docs,
        "total_chunks": total_chunks,
        "status": "success",
    }


def retrieve_context(
    db: Session,
    query: str,
    case_id: Optional[int] = None,
    top_k: int = 4,
) -> list[dict[str, Any]]:
    """Retrieve the most relevant document chunks for a query with case scoping."""
    # If vector store is empty, auto-index existing documents
    if not vector_store.chunks:
        index_all_documents(db)

    return vector_store.search(query=query, case_id=case_id, top_k=top_k)
