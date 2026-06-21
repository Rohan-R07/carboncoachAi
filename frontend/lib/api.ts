export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://carboncoach-api-366985234126.asia-south1.run.app/";

export interface CarbonData {
  transportation: number;
  electricity: number;
  food: number;
  shopping: number;
  travel: number;
  total: number;
}

export interface AssessmentRequest {
  transportation: string;
  electricity: string;
  diet: string;
  shopping: string;
  flights: string;
  notes: string;
}

export interface AssessmentResponse {
  id: string;
  timestamp: string;
  transportation: string;
  electricity: string;
  diet: string;
  shopping: string;
  flights: string;
  notes: string;
  carbon_data: CarbonData;
  eco_score: number;
  largest_contributor: string;
  medium_contributors: string[];
  low_contributors: string[];
}

export interface AnalysisResponse {
  summary: string;
  profile: string;
  observations: string[];
}

export interface RoadmapItem {
  action: string;
  goal: string;
  outcome: string;
}

export interface RoadmapResponse {
  week1: RoadmapItem;
  week2: RoadmapItem;
  week3: RoadmapItem;
  week4: RoadmapItem;
}

export interface Recommendation {
  title: string;
  impact: string;
  difficulty: string;
  reduction: number;
  impact_score: number;
  difficulty_score: number;
  priority_score: number;
}

export interface Challenge {
  id: string;
  title: string;
  points: number;
  completed: boolean;
}

export interface DashboardResponse {
  has_assessment: boolean;
  latest_assessment?: AssessmentResponse;
  eco_score: number;
  annual_footprint: number;
  reduction_forecast_percent: number;
  eco_points: number;
  challenges: Challenge[];
  recommendations: Recommendation[];
  roadmap?: RoadmapResponse;
  improvement_metrics: string;
}

export interface AIQuestion {
  id: string;
  title: string;
  description: string;
  options: string[];
}

// Service Layer functions
export async function submitAssessment(data: AssessmentRequest): Promise<AssessmentResponse> {
  const res = await fetch(`${BACKEND_URL}/api/assessment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to submit assessment.");
  }
  return res.json();
}

export async function analyzeLifestyle(): Promise<AnalysisResponse> {
  const res = await fetch(`${BACKEND_URL}/api/analyze`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to analyze lifestyle.");
  }
  return res.json();
}

export async function generateRoadmap(): Promise<RoadmapResponse> {
  const res = await fetch(`${BACKEND_URL}/api/roadmap`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate roadmap.");
  }
  return res.json();
}

export async function getRecommendations(): Promise<Recommendation[]> {
  const res = await fetch(`${BACKEND_URL}/api/recommendations`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch recommendations.");
  }
  return res.json();
}

export async function completeChallenge(challengeId: string): Promise<{ success: boolean; eco_points: number; challenges: Challenge[] }> {
  const res = await fetch(`${BACKEND_URL}/api/challenge/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challenge_id: challengeId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to complete challenge.");
  }
  return res.json();
}

export async function chatWithAssistant(message: string): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to send message.");
  }
  const data = await res.json();
  return data.response;
}

export async function getDashboardData(): Promise<DashboardResponse> {
  const res = await fetch(`${BACKEND_URL}/api/dashboard?t=${Date.now()}`, {
    method: "GET",
    headers: { "Cache-Control": "no-cache" }
  });
  if (!res.ok) {
    throw new Error("Failed to load dashboard data.");
  }
  return res.json();
}

export async function getProgressHistory(): Promise<AssessmentResponse[]> {
  const res = await fetch(`${BACKEND_URL}/api/progress?t=${Date.now()}`, {
    method: "GET",
    headers: { "Cache-Control": "no-cache" }
  });
  if (!res.ok) {
    throw new Error("Failed to load progress history.");
  }
  return res.json();
}

export async function fetchAssessmentQuestions(): Promise<AIQuestion[]> {
  const res = await fetch(`${BACKEND_URL}/api/questions?t=${Date.now()}`, {
    method: "GET",
    headers: { "Cache-Control": "no-cache" }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch assessment questions.");
  }
  return res.json();
}

export async function resetUserData(): Promise<{ success: boolean; detail: string }> {
  const res = await fetch(`${BACKEND_URL}/api/reset`, {
    method: "POST"
  });
  if (!res.ok) {
    throw new Error("Failed to reset user data.");
  }
  return res.json();
}
