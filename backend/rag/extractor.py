import os
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Optional

try:
    import pypdf
    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False


def extract_text_from_file(file_path: Path) -> str:
    """Extract clean text content from a file based on its extension."""
    if not file_path.exists():
        return ""

    ext = file_path.suffix.lower()

    if ext in [".txt", ".md", ".csv", ".json", ".log", ".rtf"]:
        return _extract_plain_text(file_path)
    elif ext == ".pdf":
        return _extract_pdf_text(file_path)
    elif ext in [".docx", ".doc"]:
        return _extract_docx_text(file_path)
    else:
        return _extract_plain_text(file_path)


def _extract_plain_text(file_path: Path) -> str:
    for enc in ["utf-8", "latin-1", "cp1252"]:
        try:
            with open(file_path, "r", encoding=enc, errors="ignore") as f:
                return f.read().strip()
        except Exception:
            continue
    return ""


def _extract_pdf_text(file_path: Path) -> str:
    text_content = []
    if PYPDF_AVAILABLE:
        try:
            reader = pypdf.PdfReader(str(file_path))
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content.append(page_text.strip())
            if text_content:
                return "\n\n".join(text_content)
        except Exception as e:
            print(f"Warning: pypdf failed for {file_path}: {e}")

    # Fallback to binary string extraction
    try:
        with open(file_path, "rb") as f:
            raw = f.read()
            # Extract plain text stream fragments
            matches = re.findall(rb"\(([\w\s\.,;:!?'\"/\-\(\)]{3,})\)", raw)
            if matches:
                return " ".join([m.decode("latin-1", errors="ignore") for m in matches])
    except Exception:
        pass

    return ""


def _extract_docx_text(file_path: Path) -> str:
    try:
        with zipfile.ZipFile(str(file_path)) as docx:
            xml_content = docx.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            # Find all text elements
            paragraphs = []
            for p in tree.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
                texts = [
                    t.text
                    for t in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t")
                    if t.text
                ]
                if texts:
                    paragraphs.append("".join(texts))
            return "\n\n".join(paragraphs)
    except Exception as e:
        # Fallback to plain text search
        return _extract_plain_text(file_path)
