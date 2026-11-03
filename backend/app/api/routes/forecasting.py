from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.schemas.schemas import ForecastResponse
from app.services.forecasting_service import ForecastingService

router = APIRouter(prefix="/forecast", tags=["Forecasting"])

@router.get("/7-day", response_model=ForecastResponse)
def get_7_day_forecast(db: Session = Depends(get_db)):
    return ForecastingService.generate_forecast(db, horizon_days=7)

@router.get("/30-day", response_model=ForecastResponse)
def get_30_day_forecast(db: Session = Depends(get_db)):
    return ForecastingService.generate_forecast(db, horizon_days=30)

