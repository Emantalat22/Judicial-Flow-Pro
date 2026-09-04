import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from core.security import hash_password
from database import SessionLocal
from models.user import User


def seed_default_admin():
    db = SessionLocal()
    try:
        # Check if an active ADMIN already exists
        existing_admin = (
            db.query(User)
            .filter(User.role == "ADMIN", User.is_active == True)
            .first()
        )
        if existing_admin:
            print(f"Active administrator already exists: {existing_admin.email} (ID: {existing_admin.id})")
            return existing_admin

        # Configurable via environment variables with safe defaults for local development
        admin_email = os.environ.get("INITIAL_ADMIN_EMAIL", "admin@judicialflow.gov")
        admin_password = os.environ.get("INITIAL_ADMIN_PASSWORD", "AdminPass123!")
        admin_name = os.environ.get("INITIAL_ADMIN_NAME", "System Administrator")

        admin_user = User(
            email=admin_email.lower(),
            hashed_password=hash_password(admin_password),
            full_name=admin_name,
            role="ADMIN",
            is_active=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"Successfully seeded initial administrator: {admin_user.email} (ID: {admin_user.id})")
        return admin_user
    finally:
        db.close()


if __name__ == "__main__":
    seed_default_admin()
