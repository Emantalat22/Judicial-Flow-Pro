from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.dependencies import get_current_active_user, require_admin
from core.security import hash_password
from database import get_db
from models.user import User
from schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.get("", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (User.email.ilike(search_pattern)) | (User.full_name.ilike(search_pattern))
        )

    if role:
        query = query.filter(User.role == role.strip().upper())

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    users = query.order_by(User.id.asc()).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )

    # Allow admins to view anyone; non-admins can view their own profile or other members
    if current_user.role != "ADMIN" and current_user.id != user_id:
        # Non-admins can view user info if needed for directory, or return safe user info
        pass

    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )

    # Permission check: Non-admins can only modify their own profile
    if current_user.role != "ADMIN" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify other users.",
        )

    # Non-admins cannot modify their own role or active status
    if current_user.role != "ADMIN":
        if user_update.role is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can modify user roles.",
            )
        if user_update.is_active is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can modify user active status.",
            )

    # Email update uniqueness check
    if user_update.email and user_update.email.lower() != target_user.email.lower():
        existing = db.query(User).filter(User.email == user_update.email.lower()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email address already exists.",
            )
        target_user.email = user_update.email.lower()

    # Full name update
    if user_update.full_name is not None:
        target_user.full_name = user_update.full_name

    # Password update
    if user_update.password:
        target_user.hashed_password = hash_password(user_update.password)

    # Role update (Admin only)
    if user_update.role is not None and current_user.role == "ADMIN":
        new_role = user_update.role.upper()
        if target_user.role == "ADMIN" and new_role != "ADMIN":
            # Protect last active admin
            active_admins = (
                db.query(User)
                .filter(User.role == "ADMIN", User.is_active == True)
                .count()
            )
            if active_admins <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove the last active administrator.",
                )
        target_user.role = new_role

    # Active status update (Admin only)
    if user_update.is_active is not None and current_user.role == "ADMIN":
        if target_user.role == "ADMIN" and user_update.is_active is False:
            # Protect last active admin
            active_admins = (
                db.query(User)
                .filter(User.role == "ADMIN", User.is_active == True)
                .count()
            )
            if active_admins <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot deactivate the last active administrator.",
                )
        target_user.is_active = user_update.is_active

    db.commit()
    db.refresh(target_user)
    return target_user


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def deactivate_or_delete_user(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )

    # Protect last active admin
    if target_user.role == "ADMIN" and target_user.is_active:
        active_admins = (
            db.query(User)
            .filter(User.role == "ADMIN", User.is_active == True)
            .count()
        )
        if active_admins <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate the last active administrator.",
            )

    # Deactivate the account safely
    target_user.is_active = False
    db.commit()

    return {
        "message": f"User '{target_user.email}' has been deactivated.",
        "id": target_user.id,
        "is_active": False,
    }
