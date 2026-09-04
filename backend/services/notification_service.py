from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session

from models.case import Case
from models.document import Document
from models.hearing import Hearing
from models.notification import Notification
from models.task import Task
from models.user import User


def create_system_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    type: str = "SYSTEM",
    priority: str = "INFO",
    link: Optional[str] = None,
    related_case_id: Optional[int] = None,
    related_hearing_id: Optional[int] = None,
    reminder_at: Optional[datetime] = None,
) -> Optional[Notification]:
    """Create a notification with duplicate prevention."""
    # Check recipient existence
    recipient = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not recipient:
        return None

    # Duplicate check: prevent duplicate unread notification with identical title, type, and user
    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.title == title,
            Notification.type == type,
            Notification.is_read == False,
        )
        .first()
    )
    if existing:
        return existing

    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        priority=priority,
        link=link,
        related_case_id=related_case_id,
        related_hearing_id=related_hearing_id,
        reminder_at=reminder_at,
        is_read=False,
    )
    db.add(notif)
    try:
        db.commit()
        db.refresh(notif)
        return notif
    except Exception as e:
        db.rollback()
        print(f"Error creating notification: {e}")
        return None


def check_and_generate_hearing_notifications(
    db: Session, target_user_id: Optional[int] = None
) -> list[Notification]:
    """
    Idempotent automatic notification generator for today's and upcoming hearings.
    Guarantees:
    - Exactly one 'Today's Hearing' notification per (hearing_id, recipient_user_id).
    - Exactly one 'Upcoming Hearing' notification per (hearing_id, recipient_user_id).
    - Safe to call repeatedly without generating duplicates.
    """
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)
    today_end = datetime(now.year, now.month, now.day, 23, 59, 59, 999999, tzinfo=timezone.utc)
    upcoming_end = today_end + timedelta(days=2)

    created_notifs: list[Notification] = []

    # Recipients to notify
    if target_user_id:
        recipient_ids = [target_user_id]
    else:
        recipient_ids = _get_active_staff_user_ids(db)

    if not recipient_ids:
        return created_notifs

    # 1. Today's Hearings
    hearings_today = (
        db.query(Hearing)
        .filter(Hearing.scheduled_at >= today_start, Hearing.scheduled_at <= today_end)
        .all()
    )

    for h in hearings_today:
        case_num = h.case.case_number if h.case else f"Case #{h.case_id}"
        time_str = h.scheduled_at.strftime("%I:%M %p")
        loc_str = f" in {h.location}" if h.location else ""
        title = f"Today's Hearing: {case_num}"
        message = f"Case {case_num} has a hearing today at {time_str}{loc_str}."

        for uid in recipient_ids:
            # Strict Idempotency check: has this specific hearing already produced today's notification for this user?
            already_exists = (
                db.query(Notification)
                .filter(
                    Notification.user_id == uid,
                    Notification.related_hearing_id == h.id,
                    Notification.title.ilike("Today's Hearing%"),
                )
                .first()
            )
            if already_exists:
                continue

            notif = Notification(
                user_id=uid,
                title=title,
                message=message,
                type="HEARING_SCHEDULED",
                priority="URGENT",
                link="/hearings",
                related_case_id=h.case_id,
                related_hearing_id=h.id,
                is_read=False,
            )
            db.add(notif)
            try:
                db.commit()
                db.refresh(notif)
                created_notifs.append(notif)
            except Exception as err:
                db.rollback()
                print(f"Error creating today's hearing notification: {err}")

    # 2. Upcoming Hearings (Tomorrow / next 48h)
    hearings_upcoming = (
        db.query(Hearing)
        .filter(Hearing.scheduled_at > today_end, Hearing.scheduled_at <= upcoming_end)
        .all()
    )

    for h in hearings_upcoming:
        case_num = h.case.case_number if h.case else f"Case #{h.case_id}"
        date_str = h.scheduled_at.strftime("%b %d at %I:%M %p")
        loc_str = f" in {h.location}" if h.location else ""
        title = f"Upcoming Hearing: {case_num}"
        message = f"Case {case_num} has a {h.hearing_type or 'Hearing'} scheduled for {date_str}{loc_str}."

        for uid in recipient_ids:
            already_exists = (
                db.query(Notification)
                .filter(
                    Notification.user_id == uid,
                    Notification.related_hearing_id == h.id,
                    Notification.title.ilike("Upcoming Hearing%"),
                )
                .first()
            )
            if already_exists:
                continue

            notif = Notification(
                user_id=uid,
                title=title,
                message=message,
                type="HEARING_SCHEDULED",
                priority="INFO",
                link="/hearings",
                related_case_id=h.case_id,
                related_hearing_id=h.id,
                is_read=False,
            )
            db.add(notif)
            try:
                db.commit()
                db.refresh(notif)
                created_notifs.append(notif)
            except Exception as err:
                db.rollback()
                print(f"Error creating upcoming hearing notification: {err}")

    return created_notifs


def _get_active_staff_user_ids(db: Session) -> list[int]:
    """Return all active users to receive court-wide operational alerts."""
    return [u.id for u in db.query(User.id).filter(User.is_active == True).all()]


def notify_task_assigned(db: Session, task: Task, assigner: Optional[User] = None):
    """Triggered when a task is assigned to a user."""
    if not task.assigned_to:
        return

    priority = (task.priority or "MEDIUM").upper()
    notif_priority = "URGENT" if priority == "URGENT" else ("WARNING" if priority == "HIGH" else "INFO")
    notif_type = "DEADLINE_URGENT" if priority == "URGENT" else "TASK_ASSIGNED"

    case_info = f" on Case {task.case.case_number}" if task.case else ""
    title = f"Task Assigned: {task.title[:50]}"
    message = f"You were assigned to task '{task.title}'{case_info} with {priority} priority."

    create_system_notification(
        db=db,
        user_id=task.assigned_to,
        title=title,
        message=message,
        type=notif_type,
        priority=notif_priority,
        link="/tasks",
        related_case_id=task.case_id,
    )


def notify_hearing_scheduled(db: Session, hearing: Hearing, scheduled_by: Optional[User] = None):
    """Triggered when a court hearing is scheduled."""
    case_num = hearing.case.case_number if hearing.case else f"Case #{hearing.case_id}"
    date_str = (
        hearing.scheduled_at.strftime("%b %d, %Y at %I:%M %p")
        if hearing.scheduled_at
        else "Upcoming Date"
    )
    loc_str = f" at {hearing.location}" if hearing.location else ""

    title = f"Hearing Scheduled: {case_num}"
    message = f"{hearing.hearing_type or 'Hearing'} docketed for {date_str}{loc_str}."

    user_ids = _get_active_staff_user_ids(db)
    for uid in user_ids:
        create_system_notification(
            db=db,
            user_id=uid,
            title=title,
            message=message,
            type="HEARING_SCHEDULED",
            priority="INFO",
            link="/hearings",
            related_case_id=hearing.case_id,
            related_hearing_id=hearing.id,
        )


def notify_hearing_updated(db: Session, hearing: Hearing, updated_by: Optional[User] = None):
    """Triggered when a court hearing date, location, or status is rescheduled."""
    case_num = hearing.case.case_number if hearing.case else f"Case #{hearing.case_id}"
    date_str = (
        hearing.scheduled_at.strftime("%b %d, %Y at %I:%M %p")
        if hearing.scheduled_at
        else "Updated Date"
    )
    loc_str = f" at {hearing.location}" if hearing.location else ""

    title = f"Hearing Rescheduled: {case_num}"
    message = f"Hearing #{hearing.id} ({hearing.hearing_type or 'Hearing'}) updated. New docket: {date_str}{loc_str} (Status: {hearing.status})."

    user_ids = _get_active_staff_user_ids(db)
    for uid in user_ids:
        create_system_notification(
            db=db,
            user_id=uid,
            title=title,
            message=message,
            type="HEARING_SCHEDULED",
            priority="WARNING",
            link="/hearings",
            related_case_id=hearing.case_id,
            related_hearing_id=hearing.id,
        )


def notify_case_status_changed(
    db: Session,
    case: Case,
    old_status: str,
    new_status: str,
    updated_by: Optional[User] = None,
):
    """Triggered when a case status changes significantly."""
    if (old_status or "").upper() == (new_status or "").upper():
        return

    title = f"Case Status Updated: {case.case_number}"
    message = f"Case '{case.title}' status transitioned from {old_status} to {new_status}."

    user_ids = _get_active_staff_user_ids(db)
    for uid in user_ids:
        create_system_notification(
            db=db,
            user_id=uid,
            title=title,
            message=message,
            type="CASE_ALERT",
            priority="INFO",
            link="/cases",
            related_case_id=case.id,
        )


def notify_document_uploaded(db: Session, document: Document, uploaded_by: Optional[User] = None):
    """Triggered when a document is uploaded to a case."""
    case_num = document.case.case_number if document.case else f"Case #{document.case_id}"
    title = f"Document Uploaded: {case_num}"
    message = f"New filing '{document.filename}' ({document.document_type or 'Document'}) was submitted."

    user_ids = _get_active_staff_user_ids(db)
    for uid in user_ids:
        create_system_notification(
            db=db,
            user_id=uid,
            title=title,
            message=message,
            type="DOCUMENT_UPLOADED",
            priority="INFO",
            link="/documents",
            related_case_id=document.case_id,
        )
