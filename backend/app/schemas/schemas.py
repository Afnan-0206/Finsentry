from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# ==================== TRANSACTION SCHEMAS ====================
class TransactionBase(BaseModel):
    merchant: str = Field(..., example="Swiggy")
    description: str = Field(..., example="Swiggy Order Food Delivery")
    amount: float = Field(..., gt=0, example=350.0)
    transaction_type: str = Field(default="expense", example="expense")  # expense, income
    category: str = Field(default="Food", example="Food")
    payment_method: str = Field(default="UPI", example="UPI")
    transaction_date: str = Field(..., example="2026-03-15")
    reference: Optional[str] = Field(default=None, example="TXN12345678")
    is_recurring: bool = Field(default=False)

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    merchant: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    transaction_type: Optional[str] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None
    transaction_date: Optional[str] = None
    reference: Optional[str] = None
    is_recurring: Optional[bool] = None

class TransactionResponse(TransactionBase):
    id: int
    import_batch_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==================== CATEGORIZATION SCHEMAS ====================
class CategorizeRequest(BaseModel):
    description: str
    merchant: Optional[str] = None
    amount: Optional[float] = None

class CategorizeResponse(BaseModel):
    category: str
    confidence: float
    method: str  # "keyword_rule", "merchant_mapping", "ml_fallback", "default"
    explanation: str

# ==================== SUBSCRIPTION SCHEMAS ====================
class SubscriptionResponse(BaseModel):
    id: int
    merchant: str
    category: str
    average_amount: float
    latest_amount: float
    frequency: str
    estimated_next_date: str
    last_payment_date: str
    detection_confidence: float
    status: str
    price_change_amount: float
    reviewed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SubscriptionUpdate(BaseModel):
    status: Optional[str] = None
    reviewed: Optional[bool] = None

class SubscriptionDetectResult(BaseModel):
    total_subscriptions_detected: int
    active_subscriptions: int
    potential_monthly_leakage: float
    price_increases_detected: int
    subscriptions: List[SubscriptionResponse]

# ==================== ANOMALY SCHEMAS ====================
class AnomalyItem(BaseModel):
    transaction_id: int
    merchant: str
    category: str
    amount: float
    transaction_date: str
    anomaly_score: float
    risk_level: str  # low, medium, high
    reason: str
    category_baseline: float
    recommended_action: str

class AnomalyAnalysisResponse(BaseModel):
    total_evaluated: int
    anomalies_detected: int
    model_trained: bool
    contamination: float
    message: str
    anomalies: List[AnomalyItem]

# ==================== DUPLICATE SCHEMAS ====================
class DuplicateCandidatePair(BaseModel):
    id_pair: str
    transaction_1: TransactionResponse
    transaction_2: TransactionResponse
    similarity_reason: str
    day_difference: int
    amount: float
    merchant: str
    status: str  # "potential_duplicate", "confirmed", "dismissed"

class DuplicateAnalysisResponse(BaseModel):
    total_potential_duplicates: int
    total_flagged_amount: float
    candidates: List[DuplicateCandidatePair]

# ==================== FORECASTING SCHEMAS ====================
class DailyForecast(BaseModel):
    date: str
    projected_income: float
    projected_expenses: float
    expected_net: float
    notes: List[str]

class ForecastResponse(BaseModel):
    horizon_days: int
    projected_total_income: float
    projected_total_expenses: float
    projected_net_savings: float
    upcoming_subscriptions_cost: float
    methodology: str
    daily_projections: List[DailyForecast]

# ==================== RECOMMENDATION SCHEMAS ====================
class RecommendationResponse(BaseModel):
    id: int
    title: str
    description: str
    reason: str
    related_category: Optional[str] = None
    estimated_impact: float
    priority: str
    status: str
    suggested_action: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RecommendationUpdate(BaseModel):
    status: str

# ==================== ALERT SCHEMAS ====================
class AlertResponse(BaseModel):
    id: int
    transaction_id: Optional[int] = None
    alert_type: str
    severity: str
    title: str
    description: str
    recommended_action: Optional[str] = None
    is_read: bool
    is_dismissed: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_dismissed: Optional[bool] = None

# ==================== BUDGET SCHEMAS ====================
class BudgetBase(BaseModel):
    category: str
    monthly_limit: float

class BudgetCreate(BudgetBase):
    pass

class BudgetResponse(BudgetBase):
    id: int
    created_at: datetime
    updated_at: datetime
    current_spent: Optional[float] = 0.0
    percentage_used: Optional[float] = 0.0

    class Config:
        from_attributes = True

# ==================== CHAT SCHEMAS ====================
class ChatQueryRequest(BaseModel):
    message: str
    model: Optional[str] = None

class ChatQueryResponse(BaseModel):
    response: str
    intent: str
    supporting_data: Optional[Dict[str, Any]] = None
    suggested_followups: List[str] = []
    provider: Optional[str] = "Deterministic Fallback"
    model: Optional[str] = None
    grounded: bool = True
    latency_seconds: Optional[float] = None
    ttft_seconds: Optional[float] = None

class ChatProviderStatus(BaseModel):
    configured_provider: str
    active_provider: str
    model: str
    status: str
    is_available: bool
    fallback_available: bool = True
    available_models: List[str] = []

class ChatHistoryItem(BaseModel):
    id: int
    role: str
    message: str
    intent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ==================== DASHBOARD SCHEMAS ====================
class MetricCard(BaseModel):
    label: str
    value: float
    formatted: str
    change_percentage: Optional[float] = None
    trend: Optional[str] = "neutral"  # "up", "down", "neutral"
    subtext: str

class DashboardSummaryResponse(BaseModel):
    total_income: float
    total_expenses: float
    net_savings: float
    available_balance: float
    potential_monthly_leakage: float
    active_subscriptions_count: int
    unusual_transactions_count: int
    unread_alerts_count: int
    financial_health_score: int  # 0 to 100
    financial_health_summary: str
    recent_transactions: List[TransactionResponse]

class CategorySpending(BaseModel):
    category: str
    total_amount: float
    percentage: float
    transaction_count: int

class MonthlyTrend(BaseModel):
    month: str  # "Oct 2025" or "2025-10"
    income: float
    expenses: float
    net: float

class DashboardTrendsResponse(BaseModel):
    monthly_trends: List[MonthlyTrend]
    category_breakdown: List[CategorySpending]
    daily_spend_last_30_days: List[Dict[str, Any]]

# ==================== CSV IMPORT SCHEMAS ====================
class CSVImportResponse(BaseModel):
    batch_id: int
    filename: str
    imported_count: int
    rejected_count: int
    duplicate_count: int
    errors: List[str]
    sample_imported: List[TransactionResponse]

