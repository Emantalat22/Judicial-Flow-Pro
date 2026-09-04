import os
import sys
from datetime import datetime, timezone, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath("."))

from database import SessionLocal
from models.user import User
from models.case import Case
from models.hearing import Hearing
from models.notification import Notification
from services.notification_service import check_and_generate_hearing_notifications

def run_tests():
    db = SessionLocal()
    try:
        print("=== Test 1: Verify Database Schema ===")
        sample = db.query(Notification).first()
        print(f"Sample notification id: {sample.id if sample else 'None'}")
        has_case_id = hasattr(Notification, "related_case_id")
        has_hearing_id = hasattr(Notification, "related_hearing_id")
        has_reminder_at = hasattr(Notification, "reminder_at")
        assert has_case_id, "related_case_id column missing"
        assert has_hearing_id, "related_hearing_id column missing"
        assert has_reminder_at, "reminder_at column missing"
        print("Schema columns verified successfully!")

        print("\n=== Test 2: Verify User & Case for testing ===")
        user = db.query(User).filter(User.email == "demo@judicialflow.gov").first()
        if not user:
            user = db.query(User).first()
        print(f"Testing with user: {user.email} (ID: {user.id})")

        case = db.query(Case).first()
        print(f"Testing with case: {case.case_number} (ID: {case.id})")

        print("\n=== Test 3: Manual Notification Creation ===")
        reminder_time = datetime.now(timezone.utc) + timedelta(days=3)
        manual_notif = Notification(
            user_id=user.id,
            title="Study Case CF-2026-015",
            message="Review the case documents and previous judgments before the upcoming hearing.",
            type="CASE_ALERT",
            priority="WARNING",
            related_case_id=case.id,
            reminder_at=reminder_time,
            link="/cases",
            is_read=False,
        )
        db.add(manual_notif)
        db.commit()
        db.refresh(manual_notif)

        assert manual_notif.id is not None
        assert manual_notif.case_number == case.case_number
        assert manual_notif.reminder_at == reminder_time
        print(f"Created manual notification ID: {manual_notif.id} for case {manual_notif.case_number} with reminder: {manual_notif.reminder_at}")

        print("\n=== Test 4: Automatic Notification for Today's Hearing ===")
        now_utc = datetime.now(timezone.utc)
        # Check if there is a hearing today, or create one for testing
        today_start = datetime(now_utc.year, now_utc.month, now_utc.day, 0, 0, 0, tzinfo=timezone.utc)
        today_end = datetime(now_utc.year, now_utc.month, now_utc.day, 23, 59, 59, 999999, tzinfo=timezone.utc)
        today_hearing = db.query(Hearing).filter(Hearing.scheduled_at >= today_start, Hearing.scheduled_at <= today_end).first()

        if not today_hearing:
            today_hearing = Hearing(
                case_id=case.id,
                hearing_type="Bail Review",
                scheduled_at=now_utc.replace(hour=10, minute=0, second=0),
                location="Courtroom 4B",
                judge=user.full_name,
                status="SCHEDULED",
            )
            db.add(today_hearing)
            db.commit()
            db.refresh(today_hearing)
            print(f"Created test hearing scheduled for today at {today_hearing.scheduled_at}")
        else:
            print(f"Found existing hearing scheduled for today: ID {today_hearing.id}")

        # Run automatic generator
        gen1 = check_and_generate_hearing_notifications(db, target_user_id=user.id)
        print(f"Run 1 generated: {len(gen1)} notifications")

        # Verify today's notification exists
        today_notif = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.related_hearing_id == today_hearing.id,
            Notification.title.ilike("Today's Hearing%"),
        ).first()

        assert today_notif is not None, "Today's hearing notification was not generated!"
        print(f"Verified Today's Hearing Notification: '{today_notif.title}' - '{today_notif.message}'")

        print("\n=== Test 5: Strict Idempotency / Duplicate Prevention ===")
        # Run 5 more times in rapid succession
        for i in range(5):
            gen_again = check_and_generate_hearing_notifications(db, target_user_id=user.id)
            assert len(gen_again) == 0, f"Duplicate generated on run {i+2}!"

        # Count notifications for this hearing
        count = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.related_hearing_id == today_hearing.id,
            Notification.title.ilike("Today's Hearing%"),
        ).count()
        assert count == 1, f"Expected exactly 1 notification, found {count}!"
        print(f"Duplicate prevention verified: exactly {count} notification exists after multiple triggers!")

        print("\n=== Test 6: Read / Unread Functionality ===")
        assert today_notif.is_read == False
        today_notif.is_read = True
        db.commit()
        db.refresh(today_notif)
        assert today_notif.is_read == True

        # Even when marked as read, generator must NOT regenerate it!
        gen_after_read = check_and_generate_hearing_notifications(db, target_user_id=user.id)
        assert len(gen_after_read) == 0, "Generator created duplicate after notification was marked as read!"
        print("Read state and idempotency after read verified successfully!")

        print("\n=== ALL TESTS PASSED SUCCESSFULLY! ===")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
