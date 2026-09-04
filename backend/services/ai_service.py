from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session, joinedload

from config import settings
from models.case import Case
from models.document import Document
from models.hearing import Hearing
from models.task import Task
from models.user import User
from rag.engine import retrieve_context
from rag.vector_store import vector_store
from schemas.ai import (
    AICitation,
    AIQueryRequest,
    AIQueryResponse,
    AIStatusResponse,
    CaseSummaryRequest,
    DraftRulingRequest,
    RetrievalRequest,
    RetrievalResponse,
    RetrievedChunk,
)
from services.llm_client import call_groq_llm

SYSTEM_PROMPT = """You are the Judicial Flow Pro AI Assistant, an advanced legal and judicial information assistant designed to assist court staff, clerks, and presiding judges.

CRITICAL RULES & CONSTRAINTS:
1. ROLE & IDENTITY: You are a judicial information and research assistant. You are NOT the final decision-maker or judge.
2. STRICT GROUNDING: Ground all factual statements and analysis strictly in the provided Case Docket and Retrieved Document Filings.
3. NO INVENTED FACTS: Never hallucinate or invent case facts, filings, dates, evidence, or nonexistent precedents.
4. INSUFFICIENT DATA: If the provided case records and retrieved documents do not contain enough information to answer a query, you MUST explicitly state that the available case records and documents do not provide sufficient information.
5. CITATIONS: Attribute facts directly to the specific case docket or filing document.
6. FORMATTING: Structure your response with clean Markdown, clear sections, bullet points, and professional judicial demeanor.
"""


def get_ai_system_status() -> AIStatusResponse:
    """Return status and configuration of the Judicial AI engine."""
    stats = vector_store.get_stats()
    return AIStatusResponse(
        status="ready",
        engine=f"Groq ({settings.groq_model_name})",
        supported_modes=["general", "case_analysis", "statute_search", "drafting", "summarization"],
        rag_indexing_ready=True,
        total_indexed_chunks=stats.get("total_chunks", 0),
        total_indexed_documents=stats.get("indexed_documents", 0),
    )


def execute_judicial_query(
    db: Session,
    request: AIQueryRequest,
    current_user: User,
) -> AIQueryResponse:
    """Execute query through Groq Llama 3.3 70B with RAG context and structured citations."""
    citations: list[AICitation] = []
    case: Optional[Case] = None
    case_context_str = "No specific case selected (court-wide query)."

    if request.case_id:
        case = (
            db.query(Case)
            .options(
                joinedload(Case.hearings),
                joinedload(Case.documents),
                joinedload(Case.tasks),
            )
            .filter(Case.id == request.case_id)
            .first()
        )
        if case:
            judge_name = case.assigned_judge or "Unassigned"
            case_context_str = (
                f"CASE DOCKET RECORD:\n"
                f"- Docket Number: {case.case_number}\n"
                f"- Case Title: {case.title}\n"
                f"- Classification: {case.case_type}\n"
                f"- Status: {case.status} (Priority: {case.priority})\n"
                f"- Assigned Judge: {judge_name}\n"
                f"- Filing Date: {case.filing_date}\n"
                f"- Description/Summary: {case.description or 'None provided.'}\n"
                f"- Docketed Hearings: {len(case.hearings)}\n"
                f"- Submitted Filings: {len(case.documents)}\n"
            )
            citations.append(
                AICitation(
                    source_type="case",
                    title=f"Case Record: {case.case_number}",
                    snippet=f"Title: {case.title}. Status: {case.status}.",
                    case_id=case.id,
                    relevance_score=1.0,
                )
            )

    # Retrieve RAG chunks from indexed documents
    retrieved_chunks = retrieve_context(
        db=db,
        query=request.prompt,
        case_id=request.case_id,
        top_k=4,
    )

    rag_context_str = "No specific document filings matched the query terms."
    if retrieved_chunks:
        rag_context_str = "RETRIEVED DOCUMENT FILINGS (EVIDENCE & PLEADINGS):\n"
        for r in retrieved_chunks:
            citations.append(
                AICitation(
                    source_type="document",
                    title=f"Filing: {r['filename']} ({r['document_type']})",
                    snippet=r["text"][:200] + ("..." if len(r["text"]) > 200 else ""),
                    case_id=r["case_id"],
                    document_id=r["document_id"],
                    relevance_score=r["relevance_score"],
                )
            )
            rag_context_str += (
                f"\n[Source: {r['filename']} (Type: {r['document_type']}, Case ID: {r['case_id']})]\n"
                f"{r['text']}\n"
            )

    # Build prompt for LLM
    mode_instructions = {
        "case_analysis": "Analyze the legal issues, claims, and evidence in the case based on the provided record.",
        "statute_search": "Identify and explain applicable statutory provisions and procedural standards related to the query.",
        "drafting": "Draft formal court order or bench memo language for review by the presiding judge.",
        "summarization": "Provide a concise executive summary of the case facts, filings, and pending proceedings.",
        "general": "Provide balanced, accurate judicial information grounded in the provided facts."
    }.get(request.mode, "Provide a grounded judicial response.")

    user_prompt = (
        f"OPERATIONAL MODE: {request.mode.upper()}\n"
        f"MODE DIRECTIVE: {mode_instructions}\n\n"
        f"=== CONTEXT ===\n"
        f"{case_context_str}\n\n"
        f"{rag_context_str}\n"
        f"===============\n\n"
        f"JUDICIAL USER INQUIRY:\n{request.prompt}\n\n"
        f"Respond according to the system instructions, grounding all statements in the context provided."
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    llm_response, tokens_used, model_name = call_groq_llm(
        messages=messages,
        temperature=request.temperature,
    )

    return AIQueryResponse(
        query=request.prompt,
        response=llm_response,
        mode=request.mode,
        case_id=request.case_id,
        citations=citations,
        tokens_used=tokens_used,
        model_used=model_name,
        created_at=datetime.now(timezone.utc),
    )


def generate_case_summary(
    db: Session,
    case_id: int,
    current_user: User,
) -> AIQueryResponse:
    """Generate comprehensive case summary using Groq LLM and case records."""
    case = (
        db.query(Case)
        .options(
            joinedload(Case.hearings),
            joinedload(Case.documents),
            joinedload(Case.tasks),
        )
        .filter(Case.id == case_id)
        .first()
    )
    if not case:
        raise ValueError(f"Case with ID {case_id} not found")

    # Retrieve relevant document context
    retrieved_chunks = retrieve_context(db=db, query="pleadings claims evidence summary", case_id=case_id, top_k=4)

    req = AIQueryRequest(
        prompt=f"Generate an executive judicial summary of Case {case.case_number} ({case.title}), including procedural posture, claims, hearings, and documentary evidence.",
        case_id=case_id,
        mode="summarization",
        temperature=0.2,
    )
    return execute_judicial_query(db, req, current_user)


def draft_court_ruling(
    db: Session,
    request: DraftRulingRequest,
    current_user: User,
) -> AIQueryResponse:
    """Draft formal court order or bench ruling using Groq LLM."""
    case = db.query(Case).filter(Case.id == request.case_id).first()
    if not case:
        raise ValueError(f"Case with ID {request.case_id} not found")

    findings_str = "\n".join([f"- {f}" for f in request.findings]) if request.findings else "Standard preliminary findings of jurisdiction and good cause."
    notes_str = f"Specific Judge's Notes:\n{request.judicial_notes}" if request.judicial_notes else "Standard order provisions."

    prompt_text = (
        f"Draft a formal {request.ruling_type.replace('_', ' ').title()} in Case No. {case.case_number} ({case.title}).\n"
        f"Incorporate the following judicial findings of fact:\n{findings_str}\n\n"
        f"{notes_str}\n\n"
        f"Include caption, recitals, findings of fact, conclusions of law, and formal decretal paragraphs."
    )

    req = AIQueryRequest(
        prompt=prompt_text,
        case_id=request.case_id,
        mode="drafting",
        temperature=0.2,
    )
    return execute_judicial_query(db, req, current_user)
