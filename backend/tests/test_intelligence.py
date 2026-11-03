from app.services.forecasting_service import ForecastingService
from app.services.recommendation_service import RecommendationService
from app.services.chatbot_service import ChatbotService
from app.core.config import settings

def test_forecasting_7_and_30_day(seeded_db):
    res_7 = ForecastingService.generate_forecast(seeded_db, horizon_days=7)
    assert res_7.horizon_days == 7
    assert len(res_7.daily_projections) == 7
    assert res_7.projected_total_expenses > 0

    res_30 = ForecastingService.generate_forecast(seeded_db, horizon_days=30)
    assert res_30.horizon_days == 30
    assert len(res_30.daily_projections) == 30
    assert res_30.upcoming_subscriptions_cost > 0

def test_recommendations_generation(seeded_db):
    recs = RecommendationService.generate_recommendations(seeded_db)
    assert len(recs) >= 1
    # Check that priority and estimated impact are valid
    for r in recs:
        assert r.priority in ["high", "medium", "low"]
        assert r.estimated_impact >= 0
        assert r.title is not None

def test_chatbot_investigator_grounded_queries(seeded_db, monkeypatch):
    monkeypatch.setattr(settings, "AI_PROVIDER", "deterministic")

    # Query 1: Subscriptions
    res_sub = ChatbotService.process_query(seeded_db, "How much am I spending on subscriptions?")
    assert res_sub.intent == "subscriptions_query"
    assert "₹" in res_sub.response or "subscription" in res_sub.response.lower()

    # Query 2: Anomalies
    res_anom = ChatbotService.process_query(seeded_db, "Why was this transaction flagged as unusual?")
    assert res_anom.intent == "anomaly_query"

    # Query 3: Duplicates
    res_dup = ChatbotService.process_query(seeded_db, "Show me potential duplicate transactions")
    assert res_dup.intent == "duplicate_query"

    # Check History
    history = ChatbotService.get_history(seeded_db)
    assert len(history) >= 6  # 3 user + 3 assistant
