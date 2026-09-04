from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="Notification")
    message = Column(String, nullable=False)
    type = Column(String(50), nullable=False, default="SYSTEM", index=True)
    priority = Column(String(20), nullable=False, default="INFO", index=True)
    link = Column(String(500), nullable=True)
    related_case_id = Column(Integer, ForeignKey("cases.id", ondelete="SET NULL"), nullable=True, index=True)
    related_hearing_id = Column(Integer, ForeignKey("hearings.id", ondelete="SET NULL"), nullable=True, index=True)
    reminder_at = Column(DateTime(timezone=True), nullable=True, index=True)
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="notifications")
    related_case = relationship("Case")
    related_hearing = relationship("Hearing")

    @property
    def case_number(self) -> str | None:
        return self.related_case.case_number if self.related_case else None

    @property
    def case_title(self) -> str | None:
        return self.related_case.title if self.related_case else None
