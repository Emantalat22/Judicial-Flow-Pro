import mimetypes
import os
import re
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from core.dependencies import get_current_active_user
from database import get_db
from models.case import Case
from models.document import Document
from models.user import User
from schemas.document import DocumentResponse
from services.notification_service import notify_document_uploaded

router = APIRouter()

# Base uploads directory resolved relative to backend directory
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads" / "documents"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed and forbidden file extensions
ALLOWED_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".rtf",
    ".odt",
    ".jpg",
    ".jpeg",
    ".png",
    ".tif",
    ".tiff",
}

FORBIDDEN_EXTENSIONS = {
    ".exe",
    ".bat",
    ".cmd",
    ".sh",
    ".ps1",
    ".vbs",
    ".js",
    ".msi",
    ".dll",
    ".com",
    ".scr",
    ".pif",
    ".application",
    ".gadget",
    ".jar",
}


def _sanitize_filename(filename: str) -> str:
    clean_name = os.path.basename(filename)
    clean_name = re.sub(r"[^\w\s\.-]", "_", clean_name)
    return clean_name or "document"


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    case_id: Optional[int] = Query(None),
    document_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    q = db.query(Document).options(joinedload(Document.case))

    if case_id is not None:
        q = q.filter(Document.case_id == case_id)
    if document_type:
        q = q.filter(Document.document_type.ilike(document_type))
    if search:
        term = f"%{search}%"
        q = q.join(Document.case).filter(
            or_(
                Document.filename.ilike(term),
                Document.document_type.ilike(term),
                Document.description.ilike(term),
                Case.case_number.ilike(term),
                Case.title.ilike(term),
            )
        )

    return q.order_by(Document.created_at.desc(), Document.id.desc()).offset(skip).limit(limit).all()


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    case_id: int = Form(...),
    document_type: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    # 1. Validate Case Existence
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case with ID {case_id} does not exist")

    # 2. Validate file presence
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # 3. Sanitize filename and validate extension
    original_filename = _sanitize_filename(file.filename)
    file_ext = Path(original_filename).suffix.lower()

    if not file_ext:
        raise HTTPException(status_code=400, detail="File has no extension")

    if file_ext in FORBIDDEN_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Files with extension '{file_ext}' are not permitted")

    if ALLOWED_EXTENSIONS and file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension '{file_ext}' is not supported")

    # 4. Generate unique stored filename
    unique_prefix = uuid.uuid4().hex[:12]
    stored_filename = f"{unique_prefix}_{original_filename}"
    target_path = UPLOAD_DIR / stored_filename

    # Prevent path traversal
    try:
        target_path.resolve().relative_to(UPLOAD_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid file path destination")

    # 5. Save file to disk
    file_size = 0
    try:
        with target_path.open("wb") as buffer:
            while chunk := await file.read(1024 * 64):
                file_size += len(chunk)
                buffer.write(chunk)
    except Exception as e:
        if target_path.exists():
            target_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to write file to disk: {str(e)}")

    # 6. Determine MIME type
    mime_type, _ = mimetypes.guess_type(original_filename)
    if not mime_type:
        mime_type = file.content_type or "application/octet-stream"

    # 7. Create DB record
    relative_file_path = f"uploads/documents/{stored_filename}"
    doc = Document(
        case_id=case_id,
        filename=original_filename,
        file_path=relative_file_path,
        document_type=document_type or "Other",
        file_size=file_size,
        mime_type=mime_type,
        description=description,
        uploaded_by=current_user.id,
    )

    try:
        db.add(doc)
        db.commit()
        db.refresh(doc)
    except Exception as e:
        db.rollback()
        if target_path.exists():
            target_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to record document metadata: {str(e)}")

    doc.case = case

    # Automatic trigger for document upload
    notify_document_uploaded(db, doc, current_user)

    return doc


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(Document)
        .options(joinedload(Document.case))
        .filter(Document.id == document_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    full_path = (BASE_DIR / doc.file_path).resolve()

    # Path traversal check
    try:
        full_path.relative_to(UPLOAD_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document storage path")

    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Document file not found on storage disk")

    media_type = doc.mime_type or "application/octet-stream"
    return FileResponse(
        path=str(full_path),
        filename=doc.filename,
        media_type=media_type,
    )


@router.delete("/{document_id}", status_code=204)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    full_path = (BASE_DIR / doc.file_path).resolve()
    try:
        full_path.relative_to(UPLOAD_DIR.resolve())
        if full_path.exists():
            full_path.unlink()
    except Exception:
        pass

    db.delete(doc)
    db.commit()
    return None
