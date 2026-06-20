"use client";

import { useEffect, useState } from "react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from "recharts";
import { AssessmentResponse } from "../lib/api";
import { BarChart3, LineChart as LineIcon, TrendingDown } from "lucide-react";

interface TrendChartProps {
  currentAssessment: AssessmentResponse;
  history: AssessmentResponse[];
}

const CATEGORY_COLORS = {
  transportation: "#10b981", // emerald
  electricity: "#3b82f6",    // blue
  food: "#f59e0b",           // amber
  shopping: "#6366f1",        // indigo
  travel: "#ec4899"          // pink
};

export default function TrendChart({ currentAssessment, history }: TrendChartProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"breakdown" | "progress" | "forecast">("breakdown");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-64 flex items-center justify-center text-slate-400">Loading charts...</div>;
  }

  // 1. Category breakdown data
  const carbon = currentAssessment.carbon_data;
  const barData = [
    { name: "Transit", kg: carbon.transportation },
    { name: "Power", kg: carbon.electricity },
    { name: "Food", kg: carbon.food },
    { name: "Shopping", kg: carbon.shopping },
    { name: "Flights", kg: carbon.travel }
  ];

  // 2. Historical data trend
  let historyData = history.map((h, i) => ({
    name: `Assmt ${i + 1}`,
    score: h.carbon_data.total
  }));

  if (historyData.length < 2) {
    historyData = [
      { name: "Prev Baseline", score: currentAssessment.carbon_data.total * 1.2 },
      { name: "Current Assmt", score: currentAssessment.carbon_data.total }
    ];
  }

  // 3. 12-Month Carbon Reduction Forecast data (25% reduction target over 12 months)
  const baseline = currentAssessment.carbon_data.total;
  const reductionTargetPct = 25; 
  const forecastData = Array.from({ length: 13 }, (_, m) => {
    const factor = (reductionTargetPct / 100) * (m / 12);
    const projectedVal = Math.round(baseline * (1 - factor));
    return {
      month: `M${m}`,
      Projected: projectedVal,
      TargetLimit: Math.round(baseline * (1 - (reductionTargetPct / 100)))
    };
  });

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-display font-bold text-slate-800 text-base">Sustainability Metrics & Analytics</h3>
          <p className="text-slate-400 text-[10px] font-semibold mt-0.5">Interactive carbon breakdowns and forecast modeling</p>
        </div>
        
        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto" role="tablist">
          <button
            onClick={() => setActiveTab("breakdown")}
            role="tab"
            aria-selected={activeTab === "breakdown"}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
              activeTab === "breakdown" 
                ? "bg-white text-emerald-700 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Emissions Breakdown
          </button>
          
          <button
            onClick={() => setActiveTab("progress")}
            role="tab"
            aria-selected={activeTab === "progress"}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
              activeTab === "progress" 
                ? "bg-white text-emerald-700 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" />
            Footprint Progress
          </button>

          <button
            onClick={() => setActiveTab("forecast")}
            role="tab"
            aria-selected={activeTab === "forecast"}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
              activeTab === "forecast" 
                ? "bg-white text-emerald-700 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            12-Month Forecast
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 mt-2">
        {activeTab === "breakdown" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                cursor={{ fill: "#f1f5f9" }}
              />
              <Bar dataKey="kg" fill="#10b981" radius={[8, 8, 0, 0]}>
                {barData.map((entry, index) => {
                  const keys = ["transportation", "electricity", "food", "shopping", "travel"] as const;
                  const colorKey = keys[index];
                  return <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[colorKey]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === "progress" && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                name="Emissions (kg)"
                stroke="#047857" 
                strokeWidth={3} 
                activeDot={{ r: 8 }}
                dot={{ stroke: "#047857", strokeWidth: 2, r: 4, fill: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === "forecast" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
              />
              <Area 
                type="monotone" 
                dataKey="Projected" 
                stroke="#059669" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorProjected)" 
              />
              <Line 
                type="dashed" 
                dataKey="TargetLimit" 
                name="Green Target"
                stroke="#ef4444" 
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
