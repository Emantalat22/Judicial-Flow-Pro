from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class HearingBase(BaseModel):
    case_id: int
    hearing_type: Optional[str] = None
    scheduled_at: datetime
    location: Optional[str] = None
    judge: Optional[str] = None
    status: str = "SCHEDULED"
    outcome: Optional[str] = None
    notes: Optional[str] = None


class HearingCreate(HearingBase):
    pass


class HearingUpdate(BaseModel):
    case_id: Optional[int] = None
    hearing_type: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    location: Optional[str] = None
    judge: Optional[str] = None
    status: Optional[str] = None
    outcome: Optional[str] = None
    notes: Optional[str] = None


class HearingRead(HearingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class HearingResponse(HearingRead):
    pass
