from sqlalchemy import Column, Integer, String, Text, DateTime, Date, func
from sqlalchemy.orm import relationship
from database import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    case_type = Column(String, nullable=False)
    # Allowed: FILED, UNDER_REVIEW, ASSIGNED, HEARING, DECISION, CLOSED
    status = Column(String, nullable=False, default="FILED")
    # Allowed: LOW, MEDIUM, HIGH, URGENT
    priority = Column(String, nullable=False, default="MEDIUM")
    filing_date = Column(Date, nullable=False)
    next_hearing_date = Column(DateTime(timezone=True), nullable=True)
    courtroom = Column(String, nullable=True)
    assigned_judge = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    hearings = relationship("Hearing", back_populates="case", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="case", cascade="all, delete-orphan")
