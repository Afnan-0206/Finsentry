from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.schemas.schemas import RecommendationResponse, RecommendationUpdate
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.get("", response_model=List[RecommendationResponse])
def get_recommendations(db: Session = Depends(get_db)):
    recs = RecommendationService.get_recommendations(db)
    return [RecommendationResponse.from_orm(r) for r in recs]

@router.patch("/{rec_id}", response_model=RecommendationResponse)
def update_recommendation_status(rec_id: int, data: RecommendationUpdate, db: Session = Depends(get_db)):
    rec = RecommendationService.update_status(db, rec_id, data.status)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return RecommendationResponse.from_orm(rec)

