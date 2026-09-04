from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


StatusValue = Literal["FILED", "UNDER_REVIEW", "ASSIGNED", "HEARING", "DECISION", "CLOSED"]
PriorityValue = Literal["LOW", "MEDIUM", "HIGH", "URGENT"]


class CaseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    case_type: str = Field(..., min_length=1, max_length=100)
    status: StatusValue = "FILED"
    priority: PriorityValue = "MEDIUM"
    filing_date: date
    next_hearing_date: Optional[datetime] = None
    courtroom: Optional[str] = None
    assigned_judge: Optional[str] = None


class CaseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    case_type: Optional[str] = Field(None, min_length=1, max_length=100)
    status: Optional[StatusValue] = None
    priority: Optional[PriorityValue] = None
    filing_date: Optional[date] = None
    next_hearing_date: Optional[datetime] = None
    courtroom: Optional[str] = None
    assigned_judge: Optional[str] = None


class CaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_number: str
    title: str
    description: Optional[str]
    case_type: str
    status: str
    priority: str
    filing_date: date
    next_hearing_date: Optional[datetime]
    courtroom: Optional[str]
    assigned_judge: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
