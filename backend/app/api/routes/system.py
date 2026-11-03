from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.services.demo_data_service import DemoDataService
from app.services.backup_service import BackupService
from app.core.config import settings
from app.core.database import DEFAULT_SQLITE_PATH, SQLALCHEMY_DATABASE_URL
from app.models.models import Transaction

router = APIRouter(prefix="/system", tags=["System"])

@router.post("/reset-demo")
def reset_demo_data(db: Session = Depends(get_db)):
    """Reset database and re-seed 6-month calibrated realistic demonstration data."""
    result = DemoDataService.reset_and_seed_demo_data(db)
    return result

@router.post("/backup")
def create_backup():
    """Create an atomic timestamped snapshot backup of finsentry.db."""
    return BackupService.create_backup()

@router.get("/backups")
def list_backups():
    """List all available local backups."""
    return BackupService.list_backups()

@router.get("/status")
def get_system_status(db: Session = Depends(get_db)):
    tx_count = db.query(Transaction).count()
    return {
        "status": "online",
        "app_name": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "currency": settings.DEFAULT_CURRENCY,
        "currency_symbol": settings.CURRENCY_SYMBOL,
        "storage_type": "Permanent Local SQLite",
        "database_file": str(DEFAULT_SQLITE_PATH),
        "database_url": SQLALCHEMY_DATABASE_URL,
        "total_transactions": tx_count,
        "ai_provider": settings.AI_PROVIDER,
        "isolation_forest_contamination": settings.ISOLATION_FOREST_CONTAMINATION,
        "min_transactions_for_ml": settings.MIN_TRANSACTIONS_FOR_ML,
        "disclaimer": (
            "FinSentry AI is an educational financial intelligence application. "
            "Its anomaly detection, forecasts, and recommendations are informational and are not proof of fraud or professional financial advice."
        )
    }
