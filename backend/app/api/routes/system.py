from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.services.demo_data_service import DemoDataService
from app.core.config import settings

router = APIRouter(prefix="/system", tags=["System"])

@router.post("/reset-demo")
def reset_demo_data(db: Session = Depends(get_db)):
    """Reset database and re-seed 6-month calibrated realistic demonstration data."""
    result = DemoDataService.reset_and_seed_demo_data(db)
    return result

@router.get("/status")
def get_system_status():
    return {
        "status": "online",
        "app_name": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "currency": settings.DEFAULT_CURRENCY,
        "currency_symbol": settings.CURRENCY_SYMBOL,
        "ai_provider": settings.AI_PROVIDER,
        "isolation_forest_contamination": settings.ISOLATION_FOREST_CONTAMINATION,
        "min_transactions_for_ml": settings.MIN_TRANSACTIONS_FOR_ML,
        "disclaimer": (
            "FinSentry AI is an educational financial intelligence application. "
            "Its anomaly detection, forecasts, and recommendations are informational and are not proof of fraud or professional financial advice."
        )
    }

