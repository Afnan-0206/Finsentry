from app.schemas.schemas import TransactionCreate
from app.services.transaction_service import TransactionService
from app.services.duplicate_service import DuplicateService

def test_potential_duplicate_detection(db_session):
    # Scenario B: Two identical Amazon charges on the same date or 1 day apart
    t1 = TransactionService.create(db_session, TransactionCreate(
        merchant="Amazon India",
        description="Amazon Order - Soundcore Wireless Headphones",
        amount=1299.0,
        transaction_type="expense",
        category="Shopping",
        payment_method="Credit Card",
        transaction_date="2026-03-02",
        reference="AMZ001"
    ))

    t2 = TransactionService.create(db_session, TransactionCreate(
        merchant="Amazon India",
        description="Amazon Order - Soundcore Wireless Headphones",
        amount=1299.0,
        transaction_type="expense",
        category="Shopping",
        payment_method="Credit Card",
        transaction_date="2026-03-02",
        reference="AMZ002"
    ))

    res = DuplicateService.detect_potential_duplicates(db_session, max_days_diff=3)
    assert res.total_potential_duplicates >= 1
    assert res.total_flagged_amount >= 1299.0

    pair = res.candidates[0]
    assert pair.amount == 1299.0
    assert "Amazon" in pair.merchant
    assert pair.day_difference == 0

