from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import Transaction, Subscription
from app.schemas.schemas import ForecastResponse, DailyForecast

class ForecastingService:
    @staticmethod
    def generate_forecast(db: Session, horizon_days: int = 30) -> ForecastResponse:
        """
        Generate early-warning financial cash-flow forecasts for 7 or 30 days ahead
        based on active recurring subscriptions, detected recurring income, and moving averages.
        """
        today = datetime.utcnow().date()

        # 1. Calculate historical baseline daily expense (excluding one-off huge anomalies)
        # Fetch expenses from the last 90 days
        past_90_days = today - timedelta(days=90)
        past_expenses = db.query(Transaction).filter(
            Transaction.transaction_type == "expense",
            Transaction.transaction_date >= past_90_days.strftime("%Y-%m-%d")
        ).all()

        total_past_expense = sum(t.amount for t in past_expenses)
        num_past_days = max(1, (today - past_90_days).days)
        # Baseline discretionary daily spend (excluding recurring obligations which will be scheduled explicitly)
        non_recurring_expenses = [t for t in past_expenses if not t.is_recurring]
        daily_discretionary_avg = sum(t.amount for t in non_recurring_expenses) / num_past_days if non_recurring_expenses else (total_past_expense / num_past_days * 0.7)
        daily_discretionary_avg = max(50.0, round(daily_discretionary_avg, 2))

        # 2. Fetch active subscriptions and recurring obligations
        subs = db.query(Subscription).filter(
            Subscription.status != "dismissed"
        ).all()

        # Build schedule map for subscriptions within the horizon
        scheduled_subs_by_day = {}
        for s in subs:
            try:
                sub_next_dt = datetime.strptime(s.estimated_next_date, "%Y-%m-%d").date()
                # Check occurrences in horizon
                curr_dt = sub_next_dt
                # If next date is already in past, advance it
                while curr_dt < today:
                    if s.frequency == "weekly":
                        curr_dt += timedelta(days=7)
                    elif s.frequency == "quarterly":
                        curr_dt += timedelta(days=90)
                    elif s.frequency == "yearly":
                        curr_dt += timedelta(days=365)
                    else:
                        curr_dt += timedelta(days=30)

                horizon_end = today + timedelta(days=horizon_days)
                while curr_dt <= horizon_end:
                    day_str = curr_dt.strftime("%Y-%m-%d")
                    if day_str not in scheduled_subs_by_day:
                        scheduled_subs_by_day[day_str] = []
                    scheduled_subs_by_day[day_str].append({
                        "merchant": s.merchant,
                        "amount": s.latest_amount,
                        "category": s.category,
                    })
                    if s.frequency == "weekly":
                        curr_dt += timedelta(days=7)
                    elif s.frequency == "quarterly":
                        curr_dt += timedelta(days=90)
                    elif s.frequency == "yearly":
                        curr_dt += timedelta(days=365)
                    else:
                        curr_dt += timedelta(days=30)
            except Exception:
                continue

        # 3. Detect regular income schedule (e.g. Salary on 1st or end of month)
        incomes = db.query(Transaction).filter(
            Transaction.transaction_type == "income"
        ).all()
        # Find salary transactions
        salary_txns = [t for t in incomes if t.category == "Salary" or "salary" in t.merchant.lower()]
        avg_salary = 0.0
        salary_day = 1
        if salary_txns:
            avg_salary = sum(t.amount for t in salary_txns) / len(salary_txns)
            try:
                sample_day = int(salary_txns[0].transaction_date.split("-")[2])
                salary_day = sample_day
            except Exception:
                salary_day = 1

        # 4. Generate daily projections
        daily_projections: List[DailyForecast] = []
        total_projected_income = 0.0
        total_projected_expense = 0.0
        total_subs_cost = 0.0

        for i in range(1, horizon_days + 1):
            project_date = today + timedelta(days=i)
            day_str = project_date.strftime("%Y-%m-%d")
            notes = []

            # Income projection: if project_date is the expected salary credit day
            day_income = 0.0
            if avg_salary > 0 and project_date.day == salary_day:
                day_income = round(avg_salary, 2)
                notes.append(f"Expected recurring Salary credit: ₹{avg_salary:,.2f}")

            # Recurring subscription charges for this day
            scheduled_items = scheduled_subs_by_day.get(day_str, [])
            day_subs_cost = sum(item["amount"] for item in scheduled_items)
            for item in scheduled_items:
                notes.append(f"Subscription renewal: {item['merchant']} (₹{item['amount']:,.2f})")
                total_subs_cost += item["amount"]

            # Daily estimated expense = recurring obligations + daily discretionary moving baseline
            day_expense = round(day_subs_cost + daily_discretionary_avg, 2)
            day_net = round(day_income - day_expense, 2)

            total_projected_income += day_income
            total_projected_expense += day_expense

            daily_projections.append(
                DailyForecast(
                    date=day_str,
                    projected_income=day_income,
                    projected_expenses=day_expense,
                    expected_net=day_net,
                    notes=notes
                )
            )

        methodology_text = (
            f"Projection combines calendar-based recurring obligations (subscriptions/utilities), "
            f"historical 90-day baseline discretionary spend (₹{daily_discretionary_avg:,.2f}/day), "
            f"and detected recurring income patterns. Estimates are statistical baselines, not guarantees."
        )

        return ForecastResponse(
            horizon_days=horizon_days,
            projected_total_income=round(total_projected_income, 2),
            projected_total_expenses=round(total_projected_expense, 2),
            projected_net_savings=round(total_projected_income - total_projected_expense, 2),
            upcoming_subscriptions_cost=round(total_subs_cost, 2),
            methodology=methodology_text,
            daily_projections=daily_projections
        )

