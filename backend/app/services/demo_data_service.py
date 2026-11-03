import random
from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.models.models import (
    Transaction, Subscription, Alert, Recommendation, Budget, AnomalyLog, ChatMessage, ImportBatch
)
from app.core.database import Base, engine
from app.services.subscription_service import SubscriptionService
from app.services.duplicate_service import DuplicateService
from app.services.recommendation_service import RecommendationService
from app.ml.anomaly_model import TransactionAnomalyDetector

class DemoDataService:
    @staticmethod
    def reset_and_seed_demo_data(db: Session) -> Dict[str, Any]:
        """
        Clears existing data and populates a rich, realistic 6-month synthetic dataset (~300 transactions)
        with carefully calibrated Indian fintech scenarios (price hike, duplicate, anomaly, surge, recurring).
        """
        # Ensure all tables exist
        Base.metadata.create_all(bind=engine)

        # 1. Clear existing database records
        db.query(Alert).delete()
        db.query(AnomalyLog).delete()
        db.query(Recommendation).delete()
        db.query(Subscription).delete()
        db.query(ChatMessage).delete()
        db.query(Transaction).delete()
        db.query(Budget).delete()
        db.query(ImportBatch).delete()
        db.commit()

        # Seed initial budgets
        default_budgets = [
            ("Food", 12000.0),
            ("Groceries", 15000.0),
            ("Shopping", 10000.0),
            ("Entertainment", 5000.0),
            ("Transportation", 6000.0),
            ("Utilities", 7000.0),
            ("Housing", 25000.0),
            ("Subscriptions", 3000.0),
        ]
        for cat, limit in default_budgets:
            b = Budget(category=cat, monthly_limit=limit)
            db.add(b)
        db.commit()

        # Anchor dates: 6 months history up to today
        today = datetime.utcnow().date()
        # Seed random generator with fixed seed for exact reproducibility
        rng = random.Random(42)

        transactions_to_add = []

        # ----------------- 1. MONTHLY RECURRING SALARY & RENT -----------------
        for m_offset in range(5, -1, -1):
            # Target month
            year = today.year
            month = today.month - m_offset
            while month <= 0:
                month += 12
                year -= 1

            # Salary on 1st
            sal_date = f"{year:04d}-{month:02d}-01"
            transactions_to_add.append(Transaction(
                merchant="Infosys Technologies Payroll",
                description="Salary Credit for month",
                amount=85000.00,
                transaction_type="income",
                category="Salary",
                payment_method="Net Banking",
                transaction_date=sal_date,
                reference=f"SAL{year}{month:02d}01INFY",
                is_recurring=True
            ))

            # Occasional Freelance Income (months 1, 3, 5)
            if m_offset in [1, 3, 5]:
                fl_date = f"{year:04d}-{month:02d}-14"
                fl_amt = 18500.00 if m_offset == 3 else 22000.00
                transactions_to_add.append(Transaction(
                    merchant="Upwork Escrow Inc",
                    description="Consulting & UI Development Payout",
                    amount=fl_amt,
                    transaction_type="income",
                    category="Freelance",
                    payment_method="Net Banking",
                    transaction_date=fl_date,
                    reference=f"UPW{year}{month:02d}14ESC",
                    is_recurring=False
                ))

            # Rent on 3rd
            rent_date = f"{year:04d}-{month:02d}-03"
            transactions_to_add.append(Transaction(
                merchant="Prestige Oasis Housing Society",
                description="Monthly Apartment Rent & Maintenance",
                amount=24000.00,
                transaction_type="expense",
                category="Housing",
                payment_method="UPI",
                transaction_date=rent_date,
                reference=f"RENT{year}{month:02d}03PRS",
                is_recurring=True
            ))

            # ----------------- 2. RECURRING UTILITIES -----------------
            # Electricity Bill on 8th
            elec_amt = 1650.00 + rng.randint(-120, 180)
            elec_date = f"{year:04d}-{month:02d}-08"
            transactions_to_add.append(Transaction(
                merchant="BESCOM Bangalore",
                description="Electricity Utility Monthly Bill",
                amount=float(elec_amt),
                transaction_type="expense",
                category="Utilities",
                payment_method="UPI",
                transaction_date=elec_date,
                reference=f"BES{year}{month:02d}08",
                is_recurring=True
            ))

            # Airtel Broadband on 12th
            airtel_date = f"{year:04d}-{month:02d}-12"
            transactions_to_add.append(Transaction(
                merchant="Airtel Broadband",
                description="Fiber Internet 200Mbps Plan",
                amount=1179.00,
                transaction_type="expense",
                category="Utilities",
                payment_method="Auto-Debit",
                transaction_date=airtel_date,
                reference=f"AIR{year}{month:02d}12",
                is_recurring=True
            ))

            # ----------------- 3. SUBSCRIPTIONS & SCENARIO A -----------------
            # Spotify on 5th
            spotify_date = f"{year:04d}-{month:02d}-05"
            transactions_to_add.append(Transaction(
                merchant="Spotify India",
                description="Spotify Premium Individual",
                amount=119.00,
                transaction_type="expense",
                category="Subscriptions",
                payment_method="Auto-Debit",
                transaction_date=spotify_date,
                reference=f"SPT{year}{month:02d}05",
                is_recurring=True
            ))

            # Google One on 16th
            g_date = f"{year:04d}-{month:02d}-16"
            transactions_to_add.append(Transaction(
                merchant="Google One",
                description="Google One 100GB Storage Plan",
                amount=130.00,
                transaction_type="expense",
                category="Subscriptions",
                payment_method="Auto-Debit",
                transaction_date=g_date,
                reference=f"GGL{year}{month:02d}16",
                is_recurring=True
            ))

            # Disney+ Hotstar on 22nd
            hotstar_date = f"{year:04d}-{month:02d}-22"
            transactions_to_add.append(Transaction(
                merchant="Disney+ Hotstar",
                description="Hotstar Super Monthly Subscription",
                amount=299.00,
                transaction_type="expense",
                category="Subscriptions",
                payment_method="Auto-Debit",
                transaction_date=hotstar_date,
                reference=f"HST{year}{month:02d}22",
                is_recurring=True
            ))

            # SCENARIO A: Netflix Price Hike
            # In months offset 5, 4, 3, 2: Netflix was ₹499
            # In months offset 1, 0: Netflix increased to ₹649!
            netflix_amt = 649.00 if m_offset <= 1 else 499.00
            netflix_date = f"{year:04d}-{month:02d}-18"
            transactions_to_add.append(Transaction(
                merchant="Netflix Entertainment",
                description="Netflix Standard Plan Monthly",
                amount=netflix_amt,
                transaction_type="expense",
                category="Subscriptions",
                payment_method="Credit Card",
                transaction_date=netflix_date,
                reference=f"NFLX{year}{month:02d}18",
                is_recurring=True
            ))

        # ----------------- 4. DAILY / WEEKLY ROUTINE EXPENSES -----------------
        # Categories: Food, Groceries, Transportation, Shopping, Entertainment, Health
        start_date = today - timedelta(days=180)
        curr_iter = start_date

        food_merchants = [
            ("Swiggy", ["Swiggy Gourmet Dinner", "Swiggy Quick Lunch", "Swiggy Snacks & Chai"], 220, 650),
            ("Zomato", ["Zomato Food Order", "Zomato Delivery Pizza", "Zomato Biryani Lunch"], 280, 780),
            ("Starbucks", ["Starbucks Cafe Latte & Croissant", "Starbucks Cold Brew"], 350, 620),
            ("McDonalds", ["McDonalds Meal & Burger", "McCafe Beverage"], 240, 520),
            ("Chai Point", ["Ginger Chai and Samosa Combo", "Chai Flask Box"], 120, 260),
        ]

        grocery_merchants = [
            ("Blinkit", ["Blinkit Daily Essentials & Dairy", "Blinkit Fresh Fruits & Milk"], 260, 950),
            ("Zepto", ["Zepto 10-Min Groceries", "Zepto Breakfast & Bread"], 210, 840),
            ("BigBasket", ["BigBasket Weekly Supermarket Provisions", "BigBasket Organic Veggies"], 1200, 3200),
            ("Instamart", ["Swiggy Instamart Snack Restock", "Instamart Home Cleaning"], 320, 920),
        ]

        commute_merchants = [
            ("Uber India", ["Uber Premier Ride to Tech Park", "Uber Go Airport Drop"], 180, 540),
            ("Ola Cabs", ["Ola Mini Commute", "Ola Auto Ride"], 120, 320),
            ("Rapido", ["Rapido Bike Taxi Office Commute"], 60, 140),
            ("Indian Oil", ["Fuel / Petrol filling - Car", "Petrol Bike Refuel"], 1200, 2500),
            ("Fastag ICICI", ["Highway Fastag Toll Electronic Debit"], 85, 240),
        ]

        shopping_merchants = [
            ("Amazon India", ["Amazon Electronics Cable", "Amazon Home Organizer", "Amazon Books Order"], 450, 1850),
            ("Myntra", ["Myntra Casual Shirts & T-Shirt", "Myntra Footwear Sale"], 890, 2490),
            ("Flipkart", ["Flipkart Kitchenware & Tools", "Flipkart Mobile Accessories"], 550, 1650),
        ]

        entertainment_merchants = [
            ("BookMyShow", ["PVR Cinemas IMAX Movie Tickets", "Inox Popcorn & Drinks Combo"], 450, 1400),
            ("Steam Games", ["Steam Winter Indie Game Purchase"], 499, 1299),
        ]

        health_merchants = [
            ("Apollo Pharmacy", ["Apollo Prescription Medicines & Vitamins", "Apollo First Aid Supplies"], 320, 1250),
            ("Cult.fit", ["Cult Pass Elite Gym Membership"], 1800, 1800),
            ("Pharmeasy", ["Monthly Health Diagnostics & Supplements"], 650, 1600),
        ]

        day_step = 0
        while curr_iter <= today:
            day_step += 1
            d_str = curr_iter.strftime("%Y-%m-%d")

            # SCENARIO D: Food Spending Surge in the latest 30 days
            # If within last 25 days, user orders food more frequently (1-2 times daily)
            days_ago = (today - curr_iter).days
            food_prob = 0.85 if days_ago <= 25 else 0.45

            if rng.random() < food_prob:
                m_name, m_descs, min_a, max_a = rng.choice(food_merchants)
                amt = float(rng.randint(min_a, max_a))
                # Add higher prices during surge
                if days_ago <= 25:
                    amt = round(amt * 1.35, 2)
                transactions_to_add.append(Transaction(
                    merchant=m_name,
                    description=rng.choice(m_descs),
                    amount=amt,
                    transaction_type="expense",
                    category="Food",
                    payment_method=rng.choice(["UPI", "UPI", "Credit Card"]),
                    transaction_date=d_str,
                    reference=f"UPI{d_str.replace('-', '')}{rng.randint(1000, 9999)}",
                    is_recurring=False
                ))

            # Groceries every ~3-4 days
            if day_step % 3 == 0:
                m_name, m_descs, min_a, max_a = rng.choice(grocery_merchants)
                amt = float(rng.randint(min_a, max_a))
                transactions_to_add.append(Transaction(
                    merchant=m_name,
                    description=rng.choice(m_descs),
                    amount=amt,
                    transaction_type="expense",
                    category="Groceries",
                    payment_method=rng.choice(["UPI", "Debit Card"]),
                    transaction_date=d_str,
                    reference=f"GROC{d_str.replace('-', '')}{rng.randint(1000, 9999)}",
                    is_recurring=False
                ))

            # Transportation on weekdays
            if curr_iter.weekday() < 5 and rng.random() < 0.60:
                m_name, m_descs, min_a, max_a = rng.choice(commute_merchants)
                amt = float(rng.randint(min_a, max_a))
                transactions_to_add.append(Transaction(
                    merchant=m_name,
                    description=rng.choice(m_descs),
                    amount=amt,
                    transaction_type="expense",
                    category="Transportation",
                    payment_method="UPI",
                    transaction_date=d_str,
                    reference=f"TRN{d_str.replace('-', '')}{rng.randint(1000, 9999)}",
                    is_recurring=False
                ))

            # Shopping occasional
            if rng.random() < 0.15:
                m_name, m_descs, min_a, max_a = rng.choice(shopping_merchants)
                amt = float(rng.randint(min_a, max_a))
                transactions_to_add.append(Transaction(
                    merchant=m_name,
                    description=rng.choice(m_descs),
                    amount=amt,
                    transaction_type="expense",
                    category="Shopping",
                    payment_method="Credit Card",
                    transaction_date=d_str,
                    reference=f"SHP{d_str.replace('-', '')}{rng.randint(1000, 9999)}",
                    is_recurring=False
                ))

            # Entertainment on weekends
            if curr_iter.weekday() >= 5 and rng.random() < 0.35:
                m_name, m_descs, min_a, max_a = rng.choice(entertainment_merchants)
                amt = float(rng.randint(min_a, max_a))
                transactions_to_add.append(Transaction(
                    merchant=m_name,
                    description=rng.choice(m_descs),
                    amount=amt,
                    transaction_type="expense",
                    category="Entertainment",
                    payment_method="Credit Card",
                    transaction_date=d_str,
                    reference=f"ENT{d_str.replace('-', '')}{rng.randint(1000, 9999)}",
                    is_recurring=False
                ))

            # Healthcare occasional
            if rng.random() < 0.08:
                m_name, m_descs, min_a, max_a = rng.choice(health_merchants)
                amt = float(rng.randint(min_a, max_a))
                transactions_to_add.append(Transaction(
                    merchant=m_name,
                    description=rng.choice(m_descs),
                    amount=amt,
                    transaction_type="expense",
                    category="Health",
                    payment_method="UPI",
                    transaction_date=d_str,
                    reference=f"MED{d_str.replace('-', '')}{rng.randint(1000, 9999)}",
                    is_recurring=False
                ))

            curr_iter += timedelta(days=1)

        # ----------------- 5. SCENARIO B: POTENTIAL DUPLICATE PAYMENT -----------------
        # Two identical Amazon transactions on the same day (or 1 day apart)
        dup_date = (today - timedelta(days=8)).strftime("%Y-%m-%d")
        transactions_to_add.append(Transaction(
            merchant="Amazon India",
            description="Amazon Order - Soundcore Wireless Headphones",
            amount=1299.00,
            transaction_type="expense",
            category="Shopping",
            payment_method="Credit Card",
            transaction_date=dup_date,
            reference="AMZ9832187121",
            is_recurring=False
        ))
        transactions_to_add.append(Transaction(
            merchant="Amazon India",
            description="Amazon Order - Soundcore Wireless Headphones",
            amount=1299.00,
            transaction_type="expense",
            category="Shopping",
            payment_method="Credit Card",
            transaction_date=dup_date,
            reference="AMZ9832187122",
            is_recurring=False
        ))

        # ----------------- 6. SCENARIO C: UNUSUAL PURCHASE (ML ANOMALY) -----------------
        # User who typically spends ₹500-₹2,000 on Shopping makes a ₹18,500 purchase
        anomaly_date = (today - timedelta(days=12)).strftime("%Y-%m-%d")
        transactions_to_add.append(Transaction(
            merchant="Croma Electronics",
            description="Croma Retail Store - Sony WH-1000XM5 ANC Headset",
            amount=18500.00,
            transaction_type="expense",
            category="Shopping",
            payment_method="Credit Card",
            transaction_date=anomaly_date,
            reference="CROMA99213456",
            is_recurring=False
        ))

        # Save all transactions
        db.add_all(transactions_to_add)
        db.commit()

        # Run intelligence modules on the freshly loaded data
        # A. Subscription detection
        sub_res = SubscriptionService.detect_and_update_subscriptions(db)

        # B. Duplicate detection
        dup_res = DuplicateService.detect_potential_duplicates(db)

        # C. Isolation Forest Anomaly model
        detector = TransactionAnomalyDetector(contamination=0.04, min_samples=20)
        anomaly_res = detector.run_detection(db)

        # D. Recommendations
        recs = RecommendationService.generate_recommendations(db)

        total_txns = db.query(Transaction).count()

        return {
            "status": "success",
            "message": f"FinSentry AI demo data initialized successfully with {total_txns} transactions spanning 6 months.",
            "total_transactions": total_txns,
            "subscriptions_detected": sub_res.total_subscriptions_detected,
            "price_increases": sub_res.price_increases_detected,
            "potential_duplicates": dup_res.total_potential_duplicates,
            "anomalies_detected": anomaly_res.anomalies_detected,
            "recommendations_generated": len(recs),
        }
