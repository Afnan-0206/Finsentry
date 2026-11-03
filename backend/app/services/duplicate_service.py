from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Transaction, Alert
from app.schemas.schemas import DuplicateCandidatePair, DuplicateAnalysisResponse, TransactionResponse

class DuplicateService:
    @staticmethod
    def detect_potential_duplicates(db: Session, max_days_diff: int = 3) -> DuplicateAnalysisResponse:
        """
        Identify pairs of transactions that share identical or nearly identical amounts,
        similar merchants, and occurred within a short interval (0-3 days).
        """
        # Fetch expenses
        expenses = db.query(Transaction).filter(
            Transaction.transaction_type == "expense"
        ).order_by(Transaction.transaction_date.desc(), Transaction.id.desc()).all()

        candidates: List[DuplicateCandidatePair] = []
        seen_pairs = set()
        total_flagged_amount = 0.0

        for i in range(len(expenses)):
            t1 = expenses[i]
            d1 = datetime.strptime(t1.transaction_date, "%Y-%m-%d")

            for j in range(i + 1, len(expenses)):
                t2 = expenses[j]
                d2 = datetime.strptime(t2.transaction_date, "%Y-%m-%d")

                day_diff = abs((d1 - d2).days)
                if day_diff > max_days_diff:
                    # Since sorted by date, transactions further along may or may not be within range,
                    # but continuing search for same date or recent dates
                    continue

                # Condition 1: Same merchant (case-insensitive) or very close merchant
                m1 = t1.merchant.strip().lower()
                m2 = t2.merchant.strip().lower()

                merchant_match = (m1 == m2) or (m1 in m2) or (m2 in m1)
                
                # Condition 2: Exact same amount
                amount_match = abs(t1.amount - t2.amount) < 0.01

                # Condition 3: Not recurring monthly bill (e.g., if day diff is 0 or 1, it's definitely suspicious; if 30 days, it's recurring, not duplicate)
                if merchant_match and amount_match and (t1.id != t2.id):
                    pair_key = tuple(sorted([t1.id, t2.id]))
                    if pair_key in seen_pairs:
                        continue
                    seen_pairs.add(pair_key)

                    if day_diff == 0:
                        reason = f"Identical amount (₹{t1.amount:,.2f}) and same merchant on the exact same day ({t1.transaction_date})."
                    else:
                        reason = f"Identical amount (₹{t1.amount:,.2f}) and same merchant within {day_diff} day(s) of each other ({t1.transaction_date} and {t2.transaction_date})."

                    pair_id = f"{min(t1.id, t2.id)}_{max(t1.id, t2.id)}"

                    # Create or check alert
                    existing_alert = db.query(Alert).filter(
                        Alert.alert_type == "potential_duplicate",
                        Alert.transaction_id == t1.id
                    ).first()

                    if not existing_alert:
                        alert = Alert(
                            transaction_id=t1.id,
                            alert_type="potential_duplicate",
                            severity="warning",
                            title=f"Potential Duplicate: {t1.merchant}",
                            description=reason,
                            recommended_action="Verify your bank/UPI statement to confirm if this was charged twice.",
                        )
                        db.add(alert)

                    candidates.append(
                        DuplicateCandidatePair(
                            id_pair=pair_id,
                            transaction_1=TransactionResponse.from_orm(t1),
                            transaction_2=TransactionResponse.from_orm(t2),
                            similarity_reason=reason,
                            day_difference=day_diff,
                            amount=t1.amount,
                            merchant=t1.merchant,
                            status="potential_duplicate"
                        )
                    )
                    total_flagged_amount += t1.amount

        db.commit()

        return DuplicateAnalysisResponse(
            total_potential_duplicates=len(candidates),
            total_flagged_amount=round(total_flagged_amount, 2),
            candidates=candidates
        )

