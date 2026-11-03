import csv
import io
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc, asc

from app.models.models import Transaction, ImportBatch
from app.schemas.schemas import TransactionCreate, TransactionUpdate, CSVImportResponse
from app.services.categorization_service import CategorizationService
from app.utils.helpers import parse_date, clean_text, CATEGORIES

class TransactionService:
    @staticmethod
    def get_transactions(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        category: Optional[str] = None,
        transaction_type: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        sort_by: str = "date_desc",  # date_desc, date_asc, amount_desc, amount_asc
    ) -> Tuple[List[Transaction], int]:
        query = db.query(Transaction)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Transaction.merchant.ilike(search_term),
                    Transaction.description.ilike(search_term),
                    Transaction.reference.ilike(search_term)
                )
            )

        if category and category != "All":
            query = query.filter(Transaction.category == category)

        if transaction_type and transaction_type != "All":
            query = query.filter(Transaction.transaction_type == transaction_type.lower())

        if start_date:
            query = query.filter(Transaction.transaction_date >= start_date)

        if end_date:
            query = query.filter(Transaction.transaction_date <= end_date)

        if min_amount is not None:
            query = query.filter(Transaction.amount >= min_amount)

        if max_amount is not None:
            query = query.filter(Transaction.amount <= max_amount)

        total_count = query.count()

        if sort_by == "date_desc":
            query = query.order_by(desc(Transaction.transaction_date), desc(Transaction.id))
        elif sort_by == "date_asc":
            query = query.order_by(asc(Transaction.transaction_date), asc(Transaction.id))
        elif sort_by == "amount_desc":
            query = query.order_by(desc(Transaction.amount))
        elif sort_by == "amount_asc":
            query = query.order_by(asc(Transaction.amount))
        else:
            query = query.order_by(desc(Transaction.transaction_date))

        items = query.offset(skip).limit(limit).all()
        return items, total_count

    @staticmethod
    def get_by_id(db: Session, transaction_id: int) -> Optional[Transaction]:
        return db.query(Transaction).filter(Transaction.id == transaction_id).first()

    @staticmethod
    def create(db: Session, data: TransactionCreate) -> Transaction:
        # If category is not provided or "Other", auto-categorize
        category = data.category
        if not category or category == "Other":
            cat_res = CategorizationService.categorize(data.description, data.merchant, data.amount)
            category = cat_res.category

        txn = Transaction(
            merchant=clean_text(data.merchant),
            description=clean_text(data.description),
            amount=round(float(data.amount), 2),
            transaction_type=data.transaction_type.lower(),
            category=category,
            payment_method=data.payment_method,
            transaction_date=parse_date(data.transaction_date),
            reference=data.reference,
            is_recurring=data.is_recurring,
        )
        db.add(txn)
        db.commit()
        db.refresh(txn)
        return txn

    @staticmethod
    def update(db: Session, transaction_id: int, data: TransactionUpdate) -> Optional[Transaction]:
        txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not txn:
            return None

        update_dict = data.dict(exclude_unset=True)
        if "merchant" in update_dict and update_dict["merchant"]:
            txn.merchant = clean_text(update_dict["merchant"])
        if "description" in update_dict and update_dict["description"]:
            txn.description = clean_text(update_dict["description"])
        if "amount" in update_dict and update_dict["amount"] is not None:
            txn.amount = round(float(update_dict["amount"]), 2)
        if "transaction_type" in update_dict and update_dict["transaction_type"]:
            txn.transaction_type = update_dict["transaction_type"].lower()
        if "category" in update_dict and update_dict["category"]:
            txn.category = update_dict["category"]
        if "payment_method" in update_dict and update_dict["payment_method"]:
            txn.payment_method = update_dict["payment_method"]
        if "transaction_date" in update_dict and update_dict["transaction_date"]:
            txn.transaction_date = parse_date(update_dict["transaction_date"])
        if "reference" in update_dict:
            txn.reference = update_dict["reference"]
        if "is_recurring" in update_dict and update_dict["is_recurring"] is not None:
            txn.is_recurring = update_dict["is_recurring"]

        db.commit()
        db.refresh(txn)
        return txn

    @staticmethod
    def delete(db: Session, transaction_id: int) -> bool:
        txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not txn:
            return False
        db.delete(txn)
        db.commit()
        return True

    @staticmethod
    def export_csv(db: Session, **filter_kwargs) -> str:
        """Export transactions to CSV format string"""
        txns, _ = TransactionService.get_transactions(db, skip=0, limit=10000, **filter_kwargs)
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "ID", "Date", "Merchant", "Description", "Amount", "Type", "Category", "Payment Method", "Reference", "Is Recurring"
        ])
        for t in txns:
            writer.writerow([
                t.id,
                t.transaction_date,
                t.merchant,
                t.description,
                t.amount,
                t.transaction_type,
                t.category,
                t.payment_method,
                t.reference or "",
                "Yes" if t.is_recurring else "No"
            ])
        return output.getvalue()

    @staticmethod
    def import_csv(db: Session, file_content: str, filename: str) -> Dict[str, Any]:
        """Safely import CSV rows with validation, column matching, deduplication and categorization"""
        reader = csv.DictReader(io.StringIO(file_content))
        if not reader.fieldnames:
            return {
                "batch_id": 0,
                "filename": filename,
                "imported_count": 0,
                "rejected_count": 0,
                "duplicate_count": 0,
                "errors": ["CSV file header is empty or malformed."],
                "sample_imported": []
            }

        # Normalize field names
        field_map = {}
        for fn in reader.fieldnames:
            clean_fn = fn.lower().strip().replace(" ", "_")
            field_map[clean_fn] = fn

        # Look up mapped column keys
        date_col = next((field_map[k] for k in ["date", "transaction_date", "txn_date"] if k in field_map), None)
        merchant_col = next((field_map[k] for k in ["merchant", "vendor", "payee", "party"] if k in field_map), None)
        desc_col = next((field_map[k] for k in ["description", "narration", "particulars", "memo"] if k in field_map), None)
        amount_col = next((field_map[k] for k in ["amount", "txn_amount", "value", "debit"] if k in field_map), None)
        type_col = next((field_map[k] for k in ["type", "transaction_type", "cr/dr", "txn_type"] if k in field_map), None)
        cat_col = next((field_map[k] for k in ["category", "category_name"] if k in field_map), None)
        method_col = next((field_map[k] for k in ["payment_method", "mode", "method"] if k in field_map), None)
        ref_col = next((field_map[k] for k in ["reference", "ref_no", "ref", "txn_id", "transaction_id"] if k in field_map), None)

        if not amount_col or (not desc_col and not merchant_col):
            return {
                "batch_id": 0,
                "filename": filename,
                "imported_count": 0,
                "rejected_count": 0,
                "duplicate_count": 0,
                "errors": ["Missing mandatory columns: Must have 'amount' and either 'merchant' or 'description'."],
                "sample_imported": []
            }

        batch = ImportBatch(filename=filename, imported_count=0, rejected_count=0)
        db.add(batch)
        db.commit()
        db.refresh(batch)

        imported_records = []
        errors = []
        duplicate_count = 0
        rejected_count = 0

        for row_idx, row in enumerate(reader, start=1):
            try:
                # Raw amount parsing
                raw_amt = row.get(amount_col, "").replace(",", "").replace("₹", "").strip()
                if not raw_amt:
                    rejected_count += 1
                    continue
                amount = abs(float(raw_amt))
                if amount <= 0:
                    rejected_count += 1
                    continue

                raw_merch = row.get(merchant_col, "") if merchant_col else ""
                raw_desc = row.get(desc_col, "") if desc_col else raw_merch
                if not raw_merch:
                    raw_merch = raw_desc[:30] if raw_desc else "General Expense"

                raw_date = row.get(date_col, "") if date_col else ""
                date_val = parse_date(raw_date) if raw_date else datetime.utcnow().strftime("%Y-%m-%d")

                # Transaction type
                txn_type = "expense"
                if type_col and row.get(type_col):
                    val = row.get(type_col).lower().strip()
                    if "income" in val or "credit" in val or "cr" in val:
                        txn_type = "income"
                elif float(raw_amt) < 0:
                    txn_type = "expense"

                # Category determination
                category = row.get(cat_col, "").strip() if cat_col else ""
                if not category or category not in CATEGORIES:
                    cat_res = CategorizationService.categorize(raw_desc, raw_merch, amount)
                    category = cat_res.category

                # Payment method
                method = row.get(method_col, "UPI").strip() if method_col else "UPI"
                ref = row.get(ref_col, "").strip() if ref_col else None

                # Check duplicate within same date, merchant, amount
                existing = db.query(Transaction).filter(
                    Transaction.merchant == clean_text(raw_merch),
                    Transaction.amount == round(amount, 2),
                    Transaction.transaction_date == date_val
                ).first()
                if existing and (ref is None or existing.reference == ref):
                    duplicate_count += 1
                    # Skip importing strict duplicate
                    continue

                txn = Transaction(
                    merchant=clean_text(raw_merch),
                    description=clean_text(raw_desc),
                    amount=round(amount, 2),
                    transaction_type=txn_type,
                    category=category,
                    payment_method=method,
                    transaction_date=date_val,
                    reference=ref,
                    import_batch_id=batch.id,
                )
                db.add(txn)
                imported_records.append(txn)

            except Exception as e:
                rejected_count += 1
                if len(errors) < 5:
                    errors.append(f"Row {row_idx}: {str(e)}")

        db.commit()
        for t in imported_records:
            db.refresh(t)

        batch.imported_count = len(imported_records)
        batch.rejected_count = rejected_count
        db.commit()

        return {
            "batch_id": batch.id,
            "filename": filename,
            "imported_count": len(imported_records),
            "rejected_count": rejected_count,
            "duplicate_count": duplicate_count,
            "errors": errors,
            "sample_imported": imported_records[:10]
        }

