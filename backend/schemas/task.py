from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

TaskPriority = Literal["LOW", "MEDIUM", "HIGH", "URGENT"]
TaskStatus = Literal["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Brief task description or title")
    description: Optional[str] = Field(None, description="Detailed task context or notes")
    case_id: Optional[int] = Field(None, description="Optional associated case ID")
    assigned_to: Optional[int] = Field(None, description="Optional assigned user ID")
    priority: TaskPriority = Field(default="MEDIUM", description="Task urgency level")
    status: TaskStatus = Field(default="PENDING", description="Task workflow status")
    due_date: Optional[datetime] = Field(None, description="Deadline for task completion")

    @field_validator("priority", mode="before")
    @classmethod
    def normalize_priority(cls, v: Optional[str]) -> str:
        if v is None:
            return "MEDIUM"
        norm = str(v).strip().upper()
        if norm not in ("LOW", "MEDIUM", "HIGH", "URGENT"):
            raise ValueError("Priority must be one of: LOW, MEDIUM, HIGH, URGENT")
        return norm

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v: Optional[str]) -> str:
        if v is None:
            return "PENDING"
        norm = str(v).strip().upper()
        if norm not in ("PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"):
            raise ValueError("Status must be one of: PENDING, IN_PROGRESS, COMPLETED, CANCELLED")
        return norm


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    case_id: Optional[int] = None
    assigned_to: Optional[int] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None

    @field_validator("priority", mode="before")
    @classmethod
    def normalize_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        norm = str(v).strip().upper()
        if norm not in ("LOW", "MEDIUM", "HIGH", "URGENT"):
            raise ValueError("Priority must be one of: LOW, MEDIUM, HIGH, URGENT")
        return norm

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        norm = str(v).strip().upper()
        if norm not in ("PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"):
            raise ValueError("Status must be one of: PENDING, IN_PROGRESS, COMPLETED, CANCELLED")
        return norm


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    case_id: Optional[int] = None
    assigned_to: Optional[int] = None
    priority: str
    status: str
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Joined / related metadata for easy frontend consumption
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    assignee_name: Optional[str] = None
    assignee_role: Optional[str] = None

    model_config = {"from_attributes": True}
