from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class DocumentBase(BaseModel):
    case_id: int
    filename: str
    file_path: str
    document_type: Optional[str] = None
    uploaded_by: Optional[int] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    description: Optional[str] = None


class DocumentCreate(BaseModel):
    case_id: int
    filename: str
    file_path: str
    document_type: Optional[str] = None
    uploaded_by: Optional[int] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    description: Optional[str] = None


class DocumentUpdate(BaseModel):
    case_id: Optional[int] = None
    filename: Optional[str] = None
    file_path: Optional[str] = None
    document_type: Optional[str] = None
    uploaded_by: Optional[int] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    description: Optional[str] = None


class DocumentRead(DocumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class DocumentResponse(DocumentRead):
    pass
