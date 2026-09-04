from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from core.dependencies import get_current_active_user
from database import get_db
from models.case import Case
from models.hearing import Hearing
from models.user import User
from schemas.hearing import HearingCreate, HearingUpdate, HearingResponse
from services.notification_service import (
    notify_hearing_scheduled,
    notify_hearing_updated,
    check_and_generate_hearing_notifications,
)

router = APIRouter()


@router.get("", response_model=list[HearingResponse])
def list_hearings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    case_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    judge: Optional[str] = Query(None),
    courtroom: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    q = db.query(Hearing).options(joinedload(Hearing.case))

    if case_id is not None:
        q = q.filter(Hearing.case_id == case_id)
    if status:
        q = q.filter(Hearing.status.ilike(status))
    if start_date:
        q = q.filter(Hearing.scheduled_at >= start_date)
    if end_date:
        q = q.filter(Hearing.scheduled_at <= end_date)
    if judge:
        q = q.filter(Hearing.judge.ilike(f"%{judge}%"))
    if courtroom:
        q = q.filter(Hearing.location.ilike(f"%{courtroom}%"))
    if search:
        term = f"%{search}%"
        q = q.join(Hearing.case).filter(
            or_(
                Case.case_number.ilike(term),
                Case.title.ilike(term),
                Hearing.location.ilike(term),
                Hearing.judge.ilike(term),
                Hearing.notes.ilike(term),
                Hearing.hearing_type.ilike(term),
            )
        )

    return q.order_by(Hearing.scheduled_at.asc(), Hearing.id.asc()).offset(skip).limit(limit).all()


@router.post("", response_model=HearingResponse, status_code=201)
def create_hearing(
    payload: HearingCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == payload.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    hearing = Hearing(**payload.model_dump())
    db.add(hearing)
    db.commit()
    db.refresh(hearing)
    hearing.case = case

    # Automatic trigger for scheduled hearing
    notify_hearing_scheduled(db, hearing, current_user)
    check_and_generate_hearing_notifications(db)

    return hearing


@router.get("/{hearing_id}", response_model=HearingResponse)
def get_hearing(
    hearing_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    hearing = (
        db.query(Hearing)
        .options(joinedload(Hearing.case))
        .filter(Hearing.id == hearing_id)
        .first()
    )
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    return hearing


@router.put("/{hearing_id}", response_model=HearingResponse)
def update_hearing(
    hearing_id: int,
    payload: HearingUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    hearing = (
        db.query(Hearing)
        .options(joinedload(Hearing.case))
        .filter(Hearing.id == hearing_id)
        .first()
    )
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")

    data = payload.model_dump(exclude_unset=True)
    if "case_id" in data and data["case_id"] != hearing.case_id:
        case = db.query(Case).filter(Case.id == data["case_id"]).first()
        if not case:
            raise HTTPException(status_code=404, detail="Target case not found")

    for field, value in data.items():
        setattr(hearing, field, value)

    db.commit()
    db.refresh(hearing)

    # Automatic trigger for updated hearing
    notify_hearing_updated(db, hearing, current_user)
    check_and_generate_hearing_notifications(db)

    return hearing


@router.delete("/{hearing_id}", status_code=204)
def delete_hearing(
    hearing_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    hearing = db.query(Hearing).filter(Hearing.id == hearing_id).first()
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    db.delete(hearing)
    db.commit()
    return None
