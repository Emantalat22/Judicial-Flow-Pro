from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base


class Hearing(Base):
    __tablename__ = "hearings"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    hearing_type = Column(String, nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    location = Column(String, nullable=True)
    judge = Column(String, nullable=True)
    status = Column(String, nullable=False, default="SCHEDULED")
    outcome = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    case = relationship("Case", back_populates="hearings")

    @property
    def case_number(self) -> str | None:
        return self.case.case_number if self.case else None

    @property
    def case_title(self) -> str | None:
        return self.case.title if self.case else None
