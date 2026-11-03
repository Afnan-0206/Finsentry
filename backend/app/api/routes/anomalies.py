from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.dependencies import get_db
from app.models.models import AnomalyLog, Transaction
from app.schemas.schemas import AnomalyAnalysisResponse, AnomalyItem
from app.ml.anomaly_model import TransactionAnomalyDetector
from app.core.config import settings

router = APIRouter(prefix="/anomalies", tags=["Anomaly Detection"])

@router.post("/analyze", response_model=AnomalyAnalysisResponse)
def analyze_anomalies(db: Session = Depends(get_db)):
    detector = TransactionAnomalyDetector(
        contamination=settings.ISOLATION_FOREST_CONTAMINATION,
        min_samples=settings.MIN_TRANSACTIONS_FOR_ML
    )
    result = detector.run_detection(db)
    return result

@router.get("", response_model=List[AnomalyItem])
def list_anomalies(db: Session = Depends(get_db)):
    logs = db.query(AnomalyLog).order_by(AnomalyLog.anomaly_score.asc()).all()
    items = []
    for log in logs:
        txn = log.transaction
        if txn:
            items.append(
                AnomalyItem(
                    transaction_id=txn.id,
                    merchant=txn.merchant,
                    category=txn.category,
                    amount=txn.amount,
                    transaction_date=txn.transaction_date,
                    anomaly_score=log.anomaly_score,
                    risk_level=log.risk_level,
                    reason=log.reason,
                    category_baseline=log.category_baseline,
                    recommended_action="Review transaction with card provider or banking log.",
                )
            )
    return items

@router.get("/{txn_id}", response_model=AnomalyItem)
def get_anomaly_detail(txn_id: int, db: Session = Depends(get_db)):
    log = db.query(AnomalyLog).filter(AnomalyLog.transaction_id == txn_id).first()
    if not log or not log.transaction:
        raise HTTPException(status_code=404, detail="Anomaly record not found for this transaction.")
    txn = log.transaction
    return AnomalyItem(
        transaction_id=txn.id,
        merchant=txn.merchant,
        category=txn.category,
        amount=txn.amount,
        transaction_date=txn.transaction_date,
        anomaly_score=log.anomaly_score,
        risk_level=log.risk_level,
        reason=log.reason,
        category_baseline=log.category_baseline,
        recommended_action="Review transaction with card provider or banking log.",
    )

