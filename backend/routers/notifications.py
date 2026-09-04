from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.dependencies import get_current_active_user
from database import get_db
from models.case import Case
from models.hearing import Hearing
from models.notification import Notification
from models.user import User
from schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    UnreadCountResponse,
)
from services.notification_service import check_and_generate_hearing_notifications

router = APIRouter()


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    is_read: Optional[bool] = Query(None),
    type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Return notifications belonging ONLY to the current authenticated user."""
    # Run idempotent automatic hearing check for today's and upcoming hearings
    check_and_generate_hearing_notifications(db, target_user_id=current_user.id)

    q = db.query(Notification).filter(Notification.user_id == current_user.id)

    if is_read is not None:
        q = q.filter(Notification.is_read == is_read)

    if type:
        q = q.filter(Notification.type.ilike(type.strip()))

    if priority:
        q = q.filter(Notification.priority.ilike(priority.strip()))

    notifications = q.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Return the current user's unread notification count."""
    # Run idempotent check for today's hearings
    check_and_generate_hearing_notifications(db, target_user_id=current_user.id)

    count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read == False)
        .count()
    )
    return UnreadCountResponse(unread_count=count)


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    payload: NotificationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a manual notification or reminder for the current or specified user."""
    recipient_id = payload.user_id or current_user.id
    recipient = db.query(User).filter(User.id == recipient_id).first()
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipient user with ID {recipient_id} does not exist",
        )

    # Validate related case if provided
    if payload.related_case_id:
        case = db.query(Case).filter(Case.id == payload.related_case_id).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Related case with ID {payload.related_case_id} not found",
            )

    # Validate related hearing if provided
    if payload.related_hearing_id:
        hearing = db.query(Hearing).filter(Hearing.id == payload.related_hearing_id).first()
        if not hearing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Related hearing with ID {payload.related_hearing_id} not found",
            )

    data = payload.model_dump()
    data["user_id"] = recipient_id

    # Auto-generate navigation link if not supplied
    if not data.get("link"):
        if data.get("related_case_id"):
            data["link"] = "/cases"
        elif data.get("related_hearing_id"):
            data["link"] = "/hearings"
        else:
            data["link"] = "/notifications"

    notification = Notification(**data)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


@router.put("/read-all", response_model=UnreadCountResponse)
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Mark all unread notifications belonging to the current user as read."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return UnreadCountResponse(unread_count=0)


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Mark only the current user's notification as read."""
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete only the current user's notification."""
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    db.delete(notification)
    db.commit()
    return None
