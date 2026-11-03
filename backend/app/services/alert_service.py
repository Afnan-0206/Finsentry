from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.models import Alert
from app.schemas.schemas import AlertResponse

class AlertService:
    @staticmethod
    def get_alerts(
        db: Session,
        severity: Optional[str] = None,
        alert_type: Optional[str] = None,
        unread_only: bool = False,
        include_dismissed: bool = False,
        limit: int = 50
    ) -> List[Alert]:
        query = db.query(Alert)
        if not include_dismissed:
            query = query.filter(Alert.is_dismissed == False)
        if unread_only:
            query = query.filter(Alert.is_read == False)
        if severity and severity != "All":
            query = query.filter(Alert.severity == severity.lower())
        if alert_type and alert_type != "All":
            query = query.filter(Alert.alert_type == alert_type)

        return query.order_by(desc(Alert.created_at)).limit(limit).all()

    @staticmethod
    def mark_read(db: Session, alert_id: int) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.is_read = True
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def dismiss(db: Session, alert_id: int) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.is_dismissed = True
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def get_unread_count(db: Session) -> int:
        return db.query(Alert).filter(Alert.is_read == False, Alert.is_dismissed == False).count()

