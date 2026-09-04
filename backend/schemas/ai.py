from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field

AIMode = Literal["general", "case_analysis", "statute_search", "drafting", "summarization"]
RulingType = Literal[
    "summary_judgment",
    "injunction_order",
    "scheduling_order",
    "evidentiary_ruling",
    "final_judgment",
]


class AICitation(BaseModel):
    source_type: Literal["case", "document", "statute", "precedent"] = Field(
        ..., description="Type of legal or record source"
    )
    title: str = Field(..., description="Document, Case, or Statute Title")
    snippet: str = Field(..., description="Excerpt or supporting evidence")
    case_id: Optional[int] = None
    document_id: Optional[int] = None
    page_number: Optional[int] = None
    relevance_score: Optional[float] = None


class AIQueryRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=5000, description="Judicial question or prompt")
    case_id: Optional[int] = Field(None, description="Optional case ID to scope analysis")
    document_ids: Optional[list[int]] = Field(None, description="Optional document IDs to scope analysis")
    mode: AIMode = Field(default="general", description="AI reasoning mode")
    temperature: float = Field(default=0.3, ge=0.0, le=1.0, description="Model temperature")


class AIQueryResponse(BaseModel):
    query: str
    response: str
    mode: str
    case_id: Optional[int] = None
    citations: list[AICitation] = Field(default_factory=list)
    tokens_used: Optional[int] = None
    model_used: str
    created_at: datetime


class CaseSummaryRequest(BaseModel):
    case_id: int = Field(..., description="Case ID to summarize")
    focus_areas: Optional[list[str]] = Field(
        default=["procedural_history", "claims", "evidence", "legal_issues"],
        description="Aspects to prioritize in summary",
    )


class DraftRulingRequest(BaseModel):
    case_id: int = Field(..., description="Target case ID")
    ruling_type: RulingType = Field(default="summary_judgment", description="Type of court order or ruling")
    judicial_notes: Optional[str] = Field(None, description="Optional specific judge instructions or findings")
    findings: Optional[list[str]] = Field(None, description="Specific factual findings to incorporate")


class AIStatusResponse(BaseModel):
    status: str
    engine: str
    supported_modes: list[str]
    rag_indexing_ready: bool
    total_indexed_chunks: Optional[int] = 0
    total_indexed_documents: Optional[int] = 0


# RAG Retrieval Schemas
class RetrievedChunk(BaseModel):
    chunk_id: str
    document_id: int
    case_id: int
    filename: str
    document_type: str
    chunk_index: int
    text: str
    relevance_score: float


class RetrievalRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Query string to retrieve relevant context for")
    case_id: Optional[int] = Field(None, description="Optional case ID filter to restrict retrieval to a specific case")
    top_k: int = Field(default=4, ge=1, le=20, description="Number of relevant chunks to return")


class RetrievalResponse(BaseModel):
    query: str
    case_id: Optional[int] = None
    chunks: list[RetrievedChunk] = Field(default_factory=list)
    total_retrieved: int


class IndexDocumentsResponse(BaseModel):
    indexed_documents: int
    total_chunks: int
    status: str
