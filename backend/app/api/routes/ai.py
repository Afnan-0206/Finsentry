from fastapi import APIRouter
from app.schemas.schemas import CategorizeRequest, CategorizeResponse
from app.services.categorization_service import CategorizationService

router = APIRouter(prefix="/ai", tags=["AI Intelligence"])

@router.post("/categorize", response_model=CategorizeResponse)
def categorize_transaction(payload: CategorizeRequest):
    return CategorizationService.categorize(
        description=payload.description,
        merchant=payload.merchant,
        amount=payload.amount
    )

