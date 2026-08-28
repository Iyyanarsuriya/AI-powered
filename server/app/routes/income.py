from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.models.income import Income
from app.schemas.income import (IncomeCreate,IncomeUpdate,IncomeResponse,IncomeSummaryResponse,IncomeSourceBreakdown,)

router = APIRouter(prefix="/api/incomes", tags=["Income Management"])


@router.get("", response_model=List[IncomeResponse])
def get_incomes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by source or notes"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    query = select(Income).where(Income.user_id == current_user.id)

    if category:
        query = query.where(Income.category == category)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (Income.source.ilike(search_pattern)) | (Income.notes.ilike(search_pattern))
        )

    query = query.order_by(desc(Income.date), desc(Income.id)).offset(offset).limit(limit)
    incomes = db.scalars(query).all()
    return incomes


@router.get("/summary", response_model=IncomeSummaryResponse)
def get_income_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Total Income
    total_query = select(func.coalesce(func.sum(Income.amount), 0.0)).where(
        Income.user_id == current_user.id
    )
    total_income = float(db.scalar(total_query) or 0.0)

    # Current Month Income
    now = datetime.now(timezone.utc)
    current_month_start = datetime(now.year, now.month, 1)
    monthly_query = select(func.coalesce(func.sum(Income.amount), 0.0)).where(
        Income.user_id == current_user.id,
        Income.date >= current_month_start,
    )
    monthly_income = float(db.scalar(monthly_query) or 0.0)

    # Count of incomes
    count_query = select(func.count(Income.id)).where(Income.user_id == current_user.id)
    income_count = int(db.scalar(count_query) or 0)

    # Breakdown by Source
    source_query = (
        select(
            Income.source,
            func.sum(Income.amount).label("total_amount"),
            func.count(Income.id).label("count"),
        )
        .where(Income.user_id == current_user.id)
        .group_by(Income.source)
        .order_by(desc("total_amount"))
    )
    source_results = db.execute(source_query).all()

    source_breakdown = []
    for row in source_results:
        src_total = float(row.total_amount)
        percentage = round((src_total / total_income * 100), 1) if total_income > 0 else 0.0
        source_breakdown.append(
            IncomeSourceBreakdown(
                source=row.source,
                total_amount=src_total,
                percentage=percentage,
                count=int(row.count),
            )
        )

    # Recent Incomes (latest 5)
    recent_query = (
        select(Income)
        .where(Income.user_id == current_user.id)
        .order_by(desc(Income.date), desc(Income.id))
        .limit(5)
    )
    recent_incomes = db.scalars(recent_query).all()

    return IncomeSummaryResponse(
        total_income=total_income,
        monthly_income=monthly_income,
        income_count=income_count,
        source_breakdown=source_breakdown,
        recent_incomes=recent_incomes,
    )


# ==================================================
# 3. CREATE INCOME
# POST /api/incomes
# ==================================================
@router.post("", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income(
    income_data: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    income = Income(
        user_id=current_user.id,
        source=income_data.source.strip(),
        amount=income_data.amount,
        category=income_data.category.strip(),
        notes=income_data.notes.strip() if income_data.notes else None,
        date=income_data.date or datetime.now(timezone.utc),
    )
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


# ==================================================
# 4. GET SINGLE INCOME BY ID
# GET /api/incomes/{income_id}
# ==================================================
@router.get("/{income_id}", response_model=IncomeResponse)
def get_income_by_id(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(Income).where(Income.id == income_id, Income.user_id == current_user.id)
    income = db.scalar(statement)

    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income record not found",
        )
    return income


# ==================================================
# 5. UPDATE INCOME
# PUT /api/incomes/{income_id}
# ==================================================
@router.put("/{income_id}", response_model=IncomeResponse)
def update_income(
    income_id: int,
    income_data: IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(Income).where(Income.id == income_id, Income.user_id == current_user.id)
    income = db.scalar(statement)

    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income record not found",
        )

    if income_data.source is not None:
        income.source = income_data.source.strip()
    if income_data.amount is not None:
        income.amount = income_data.amount
    if income_data.category is not None:
        income.category = income_data.category.strip()
    if income_data.notes is not None:
        income.notes = income_data.notes.strip() if income_data.notes else None
    if income_data.date is not None:
        income.date = income_data.date

    db.commit()
    db.refresh(income)
    return income


# ==================================================
# 6. DELETE INCOME
# DELETE /api/incomes/{income_id}
# ==================================================
@router.delete("/{income_id}", status_code=status.HTTP_200_OK)
def delete_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(Income).where(Income.id == income_id, Income.user_id == current_user.id)
    income = db.scalar(statement)

    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income record not found",
        )

    db.delete(income)
    db.commit()
    return {"message": "Income record deleted successfully", "id": income_id}
