import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from sklearn.ensemble import IsolationForest

from app.ml.feature_engineering import FeatureEngineering
from app.models.models import Transaction, AnomalyLog, Alert
from app.schemas.schemas import AnomalyItem, AnomalyAnalysisResponse
from sqlalchemy.orm import Session

class TransactionAnomalyDetector:
    def __init__(self, contamination: float = 0.05, min_samples: int = 20, random_state: int = 42):
        self.contamination = contamination
        self.min_samples = min_samples
        self.random_state = random_state
        self.model = IsolationForest(
            contamination=self.contamination,
            random_state=self.random_state,
            n_estimators=100,
            n_jobs=-1
        )
        self.is_fitted = False

    def run_detection(self, db: Session) -> AnomalyAnalysisResponse:
        """
        Evaluate expense transactions using Isolation Forest machine learning model.
        Returns detailed anomaly scoring, feature attribution, and actionable explanations.
        """
        # Fetch expense transactions
        expenses = db.query(Transaction).filter(
            Transaction.transaction_type == "expense"
        ).order_by(Transaction.transaction_date.desc()).all()

        total_txns = len(expenses)

        # Honest small dataset check:
        if total_txns < self.min_samples:
            return AnomalyAnalysisResponse(
                total_evaluated=total_txns,
                anomalies_detected=0,
                model_trained=False,
                contamination=self.contamination,
                message=f"Insufficient transaction history ({total_txns}/{self.min_samples} required). Load demo data or import at least {self.min_samples} expense records to train the Isolation Forest model.",
                anomalies=[]
            )

        # Feature extraction
        df, X, cat_means = FeatureEngineering.extract_features(expenses)

        # Fit Isolation Forest
        self.model.fit(X)
        self.is_fitted = True

        # Decision function: average anomaly score of base estimators.
        # Lower score = more abnormal. Negative values are treated as outliers.
        decision_scores = self.model.decision_function(X)
        predictions = self.model.predict(X)  # -1 for anomaly, 1 for normal

        df["decision_score"] = decision_scores
        df["is_anomaly"] = predictions == -1

        # Clear old anomaly logs to keep database synchronized with latest model run
        db.query(AnomalyLog).delete()

        anomaly_items: List[AnomalyItem] = []

        # Filter detected anomalies
        anomaly_df = df[df["is_anomaly"]].sort_values(by="decision_score")

        for _, row in anomaly_df.iterrows():
            txn_id = int(row["id"])
            amount = float(row["amount"])
            category = str(row["category"])
            merchant = str(row["merchant"])
            txn_date = str(row["transaction_date"])
            dec_score = float(row["decision_score"])
            ratio = float(row["relative_amount_ratio"])
            cat_mean = float(cat_means.get(category, amount))

            # Risk level and human-readable explanation
            if dec_score < -0.15 or ratio >= 4.0:
                risk_level = "high"
            elif dec_score < -0.05 or ratio >= 2.0:
                risk_level = "medium"
            else:
                risk_level = "low"

            reasons = []
            if ratio >= 2.0:
                reasons.append(f"Spending of ₹{amount:,.2f} is {ratio:.1f}x higher than your typical average for '{category}' (₹{cat_mean:,.2f})")
            if row["merchant_frequency"] <= 1:
                reasons.append(f"Infrequent or first-time transaction with merchant '{merchant}'")
            if row["category_zscore"] > 2.5:
                reasons.append(f"Unusually high statistical variance in your {category} spending patterns")

            if not reasons:
                reasons.append(f"Transaction exhibits abnormal feature distribution in Isolation Forest decision trees (score: {dec_score:.3f})")

            full_reason = ". ".join(reasons) + "."

            rec_action = (
                "Review this transaction in your banking app. If authorized, you may acknowledge this alert; "
                "otherwise verify invoice and merchant authenticity."
            )

            # Persist Anomaly Log in DB
            anomaly_log = AnomalyLog(
                transaction_id=txn_id,
                anomaly_score=round(dec_score, 4),
                risk_level=risk_level,
                reason=full_reason,
                category_baseline=round(cat_mean, 2),
            )
            db.add(anomaly_log)

            # Ensure Alert exists in Alert table
            existing_alert = db.query(Alert).filter(
                Alert.alert_type == "unusual_transaction",
                Alert.transaction_id == txn_id
            ).first()

            if not existing_alert:
                alert = Alert(
                    transaction_id=txn_id,
                    alert_type="unusual_transaction",
                    severity="high" if risk_level == "high" else "warning",
                    title=f"Unusual Spend: {merchant} (₹{amount:,.2f})",
                    description=full_reason,
                    recommended_action=rec_action,
                )
                db.add(alert)

            anomaly_items.append(
                AnomalyItem(
                    transaction_id=txn_id,
                    merchant=merchant,
                    category=category,
                    amount=amount,
                    transaction_date=txn_date,
                    anomaly_score=round(dec_score, 4),
                    risk_level=risk_level,
                    reason=full_reason,
                    category_baseline=round(cat_mean, 2),
                    recommended_action=rec_action,
                )
            )

        db.commit()

        return AnomalyAnalysisResponse(
            total_evaluated=total_txns,
            anomalies_detected=len(anomaly_items),
            model_trained=True,
            contamination=self.contamination,
            message=f"Isolation Forest successfully trained on {total_txns} expense records. Identified {len(anomaly_items)} statistical outliers.",
            anomalies=anomaly_items
        )

