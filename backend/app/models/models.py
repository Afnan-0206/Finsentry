from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    merchant = Column(String(100), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(20), nullable=False, default="expense", index=True)  # "income" or "expense"
    category = Column(String(50), nullable=False, default="Other", index=True)
    payment_method = Column(String(50), nullable=False, default="UPI")
    transaction_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    reference = Column(String(100), nullable=True)
    import_batch_id = Column(Integer, ForeignKey("import_batches.id"), nullable=True)
    is_recurring = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    alerts = relationship("Alert", back_populates="transaction", cascade="all, delete-orphan")
    anomaly_logs = relationship("AnomalyLog", back_populates="transaction", cascade="all, delete-orphan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    merchant = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False, default="Subscriptions")
    average_amount = Column(Float, nullable=False)
    latest_amount = Column(Float, nullable=False)
    frequency = Column(String(20), nullable=False, default="monthly")  # weekly, monthly, quarterly, yearly
    estimated_next_date = Column(String(10), nullable=False)
    last_payment_date = Column(String(10), nullable=False)
    detection_confidence = Column(Float, default=0.9)
    status = Column(String(30), default="active")  # active, price_increase, possibly_unused, dismissed
    price_change_amount = Column(Float, default=0.0)
    reviewed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    alert_type = Column(String(50), nullable=False, index=True)
    # Types: unusual_transaction, potential_duplicate, price_increase, upcoming_recurring, spending_spike, budget_exceeded, subscription_leakage
    severity = Column(String(20), nullable=False, default="info")  # info, warning, high
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    is_dismissed = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="alerts")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    reason = Column(Text, nullable=False)
    related_category = Column(String(50), nullable=True)
    estimated_impact = Column(Float, default=0.0)  # in INR
    priority = Column(String(20), default="medium")  # high, medium, low
    status = Column(String(20), default="active")  # active, reviewed, dismissed
    suggested_action = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category = Column(String(50), unique=True, nullable=False)
    monthly_limit = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role = Column(String(20), nullable=False)  # "user", "assistant"
    message = Column(Text, nullable=False)
    intent = Column(String(50), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ImportBatch(Base):
    __tablename__ = "import_batches"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    imported_count = Column(Integer, default=0)
    rejected_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class AnomalyLog(Base):
    __tablename__ = "anomaly_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    anomaly_score = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False, default="medium")  # low, medium, high
    reason = Column(Text, nullable=False)
    category_baseline = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="anomaly_logs")

