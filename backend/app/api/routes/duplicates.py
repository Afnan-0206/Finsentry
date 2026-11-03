from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.schemas.schemas import DuplicateAnalysisResponse
from app.services.duplicate_service import DuplicateService

router = APIRouter(prefix="/duplicates", tags=["Duplicate Detection"])

@router.get("", response_model=DuplicateAnalysisResponse)
def get_duplicates(max_days: int = Query(3, ge=0, le=14), db: Session = Depends(get_db)):
    return DuplicateService.detect_potential_duplicates(db, max_days_diff=max_days)

@router.post("/analyze", response_model=DuplicateAnalysisResponse)
def analyze_duplicates(max_days: int = Query(3, ge=0, le=14), db: Session = Depends(get_db)):
    return DuplicateService.detect_potential_duplicates(db, max_days_diff=max_days)

