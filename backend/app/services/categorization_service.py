import re
from typing import Dict, Tuple, Optional
from app.schemas.schemas import CategorizeResponse
from app.utils.helpers import CATEGORIES

# Common Indian & Global merchants mapped to category with high confidence
MERCHANT_DIRECT_MAP = {
    # Food
    "swiggy": ("Food", 0.98, "Recognized food delivery platform"),
    "zomato": ("Food", 0.98, "Recognized food delivery platform"),
    "mcdonalds": ("Food", 0.95, "Recognized restaurant merchant"),
    "starbucks": ("Food", 0.95, "Recognized cafe / food merchant"),
    "dominos": ("Food", 0.96, "Recognized pizza delivery merchant"),
    "kfc": ("Food", 0.95, "Recognized quick-service restaurant"),
    "chai point": ("Food", 0.95, "Recognized beverage cafe"),
    "burger king": ("Food", 0.95, "Recognized fast food chain"),
    "haldiram": ("Food", 0.94, "Recognized restaurant & snacks merchant"),
    "subway": ("Food", 0.95, "Recognized quick-service restaurant"),

    # Groceries
    "blinkit": ("Groceries", 0.98, "Recognized quick-commerce grocery app"),
    "zepto": ("Groceries", 0.98, "Recognized quick-commerce grocery app"),
    "instamart": ("Groceries", 0.98, "Recognized grocery delivery platform"),
    "bigbasket": ("Groceries", 0.98, "Recognized online supermarket"),
    "nature's basket": ("Groceries", 0.95, "Recognized grocery chain"),
    "dmart": ("Groceries", 0.96, "Recognized supermarket retail store"),
    "spencer's": ("Groceries", 0.94, "Recognized supermarket store"),
    "more retail": ("Groceries", 0.92, "Recognized grocery retail chain"),

    # Transportation
    "uber": ("Transportation", 0.97, "Recognized ridesharing merchant"),
    "ola": ("Transportation", 0.97, "Recognized ridesharing merchant"),
    "rapido": ("Transportation", 0.96, "Recognized bike-taxi / commute platform"),
    "irctc": ("Transportation", 0.98, "Indian railway ticketing authority"),
    "makemytrip": ("Travel", 0.94, "Travel and flight booking platform"),
    "indigo": ("Travel", 0.96, "Airline carrier ticket booking"),
    "metro rail": ("Transportation", 0.98, "Public transit metro agency"),
    "fastag": ("Transportation", 0.96, "Highway toll payment service"),
    "indian oil": ("Transportation", 0.95, "Fuel and petrol pump merchant"),
    "bharat petroleum": ("Transportation", 0.95, "Fuel and petrol pump merchant"),
    "hpcl": ("Transportation", 0.95, "Fuel and petrol pump merchant"),

    # Shopping
    "amazon": ("Shopping", 0.95, "Major e-commerce retail platform"),
    "flipkart": ("Shopping", 0.95, "Major e-commerce marketplace"),
    "myntra": ("Shopping", 0.96, "Fashion e-commerce retailer"),
    "ajio": ("Shopping", 0.95, "Fashion retail merchant"),
    "croma": ("Shopping", 0.94, "Electronics retail chain"),
    "vijay sales": ("Shopping", 0.94, "Electronics retail chain"),
    "ikea": ("Shopping", 0.95, "Home furnishing and decor store"),
    "zara": ("Shopping", 0.95, "Apparel and clothing retail"),
    "h&m": ("Shopping", 0.95, "Apparel and clothing retail"),

    # Entertainment
    "pvr": ("Entertainment", 0.97, "Cinema theater chain"),
    "inox": ("Entertainment", 0.97, "Cinema theater chain"),
    "bookmyshow": ("Entertainment", 0.98, "Movie and events ticketing portal"),
    "steam": ("Entertainment", 0.96, "Digital gaming platform"),
    "playstation": ("Entertainment", 0.96, "Digital gaming subscription/store"),

    # Subscriptions
    "netflix": ("Subscriptions", 0.99, "Video streaming subscription"),
    "spotify": ("Subscriptions", 0.99, "Music streaming subscription"),
    "youtube premium": ("Subscriptions", 0.99, "Digital media recurring subscription"),
    "hotstar": ("Subscriptions", 0.98, "OTT streaming service subscription"),
    "disney+": ("Subscriptions", 0.98, "OTT streaming subscription"),
    "prime video": ("Subscriptions", 0.97, "Video streaming subscription"),
    "apple music": ("Subscriptions", 0.98, "Music streaming service"),
    "google one": ("Subscriptions", 0.98, "Cloud storage subscription"),
    "icloud": ("Subscriptions", 0.98, "Cloud storage subscription"),
    "github": ("Subscriptions", 0.95, "Developer tools subscription"),
    "chatgpt": ("Subscriptions", 0.98, "AI software recurring subscription"),
    "openai": ("Subscriptions", 0.97, "AI subscription / API billing"),

    # Utilities
    "bescom": ("Utilities", 0.98, "Electricity distribution utility"),
    "tneb": ("Utilities", 0.98, "Electricity board utility"),
    "tatapower": ("Utilities", 0.98, "Electric utility service"),
    "adanigas": ("Utilities", 0.98, "Piped gas utility service"),
    "indane gas": ("Utilities", 0.98, "LPG cooking cylinder provider"),
    "airtel broadband": ("Utilities", 0.96, "Broadband internet utility"),
    "jio fiber": ("Utilities", 0.96, "Broadband internet utility"),
    "act fibernet": ("Utilities", 0.97, "Broadband internet utility"),

    # Health
    "apollo pharmacy": ("Health", 0.97, "Pharmacy and healthcare retailer"),
    "medplus": ("Health", 0.97, "Pharmacy and medicine retailer"),
    "pharmeasy": ("Health", 0.96, "Online medicine and diagnostic service"),
    "1mg": ("Health", 0.96, "Online pharmacy and health tests"),
    "cult.fit": ("Health", 0.95, "Fitness and gym membership"),
    "dr lal pathlabs": ("Health", 0.98, "Diagnostic laboratory tests"),

    # Housing
    "nobroker": ("Housing", 0.95, "Rental housing and maintenance portal"),
    "mygate": ("Housing", 0.95, "Society maintenance and housing portal"),

    # Education
    "coursera": ("Education", 0.96, "Online education & certifications"),
    "udemy": ("Education", 0.96, "Online courses marketplace"),
    "udacity": ("Education", 0.96, "Online technical education platform"),

    # Salary / Income
    "salary": ("Salary", 0.99, "Payroll compensation credit"),
    "payroll": ("Salary", 0.99, "Employer payroll transfer"),
    "upwork": ("Freelance", 0.98, "Freelance marketplace payout"),
    "fiverr": ("Freelance", 0.98, "Freelance services payout"),
}

# Regex and keyword rules
KEYWORD_RULES = [
    (r"(salary|payroll|ctc payout|monthly stipend)", "Salary", 0.97, "Salary or payroll keyword detected"),
    (r"(freelance|consulting fee|client payout|stipend)", "Freelance", 0.92, "Freelance/consultancy income keyword detected"),
    (r"(swiggy|zomato|restaurant|cafe|bistro|diner|pizza|burger|bakery|eats|food|canteen|kitchen|dhaba)", "Food", 0.94, "Food & dining keywords found in description"),
    (r"(grocery|supermarket|vegetable|fruit|blinkit|zepto|instamart|bigbasket|provisions|kirana)", "Groceries", 0.95, "Grocery keywords found in description"),
    (r"(uber|ola|rapido|metro|cab|taxi|fuel|petrol|diesel|fastag|parking|toll)", "Transportation", 0.95, "Commute or fuel keywords detected"),
    (r"(flight|airline|hotel|resort|airbnb|booking\.com|irctc|train ticket|travel)", "Travel", 0.92, "Travel or lodging keywords detected"),
    (r"(netflix|spotify|prime|hotstar|youtube|subscription|patreon|sub|membership|recurring)", "Subscriptions", 0.96, "Recurring media/subscription keywords detected"),
    (r"(electricity|water bill|power|bescom|tneb|gas cylinder|broadband|wifi bill|internet bill|dth recharge)", "Utilities", 0.95, "Utility bill keywords detected"),
    (r"(rent|apartment rent|society maintenance|maintenance fee|flat maintenance)", "Housing", 0.96, "Housing/rent keywords detected"),
    (r"(pharmacy|hospital|clinic|doctor|medicine|chemist|lab test|dental|healthcare|diagnostic)", "Health", 0.95, "Healthcare keywords detected"),
    (r"(tuition|college fee|exam fee|udemy|coursera|books|school fee|course)", "Education", 0.93, "Educational expense keywords detected"),
    (r"(amazon|flipkart|myntra|ajio|shopping|clothing|electronics|apparel|footwear)", "Shopping", 0.92, "E-commerce/retail shopping keywords detected"),
    (r"(pvr|inox|cinema|movie|theatre|game|gaming|concert|show|event)", "Entertainment", 0.93, "Entertainment keywords detected"),
]

class CategorizationService:
    @staticmethod
    def categorize(description: str, merchant: Optional[str] = None, amount: Optional[float] = None) -> CategorizeResponse:
        desc_clean = (description or "").lower().strip()
        merch_clean = (merchant or "").lower().strip()
        combined = f"{merch_clean} {desc_clean}".strip()

        # Step 1: Check known merchant exact/prefix mapping
        for m_key, (cat, conf, expl) in MERCHANT_DIRECT_MAP.items():
            if m_key in merch_clean or m_key in desc_clean:
                return CategorizeResponse(
                    category=cat,
                    confidence=conf,
                    method="merchant_directory",
                    explanation=f"{expl} matching '{m_key}'."
                )

        # Step 2: Check regex keyword patterns
        for pattern, cat, conf, expl in KEYWORD_RULES:
            if re.search(pattern, combined):
                return CategorizeResponse(
                    category=cat,
                    confidence=conf,
                    method="rule_based_matcher",
                    explanation=f"{expl} in transaction text."
                )

        # Step 3: Check heuristics based on amount or description structure
        if "bill" in combined or "recharge" in combined:
            return CategorizeResponse(
                category="Utilities",
                confidence=0.75,
                method="heuristic_pattern",
                explanation="Pattern matches bill payment or utility recharge."
            )

        # Fallback for unrecognized descriptions: transparently mark as "Other"
        return CategorizeResponse(
            category="Other",
            confidence=0.40,
            method="default_fallback",
            explanation="No deterministic rule or merchant matched this description. Marked for manual review."
        )

