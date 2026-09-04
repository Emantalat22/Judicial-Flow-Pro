import json
import math
import os
import re
from collections import Counter
from pathlib import Path
from typing import Any, Optional

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
INDEX_FILE = DATA_DIR / "rag_vector_index.json"

STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as",
    "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "could",
    "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had",
    "has", "have", "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how",
    "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more", "most", "my", "myself",
    "no", "nor", "not", "now", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours",
    "ourselves", "out", "over", "own", "same", "she", "should", "so", "some", "such", "than", "that",
    "the", "their", "theirs", "them", "themselves", "then", "there", "these", "they", "this", "those",
    "through", "to", "too", "under", "until", "up", "very", "was", "we", "were", "what", "when", "where",
    "which", "while", "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"
}


def _tokenize(text: str) -> list[str]:
    """Tokenize text into lowercased alpha-numeric words, excluding standard stopwords."""
    words = re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", text.lower())
    return [w for w in words if w not in STOP_WORDS]


def _compute_vector(tokens: list[str]) -> dict[str, float]:
    """Compute normalized Term Frequency vector."""
    if not tokens:
        return {}
    counts = Counter(tokens)
    total = sum(counts.values())
    raw_vec = {word: (count / total) * (1.0 + math.log(1.0 + count)) for word, count in counts.items()}
    # Normalize to unit length
    magnitude = math.sqrt(sum(v * v for v in raw_vec.values())) or 1.0
    return {word: val / magnitude for word, val in raw_vec.items()}


def _cosine_similarity(vec_a: dict[str, float], vec_b: dict[str, float]) -> float:
    """Compute cosine similarity between two normalized sparse vectors."""
    if not vec_a or not vec_b:
        return 0.0
    # Iterate over the smaller vector
    small_vec, large_vec = (vec_a, vec_b) if len(vec_a) < len(vec_b) else (vec_b, vec_a)
    dot_product = sum(weight * large_vec.get(word, 0.0) for word, weight in small_vec.items())
    return float(dot_product)


class LocalVectorStore:
    """Lightweight, disk-persisted vector store tailored for Judicial Flow Pro RAG."""

    def __init__(self, storage_path: Path = INDEX_FILE):
        self.storage_path = storage_path
        self.chunks: list[dict[str, Any]] = []
        self.load_from_disk()

    def clear(self):
        """Clear all stored vectors."""
        self.chunks = []
        self.save_to_disk()

    def add_chunk(
        self,
        chunk_id: str,
        document_id: int,
        case_id: int,
        filename: str,
        document_type: str,
        chunk_index: int,
        text: str,
    ):
        """Add or update an indexed chunk in the vector store."""
        tokens = _tokenize(f"{filename} {document_type} {text}")
        vector = _compute_vector(tokens)

        # Remove existing chunk with same id if any
        self.chunks = [c for c in self.chunks if c["id"] != chunk_id]

        self.chunks.append({
            "id": chunk_id,
            "document_id": document_id,
            "case_id": case_id,
            "filename": filename,
            "document_type": document_type,
            "chunk_index": chunk_index,
            "text": text,
            "vector": vector,
        })

    def search(
        self,
        query: str,
        case_id: Optional[int] = None,
        top_k: int = 4,
    ) -> list[dict[str, Any]]:
        """Search the vector store for the most relevant chunks matching the query."""
        query_tokens = _tokenize(query)
        if not query_tokens or not self.chunks:
            return []

        query_vec = _compute_vector(query_tokens)
        results = []

        for chunk in self.chunks:
            # Enforce strict case isolation if case_id is specified
            if case_id is not None and chunk["case_id"] != case_id:
                continue

            similarity = _cosine_similarity(query_vec, chunk["vector"])
            if similarity > 0.0:
                results.append({
                    "chunk_id": chunk["id"],
                    "document_id": chunk["document_id"],
                    "case_id": chunk["case_id"],
                    "filename": chunk["filename"],
                    "document_type": chunk["document_type"],
                    "chunk_index": chunk["chunk_index"],
                    "text": chunk["text"],
                    "relevance_score": round(similarity, 4),
                })

        # Sort by relevance score descending
        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return results[:top_k]

    def save_to_disk(self):
        """Persist index to disk."""
        try:
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump(self.chunks, f, indent=2)
        except Exception as e:
            print(f"Warning: Failed to save vector store to disk: {e}")

    def load_from_disk(self):
        """Load index from disk if present."""
        if self.storage_path.exists():
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    self.chunks = json.load(f)
            except Exception as e:
                print(f"Warning: Failed to load vector store from disk: {e}")
                self.chunks = []

    def get_stats(self) -> dict[str, Any]:
        """Return total chunks and distinct indexed document count."""
        doc_ids = {c["document_id"] for c in self.chunks}
        case_ids = {c["case_id"] for c in self.chunks}
        return {
            "total_chunks": len(self.chunks),
            "indexed_documents": len(doc_ids),
            "indexed_cases": len(case_ids),
        }


# Global singleton instance
vector_store = LocalVectorStore()
