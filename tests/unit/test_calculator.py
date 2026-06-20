import pytest
from models.schemas import AssessmentRequest
from utils.calculator import calculate_carbon_footprint, get_emission_contributors

def test_calculate_carbon_footprint_low_footprint():
    # Low footprint inputs
    req = AssessmentRequest(
        transportation="Walk",
        electricity="Rarely",
        diet="Vegan",
        shopping="Rarely",
        flights="0",
        notes="Testing low emissions"
    )
    carbon, score = calculate_carbon_footprint(req)
    
    # Assertions
    assert carbon.transportation == 0.0
    assert carbon.electricity == 200.0
    assert carbon.food == 500.0
    assert carbon.shopping == 100.0
    assert carbon.travel == 0.0
    assert carbon.total == 800.0
    
    # Deductions: Walk(0) + Rarely(0) + Vegan(0) + Rarely(0) + Flights(0) = 0. Score = 100
    assert score == 100

def test_calculate_carbon_footprint_high_footprint():
    # High footprint inputs
    req = AssessmentRequest(
        transportation="Car",
        electricity="8+ Hours",
        diet="Meat Heavy",
        shopping="Frequently",
        flights="5+",
        notes="Testing high emissions"
    )
    carbon, score = calculate_carbon_footprint(req)
    
    # Assertions
    assert carbon.transportation == 3000.0
    assert carbon.electricity == 3500.0
    assert carbon.food == 4000.0
    assert carbon.shopping == 2000.0
    assert carbon.travel == 9000.0
    assert carbon.total == 21500.0
    
    # Deductions: Car(20) + 8+ hrs(25) + Meat Heavy(25) + Frequently(20) + 5+ flights(30) = 120. Score = max(0, 100 - 120) = 0
    assert score == 0

def test_calculate_carbon_footprint_mixed():
    req = AssessmentRequest(
        transportation="Public Transport",
        electricity="1–4 Hours",
        diet="Vegetarian",
        shopping="Weekly",
        flights="1–2",
        notes="Testing mixed emissions"
    )
    carbon, score = calculate_carbon_footprint(req)
    
    assert carbon.transportation == 500.0
    assert carbon.electricity == 800.0
    assert carbon.food == 1000.0
    assert carbon.shopping == 800.0
    assert carbon.travel == 1500.0
    assert carbon.total == 4600.0
    
    # Deductions: Public(5) + 1-4h(5) + Veg(5) + Weekly(15) + 1-2(10) = 40. Score = 60
    assert score == 60

def test_get_emission_contributors():
    req = AssessmentRequest(
        transportation="Car", # 3000
        electricity="Rarely", # 200
        diet="Vegan", # 500
        shopping="Frequently", # 2000
        flights="0", # 0
        notes=""
    )
    carbon, _ = calculate_carbon_footprint(req)
    largest, medium, low = get_emission_contributors(carbon)
    
    assert largest == "Transportation Habits"
    assert "Shopping & Consumer Habits" in medium
    assert "Dietary Choices" in medium
    assert "Flight Travel" in low
    assert "Electricity Consumption" in low
