import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from models.schemas import (
    AssessmentRequest,
    AssessmentResponse,
    AnalysisResponse,
    RoadmapResponse,
    Recommendation,
    Challenge,
    ChallengeCompleteRequest,
    ChallengeCompleteResponse,
    ChatRequest,
    ChatResponse,
    DashboardResponse,
    CarbonData,
    AIQuestion
)
from services.db_service import DatabaseService
from services.huggingface_service import HuggingFaceService
from utils.calculator import (
    calculate_carbon_footprint,
    get_emission_contributors,
    generate_recommendations
)
from utils.security import rate_limit_dependency, sanitize_text

router = APIRouter(prefix="/api")

# Singletons / Providers
db_service = DatabaseService()
huggingface_service = HuggingFaceService()

def get_db() -> DatabaseService:
    return db_service

def get_huggingface() -> HuggingFaceService:
    return huggingface_service

@router.post(
    "/assessment",
    response_model=AssessmentResponse,
    dependencies=[Depends(rate_limit_dependency)]
)
async def submit_assessment(
    req: AssessmentRequest,
    db: DatabaseService = Depends(get_db)
):
    """
    Submits user lifestyle assessment. Calculates scores, ranks emissions,
    generates recommendations, and saves to database.
    """
    # 1. Core Rule-based Calculation
    carbon_data, eco_score = calculate_carbon_footprint(req)
    largest, medium, low = get_emission_contributors(carbon_data)
    
    # 2. Priority engine recommendations
    recs = generate_recommendations(req)
    db_recs = [r.model_dump() for r in recs]
    
    # 3. Store in Database
    assessment_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    assessment_dict = {
        "id": assessment_id,
        "timestamp": timestamp,
        "transportation": req.transportation,
        "electricity": req.electricity,
        "diet": req.diet,
        "shopping": req.shopping,
        "flights": req.flights,
        "notes": sanitize_text(req.notes),
        "carbon_data": carbon_data.model_dump(),
        "eco_score": eco_score,
        "largest_contributor": largest,
        "medium_contributors": medium,
        "low_contributors": low
    }
    
    db.save_assessment(assessment_dict)
    db.save_recommendations(db_recs)
    
    return AssessmentResponse(**assessment_dict)

@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    dependencies=[Depends(rate_limit_dependency)]
)
async def analyze_lifestyle(
    db: DatabaseService = Depends(get_db),
    huggingface: HuggingFaceService = Depends(get_huggingface)
):
    """
    Calls Hugging Face API to analyze current lifestyle and generate observations.
    """
    latest = db.get_latest_assessment()
    if not latest:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No assessment data found. Please complete the assessment form first."
        )
    
    req = AssessmentRequest(
        transportation=latest["transportation"],
        electricity=latest["electricity"],
        diet=latest["diet"],
        shopping=latest["shopping"],
        flights=latest["flights"],
        notes=latest["notes"]
    )
    
    try:
        analysis = huggingface.analyze_lifestyle(req)
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post(
    "/roadmap",
    response_model=RoadmapResponse,
    dependencies=[Depends(rate_limit_dependency)]
)
async def generate_roadmap(
    db: DatabaseService = Depends(get_db),
    huggingface: HuggingFaceService = Depends(get_huggingface)
):
    """
    Generates and saves the personalized 30-day roadmap.
    """
    latest = db.get_latest_assessment()
    if not latest:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No assessment data found. Please complete the assessment form first."
        )
    
    req = AssessmentRequest(
        transportation=latest["transportation"],
        electricity=latest["electricity"],
        diet=latest["diet"],
        shopping=latest["shopping"],
        flights=latest["flights"],
        notes=latest["notes"]
    )
    
    try:
        roadmap = huggingface.generate_roadmap(req)
        db.save_roadmap(roadmap.model_dump())
        return roadmap
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/recommendations", response_model=List[Recommendation])
async def fetch_recommendations(db: DatabaseService = Depends(get_db)):
    """
    Retrieves the mathematically sorted recommendation list.
    """
    recs = db.get_recommendations()
    return [Recommendation(**r) for r in recs]

@router.post("/challenge/complete", response_model=ChallengeCompleteResponse)
async def complete_eco_challenge(
    req: ChallengeCompleteRequest,
    db: DatabaseService = Depends(get_db)
):
    """
    Marks an eco challenge as complete, earning eco points.
    """
    res = db.complete_challenge(req.challenge_id)
    if not res["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Challenge already completed or not found."
        )
    
    return ChallengeCompleteResponse(
        success=True,
        eco_points=res["eco_points"],
        challenges=[Challenge(**c) for c in res["challenges"]]
    )

@router.post(
    "/chat",
    response_model=ChatResponse,
    dependencies=[Depends(rate_limit_dependency)]
)
async def chat_interaction(
    req: ChatRequest,
    db: DatabaseService = Depends(get_db),
    huggingface: HuggingFaceService = Depends(get_huggingface)
):
    """
    Secure chatbot endpoint with input sanitization and prompt injection mitigation.
    """
    sanitized_msg = sanitize_text(req.message)
    if not sanitized_msg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or empty chat message."
        )

    # 1. Fetch Context
    latest_assessment = db.get_latest_assessment()
    history = db.get_chat_history()
    
    # 2. Get AI Response
    ai_reply = huggingface.generate_chat_response(sanitized_msg, latest_assessment, history)
    
    # 3. Log History
    db.add_chat_message("user", sanitized_msg)
    db.add_chat_message("assistant", ai_reply)
    
    return ChatResponse(response=ai_reply)

@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard_summary(db: DatabaseService = Depends(get_db)):
    """
    Aggregates stats for the dashboard: Carbon score, forecast, points, and challenges.
    """
    latest = db.get_latest_assessment()
    if not latest:
        # Return empty state
        return DashboardResponse(
            has_assessment=False,
            eco_score=100,
            annual_footprint=0.0,
            reduction_forecast_percent=0.0,
            eco_points=db.get_eco_points(),
            challenges=[Challenge(**c) for c in db.get_challenges()],
            recommendations=[],
            roadmap=None,
            improvement_metrics="Complete your first assessment to initialize your dashboard."
        )
    
    # Calculate reduction forecast mathematically:
    # reduction_forecast_percent = (sum of active recommendation reductions / total baseline footprint) * 100
    recs = db.get_recommendations()
    total_reduction = sum([r.get("reduction", 0) for r in recs[:3]]) # top 3 recommendations
    base_total = latest["carbon_data"]["total"]
    
    reduction_forecast = 0.0
    if base_total > 0:
        reduction_forecast = round((total_reduction / base_total) * 100, 1)
        # Cap forecast percent to 80% to keep it realistic
        reduction_forecast = min(reduction_forecast, 80.0)

    # Calculate improvement metric: Compare latest assessment to second-to-last assessment
    assessments = db.get_assessments()
    improvement_metrics = "Carbon assessment completed! Start implementing recommendations to lower footprint."
    
    if len(assessments) >= 2:
        prev = assessments[-2]
        prev_total = prev["carbon_data"]["total"]
        current_total = latest["carbon_data"]["total"]
        if prev_total > 0:
            pct_diff = ((current_total - prev_total) / prev_total) * 100
            if pct_diff < 0:
                improvement_metrics = f"Footprint reduced by {abs(round(pct_diff, 1))}% compared to previous assessment!"
            elif pct_diff > 0:
                improvement_metrics = f"Footprint increased by {round(pct_diff, 1)}% compared to previous assessment. Try adjusting habits."
            else:
                improvement_metrics = "Footprint remains stable compared to previous assessment."

    latest_response = AssessmentResponse(**latest)
    db_roadmap = db.get_roadmap()
    roadmap_response = RoadmapResponse(**db_roadmap) if db_roadmap else None

    return DashboardResponse(
        has_assessment=True,
        latest_assessment=latest_response,
        eco_score=latest["eco_score"],
        annual_footprint=latest["carbon_data"]["total"],
        reduction_forecast_percent=reduction_forecast,
        eco_points=db.get_eco_points(),
        challenges=[Challenge(**c) for c in db.get_challenges()],
        recommendations=[Recommendation(**r) for r in recs],
        roadmap=roadmap_response,
        improvement_metrics=improvement_metrics
    )

@router.get("/progress", response_model=List[AssessmentResponse])
async def get_progress_trend(db: DatabaseService = Depends(get_db)):
    """
    Fetches all historical assessments for trend plotting.
    """
    assessments = db.get_assessments()
    return [AssessmentResponse(**a) for a in assessments]

@router.get("/questions", response_model=List[AIQuestion])
async def get_assessment_questions(
    db: DatabaseService = Depends(get_db),
    huggingface: HuggingFaceService = Depends(get_huggingface)
):
    """
    Returns AI-generated assessment questions mapping to standard options.
    If a previous assessment exists, tailors the questions based on it.
    """
    latest = db.get_latest_assessment()
    try:
        return huggingface.generate_assessment_questions(latest)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/reset")
async def reset_user_data(db: DatabaseService = Depends(get_db)):
    """
    Purges all saved user data and resets database structures.
    """
    db.reset_db()
    return {"success": True, "detail": "All previous carbon footprint data has been successfully reset."}
