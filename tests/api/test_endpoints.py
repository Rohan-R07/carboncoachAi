import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app import app
from services.db_service import DatabaseService
from models.schemas import AnalysisResponse, RoadmapResponse, RoadmapItem, AIQuestion

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_db_fixture():
    db = DatabaseService()
    db.reset_db()
    yield
    db.reset_db()

@pytest.fixture(autouse=True)
def mock_huggingface_service():
    with patch("routes.endpoints.huggingface_service.analyze_lifestyle") as mock_analyze, \
         patch("routes.endpoints.huggingface_service.generate_roadmap") as mock_roadmap, \
         patch("routes.endpoints.huggingface_service.generate_chat_response") as mock_chat, \
         patch("routes.endpoints.huggingface_service.generate_assessment_questions") as mock_questions:
         
         mock_analyze.return_value = AnalysisResponse(
             summary="AI Generated summary",
             profile="AI Generated profile",
             observations=["Observation 1", "Observation 2"]
         )
         
         mock_roadmap.return_value = RoadmapResponse(
             week1=RoadmapItem(action="Action 1", goal="Goal 1", outcome="Outcome 1"),
             week2=RoadmapItem(action="Action 2", goal="Goal 2", outcome="Outcome 2"),
             week3=RoadmapItem(action="Action 3", goal="Goal 3", outcome="Outcome 3"),
             week4=RoadmapItem(action="Action 4", goal="Goal 4", outcome="Outcome 4")
         )
         
         mock_chat.return_value = "AI chatbot reply"
         
         mock_questions.return_value = [
             AIQuestion(id="transportation", title="T", description="D", options=["Walk", "Bicycle", "Public Transport", "Car"]),
             AIQuestion(id="electricity", title="E", description="D", options=["Rarely", "1–4 Hours", "4–8 Hours", "8+ Hours"]),
             AIQuestion(id="diet", title="D", description="D", options=["Vegan", "Vegetarian", "Mixed", "Meat Heavy"]),
             AIQuestion(id="shopping", title="S", description="D", options=["Rarely", "Monthly", "Weekly", "Frequently"]),
             AIQuestion(id="flights", title="F", description="D", options=["0", "1–2", "3–5", "5+"])
         ]
         
         yield

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["app"] == "CarbonCoach AI API"

def test_full_workflow():
    # 1. Dashboard empty state
    dashboard_res = client.get("/api/dashboard")
    assert dashboard_res.status_code == 200
    assert dashboard_res.json()["has_assessment"] is False

    # 2. Submit assessment
    payload = {
        "transportation": "Car",
        "electricity": "4–8 Hours",
        "diet": "Mixed",
        "shopping": "Weekly",
        "flights": "1–2",
        "notes": "Regular commuting habits."
    }
    assessment_res = client.post("/api/assessment", json=payload)
    assert assessment_res.status_code == 200
    data = assessment_res.json()
    assert data["carbon_data"]["total"] > 0
    assert data["eco_score"] > 0

    # 3. Analyze lifestyle (Hugging Face integration, mock fallback will run)
    analyze_res = client.post("/api/analyze")
    assert analyze_res.status_code == 200
    assert "summary" in analyze_res.json()

    # 4. Generate roadmap
    roadmap_res = client.post("/api/roadmap")
    assert roadmap_res.status_code == 200
    assert "week1" in roadmap_res.json()

    # 5. Fetch recommendations
    recs_res = client.post("/api/recommendations")
    assert recs_res.status_code == 200
    assert len(recs_res.json()) >= 3

    # 6. Fetch Dashboard again (populated state)
    dashboard_res2 = client.get("/api/dashboard")
    assert dashboard_res2.status_code == 200
    dash_data = dashboard_res2.json()
    assert dash_data["has_assessment"] is True
    assert dash_data["eco_score"] == data["eco_score"]
    assert dash_data["roadmap"] is not None

    # 7. Complete challenge
    challenges_before = dash_data["challenges"]
    first_challenge_id = challenges_before[0]["id"]
    
    complete_res = client.post("/api/challenge/complete", json={"challenge_id": first_challenge_id})
    assert complete_res.status_code == 200
    complete_data = complete_res.json()
    assert complete_data["success"] is True
    assert complete_data["eco_points"] > 0
    
    # Verify first challenge is marked completed
    assert complete_data["challenges"][0]["completed"] is True

    # 8. Interactive chat
    chat_res = client.post("/api/chat", json={"message": "Should I purchase an EV?"})
    assert chat_res.status_code == 200
    assert "response" in chat_res.json()
    assert len(chat_res.json()["response"]) > 0

    # 9. Get progress trends
    progress_res = client.get("/api/progress")
    assert progress_res.status_code == 200
    assert len(progress_res.json()) == 1

    # 10. Fetch questions
    questions_res = client.get("/api/questions")
    assert questions_res.status_code == 200
    assert len(questions_res.json()) == 5
    assert questions_res.json()[0]["id"] == "transportation"

    # 11. Reset data
    reset_res = client.post("/api/reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["success"] is True

    # 12. Verify dashboard is back to empty state
    dashboard_res_empty = client.get("/api/dashboard")
    assert dashboard_res_empty.status_code == 200
    assert dashboard_res_empty.json()["has_assessment"] is False
