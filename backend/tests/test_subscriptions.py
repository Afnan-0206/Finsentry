from app.schemas.schemas import TransactionCreate
from app.services.transaction_service import TransactionService
from app.services.subscription_service import SubscriptionService

def test_subscription_detection_and_price_increase(db_session):
    # Scenario A: Netflix at ₹499 for 3 months, then increased to ₹649
    dates_and_amounts = [
        ("2025-10-05", 499.0),
        ("2025-11-05", 499.0),
        ("2025-12-05", 499.0),
        ("2026-01-05", 649.0),
    ]

    for d, amt in dates_and_amounts:
        TransactionService.create(db_session, TransactionCreate(
            merchant="Netflix Entertainment",
            description="Netflix Standard Streaming",
            amount=amt,
            transaction_type="expense",
            category="Subscriptions",
            payment_method="Credit Card",
            transaction_date=d
        ))

    # Run detection
    result = SubscriptionService.detect_and_update_subscriptions(db_session)
    assert result.total_subscriptions_detected >= 1
    assert result.price_increases_detected >= 1

    # Find Netflix subscription
    netflix_sub = next((s for s in result.subscriptions if "Netflix" in s.merchant), None)
    assert netflix_sub is not None
    assert netflix_sub.frequency == "monthly"
    assert netflix_sub.status == "price_increase"
    assert netflix_sub.latest_amount == 649.0
    assert netflix_sub.price_change_amount == 150.0  # 649 - 499
    assert netflix_sub.detection_confidence >= 0.85

