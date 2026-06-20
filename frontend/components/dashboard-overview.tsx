"use client";

import { useState } from "react";
import { DashboardResponse, AssessmentResponse, Recommendation } from "../lib/api";
import TrendChart from "./trend-chart";
import ChallengePanel from "./challenge-panel";
import { Shield, Sparkles, Award, TrendingDown, CheckSquare, Calendar, ChevronRight, AlertCircle, Leaf, HelpCircle } from "lucide-react";

interface DashboardOverviewProps {
  data: DashboardResponse;
  history: AssessmentResponse[];
}

export default function DashboardOverview({ data, history }: DashboardOverviewProps) {
  const latest = data.latest_assessment;
  const [points, setPoints] = useState(data.eco_points);
  
  if (!latest) return null;

  // Render the category list for Eco Score explainers
  const getEcoScoreDescriptor = (score: number) => {
    if (score >= 80) return { label: "Excellent (Eco Champion)", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" };
    if (score >= 50) return { label: "Moderate (Getting Green)", color: "text-amber-600", bg: "bg-amber-50 border-amber-100" };
    return { label: "Low (High Footprint Driver)", color: "text-rose-600", bg: "bg-rose-50 border-rose-100" };
  };

  const descriptor = getEcoScoreDescriptor(data.eco_score);

  return (
    <div className="space-y-8">
      {/* Dynamic Alert Banner */}
      <div className="flex items-start gap-3.5 p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl border border-emerald-700 shadow-md">
        <Sparkles className="w-5 h-5 text-emerald-300 flex-shrink-0 animate-bounce mt-0.5" />
        <div>
          <h4 className="font-display font-bold text-sm tracking-tight">Active Coach Insight</h4>
          <p className="text-emerald-100 text-xs leading-relaxed mt-1 font-medium">{data.improvement_metrics}</p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1: Eco Score */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-4 top-4 p-2 bg-emerald-50 rounded-xl text-emerald-600">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Eco Score</span>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="font-display font-extrabold text-4xl text-slate-800 tracking-tight">{data.eco_score}</span>
              <span className="text-slate-400 text-sm font-semibold">/ 100</span>
            </div>
            <p className={`text-[10px] font-bold ${descriptor.color} mt-2`}>
              {descriptor.label}
            </p>
          </div>
        </div>

        {/* Card 2: Annual CO2 Footprint */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-4 top-4 p-2 bg-slate-100 rounded-xl text-slate-500">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Annual Carbon</span>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="font-display font-extrabold text-4xl text-slate-800 tracking-tight">
                {latest.carbon_data.total.toLocaleString()}
              </span>
              <span className="text-slate-400 text-xs font-semibold">kg CO₂</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">Estimated greenhouse emission equivalent</p>
          </div>
        </div>

        {/* Card 3: Potential Savings Forecast */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-4 top-4 p-2 bg-teal-50 rounded-xl text-teal-600">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Forecast Reduction</span>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="font-display font-extrabold text-4xl text-teal-600 tracking-tight">
                -{data.reduction_forecast_percent}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">Expected reduction if roadmap followed</p>
          </div>
        </div>

        {/* Card 4: Eco Points */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-4 top-4 p-2 bg-amber-50 rounded-xl text-amber-500">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Eco Points Earned</span>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="font-display font-extrabold text-4xl text-amber-500 tracking-tight">{points}</span>
              <span className="text-slate-400 text-xs font-semibold">pts</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">Points earned completing habits</p>
          </div>
        </div>
      </div>

      {/* Main Breakdown & Challenges section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Trend and breakdown charts */}
          <TrendChart currentAssessment={latest} history={history} />
        </div>
        <div>
          {/* Daily challenges panel */}
          <ChallengePanel 
            initialChallenges={data.challenges} 
            initialPoints={data.eco_points} 
            onPointsUpdate={(pts) => setPoints(pts)}
          />
        </div>
      </div>

      {/* Recommendations Checklist */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <CheckSquare className="w-5 h-5 text-emerald-600" />
          <h3 className="font-display font-bold text-slate-800 text-lg">What Should I Fix First?</h3>
        </div>
        <p className="text-slate-500 text-xs mb-6 max-w-xl leading-relaxed">
          Our prioritizer mathematically sorts these recommendations based on high carbon reduction capability, ease of implementation, and overall priority level.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.recommendations.slice(0, 3).map((r, i) => (
            <div key={i} className="border border-slate-100 p-5 rounded-2xl bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-200 transition-all flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.impact === "Critical" || r.impact === "High"
                      ? "bg-rose-50 text-rose-700 border border-rose-100"
                      : "bg-teal-50 text-teal-700 border border-teal-100"
                  }`}>
                    {r.impact} Impact
                  </span>
                  <span className="text-[10px] font-bold bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-md">
                    Priority {r.priority_score}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-800 text-xs leading-snug">{r.title}</h4>
              </div>
              <div className="flex items-center justify-between mt-4 border-t border-slate-100 pt-3 text-[10px] font-semibold text-slate-500">
                <span>Diff: <span className="text-slate-800 font-bold">{r.difficulty}</span></span>
                <span className="text-emerald-700 font-bold">-{r.reduction} kg CO₂/yr</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly roadmap panel */}
      {data.roadmap && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h3 className="font-display font-bold text-slate-800 text-lg">Personalized 30-Day Roadmap</h3>
          </div>
          <p className="text-slate-500 text-xs mb-8 max-w-xl leading-relaxed">
            A week-by-week actionable plan customized by CarbonCoach AI. Focus on completing these goals.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Week 1 */}
            <div className="relative border border-slate-100 bg-slate-50/20 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2 block">Week 1 Goal</span>
                <h4 className="font-bold text-slate-800 text-xs leading-relaxed mb-2">{data.roadmap.week1.action}</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed mb-3">Goal: {data.roadmap.week1.goal}</p>
              </div>
              <p className="text-emerald-800 bg-emerald-50 text-[10px] font-bold p-2.5 rounded-xl border border-emerald-100/60 mt-2">
                Expected: {data.roadmap.week1.outcome}
              </p>
            </div>
            
            {/* Week 2 */}
            <div className="relative border border-slate-100 bg-slate-50/20 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2 block">Week 2 Goal</span>
                <h4 className="font-bold text-slate-800 text-xs leading-relaxed mb-2">{data.roadmap.week2.action}</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed mb-3">Goal: {data.roadmap.week2.goal}</p>
              </div>
              <p className="text-emerald-800 bg-emerald-50 text-[10px] font-bold p-2.5 rounded-xl border border-emerald-100/60 mt-2">
                Expected: {data.roadmap.week2.outcome}
              </p>
            </div>

            {/* Week 3 */}
            <div className="relative border border-slate-100 bg-slate-50/20 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2 block">Week 3 Goal</span>
                <h4 className="font-bold text-slate-800 text-xs leading-relaxed mb-2">{data.roadmap.week3.action}</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed mb-3">Goal: {data.roadmap.week3.goal}</p>
              </div>
              <p className="text-emerald-800 bg-emerald-50 text-[10px] font-bold p-2.5 rounded-xl border border-emerald-100/60 mt-2">
                Expected: {data.roadmap.week3.outcome}
              </p>
            </div>

            {/* Week 4 */}
            <div className="relative border border-slate-100 bg-slate-50/20 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2 block">Week 4 Goal</span>
                <h4 className="font-bold text-slate-800 text-xs leading-relaxed mb-2">{data.roadmap.week4.action}</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed mb-3">Goal: {data.roadmap.week4.goal}</p>
              </div>
              <p className="text-emerald-800 bg-emerald-50 text-[10px] font-bold p-2.5 rounded-xl border border-emerald-100/60 mt-2">
                Expected: {data.roadmap.week4.outcome}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
