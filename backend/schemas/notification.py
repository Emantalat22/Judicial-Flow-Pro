from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

NotificationPriority = Literal["INFO", "WARNING", "URGENT", "SUCCESS"]
NotificationType = Literal[
    "CASE_ALERT",
    "HEARING_SCHEDULED",
    "TASK_ASSIGNED",
    "DOCUMENT_UPLOADED",
    "DEADLINE_URGENT",
    "SYSTEM",
]


class NotificationBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Brief notification title")
    message: str = Field(..., min_length=1, description="Notification message content")
    type: str = Field(default="SYSTEM", description="Category of notification")
    priority: str = Field(default="INFO", description="Urgency level")
    link: Optional[str] = Field(None, max_length=500, description="Optional navigation link")
    related_case_id: Optional[int] = Field(None, description="Optional related case ID")
    related_hearing_id: Optional[int] = Field(None, description="Optional related hearing ID")
    reminder_at: Optional[datetime] = Field(None, description="Optional reminder date/time")

    @field_validator("priority", mode="before")
    @classmethod
    def normalize_priority(cls, v: Optional[str]) -> str:
        if v is None:
            return "INFO"
        norm = str(v).strip().upper()
        if norm in ("NORMAL", "INFO"):
            return "INFO"
        if norm in ("IMPORTANT", "WARNING"):
            return "WARNING"
        if norm in ("URGENT", "CRITICAL"):
            return "URGENT"
        if norm in ("SUCCESS", "LOW"):
            return "SUCCESS"
        return "INFO"

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, v: Optional[str]) -> str:
        if v is None:
            return "SYSTEM"
        norm = str(v).strip().upper()
        if norm in ("GENERAL", "SYSTEM"):
            return "SYSTEM"
        if norm in ("CASE", "CASE_ALERT"):
            return "CASE_ALERT"
        if norm in ("HEARING", "HEARING_SCHEDULED"):
            return "HEARING_SCHEDULED"
        if norm in ("TASK", "TASK_ASSIGNED"):
            return "TASK_ASSIGNED"
        return norm


class NotificationCreate(NotificationBase):
    user_id: Optional[int] = Field(None, description="Target user ID (defaults to current user if omitted)")


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    priority: str
    link: Optional[str] = None
    related_case_id: Optional[int] = None
    related_hearing_id: Optional[int] = None
    reminder_at: Optional[datetime] = None
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationRead(NotificationResponse):
    """Alias for backwards compatibility."""
    pass


class UnreadCountResponse(BaseModel):
    unread_count: int
