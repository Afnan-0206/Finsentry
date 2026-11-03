import numpy as np
import pandas as pd
from datetime import datetime
from typing import List, Tuple, Dict, Any
from app.models.models import Transaction

class FeatureEngineering:
    @staticmethod
    def extract_features(transactions: List[Transaction]) -> Tuple[pd.DataFrame, np.ndarray, Dict[str, float]]:
        """
        Extract meaningful numerical features for Isolation Forest anomaly detection.
        Returns:
            - DataFrame with metadata and computed columns
            - Numpy array X formatted for Scikit-learn
            - Category baseline dictionary (mean amounts per category)
        """
        records = []
        for t in transactions:
            try:
                dt = datetime.strptime(t.transaction_date, "%Y-%m-%d")
                day_of_week = dt.weekday()  # 0=Monday, 6=Sunday
                day_of_month = dt.day
            except Exception:
                day_of_week = 2
                day_of_month = 15

            records.append({
                "id": t.id,
                "merchant": t.merchant,
                "category": t.category,
                "amount": float(t.amount),
                "transaction_date": t.transaction_date,
                "day_of_week": day_of_week,
                "day_of_month": day_of_month,
            })

        df = pd.DataFrame(records)
        if df.empty:
            return df, np.empty((0, 6)), {}

        # 1. Log transform of amount (handles long right-tailed spend distributions)
        df["log_amount"] = np.log1p(df["amount"])

        # 2. Merchant transaction frequency count
        merchant_counts = df["merchant"].value_counts().to_dict()
        df["merchant_frequency"] = df["merchant"].map(merchant_counts)

        # 3. Category baseline: mean and standard deviation per category
        category_stats = df.groupby("category")["amount"].agg(["mean", "std"]).to_dict()
        cat_mean_dict = category_stats["mean"]
        cat_std_dict = category_stats["std"]

        df["category_mean"] = df["category"].map(cat_mean_dict).fillna(df["amount"].mean())
        df["category_std"] = df["category"].map(cat_std_dict).fillna(1.0).replace(0.0, 1.0)

        # 4. Relative to category mean ratio
        df["relative_amount_ratio"] = df["amount"] / (df["category_mean"] + 1e-5)

        # 5. Z-score deviation within category
        df["category_zscore"] = (df["amount"] - df["category_mean"]) / df["category_std"]

        # Feature matrix columns for Isolation Forest
        feature_cols = [
            "log_amount",
            "day_of_week",
            "day_of_month",
            "merchant_frequency",
            "relative_amount_ratio",
            "category_zscore",
        ]

        # Replace any infs or NaNs
        X = df[feature_cols].replace([np.inf, -np.inf], 0).fillna(0).values

        return df, X, cat_mean_dict

