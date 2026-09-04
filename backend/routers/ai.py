from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.dependencies import get_current_active_user
from database import get_db
from models.case import Case
from models.user import User
from rag.engine import index_all_documents, retrieve_context
from schemas.ai import (
    AIQueryRequest,
    AIQueryResponse,
    AIStatusResponse,
    CaseSummaryRequest,
    DraftRulingRequest,
    IndexDocumentsResponse,
    RetrievalRequest,
    RetrievalResponse,
    RetrievedChunk,
)
from services.ai_service import (
    draft_court_ruling,
    execute_judicial_query,
    generate_case_summary,
    get_ai_system_status,
)

router = APIRouter()


@router.get("/status", response_model=AIStatusResponse)
def get_status(
    current_user: User = Depends(get_current_active_user),
):
    """Return status and configuration of the Judicial AI Assistant engine."""
    return get_ai_system_status()


@router.post("/query", response_model=AIQueryResponse)
def query_ai(
    payload: AIQueryRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Execute an authenticated judicial query with optional case context and RAG citations."""
    if payload.case_id:
        case = db.query(Case).filter(Case.id == payload.case_id).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Case with ID {payload.case_id} not found",
            )

    return execute_judicial_query(db, payload, current_user)


@router.post("/summarize-case", response_model=AIQueryResponse)
def summarize_case(
    payload: CaseSummaryRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Generate a structured executive summary of a case and its filings."""
    case = db.query(Case).filter(Case.id == payload.case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {payload.case_id} not found",
        )

    try:
        return generate_case_summary(db, payload.case_id, current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/draft-ruling", response_model=AIQueryResponse)
def draft_ruling(
    payload: DraftRulingRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Draft a formal court ruling or order for judicial review."""
    case = db.query(Case).filter(Case.id == payload.case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {payload.case_id} not found",
        )

    try:
        return draft_court_ruling(db, payload, current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/index-documents", response_model=IndexDocumentsResponse)
def index_documents(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Ingest and index all stored court documents for vector retrieval."""
    res = index_all_documents(db)
    return IndexDocumentsResponse(
        indexed_documents=res["indexed_documents"],
        total_chunks=res["total_chunks"],
        status=res["status"],
    )


@router.post("/retrieve", response_model=RetrievalResponse)
def retrieve(
    payload: RetrievalRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve relevant document chunks with strict case-scoping and similarity scores."""
    if payload.case_id:
        case = db.query(Case).filter(Case.id == payload.case_id).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Case with ID {payload.case_id} not found",
            )

    chunks = retrieve_context(
        db=db,
        query=payload.query,
        case_id=payload.case_id,
        top_k=payload.top_k,
    )
    retrieved = [
        RetrievedChunk(
            chunk_id=c["chunk_id"],
            document_id=c["document_id"],
            case_id=c["case_id"],
            filename=c["filename"],
            document_type=c["document_type"],
            chunk_index=c["chunk_index"],
            text=c["text"],
            relevance_score=c["relevance_score"],
        )
        for c in chunks
    ]
    return RetrievalResponse(
        query=payload.query,
        case_id=payload.case_id,
        chunks=retrieved,
        total_retrieved=len(retrieved),
    )
