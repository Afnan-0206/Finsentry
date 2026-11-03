from app.schemas.schemas import TransactionCreate
from app.services.transaction_service import TransactionService
from app.ml.anomaly_model import TransactionAnomalyDetector
from app.services.demo_data_service import DemoDataService

def test_insufficient_data_handling(db_session):
    # Only 3 transactions created (< 20 required threshold)
    for i in range(3):
        TransactionService.create(db_session, TransactionCreate(
            merchant="Merchant A", description="Item", amount=100.0,
            transaction_type="expense", category="Food", payment_method="UPI",
            transaction_date="2026-03-01"
        ))

    detector = TransactionAnomalyDetector(min_samples=20)
    res = detector.run_detection(db_session)
    # Must honestly report that model cannot be trained
    assert res.model_trained is False
    assert res.anomalies_detected == 0
    assert "Insufficient" in res.message or "20" in res.message

def test_isolation_forest_anomaly_detection_scenario_c(seeded_db):
    detector = TransactionAnomalyDetector(contamination=0.05, min_samples=20)
    res = detector.run_detection(seeded_db)
    assert res.model_trained is True
    assert res.anomalies_detected >= 1

    # Scenario C: ₹18,500 Croma Electronics purchase must be caught as an anomaly
    croma_anomaly = next((a for a in res.anomalies if "Croma" in a.merchant or a.amount >= 18000), None)
    assert croma_anomaly is not None
    assert croma_anomaly.risk_level == "high"
    assert "Shopping" in croma_anomaly.reason or "higher than" in croma_anomaly.reason

