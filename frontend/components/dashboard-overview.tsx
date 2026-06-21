"use client";

import { useState, useEffect } from "react";
import { DashboardResponse, AssessmentResponse, Recommendation } from "../lib/api";
import dynamic from "next/dynamic";

const TrendChart = dynamic(() => import("./trend-chart"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-center animate-pulse text-xs text-slate-400 font-semibold">
      Loading chart visualization...
    </div>
  ),
});

const ChallengePanel = dynamic(() => import("./challenge-panel"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-center animate-pulse text-xs text-slate-400 font-semibold">
      Loading daily challenges...
    </div>
  ),
});

import { 
  Sparkles, Award, TrendingDown, CheckSquare, Calendar, 
  Leaf, CheckCircle2, Sliders 
} from "lucide-react";

interface DashboardOverviewProps {
  data: DashboardResponse;
  history: AssessmentResponse[];
}

// Simulated Carbon factors (kg CO2 per year)
const SIM_TRANSPORT_FACTORS = {
  "Walk": 0,
  "Bicycle": 0,
  "Public Transport": 500,
  "Car": 3000
};

const SIM_ELECTRICITY_FACTORS = {
  "Rarely": 200,
  "1–4 Hours": 800,
  "4–8 Hours": 1800,
  "8+ Hours": 3500
};

const SIM_DIET_FACTORS = {
  "Vegan": 500,
  "Vegetarian": 1000,
  "Mixed": 2000,
  "Meat Heavy": 4000
};

const SIM_SHOPPING_FACTORS = {
  "Rarely": 100,
  "Monthly": 300,
  "Weekly": 800,
  "Frequently": 2000
};

const SIM_FLIGHT_FACTORS = {
  "0": 0,
  "1–2": 1500,
  "3–5": 4500,
  "5+": 9000
};

// Deductions for Eco Score calculation
const SIM_TRANSPORT_DEDUCTIONS = {
  "Walk": 0,
  "Bicycle": 0,
  "Public Transport": 5,
  "Car": 20
};

const SIM_ELECTRICITY_DEDUCTIONS = {
  "Rarely": 0,
  "1–4 Hours": 5,
  "4–8 Hours": 15,
  "8+ Hours": 25
};

const SIM_DIET_DEDUCTIONS = {
  "Vegan": 0,
  "Vegetarian": 5,
  "Mixed": 15,
  "Meat Heavy": 25
};

const SIM_SHOPPING_DEDUCTIONS = {
  "Rarely": 0,
  "Monthly": 5,
  "Weekly": 15,
  "Frequently": 20
};

const SIM_FLIGHT_DEDUCTIONS = {
  "0": 0,
  "1–2": 10,
  "3–5": 20,
  "5+": 30
};

export default function DashboardOverview({ data, history }: DashboardOverviewProps) {
  const latest = data.latest_assessment;
  const [points, setPoints] = useState(data.eco_points);
  
  if (!latest) return null;

  // --- Sustainability Achievement System Math ---
  const getLevelInfo = (pts: number) => {
    if (pts >= 500) return { name: "Level 4: Forest Guardian", badge: "🏆", nextLimit: 1000, label: "Eco Legend" };
    if (pts >= 250) return { name: "Level 3: Oak", badge: "🌳", nextLimit: 500, label: "Green Practitioner" };
    if (pts >= 100) return { name: "Level 2: Sapling", badge: "🌱", nextLimit: 250, label: "Aspiring Advocate" };
    return { name: "Level 1: Seedling", badge: "🍃", nextLimit: 100, label: "Green Starter" };
  };
  const levelInfo = getLevelInfo(points);
  const levelProgress = Math.min(100, Math.round((points / levelInfo.nextLimit) * 100));

  const badgesList = [
    { id: "transit", icon: "🚶", name: "Transit Pioneer", desc: "Use eco-friendly commuting", unlocked: latest.transportation !== "Car" },
    { id: "power", icon: "💡", name: "Vampire Slayer", desc: "Energy usage under 4 hours", unlocked: ["Rarely", "1–4 Hours"].includes(latest.electricity.replace("-", "–")) },
    { id: "diet", icon: "🥗", name: "Plant Champion", desc: "Eat vegetarian or vegan meals", unlocked: ["Vegan", "Vegetarian"].includes(latest.diet) },
    { id: "shopping", icon: "🛍️", name: "Mindful Shopper", desc: "Shop monthly or rarely", unlocked: ["Rarely", "Monthly"].includes(latest.shopping) },
    { id: "flights", icon: "✈️", name: "Fly Light", desc: "Take zero flights per year", unlocked: latest.flights === "0" },
    { id: "elite", icon: "🏆", name: "Eco Elite", desc: "Score over 300 Eco Points", unlocked: points >= 300 }
  ];

  // --- What-If Difficulty and Savings Scoring ---
  const getDiffScore = (val: string) => {
    const clean = val.replace("-", "–");
    if (["Walk", "Bicycle", "Rarely", "0", "Monthly"].includes(clean)) return 1;
    if (["1–4 Hours", "1–2", "Vegetarian", "Vegan"].includes(clean)) return 2;
    if (["Public Transport", "Mixed", "Weekly"].includes(clean)) return 3;
    if (["Car", "4–8 Hours", "3–5", "Frequently"].includes(clean)) return 4;
    if (["8+ Hours", "5+"].includes(clean)) return 5;
    return 3;
  };

  const getSavingsScore = (val: string) => {
    const clean = val.replace("-", "–");
    if (["Walk", "Bicycle", "Rarely", "0"].includes(clean)) return 5;
    if (["1–4 Hours", "1–2", "Vegan", "Vegetarian", "Rarely"].includes(clean)) return 4;
    if (["Public Transport", "Monthly", "Mixed"].includes(clean)) return 3;
    if (["Weekly", "4–8 Hours", "3–5"].includes(clean)) return 2;
    if (["Car", "Frequently", "8+ Hours", "5+"].includes(clean)) return 1;
    return 3;
  };

  // --- What-If Simulator State ---
  const [simTransportation, setSimTransportation] = useState(latest.transportation);
  const [simElectricity, setSimElectricity] = useState(latest.electricity);
  const [simDiet, setSimDiet] = useState(latest.diet);
  const [simShopping, setSimShopping] = useState(latest.shopping);
  const [simFlights, setSimFlights] = useState(latest.flights);

  const simDifficultyAvg = Math.round(
    (getDiffScore(simTransportation) +
     getDiffScore(simElectricity) +
     getDiffScore(simDiet) +
     getDiffScore(simShopping) +
     getDiffScore(simFlights)) / 5
  );

  const simSavingsAvg = Math.round(
    (getSavingsScore(simTransportation) +
     getSavingsScore(simElectricity) +
     getSavingsScore(simDiet) +
     getSavingsScore(simShopping) +
     getSavingsScore(simFlights)) / 5
  );

  const getSimDifficultyLabel = (score: number) => {
    if (score <= 1) return { text: "Very Easy", color: "text-emerald-400" };
    if (score === 2) return { text: "Easy", color: "text-emerald-300" };
    if (score === 3) return { text: "Moderate", color: "text-amber-300" };
    if (score === 4) return { text: "Hard", color: "text-rose-300" };
    return { text: "Very Hard", color: "text-rose-400" };
  };

  const getSimSavingsLabel = (score: number) => {
    if (score <= 1) return { text: "Minimal", color: "text-rose-400" };
    if (score === 2) return { text: "Low", color: "text-rose-300" };
    if (score === 3) return { text: "Moderate", color: "text-amber-300" };
    if (score === 4) return { text: "Significant", color: "text-emerald-300" };
    return { text: "Maximum", color: "text-emerald-400" };
  };

  // --- Roadmap Completion State ---
  const [completedWeeks, setCompletedWeeks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`roadmap_completed_${latest.id}`);
        if (stored) {
          setCompletedWeeks(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load roadmap completed states", e);
      }
    }
  }, [latest.id]);

  const handleToggleWeek = (weekKey: string) => {
    const isNowCompleted = !completedWeeks[weekKey];
    const updated = { ...completedWeeks, [weekKey]: isNowCompleted };
    setCompletedWeeks(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(`roadmap_completed_${latest.id}`, JSON.stringify(updated));
    }
    
    // Gamification: Award 50 points per week completion
    if (isNowCompleted) {
      setPoints(prev => prev + 50);
    } else {
      setPoints(prev => Math.max(0, prev - 50));
    }
  };

  // --- What-If Math Recalculation ---
  const normElec = simElectricity.replace("-", "–");
  const normFlights = simFlights.replace("-", "–");

  const simTransitVal = SIM_TRANSPORT_FACTORS[simTransportation as keyof typeof SIM_TRANSPORT_FACTORS] || 0;
  const simElecVal = SIM_ELECTRICITY_FACTORS[normElec as keyof typeof SIM_ELECTRICITY_FACTORS] || 0;
  const simDietVal = SIM_DIET_FACTORS[simDiet as keyof typeof SIM_DIET_FACTORS] || 0;
  const simShopVal = SIM_SHOPPING_FACTORS[simShopping as keyof typeof SIM_SHOPPING_FACTORS] || 0;
  const simFlightVal = SIM_FLIGHT_FACTORS[normFlights as keyof typeof SIM_FLIGHT_FACTORS] || 0;

  const simTotal = simTransitVal + simElecVal + simDietVal + simShopVal + simFlightVal;

  const deductions = 
    (SIM_TRANSPORT_DEDUCTIONS[simTransportation as keyof typeof SIM_TRANSPORT_DEDUCTIONS] || 0) +
    (SIM_ELECTRICITY_DEDUCTIONS[normElec as keyof typeof SIM_ELECTRICITY_DEDUCTIONS] || 0) +
    (SIM_DIET_DEDUCTIONS[simDiet as keyof typeof SIM_DIET_DEDUCTIONS] || 0) +
    (SIM_SHOPPING_DEDUCTIONS[simShopping as keyof typeof SIM_SHOPPING_DEDUCTIONS] || 0) +
    (SIM_FLIGHT_DEDUCTIONS[normFlights as keyof typeof SIM_FLIGHT_DEDUCTIONS] || 0);

  const simScore = Math.max(0, 100 - deductions);
  const carbonSavings = latest.carbon_data.total - simTotal;

  // --- Behavioral Trend Analysis ---
  const getTrendAnalysis = () => {
    if (!history || history.length < 2) {
      const largest = latest.largest_contributor;
      return {
        text: `Your biggest emissions driver is currently your ${largest}. Focus on implementing the top recommendation below to start seeing reduction trends in your next assessment.`,
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
        badge: "Initial Baseline Analysis"
      };
    }
    
    const current = history[history.length - 1];
    const prev = history[history.length - 2];
    const currentTotal = current.carbon_data.total;
    const prevTotal = prev.carbon_data.total;
    const diff = currentTotal - prevTotal;

    if (diff < 0) {
      const percent = Math.round((Math.abs(diff) / prevTotal) * 100);
      return {
        text: `Fantastic progress! Your carbon footprint decreased by ${Math.abs(diff).toLocaleString()} kg CO₂/year (${percent}% reduction) compared to your previous assessment, driven by optimizations in your lifestyle.`,
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
        badge: "Positive Trend Detected"
      };
    } else if (diff > 0) {
      const percent = Math.round((diff / prevTotal) * 100);
      return {
        text: `Your footprint increased by ${diff.toLocaleString()} kg CO₂/year (+${percent}%) since your last check. Consider reviewing your ${current.largest_contributor.toLowerCase()} and setting fresh limits.`,
        badgeColor: "bg-rose-50 text-rose-700 border-rose-100",
        badge: "Negative Trend Alert"
      };
    } else {
      return {
        text: "Your carbon footprint has stabilized at your baseline. Try checking off some of your roadmap tasks to drive emissions down further.",
        badgeColor: "bg-slate-50 text-slate-700 border-slate-100",
        badge: "Stable Trend"
      };
    }
  };

  const trendAnalysis = getTrendAnalysis();

  const getEcoScoreDescriptor = (score: number) => {
    if (score >= 80) return { label: "Excellent (Eco Champion)", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" };
    if (score >= 50) return { label: "Moderate (Getting Green)", color: "text-amber-600", bg: "bg-amber-50 border-amber-100" };
    return { label: "Low (High Footprint Driver)", color: "text-rose-600", bg: "bg-rose-50 border-rose-100" };
  };

  const descriptor = getEcoScoreDescriptor(data.eco_score);

  return (
    <div className="space-y-8">
      {/* Sustainability Achievement System */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center">
              {levelInfo.badge}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Current Standing</span>
              <h3 className="font-display font-bold text-slate-800 text-lg leading-tight mt-0.5">{levelInfo.name}</h3>
              <p className="text-slate-500 text-xs mt-1">Role: <span className="font-semibold text-slate-700">{levelInfo.label}</span></p>
            </div>
          </div>
          
          <div className="flex-1 max-w-md">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs font-semibold text-slate-500">Progress to Next Tier</span>
              <span className="text-xs font-bold text-slate-700">{points} / {levelInfo.nextLimit} pts</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${levelProgress}%` }} 
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
              <span>{levelInfo.name.split(":")[0]}</span>
              <span>Next Milestone: {levelInfo.nextLimit} pts</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-6 pt-6">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Earned Badges & Achievements</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {badgesList.map((badge) => (
              <div 
                key={badge.id} 
                className={`p-4 rounded-2xl border text-center transition-all ${
                  badge.unlocked 
                    ? "bg-emerald-50/50 border-emerald-200 text-slate-800" 
                    : "bg-slate-50/40 border-slate-100 text-slate-400 opacity-60"
                }`}
              >
                <div className={`text-2xl mb-2 mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                  badge.unlocked ? "bg-emerald-100/60" : "bg-slate-200/50"
                }`}>
                  {badge.icon}
                </div>
                <h5 className="font-bold text-xs leading-tight">{badge.name}</h5>
                <p className="text-[9px] mt-1 leading-snug">{badge.desc}</p>
                <span className={`inline-block text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-2 ${
                  badge.unlocked ? "bg-emerald-200 text-emerald-800" : "bg-slate-200 text-slate-500"
                }`}>
                  {badge.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Coach Insight Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl border border-emerald-700 shadow-md">
        <div className="flex items-start gap-3.5">
          <Sparkles className="w-5 h-5 text-emerald-300 flex-shrink-0 animate-bounce mt-0.5" />
          <div>
            <h4 className="font-display font-bold text-sm tracking-tight">Active Coach Insight</h4>
            <p className="text-emerald-100 text-xs leading-relaxed mt-1 font-medium">{data.improvement_metrics}</p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold self-start md:self-auto ${trendAnalysis.badgeColor}`}>
          <span className="uppercase tracking-wider mr-1.5">{trendAnalysis.badge}:</span>
          <span className="font-semibold text-slate-700">{trendAnalysis.text}</span>
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

      {/* What-If Simulator section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl border border-slate-800 p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <Sliders className="w-5 h-5 text-emerald-400" />
          <h3 className="font-display font-bold text-lg">What-If Sustainability Simulator</h3>
        </div>
        <p className="text-slate-400 text-xs mb-8 max-w-xl leading-relaxed">
          Toggle options below to simulate different sustainable actions. See how they impact your footprint and score immediately.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sim-transport" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Commute Transport</label>
                <select 
                  id="sim-transport"
                  value={simTransportation} 
                  onChange={(e) => setSimTransportation(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="Walk">Walk</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Public Transport">Public Transport</option>
                  <option value="Car">Car</option>
                </select>
              </div>

              <div>
                <label htmlFor="sim-electricity" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Electricity Usage</label>
                <select 
                  id="sim-electricity"
                  value={simElectricity} 
                  onChange={(e) => setSimElectricity(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="Rarely">Rarely</option>
                  <option value="1–4 Hours">1–4 Hours</option>
                  <option value="4–8 Hours">4–8 Hours</option>
                  <option value="8+ Hours">8+ Hours</option>
                </select>
              </div>

              <div>
                <label htmlFor="sim-diet" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Diet Type</label>
                <select 
                  id="sim-diet"
                  value={simDiet} 
                  onChange={(e) => setSimDiet(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="Vegan">Vegan</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Meat Heavy">Meat Heavy</option>
                </select>
              </div>

              <div>
                <label htmlFor="sim-shopping" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Shopping Frequency</label>
                <select 
                  id="sim-shopping"
                  value={simShopping} 
                  onChange={(e) => setSimShopping(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="Rarely">Rarely</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Frequently">Frequently</option>
                </select>
              </div>
            </div>

            <div className="w-full sm:w-1/2">
              <label htmlFor="sim-flights" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Annual Flights</label>
              <select 
                id="sim-flights"
                value={simFlights} 
                onChange={(e) => setSimFlights(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="0">0</option>
                <option value="1–2">1–2</option>
                <option value="3–5">3–5</option>
                <option value="5+">5+</option>
              </select>
            </div>
          </div>

          {/* Simulated Outputs */}
          <div className="bg-slate-800/50 border border-slate-700/60 p-6 rounded-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">Simulated Projection</span>
              
              <div>
                <span className="text-[10px] text-slate-400 font-medium">Estimated Footprint</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-display font-extrabold text-2xl text-white tracking-tight">
                    {simTotal.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-xs font-semibold">kg CO₂</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-medium">Simulated Eco Score</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-display font-extrabold text-2xl text-emerald-400 tracking-tight">
                    {simScore}
                  </span>
                  <span className="text-slate-400 text-[10px] font-semibold">/ 100</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-700/60 pt-3 mt-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Difficulty Level</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-xs font-bold ${getSimDifficultyLabel(simDifficultyAvg).color}`}>
                      {getSimDifficultyLabel(simDifficultyAvg).text}
                    </span>
                    <span className="text-slate-500 text-[10px]">({simDifficultyAvg}/5)</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Financial Savings</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-xs font-bold ${getSimSavingsLabel(simSavingsAvg).color}`}>
                      {getSimSavingsLabel(simSavingsAvg).text}
                    </span>
                    <span className="text-slate-500 text-[10px]">({simSavingsAvg}/5)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4 mt-4">
              {carbonSavings > 0 ? (
                <div className="bg-emerald-950/40 border border-emerald-900/60 p-3.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide block mb-1">Impact Potential</span>
                  <p className="text-xs text-white leading-relaxed font-semibold">
                    You would save <span className="text-emerald-400 font-bold">{carbonSavings.toLocaleString()} kg CO₂</span>/year!
                  </p>
                </div>
              ) : carbonSavings < 0 ? (
                <div className="bg-rose-950/40 border border-rose-900/60 p-3.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wide block mb-1">Emission Increase</span>
                  <p className="text-xs text-white leading-relaxed font-semibold">
                    This path adds <span className="text-rose-400 font-bold">{Math.abs(carbonSavings).toLocaleString()} kg CO₂</span>/year.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-700/30 border border-slate-700/60 p-3.5 rounded-xl text-center">
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    Same as your current actual footprint.
                  </p>
                </div>
              )}
            </div>
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
          {data.recommendations.slice(0, 3).map((r, i) => {
            const reductionPct = Math.round((r.reduction / latest.carbon_data.total) * 100) || 0;
            return (
              <div key={i} className="border border-slate-100 p-5 rounded-2xl bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-200 transition-all flex flex-col justify-between min-h-[220px]">
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
                  
                  {/* Explainable AI block */}
                  {r.explanation && (
                    <p className="text-[10px] text-slate-400 leading-normal mt-2 italic font-medium">
                      {r.explanation}
                    </p>
                  )}

                  <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                    {r.why_recommended && (
                      <div>
                        <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Why Recommended</span>
                        <p className="text-[10px] text-slate-600 leading-normal font-medium">{r.why_recommended}</p>
                      </div>
                    )}
                    {r.expected_impact && (
                      <div>
                        <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Expected Impact</span>
                        <p className="text-[10px] text-slate-600 leading-normal font-medium">{r.expected_impact}</p>
                      </div>
                    )}
                    {r.confidence_level && (
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">AI Confidence</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          r.confidence_level === "High" 
                            ? "bg-emerald-100 text-emerald-800" 
                            : r.confidence_level === "Medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}>
                          {r.confidence_level}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  {/* Recommendation Impact Scoring progress bar */}
                  <div className="w-full bg-slate-250 h-1 rounded-full overflow-hidden mt-1 relative">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-350" 
                      style={{ width: `${Math.min(100, reductionPct)}%` }} 
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[9px] font-semibold text-slate-400">
                    <span>Footprint Impact</span>
                    <span className="text-emerald-700">-{reductionPct}%</span>
                  </div>

                  <div className="flex items-center justify-between mt-3 border-t border-slate-100 pt-3 text-[10px] font-semibold text-slate-500">
                    <span>Diff: <span className="text-slate-800 font-bold">{r.difficulty}</span></span>
                    <span className="text-emerald-700 font-bold">-{r.reduction} kg CO₂/yr</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carbon Forecast Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <TrendingDown className="w-5 h-5 text-emerald-600" />
          <h3 className="font-display font-bold text-slate-800 text-lg">AI Carbon Reduction Forecast</h3>
        </div>
        <p className="text-slate-500 text-xs mb-8 max-w-xl leading-relaxed">
          Based on your assessment and personalized roadmap, CarbonCoach AI projects your footprint reduction across key milestones as you adapt your daily habits.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1 Month */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 border border-emerald-100 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">1-Month Horizon</span>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="font-display font-extrabold text-3xl text-emerald-800 tracking-tight">-3.5%</span>
                <span className="text-slate-400 text-xs font-semibold">CO₂ reduction</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 font-medium">Habit Adaptation Phase</p>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Initial reduction driven by consciousness around electricity usage and commuting choice adjustments.</p>
            </div>
            <div className="border-t border-emerald-150 pt-3 mt-4 text-[10px] font-semibold text-emerald-800">
              Est. Saved: ~{Math.round(latest.carbon_data.total * 0.035).toLocaleString()} kg CO₂/yr
            </div>
          </div>

          {/* 3 Months */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 border border-emerald-100 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">3-Month Horizon</span>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="font-display font-extrabold text-3xl text-emerald-800 tracking-tight">-12.0%</span>
                <span className="text-slate-400 text-xs font-semibold">CO₂ reduction</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 font-medium">Medium-term Optimization</p>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Sustained diet transitions, optimized appliance patterns, and shifting local travel methods.</p>
            </div>
            <div className="border-t border-emerald-150 pt-3 mt-4 text-[10px] font-semibold text-emerald-800">
              Est. Saved: ~{Math.round(latest.carbon_data.total * 0.12).toLocaleString()} kg CO₂/yr
            </div>
          </div>

          {/* 6 Months */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-600 p-6 rounded-2xl text-white flex flex-col justify-between shadow-md">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">6-Month Target</span>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="font-display font-extrabold text-3xl text-white tracking-tight">-25.0%</span>
                <span className="text-emerald-200 text-xs font-semibold">CO₂ reduction</span>
              </div>
              <p className="text-xs text-emerald-100 mt-2 font-medium">Full Roadmap Completion</p>
              <p className="text-[10px] text-emerald-100/90 mt-1 leading-relaxed">Full adoption of low-carbon travel alternatives, waste reduction habits, and energy improvements.</p>
            </div>
            <div className="border-t border-emerald-400/40 pt-3 mt-4 text-[10px] font-semibold text-emerald-100">
              Est. Saved: ~{Math.round(latest.carbon_data.total * 0.25).toLocaleString()} kg CO₂/yr
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation Priority Matrix */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Sliders className="w-5 h-5 text-emerald-600" />
          <h3 className="font-display font-bold text-slate-800 text-lg">AI Recommendation Priority Matrix</h3>
        </div>
        <p className="text-slate-500 text-xs mb-6 max-w-xl leading-relaxed">
          All calculated recommendations mapped across impact, effort difficulty, financial savings, and overall Priority Score.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="pb-3 pr-4">Action Recommendation</th>
                <th className="pb-3 px-4">Carbon Impact</th>
                <th className="pb-3 px-4">Effort / Difficulty</th>
                <th className="pb-3 px-4">Financial Savings</th>
                <th className="pb-3 pl-4 text-right">Priority Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {data.recommendations.map((r, idx) => {
                const difficultyVal = getDiffScore(r.difficulty);
                const savingsVal = getSavingsScore(r.difficulty);
                
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pr-4 font-semibold text-slate-800">{r.title}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.impact === "Critical" || r.impact === "High"
                          ? "bg-rose-50 text-rose-700 border border-rose-100"
                          : "bg-teal-50 text-teal-700 border border-teal-100"
                      }`}>
                        {r.impact} (-{r.reduction} kg)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      <div className="flex items-center gap-1">
                        <span>{r.difficulty}</span>
                        <span className="text-slate-400 text-[10px]">({difficultyVal}/5)</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      <div className="flex items-center gap-1">
                        <span className="text-emerald-700 font-semibold">
                          {savingsVal >= 4 ? "High" : savingsVal === 3 ? "Medium" : "Low"}
                        </span>
                        <span className="text-slate-400 text-[10px]">({savingsVal}/5)</span>
                      </div>
                    </td>
                    <td className="py-3.5 pl-4 text-right font-bold text-slate-800">{r.priority_score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
            A week-by-week actionable plan customized by CarbonCoach AI. Focus on completing these goals. Checking off a completed week awards you <span className="text-emerald-600 font-bold">+50 Eco Points</span>!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Week 1 */}
            <div className={`relative border p-5 rounded-2xl flex flex-col justify-between transition-all ${
              completedWeeks.week1 
                ? "border-emerald-200 bg-emerald-50/10 shadow-sm" 
                : "border-slate-100 bg-slate-50/20"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Week 1 Goal</span>
                  <button 
                    onClick={() => handleToggleWeek("week1")}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      completedWeeks.week1 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : "border-slate-350 hover:border-emerald-500 hover:bg-emerald-50/10 text-transparent"
                    }`}
                    aria-label="Mark week 1 as complete"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className={`font-bold text-slate-800 text-xs leading-relaxed mb-2 ${completedWeeks.week1 ? "line-through text-slate-400" : ""}`}>
                  {data.roadmap.week1.action}
                </h4>
                <p className="text-slate-500 text-[10px] leading-relaxed mb-3">Goal: {data.roadmap.week1.goal}</p>
              </div>
              <p className="text-emerald-800 bg-emerald-50 text-[10px] font-bold p-2.5 rounded-xl border border-emerald-100/60 mt-2">
                Expected: {data.roadmap.week1.outcome}
              </p>
            </div>
            
            {/* Week 2 */}
            <div className={`relative border p-5 rounded-2xl flex flex-col justify-between transition-all ${
              completedWeeks.week2 
                ? "border-emerald-200 bg-emerald-50/10 shadow-sm" 
                : "border-slate-100 bg-slate-50/20"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Week 2 Goal</span>
                  <button 
                    onClick={() => handleToggleWeek("week2")}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      completedWeeks.week2 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : "border-slate-350 hover:border-emerald-500 hover:bg-emerald-50/10 text-transparent"
                    }`}
                    aria-label="Mark week 2 as complete"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className={`font-bold text-slate-800 text-xs leading-relaxed mb-2 ${completedWeeks.week2 ? "line-through text-slate-400" : ""}`}>
                  {data.roadmap.week2.action}
                </h4>
                <p className="text-slate-500 text-[10px] leading-relaxed mb-3">Goal: {data.roadmap.week2.goal}</p>
              </div>
              <p className="text-emerald-800 bg-emerald-50 text-[10px] font-bold p-2.5 rounded-xl border border-emerald-100/60 mt-2">
                Expected: {data.roadmap.week2.outcome}
              </p>
            </div>

            {/* Week 3 */}
            <div className={`relative border p-5 rounded-2xl flex flex-col justify-between transition-all ${
              completedWeeks.week3 
                ? "border-emerald-200 bg-emerald-50/10 shadow-sm" 
                : "border-slate-100 bg-slate-50/20"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Week 3 Goal</span>
                  <button 
                    onClick={() => handleToggleWeek("week3")}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      completedWeeks.week3 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : "border-slate-350 hover:border-emerald-500 hover:bg-emerald-50/10 text-transparent"
                    }`}
                    aria-label="Mark week 3 as complete"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className={`font-bold text-slate-800 text-xs leading-relaxed mb-2 ${completedWeeks.week3 ? "line-through text-slate-400" : ""}`}>
                  {data.roadmap.week3.action}
                </h4>
                <p className="text-slate-500 text-[10px] leading-relaxed mb-3">Goal: {data.roadmap.week3.goal}</p>
              </div>
              <p className="text-emerald-800 bg-emerald-50 text-[10px] font-bold p-2.5 rounded-xl border border-emerald-100/60 mt-2">
                Expected: {data.roadmap.week3.outcome}
              </p>
            </div>

            {/* Week 4 */}
            <div className={`relative border p-5 rounded-2xl flex flex-col justify-between transition-all ${
              completedWeeks.week4 
                ? "border-emerald-200 bg-emerald-50/10 shadow-sm" 
                : "border-slate-100 bg-slate-50/20"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Week 4 Goal</span>
                  <button 
                    onClick={() => handleToggleWeek("week4")}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      completedWeeks.week4 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : "border-slate-350 hover:border-emerald-500 hover:bg-emerald-50/10 text-transparent"
                    }`}
                    aria-label="Mark week 4 as complete"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className={`font-bold text-slate-800 text-xs leading-relaxed mb-2 ${completedWeeks.week4 ? "line-through text-slate-400" : ""}`}>
                  {data.roadmap.week4.action}
                </h4>
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
