from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.schemas.schemas import AlertResponse, AlertUpdate
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    severity: Optional[str] = None,
    alert_type: Optional[str] = None,
    unread_only: bool = False,
    include_dismissed: bool = False,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    alerts = AlertService.get_alerts(
        db, severity=severity, alert_type=alert_type,
        unread_only=unread_only, include_dismissed=include_dismissed, limit=limit
    )
    return [AlertResponse.from_orm(a) for a in alerts]

@router.get("/unread-count")
def get_unread_alerts_count(db: Session = Depends(get_db)):
    count = AlertService.get_unread_count(db)
    return {"unread_count": count}

@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert(alert_id: int, data: AlertUpdate, db: Session = Depends(get_db)):
    if data.is_read:
        alert = AlertService.mark_read(db, alert_id)
    elif data.is_dismissed:
        alert = AlertService.dismiss(db, alert_id)
    else:
        alert = None

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return AlertResponse.from_orm(alert)

