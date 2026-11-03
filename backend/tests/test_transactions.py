from app.schemas.schemas import TransactionCreate, TransactionUpdate
from app.services.transaction_service import TransactionService

def test_transaction_crud(db_session):
    # 1. Create Transaction
    data = TransactionCreate(
        merchant="Starbucks Coffee",
        description="Iced Americano with Croissant",
        amount=380.0,
        transaction_type="expense",
        category="Food",
        payment_method="UPI",
        transaction_date="2026-03-10",
        reference="TXN10001",
        is_recurring=False
    )
    txn = TransactionService.create(db_session, data)
    assert txn.id is not None
    assert txn.merchant == "Starbucks Coffee"
    assert txn.amount == 380.0

    # 2. Get Transaction
    fetched = TransactionService.get_by_id(db_session, txn.id)
    assert fetched is not None
    assert fetched.id == txn.id

    # 3. Update Transaction
    update_data = TransactionUpdate(amount=420.0, category="Food")
    updated = TransactionService.update(db_session, txn.id, update_data)
    assert updated.amount == 420.0

    # 4. List and Filter
    items, count = TransactionService.get_transactions(db_session, category="Food")
    assert count >= 1
    assert any(i.id == txn.id for i in items)

    # 5. Delete Transaction
    deleted = TransactionService.delete(db_session, txn.id)
    assert deleted is True
    assert TransactionService.get_by_id(db_session, txn.id) is None

def test_csv_export_and_import(db_session):
    # Seed 2 transactions
    t1 = TransactionService.create(db_session, TransactionCreate(
        merchant="Swiggy", description="Lunch order", amount=350.0,
        transaction_type="expense", category="Food", payment_method="UPI",
        transaction_date="2026-03-01", reference="REF001"
    ))
    t2 = TransactionService.create(db_session, TransactionCreate(
        merchant="Uber", description="Cab ride", amount=250.0,
        transaction_type="expense", category="Transportation", payment_method="UPI",
        transaction_date="2026-03-02", reference="REF002"
    ))

    # Export to CSV
    csv_text = TransactionService.export_csv(db_session)
    assert "Swiggy" in csv_text
    assert "Uber" in csv_text
    assert "Amount" in csv_text

    # Import valid CSV text
    sample_csv = (
        "date,merchant,description,amount,type,category,payment_method,reference\n"
        "2026-03-15,BookMyShow,Cinema Tickets IMAX,950.00,expense,Entertainment,Credit Card,BMS9911\n"
        "2026-03-16,Blinkit,Milk and Eggs,210.00,expense,Groceries,UPI,BLK9922\n"
    )
    res = TransactionService.import_csv(db_session, sample_csv, "test_import.csv")
    assert res["imported_count"] == 2
    assert res["rejected_count"] == 0

