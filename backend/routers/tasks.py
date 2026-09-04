from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from core.dependencies import get_current_active_user
from database import get_db
from models.case import Case
from models.task import Task
from models.user import User
from schemas.task import TaskCreate, TaskResponse, TaskUpdate
from services.notification_service import notify_task_assigned

router = APIRouter()


def _format_task_response(task: Task) -> TaskResponse:
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        case_id=task.case_id,
        assigned_to=task.assigned_to,
        priority=task.priority,
        status=task.status,
        due_date=task.due_date,
        created_at=task.created_at,
        updated_at=task.updated_at,
        case_number=task.case.case_number if task.case else None,
        case_title=task.case.title if task.case else None,
        assignee_name=task.assignee.full_name or task.assignee.email if task.assignee else None,
        assignee_role=task.assignee.role if task.assignee else None,
    )


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    case_id: Optional[int] = Query(None),
    assigned_to: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    q = db.query(Task).options(
        joinedload(Task.case),
        joinedload(Task.assignee),
    )

    if case_id is not None:
        q = q.filter(Task.case_id == case_id)

    if assigned_to is not None:
        q = q.filter(Task.assigned_to == assigned_to)

    if status:
        q = q.filter(Task.status.ilike(status.strip()))

    if priority:
        q = q.filter(Task.priority.ilike(priority.strip()))

    if search:
        term = f"%{search.strip()}%"
        q = (
            q.outerjoin(Task.case)
            .outerjoin(Task.assignee)
            .filter(
                or_(
                    Task.title.ilike(term),
                    Task.description.ilike(term),
                    Case.case_number.ilike(term),
                    Case.title.ilike(term),
                    User.full_name.ilike(term),
                    User.email.ilike(term),
                )
            )
        )

    tasks = q.order_by(Task.due_date.asc().nullslast(), Task.created_at.desc()).offset(skip).limit(limit).all()
    return [_format_task_response(t) for t in tasks]


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    task = (
        db.query(Task)
        .options(
            joinedload(Task.case),
            joinedload(Task.assignee),
        )
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    return _format_task_response(task)


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    case = None
    if payload.case_id is not None:
        case = db.query(Case).filter(Case.id == payload.case_id).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Case with ID {payload.case_id} does not exist",
            )

    assignee = None
    if payload.assigned_to is not None:
        assignee = db.query(User).filter(User.id == payload.assigned_to).first()
        if not assignee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {payload.assigned_to} does not exist",
            )
        if not assignee.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign task to an inactive user",
            )

    task = Task(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)

    task.case = case
    task.assignee = assignee

    # Trigger automatic notification for task assignment
    if task.assigned_to:
        notify_task_assigned(db, task, current_user)

    return _format_task_response(task)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    task = (
        db.query(Task)
        .options(
            joinedload(Task.case),
            joinedload(Task.assignee),
        )
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    old_assigned_to = task.assigned_to
    update_data = payload.model_dump(exclude_unset=True)

    if "case_id" in update_data and update_data["case_id"] is not None:
        case = db.query(Case).filter(Case.id == update_data["case_id"]).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Case with ID {update_data['case_id']} does not exist",
            )
        task.case = case
    elif "case_id" in update_data and update_data["case_id"] is None:
        task.case = None

    if "assigned_to" in update_data and update_data["assigned_to"] is not None:
        assignee = db.query(User).filter(User.id == update_data["assigned_to"]).first()
        if not assignee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {update_data['assigned_to']} does not exist",
            )
        if not assignee.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign task to an inactive user",
            )
        task.assignee = assignee
    elif "assigned_to" in update_data and update_data["assigned_to"] is None:
        task.assignee = None

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    # Trigger notification if assigned to a new user
    if task.assigned_to and task.assigned_to != old_assigned_to:
        notify_task_assigned(db, task, current_user)

    return _format_task_response(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    db.delete(task)
    db.commit()
    return None
