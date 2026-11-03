import pytest
from app.services.financial_context_service import FinancialContextService
from app.services.chatbot_service import ChatbotService
from app.ai.providers import (
    get_ai_provider,
    DeterministicFallbackProvider,
    OllamaProvider,
)
from app.core.config import settings

def test_financial_context_retrieval(db_session):
    """Verify that financial context accurately extracts metrics from SQLite."""
    ctx = FinancialContextService.get_full_financial_context(db_session)
    assert "summary" in ctx
    assert "monthly_comparison" in ctx
    assert "highest_spending_category" in ctx
    assert "subscriptions" in ctx
    assert "anomalies" in ctx
    assert "duplicates" in ctx
    assert "forecast_30_day" in ctx
    assert "recommendations" in ctx

    summary = ctx["summary"]
    assert summary["total_income"] >= 0
    assert summary["total_expenses"] >= 0
    assert 0 <= summary["health_score"] <= 100

def test_prompt_formatting(db_session):
    """Verify that formatted prompt context contains necessary grounding elements."""
    ctx = FinancialContextService.get_full_financial_context(db_session)
    prompt_str = FinancialContextService.format_context_for_prompt(ctx)
    assert "FINANCIAL LEDGER AUDIT FACTS" in prompt_str
    assert "₹" in prompt_str
    assert "Month-over-Month Comparison" in prompt_str

def test_ollama_provider_availability():
    """Verify OllamaProvider checks availability and detects local Ollama server."""
    provider = OllamaProvider()
    available = provider.is_available()
    assert isinstance(available, bool)
    assert provider.model_name == settings.OLLAMA_MODEL

def test_provider_status_endpoint(client):
    """Verify GET /api/chat/status returns operational provider details."""
    res = client.get("/api/chat/status")
    assert res.status_code == 200
    data = res.json()
    assert "active_provider" in data
    assert "model" in data
    assert data["fallback_available"] is True

def test_all_seven_benchmark_queries(db_session, monkeypatch):
    """Verify ChatbotService accurately grounds all 7 primary evaluation queries."""
    monkeypatch.setattr(settings, "AI_PROVIDER", "deterministic")
    benchmark_queries = [
        "Why did my savings decrease this month?",
        "What is my highest spending category?",
        "Which subscriptions are costing me the most?",
        "Are there any suspicious transactions?",
        "How much can I save next month?",
        "Compare this month with last month",
        "Explain my financial health score",
    ]

    for q in benchmark_queries:
        res = ChatbotService.process_query(db_session, q)
        assert res.response is not None
        assert len(res.response) > 20
        assert res.grounded is True
        assert res.provider is not None
        assert len(res.suggested_followups) > 0

def test_chat_api_endpoint(client, monkeypatch):
    """Verify POST /api/chat handles natural language questions and returns grounded response."""
    monkeypatch.setattr(settings, "AI_PROVIDER", "deterministic")
    payload = {"message": "What is my highest spending category?"}
    res = client.post("/api/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert "intent" in data
    assert "provider" in data
    assert "suggested_followups" in data
