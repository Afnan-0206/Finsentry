from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict
import numpy as np
from sqlalchemy.orm import Session

from app.models.models import Transaction, Subscription, Alert
from app.schemas.schemas import SubscriptionResponse, SubscriptionDetectResult

class SubscriptionService:
    @staticmethod
    def detect_and_update_subscriptions(db: Session) -> SubscriptionDetectResult:
        """
        Analyze historical expense transactions to discover recurring subscriptions,
        detect price increases, calculate confidence, and project next billing dates.
        """
        # Fetch all expense transactions ordered by date
        expenses = db.query(Transaction).filter(
            Transaction.transaction_type == "expense"
        ).order_by(Transaction.transaction_date.asc()).all()

        # Group transactions by normalized merchant
        merchant_groups = defaultdict(list)
        for t in expenses:
            # Normalize merchant key
            key = t.merchant.strip().title()
            merchant_groups[key].append(t)

        detected_subs = []
        active_count = 0
        total_leakage = 0.0
        price_hike_count = 0

        # We inspect merchants with 2 or more transactions
        for merchant_name, txns in merchant_groups.items():
            if len(txns) < 2:
                continue

            # Sort by date
            txns = sorted(txns, key=lambda x: x.transaction_date)
            dates = [datetime.strptime(t.transaction_date, "%Y-%m-%d") for t in txns]
            amounts = [t.amount for t in txns]

            # Calculate intervals between successive transactions
            intervals = [(dates[i] - dates[i-1]).days for i in range(1, len(dates))]
            if not intervals:
                continue

            median_interval = float(np.median(intervals))
            std_interval = float(np.std(intervals)) if len(intervals) > 1 else 0.0

            # Frequency detection
            frequency = None
            tolerance = 5  # days tolerance
            if 5 <= median_interval <= 9:
                frequency = "weekly"
            elif 25 <= median_interval <= 35:
                frequency = "monthly"
            elif 80 <= median_interval <= 100:
                frequency = "quarterly"
            elif 350 <= median_interval <= 380:
                frequency = "yearly"

            # Check if merchant is explicitly in known subscription category or recurring flag
            is_sub_category = any(t.category in ["Subscriptions", "Utilities", "Housing"] for t in txns)

            # Recurrence condition:
            # 1. Frequency matched within typical window, OR
            # 2. Category is Subscriptions/Utilities and intervals are roughly periodic
            if not frequency and is_sub_category and 20 <= median_interval <= 40:
                frequency = "monthly"

            if not frequency:
                continue

            # Confidence score calculation based on interval consistency and amount consistency
            amount_std = float(np.std(amounts)) if len(amounts) > 1 else 0.0
            avg_amount = float(np.mean(amounts))
            latest_amount = float(amounts[-1])
            first_amount = float(amounts[0])

            # Baseline confidence
            confidence = 0.70
            if std_interval <= 3.0:
                confidence += 0.15
            elif std_interval <= 7.0:
                confidence += 0.10

            if is_sub_category:
                confidence += 0.10

            confidence = min(0.99, round(confidence, 2))

            # Detect price change: compare latest transaction amount to previous amounts
            price_change = 0.0
            status = "active"

            if len(amounts) >= 2:
                # If latest amount is greater than the preceding transactions
                prev_amounts = amounts[:-1]
                prev_avg = float(np.mean(prev_amounts))
                if latest_amount > prev_avg * 1.05 and (latest_amount - prev_avg) >= 50:
                    price_change = round(latest_amount - prev_avg, 2)
                    status = "price_increase"
                    price_hike_count += 1

            # Estimate next billing date
            last_date = dates[-1]
            if frequency == "weekly":
                next_date = last_date + timedelta(days=7)
                monthly_cost = latest_amount * 4.33
            elif frequency == "monthly":
                next_date = last_date + timedelta(days=30)
                monthly_cost = latest_amount
            elif frequency == "quarterly":
                next_date = last_date + timedelta(days=90)
                monthly_cost = latest_amount / 3.0
            elif frequency == "yearly":
                next_date = last_date + timedelta(days=365)
                monthly_cost = latest_amount / 12.0
            else:
                next_date = last_date + timedelta(days=30)
                monthly_cost = latest_amount

            # Check if overdue / possibly unused: if last payment was > 2 intervals ago and not a price hike
            days_since_last = (datetime.utcnow() - last_date).days
            if status != "price_increase" and days_since_last > (median_interval * 2.2) and days_since_last > 45:
                status = "possibly_unused"

            # Check existing subscription in DB
            sub_record = db.query(Subscription).filter(
                Subscription.merchant == merchant_name
            ).first()

            category = txns[-1].category or "Subscriptions"

            if not sub_record:
                sub_record = Subscription(
                    merchant=merchant_name,
                    category=category,
                    average_amount=round(avg_amount, 2),
                    latest_amount=round(latest_amount, 2),
                    frequency=frequency,
                    estimated_next_date=next_date.strftime("%Y-%m-%d"),
                    last_payment_date=last_date.strftime("%Y-%m-%d"),
                    detection_confidence=confidence,
                    status=status,
                    price_change_amount=price_change,
                    reviewed=False,
                )
                db.add(sub_record)
                db.flush()

                # Generate alert if price hike detected
                if status == "price_increase":
                    alert = Alert(
                        transaction_id=txns[-1].id,
                        alert_type="price_increase",
                        severity="warning",
                        title=f"Price Increase: {merchant_name}",
                        description=f"{merchant_name} increased from ~₹{prev_avg:.0f} to ₹{latest_amount:.0f} (+₹{price_change:.0f}).",
                        recommended_action="Review if this subscription plan was upgraded or if you wish to downgrade/cancel.",
                    )
                    db.add(alert)
            else:
                # Update existing record
                sub_record.average_amount = round(avg_amount, 2)
                sub_record.latest_amount = round(latest_amount, 2)
                sub_record.frequency = frequency
                sub_record.estimated_next_date = next_date.strftime("%Y-%m-%d")
                sub_record.last_payment_date = last_date.strftime("%Y-%m-%d")
                sub_record.detection_confidence = confidence
                if not sub_record.reviewed:
                    sub_record.status = status
                sub_record.price_change_amount = price_change

            # Mark transactions as recurring in DB
            for t in txns:
                t.is_recurring = True

            detected_subs.append(sub_record)
            if status != "dismissed":
                active_count += 1
                total_leakage += monthly_cost

        db.commit()

        # Re-query all subscriptions
        all_subs = db.query(Subscription).order_by(Subscription.latest_amount.desc()).all()
        return SubscriptionDetectResult(
            total_subscriptions_detected=len(all_subs),
            active_subscriptions=active_count,
            potential_monthly_leakage=round(total_leakage, 2),
            price_increases_detected=price_hike_count,
            subscriptions=[SubscriptionResponse.from_orm(s) for s in all_subs]
        )

    @staticmethod
    def get_subscriptions(db: Session) -> List[Subscription]:
        return db.query(Subscription).order_by(Subscription.latest_amount.desc()).all()

    @staticmethod
    def update_subscription(db: Session, sub_id: int, status: Optional[str] = None, reviewed: Optional[bool] = None) -> Optional[Subscription]:
        sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
        if not sub:
            return None
        if status is not None:
            sub.status = status
        if reviewed is not None:
            sub.reviewed = reviewed
        db.commit()
        db.refresh(sub)
        return sub
