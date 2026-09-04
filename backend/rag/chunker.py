import re
from typing import List, Optional


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> list[str]:
    """Split text into overlapping semantic chunks."""
    if not text or not text.strip():
        return []

    clean_text = re.sub(r"\s+", " ", text).strip()
    if len(clean_text) <= chunk_size:
        return [clean_text]

    chunks = []
    start = 0
    text_length = len(clean_text)

    while start < text_length:
        end = start + chunk_size
        if end >= text_length:
            chunk = clean_text[start:].strip()
            if chunk:
                chunks.append(chunk)
            break

        # Try to break on a sentence boundary (. ! ? \n)
        boundary = -1
        for punct in [". ", "! ", "? ", "; "]:
            pos = clean_text.rfind(punct, start + int(chunk_size * 0.5), end)
            if pos != -1 and pos > boundary:
                boundary = pos + len(punct)

        # Fallback to word boundary
        if boundary == -1:
            space_pos = clean_text.rfind(" ", start + int(chunk_size * 0.5), end)
            if space_pos != -1:
                boundary = space_pos + 1
            else:
                boundary = end

        chunk = clean_text[start:boundary].strip()
        if chunk:
            chunks.append(chunk)

        start = max(start + 1, boundary - overlap)

    return chunks
