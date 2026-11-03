from app.services.categorization_service import CategorizationService

def test_merchant_direct_categorization():
    res = CategorizationService.categorize("SWIGGY ORDER 78291", "Swiggy")
    assert res.category == "Food"
    assert res.confidence >= 0.90
    assert "Swiggy" in res.explanation or "swiggy" in res.explanation

    res_uber = CategorizationService.categorize("UBER TRIP BANGALORE", "Uber")
    assert res_uber.category == "Transportation"
    assert res_uber.confidence >= 0.90

    res_nflx = CategorizationService.categorize("NETFLIX MONTHLY PLAN", "Netflix")
    assert res_nflx.category == "Subscriptions"
    assert res_nflx.confidence >= 0.95

    res_salary = CategorizationService.categorize("MONTHLY SALARY CREDIT FOR OCT", "Infosys")
    assert res_salary.category == "Salary"

def test_keyword_rule_matching():
    res = CategorizationService.categorize("electricity bill payment for home", "State Power")
    assert res.category == "Utilities"

    res_groceries = CategorizationService.categorize("instamart vegetables and snacks order", "QuickCart")
    assert res_groceries.category == "Groceries"

def test_unrecognized_description_fallback():
    # Should transparently return 'Other' with lower confidence, never inventing certainty
    res = CategorizationService.categorize("RANDOM UNKNOWN TRANSACTION STRING 98127391")
    assert res.category == "Other"
    assert res.confidence <= 0.50
    assert res.method == "default_fallback"

