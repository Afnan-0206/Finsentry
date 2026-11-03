from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.dependencies import get_db
from app.models.models import Budget, Transaction
from app.schemas.schemas import BudgetCreate, BudgetResponse

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("", response_model=List[BudgetResponse])
def get_budgets(db: Session = Depends(get_db)):
    budgets = db.query(Budget).all()
    # Compute current month spent per budget category
    today = datetime.utcnow().date()
    month_start = today.replace(day=1).strftime("%Y-%m-%d")

    results = []
    for b in budgets:
        spent = db.query(func.sum(Transaction.amount)).filter(
            Transaction.transaction_type == "expense",
            Transaction.category == b.category,
            Transaction.transaction_date >= month_start
        ).scalar() or 0.0

        pct = round((spent / max(1.0, b.monthly_limit)) * 100, 1)

        b_dict = {
            "id": b.id,
            "category": b.category,
            "monthly_limit": b.monthly_limit,
            "created_at": b.created_at,
            "updated_at": b.updated_at,
            "current_spent": round(spent, 2),
            "percentage_used": pct
        }
        results.append(BudgetResponse(**b_dict))
    return results

@router.post("", response_model=BudgetResponse, status_code=201)
def create_budget(data: BudgetCreate, db: Session = Depends(get_db)):
    existing = db.query(Budget).filter(Budget.category == data.category).first()
    if existing:
        existing.monthly_limit = data.monthly_limit
        db.commit()
        db.refresh(existing)
        return BudgetResponse(
            id=existing.id,
            category=existing.category,
            monthly_limit=existing.monthly_limit,
            created_at=existing.created_at,
            updated_at=existing.updated_at,
            current_spent=0.0,
            percentage_used=0.0
        )

    b = Budget(category=data.category, monthly_limit=data.monthly_limit)
    db.add(b)
    db.commit()
    db.refresh(b)
    return BudgetResponse(
        id=b.id,
        category=b.category,
        monthly_limit=b.monthly_limit,
        created_at=b.created_at,
        updated_at=b.updated_at,
        current_spent=0.0,
        percentage_used=0.0
    )

@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(budget_id: int, data: BudgetCreate, db: Session = Depends(get_db)):
    b = db.query(Budget).filter(Budget.id == budget_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Budget not found")
    b.category = data.category
    b.monthly_limit = data.monthly_limit
    db.commit()
    db.refresh(b)
    return BudgetResponse(
        id=b.id,
        category=b.category,
        monthly_limit=b.monthly_limit,
        created_at=b.created_at,
        updated_at=b.updated_at,
        current_spent=0.0,
        percentage_used=0.0
    )

