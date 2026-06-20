import pytest
from models.schemas import AssessmentRequest
from utils.calculator import generate_recommendations

def test_priority_engine_sorting():
    # User with Car commute and Meat Heavy diet
    req = AssessmentRequest(
        transportation="Car",
        electricity="Rarely",
        diet="Meat Heavy",
        shopping="Rarely",
        flights="0"
    )
    
    recs = generate_recommendations(req)
    
    assert len(recs) >= 3
    # Check that it's sorted by priority_score descending
    for i in range(len(recs) - 1):
        assert recs[i].priority_score >= recs[i+1].priority_score

def test_priority_engine_math_logic():
    req = AssessmentRequest(
        transportation="Car",
        electricity="8+ Hours",
        diet="Meat Heavy",
        shopping="Frequently",
        flights="5+"
    )
    recs = generate_recommendations(req)
    
    # Critical recommendations like Flight reduction or Solar power should rank very high
    first = recs[0]
    # Check priority_score formula: impact_score * 3 + (5 - difficulty_score) * 2
    # Verify that the calculated priority matches the saved one
    expected_score = (first.impact_score * 3) + (5 - first.difficulty_score) * 2
    assert first.priority_score == expected_score
