from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import Transaction, Subscription, Budget, Recommendation
from app.schemas.schemas import RecommendationResponse

class RecommendationService:
    @staticmethod
    def generate_recommendations(db: Session) -> List[Recommendation]:
        """
        Analyze spending patterns, subscription commitments, duplicates, and category trajectories
        to produce realistic, evidence-backed financial recommendations.
        """
        today = datetime.utcnow().date()
        this_month_start = today.replace(day=1)
        # Prev month start
        if this_month_start.month == 1:
            prev_month_start = this_month_start.replace(year=this_month_start.year - 1, month=12)
        else:
            prev_month_start = this_month_start.replace(month=this_month_start.month - 1)

        this_m_str = this_month_start.strftime("%Y-%m-%d")
        prev_m_str = prev_month_start.strftime("%Y-%m-%d")

        # 1. Monthly Category Spending Comparison
        expenses = db.query(Transaction).filter(
            Transaction.transaction_type == "expense"
        ).all()

        current_month_cat = defaultdict(float)
        prev_month_cat = defaultdict(float)

        for t in expenses:
            if t.transaction_date >= this_m_str:
                current_month_cat[t.category] += t.amount
            elif prev_m_str <= t.transaction_date < this_m_str:
                prev_month_cat[t.category] += t.amount

        new_recs = []

        # Check Category Spending Spikes
        for cat, curr_spent in current_month_cat.items():
            prev_spent = prev_month_cat.get(cat, 0.0)
            if prev_spent >= 1000 and curr_spent > prev_spent * 1.25:
                pct_increase = round(((curr_spent - prev_spent) / prev_spent) * 100, 1)
                diff = round(curr_spent - prev_spent, 2)
                new_recs.append({
                    "title": f"Spending surge detected in {cat}",
                    "description": f"You spent ₹{curr_spent:,.0f} on {cat} this month, which is {pct_increase}% (₹{diff:,.0f}) higher than last month (₹{prev_spent:,.0f}).",
                    "reason": f"Category expenditure accelerated significantly faster than previous monthly baseline.",
                    "related_category": cat,
                    "estimated_impact": diff,
                    "priority": "high" if diff > 3000 else "medium",
                    "suggested_action": f"Review recent {cat} receipts to determine whether this was a one-time essential purchase or recurring lifestyle inflation."
                })

        # 2. Subscription Leakage Recommendation
        active_subs = db.query(Subscription).filter(
            Subscription.status.in_(["active", "price_increase"])
        ).all()

        if active_subs:
            monthly_sub_cost = sum(
                s.latest_amount if s.frequency == "monthly"
                else (s.latest_amount * 4.33 if s.frequency == "weekly" else s.latest_amount / 12.0)
                for s in active_subs
            )
            annual_impact = round(monthly_sub_cost * 12, 2)
            sub_count = len(active_subs)

            if sub_count >= 3:
                new_recs.append({
                    "title": f"Recurring Subscription Optimization ({sub_count} active services)",
                    "description": f"You currently maintain {sub_count} active subscriptions totalling ~₹{monthly_sub_cost:,.0f}/month (₹{annual_impact:,.0f}/year).",
                    "reason": f"Multiple active subscriptions across media and digital utilities create steady background cash outflow.",
                    "related_category": "Subscriptions",
                    "estimated_impact": annual_impact,
                    "priority": "medium",
                    "suggested_action": "Audit recurring services on your Subscriptions tab and consider consolidating streaming or productivity memberships."
                })

        # 3. Price Increase Alert Follow-up
        price_hike_subs = db.query(Subscription).filter(
            Subscription.status == "price_increase"
        ).all()
        for s in price_hike_subs:
            new_recs.append({
                "title": f"Unaddressed Price Hike: {s.merchant}",
                "description": f"{s.merchant} subscription increased to ₹{s.latest_amount:,.2f} (+₹{s.price_change_amount:,.2f}/cycle).",
                "reason": "Merchant billing rate increased compared to historical baseline charges.",
                "related_category": "Subscriptions",
                "estimated_impact": round(s.price_change_amount * 12, 2),
                "priority": "high",
                "suggested_action": f"Decide whether to accept the higher tier pricing for {s.merchant} or switch to a lower tier or alternative."
            })

        # 4. Budget Overrun Checks
        budgets = db.query(Budget).all()
        for b in budgets:
            spent = current_month_cat.get(b.category, 0.0)
            if spent > b.monthly_limit:
                overage = round(spent - b.monthly_limit, 2)
                new_recs.append({
                    "title": f"Budget Exceeded: {b.category}",
                    "description": f"You have spent ₹{spent:,.0f} of your ₹{b.monthly_limit:,.0f} monthly budget for {b.category}.",
                    "reason": f"Recorded expenses exceed your planned monthly ceiling by ₹{overage:,.0f}.",
                    "related_category": b.category,
                    "estimated_impact": overage,
                    "priority": "high",
                    "suggested_action": f"Pause discretionary spending in {b.category} for the remainder of this calendar cycle."
                })

        # 5. Modest Discretionary Savings Opportunity
        # If food/entertainment spending is notable, illustrate 10% trim
        discretionary_spend = current_month_cat.get("Food", 0.0) + current_month_cat.get("Entertainment", 0.0) + current_month_cat.get("Shopping", 0.0)
        if discretionary_spend >= 5000:
            monthly_saving = round(discretionary_spend * 0.10, 2)
            annual_saving = round(monthly_saving * 12, 2)
            new_recs.append({
                "title": "Discretionary Spending 10% Trim Target",
                "description": f"Reducing dining, entertainment, and impulsive shopping by 10% (~₹{monthly_saving:,.0f}/month) saves ~₹{annual_saving:,.0f} annually.",
                "reason": "Discretionary categories represent flexible expenses that can be adjusted without affecting fixed living obligations.",
                "related_category": "Food",
                "estimated_impact": annual_saving,
                "priority": "low",
                "suggested_action": "Set a weekly cap on food delivery apps and dine-out frequency."
            })

        # Synchronize with database: avoid creating exact duplicate active titles
        existing_active = db.query(Recommendation).filter(Recommendation.status == "active").all()
        existing_titles = {r.title for r in existing_active}

        for rec in new_recs:
            if rec["title"] not in existing_titles:
                db_rec = Recommendation(
                    title=rec["title"],
                    description=rec["description"],
                    reason=rec["reason"],
                    related_category=rec["related_category"],
                    estimated_impact=rec["estimated_impact"],
                    priority=rec["priority"],
                    status="active",
                    suggested_action=rec["suggested_action"],
                )
                db.add(db_rec)

        db.commit()
        return db.query(Recommendation).filter(Recommendation.status != "dismissed").order_by(
            Recommendation.priority.asc(), Recommendation.created_at.desc()
        ).all()

    @staticmethod
    def get_recommendations(db: Session) -> List[Recommendation]:
        recs = db.query(Recommendation).filter(Recommendation.status != "dismissed").order_by(
            Recommendation.created_at.desc()
        ).all()
        if not recs:
            return RecommendationService.generate_recommendations(db)
        return recs

    @staticmethod
    def update_status(db: Session, rec_id: int, status: str) -> Optional[Recommendation]:
        rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
        if not rec:
            return None
        rec.status = status
        db.commit()
        db.refresh(rec)
        return rec

