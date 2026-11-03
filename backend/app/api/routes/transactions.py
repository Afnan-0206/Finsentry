from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.models import Transaction
from app.schemas.schemas import (
    TransactionCreate, TransactionUpdate, TransactionResponse, CSVImportResponse
)
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def list_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    category: Optional[str] = None,
    transaction_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    sort_by: str = Query("date_desc", pattern="^(date_desc|date_asc|amount_desc|amount_asc)$"),
    db: Session = Depends(get_db)
):
    items, total = TransactionService.get_transactions(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        category=category,
        transaction_type=transaction_type,
        start_date=start_date,
        end_date=end_date,
        min_amount=min_amount,
        max_amount=max_amount,
        sort_by=sort_by
    )
    return items

@router.post("", response_model=TransactionResponse, status_code=201)
def create_transaction(data: TransactionCreate, db: Session = Depends(get_db)):
    return TransactionService.create(db, data)

@router.post("/import", response_model=CSVImportResponse)
async def import_transactions_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    content = await file.read()
    try:
        decoded_content = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            decoded_content = content.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=400, detail="Unable to decode CSV file format.")

    result = TransactionService.import_csv(db, decoded_content, file.filename)
    return result

@router.get("/export", response_class=PlainTextResponse)
def export_transactions_csv(
    category: Optional[str] = None,
    transaction_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    csv_text = TransactionService.export_csv(
        db=db,
        category=category,
        transaction_type=transaction_type,
        start_date=start_date,
        end_date=end_date
    )
    return PlainTextResponse(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions_export.csv"}
    )

@router.get("/{txn_id}", response_model=TransactionResponse)
def get_transaction(txn_id: int, db: Session = Depends(get_db)):
    txn = TransactionService.get_by_id(db, txn_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn

@router.put("/{txn_id}", response_model=TransactionResponse)
def update_transaction(txn_id: int, data: TransactionUpdate, db: Session = Depends(get_db)):
    txn = TransactionService.update(db, txn_id, data)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn

@router.delete("/{txn_id}", status_code=204)
def delete_transaction(txn_id: int, db: Session = Depends(get_db)):
    deleted = TransactionService.delete(db, txn_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return Response(status_code=204)
