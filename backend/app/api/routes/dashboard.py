from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.api.dependencies import get_db
from app.models.models import Transaction, Subscription, Alert
from app.schemas.schemas import (
    DashboardSummaryResponse, DashboardTrendsResponse, TransactionResponse,
    MonthlyTrend, CategorySpending
)
from app.utils.helpers import format_inr

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    # Total Income and Expenses
    total_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.transaction_type == "income"
    ).scalar() or 0.0

    total_expenses = db.query(func.sum(Transaction.amount)).filter(
        Transaction.transaction_type == "expense"
    ).scalar() or 0.0

    net_savings = total_income - total_expenses
    available_balance = net_savings

    # Subscriptions & Monthly Leakage
    active_subs = db.query(Subscription).filter(
        Subscription.status.in_(["active", "price_increase"])
    ).all()
    active_subs_count = len(active_subs)

    potential_monthly_leakage = sum(
        s.latest_amount if s.frequency == "monthly"
        else (s.latest_amount * 4.33 if s.frequency == "weekly" else s.latest_amount / 12.0)
        for s in active_subs
    )

    # Unusual Transactions
    unusual_count = db.query(Alert).filter(
        Alert.alert_type == "unusual_transaction",
        Alert.is_dismissed == False
    ).count()

    # Unread Alerts
    unread_alerts = db.query(Alert).filter(
        Alert.is_read == False,
        Alert.is_dismissed == False
    ).count()

    # Recent transactions (last 6)
    recent_txns = db.query(Transaction).order_by(
        desc(Transaction.transaction_date), desc(Transaction.id)
    ).limit(6).all()

    # Calculate Financial Health Score (0 - 100)
    # Factors:
    # 1. Savings rate (40 pts)
    # 2. Subscription leakage ratio vs income (25 pts)
    # 3. Anomaly / duplicate flags (20 pts)
    # 4. Cashflow positivity (15 pts)
    savings_rate = (net_savings / total_income) if total_income > 0 else 0.0
    sr_pts = min(40.0, max(0.0, savings_rate * 80.0))

    sub_leak_ratio = (potential_monthly_leakage / (total_income / 6.0)) if total_income > 0 else 0.1
    leak_pts = max(5.0, 25.0 - (sub_leak_ratio * 100.0))

    anomaly_penalty = min(20.0, unusual_count * 5.0)
    anomaly_pts = max(0.0, 20.0 - anomaly_penalty)

    cf_pts = 15.0 if net_savings > 0 else 0.0

    health_score = int(round(sr_pts + leak_pts + anomaly_pts + cf_pts))
    health_score = max(15, min(98, health_score))

    # Narrative explanation
    if health_score >= 80:
        summary_narrative = (
            f"Your financial health is strong ({health_score}/100). You maintain a positive cash-flow buffer. "
            f"Watch your recurring commitments ({format_inr(potential_monthly_leakage)}/mo) to prevent silent leakage."
        )
    elif health_score >= 60:
        summary_narrative = (
            f"Your financial trajectory is moderate ({health_score}/100). Recent expenses and active subscriptions "
            f"({format_inr(potential_monthly_leakage)}/mo) have tightened your monthly savings margin."
        )
    else:
        summary_narrative = (
            f"Early warning ({health_score}/100): High discretionary spending or unusual transactions detected. "
            f"Review flagged alerts and recurring subscriptions to protect your cash-flow reserve."
        )

    return DashboardSummaryResponse(
        total_income=round(total_income, 2),
        total_expenses=round(total_expenses, 2),
        net_savings=round(net_savings, 2),
        available_balance=round(available_balance, 2),
        potential_monthly_leakage=round(potential_monthly_leakage, 2),
        active_subscriptions_count=active_subs_count,
        unusual_transactions_count=unusual_count,
        unread_alerts_count=unread_alerts,
        financial_health_score=health_score,
        financial_health_summary=summary_narrative,
        recent_transactions=[TransactionResponse.from_orm(t) for t in recent_txns]
    )

@router.get("/trends", response_model=DashboardTrendsResponse)
def get_dashboard_trends(db: Session = Depends(get_db)):
    # 1. Monthly Trends (Income vs Expenses by Month)
    txns = db.query(Transaction).order_by(Transaction.transaction_date.asc()).all()

    monthly_map = {}
    category_map = {}
    daily_map = {}

    today = datetime.utcnow().date()
    thirty_days_ago = (today - timedelta(days=30)).strftime("%Y-%m-%d")

    total_expense_sum = 0.0

    for t in txns:
        # Month string YYYY-MM
        m_str = t.transaction_date[:7]
        if m_str not in monthly_map:
            monthly_map[m_str] = {"income": 0.0, "expenses": 0.0}

        if t.transaction_type == "income":
            monthly_map[m_str]["income"] += t.amount
        else:
            monthly_map[m_str]["expenses"] += t.amount
            total_expense_sum += t.amount
            category_map[t.category] = category_map.get(t.category, {"amount": 0.0, "count": 0})
            category_map[t.category]["amount"] += t.amount
            category_map[t.category]["count"] += 1

            # Daily spend last 30 days
            if t.transaction_date >= thirty_days_ago:
                daily_map[t.transaction_date] = daily_map.get(t.transaction_date, 0.0) + t.amount

    # Format monthly trends (last 6 calendar months sorted)
    sorted_months = sorted(monthly_map.keys())[-6:]
    monthly_trends = []
    for m in sorted_months:
        dt = datetime.strptime(m, "%Y-%m")
        label = dt.strftime("%b %Y")
        inc = round(monthly_map[m]["income"], 2)
        exp = round(monthly_map[m]["expenses"], 2)
        monthly_trends.append(
            MonthlyTrend(
                month=label,
                income=inc,
                expenses=exp,
                net=round(inc - exp, 2)
            )
        )

    # Format category breakdown sorted by amount
    category_breakdown = []
    for cat, data in sorted(category_map.items(), key=lambda x: x[1]["amount"], reverse=True):
        amt = round(data["amount"], 2)
        pct = round((amt / max(1.0, total_expense_sum)) * 100, 1)
        category_breakdown.append(
            CategorySpending(
                category=cat,
                total_amount=amt,
                percentage=pct,
                transaction_count=data["count"]
            )
        )

    # Format daily spend for last 30 days
    daily_spend = []
    for i in range(30, -1, -1):
        d = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_spend.append({
            "date": d,
            "display_date": (today - timedelta(days=i)).strftime("%d %b"),
            "amount": round(daily_map.get(d, 0.0), 2)
        })

    return DashboardTrendsResponse(
        monthly_trends=monthly_trends,
        category_breakdown=category_breakdown,
        daily_spend_last_30_days=daily_spend
    )

