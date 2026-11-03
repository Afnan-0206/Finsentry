from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.models import Subscription
from app.schemas.schemas import (
    SubscriptionResponse, SubscriptionUpdate, SubscriptionDetectResult
)
from app.services.subscription_service import SubscriptionService

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

@router.get("", response_model=List[SubscriptionResponse])
def get_subscriptions(db: Session = Depends(get_db)):
    subs = SubscriptionService.get_subscriptions(db)
    return [SubscriptionResponse.from_orm(s) for s in subs]

@router.post("/detect", response_model=SubscriptionDetectResult)
def detect_subscriptions(db: Session = Depends(get_db)):
    result = SubscriptionService.detect_and_update_subscriptions(db)
    return result

@router.get("/{sub_id}", response_model=SubscriptionResponse)
def get_subscription(sub_id: int, db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return SubscriptionResponse.from_orm(sub)

@router.patch("/{sub_id}", response_model=SubscriptionResponse)
def update_subscription(sub_id: int, data: SubscriptionUpdate, db: Session = Depends(get_db)):
    sub = SubscriptionService.update_subscription(db, sub_id, data.status, data.reviewed)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return SubscriptionResponse.from_orm(sub)

