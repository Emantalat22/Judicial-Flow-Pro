from typing import Optional
import random

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.dependencies import get_current_active_user
from database import get_db
from models.case import Case
from models.user import User
from schemas.case import CaseCreate, CaseUpdate, CaseResponse
from services.notification_service import notify_case_status_changed

router = APIRouter()


def _generate_case_number(db: Session) -> str:
    year = 2026
    count = db.query(func.count(Case.id)).scalar() or 0
    seq = count + 1
    candidate = f"JFP-{year}-{seq:04d}"
    if db.query(Case).filter(Case.case_number == candidate).first():
        seq = random.randint(1000, 9999)
        candidate = f"JFP-{year}-{seq:04d}"
    return candidate


@router.get("", response_model=list[CaseResponse])
def list_cases(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None),
    case_type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    q = db.query(Case)
    if search:
        term = f"%{search}%"
        q = q.filter(
            (Case.title.ilike(term))
            | (Case.case_number.ilike(term))
            | (Case.judge.ilike(term))
            | (Case.plaintiff.ilike(term))
            | (Case.defendant.ilike(term))
        )
    if status:
        q = q.filter(Case.status == status)
    if case_type:
        q = q.filter(Case.case_type == case_type)
    if priority:
        q = q.filter(Case.priority == priority)
    return q.order_by(Case.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=CaseResponse, status_code=201)
def create_case(
    payload: CaseCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    case_number = _generate_case_number(db)
    case = Case(case_number=case_number, **payload.model_dump())
    db.add(case)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Duplicate case number; please retry")
    db.refresh(case)
    return case


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(
    case_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.put("/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: int,
    payload: CaseUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    old_status = case.status
    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(case, field, value)

    db.commit()
    db.refresh(case)

    # Automatic trigger if case status changed
    if "status" in update_data and update_data["status"] != old_status:
        notify_case_status_changed(db, case, old_status, case.status, current_user)

    return case


@router.delete("/{case_id}", status_code=204)
def delete_case(
    case_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(case)
    db.commit()
    return None
