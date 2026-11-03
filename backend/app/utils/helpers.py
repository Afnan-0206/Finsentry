import re
from datetime import datetime
from typing import List

CATEGORIES: List[str] = [
    "Food",
    "Groceries",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Education",
    "Health",
    "Utilities",
    "Housing",
    "Subscriptions",
    "Travel",
    "Salary",
    "Freelance",
    "Other",
]

PAYMENT_METHODS: List[str] = [
    "UPI",
    "Credit Card",
    "Debit Card",
    "Net Banking",
    "Cash",
    "Auto-Debit",
]

def format_inr(amount: float) -> str:
    """Format float into Indian Rupee style, e.g. ₹18,500.00 or -₹1,250.00"""
    prefix = "₹"
    if amount < 0:
        prefix = "-₹"
        amount = abs(amount)
        
    s = f"{amount:.2f}"
    parts = s.split(".")
    integer_part = parts[0]
    decimal_part = parts[1]

    if len(integer_part) <= 3:
        formatted = integer_part
    else:
        last3 = integer_part[-3:]
        other = integer_part[:-3]
        other_grouped = []
        while len(other) > 2:
            other_grouped.insert(0, other[-2:])
            other = other[:-2]
        if other:
            other_grouped.insert(0, other)
        formatted = ",".join(other_grouped) + "," + last3

    return f"{prefix}{formatted}.{decimal_part}"

def clean_text(text: str) -> str:
    """Clean and normalize merchant/description text"""
    if not text:
        return ""
    text = text.strip()
    text = re.sub(r'\s+', ' ', text)
    return text

def parse_date(date_str: str) -> str:
    """Standardize date into YYYY-MM-DD format"""
    formats = [
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%Y/%m/%d",
        "%d %b %Y",
        "%d %B %Y",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    # Default fallback
    return datetime.utcnow().strftime("%Y-%m-%d")

