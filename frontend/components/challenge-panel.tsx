"use client";

import { useState } from "react";
import { Challenge, completeChallenge } from "../lib/api";
import { CheckCircle2, Circle, Award, Loader2, Sparkles } from "lucide-react";

interface ChallengePanelProps {
  initialChallenges: Challenge[];
  initialPoints: number;
  onPointsUpdate: (newPoints: number) => void;
}

export default function ChallengePanel({ initialChallenges, initialPoints, onPointsUpdate }: ChallengePanelProps) {
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [points, setPoints] = useState(initialPoints);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleComplete = async (id: string) => {
    if (loadingId) return;
    setLoadingId(id);
    try {
      const res = await completeChallenge(id);
      if (res.success) {
        setPoints(res.eco_points);
        setChallenges(res.challenges);
        onPointsUpdate(res.eco_points);
      }
    } catch (err) {
      console.error("Failed to complete challenge:", err);
    } finally {
      setLoadingId(null);
    }
  };

  const completedCount = challenges.filter(c => c.completed).length;
  const progressPercent = Math.round((completedCount / challenges.length) * 100);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
      {/* Header / Points Info */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-bold text-slate-800 text-base">Daily Eco Challenges</h3>
          <p className="text-xs text-slate-400">Complete challenges to earn points</p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm animate-pulse">
          <Award className="w-4 h-4" />
          <span className="font-bold text-sm tracking-tight">{points} pts</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span>Daily Habit Progression</span>
          <span>{completedCount}/{challenges.length} Done</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full w-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Challenge Checklist */}
      <div className="space-y-3 flex-grow overflow-y-auto max-h-[220px] pr-1">
        {challenges.map(c => (
          <button
            key={c.id}
            onClick={() => !c.completed && handleComplete(c.id)}
            disabled={c.completed || loadingId === c.id}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
              c.completed
                ? "border-slate-100 bg-slate-50/50 text-slate-400"
                : "border-slate-150 hover:border-emerald-200 text-slate-700 hover:bg-emerald-50/10 cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-3">
              {loadingId === c.id ? (
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin flex-shrink-0" />
              ) : c.completed ? (
                <CheckCircle2 className="w-5 h-5 text-slate-300 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-400 hover:text-emerald-500 transition-colors flex-shrink-0" />
              )}
              <span className={`text-xs font-semibold leading-relaxed ${c.completed ? "line-through" : ""}`}>{c.title}</span>
            </div>
            {!c.completed && (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md flex-shrink-0">
                +{c.points} pt
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
