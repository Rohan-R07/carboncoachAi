from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict

class AssessmentRequest(BaseModel):
    transportation: str = Field(..., description="Transportation method")
    electricity: str = Field(..., description="Daily electricity hours of high usage")
    diet: str = Field(..., description="Diet type")
    shopping: str = Field(..., description="Shopping frequency")
    flights: str = Field(..., description="Flights per year")
    notes: Optional[str] = Field("", description="Additional lifestyle notes")

    @field_validator("transportation")
    @classmethod
    def validate_transportation(cls, v: str) -> str:
        options = ["Walk", "Bicycle", "Public Transport", "Car"]
        if v not in options:
            raise ValueError(f"Transportation must be one of: {options}")
        return v

    @field_validator("electricity")
    @classmethod
    def validate_electricity(cls, v: str) -> str:
        options = ["Rarely", "1–4 Hours", "4–8 Hours", "8+ Hours"]
        # Normalize dash characters just in case
        v_normalized = v.replace("-", "–")
        if v_normalized not in options:
            raise ValueError(f"Electricity must be one of: {options}")
        return v_normalized

    @field_validator("diet")
    @classmethod
    def validate_diet(cls, v: str) -> str:
        options = ["Vegan", "Vegetarian", "Mixed", "Meat Heavy"]
        if v not in options:
            raise ValueError(f"Diet must be one of: {options}")
        return v

    @field_validator("shopping")
    @classmethod
    def validate_shopping(cls, v: str) -> str:
        options = ["Rarely", "Monthly", "Weekly", "Frequently"]
        if v not in options:
            raise ValueError(f"Shopping must be one of: {options}")
        return v

    @field_validator("flights")
    @classmethod
    def validate_flights(cls, v: str) -> str:
        options = ["0", "1–2", "3–5", "5+"]
        v_normalized = v.replace("-", "–")
        if v_normalized not in options:
            raise ValueError(f"Flights must be one of: {options}")
        return v_normalized

class CarbonData(BaseModel):
    transportation: float
    electricity: float
    food: float
    shopping: float
    travel: float
    total: float

class AssessmentResponse(BaseModel):
    id: str
    timestamp: str
    transportation: str
    electricity: str
    diet: str
    shopping: str
    flights: str
    notes: str
    carbon_data: CarbonData
    eco_score: int
    largest_contributor: str
    medium_contributors: List[str]
    low_contributors: List[str]

class AnalysisResponse(BaseModel):
    summary: str
    profile: str
    observations: List[str]

class RoadmapItem(BaseModel):
    action: str
    goal: str
    outcome: str

class RoadmapResponse(BaseModel):
    week1: RoadmapItem
    week2: RoadmapItem
    week3: RoadmapItem
    week4: RoadmapItem

class Recommendation(BaseModel):
    title: str
    impact: str
    difficulty: str
    reduction: int
    impact_score: int
    difficulty_score: int
    priority_score: int
    explanation: str = ""

class Challenge(BaseModel):
    id: str
    title: str
    points: int
    completed: bool

class ChallengeCompleteRequest(BaseModel):
    challenge_id: str

class ChallengeCompleteResponse(BaseModel):
    success: bool
    eco_points: int
    challenges: List[Challenge]

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

class DashboardResponse(BaseModel):
    has_assessment: bool
    latest_assessment: Optional[AssessmentResponse] = None
    eco_score: int
    annual_footprint: float
    reduction_forecast_percent: float
    eco_points: int
    challenges: List[Challenge]
    recommendations: List[Recommendation]
    roadmap: Optional[RoadmapResponse] = None
    improvement_metrics: str

class AIQuestion(BaseModel):
    id: str
    title: str
    description: str
    options: List[str]
