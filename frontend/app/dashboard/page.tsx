"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDashboardData, getProgressHistory, DashboardResponse, AssessmentResponse, resetUserData } from "../../lib/api";
import DashboardOverview from "../../components/dashboard-overview";
import Chatbot from "../../components/chatbot";
import { Leaf, LayoutDashboard, ClipboardList, RefreshCw, LogOut, Loader2, Award, Sparkles, Trash2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [history, setHistory] = useState<AssessmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = async (isSilent = false) => {
    try {
      if (isSilent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      const dashData = await getDashboardData();
      setData(dashData);
      
      if (dashData.has_assessment) {
        const histData = await getProgressHistory();
        setHistory(histData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data. Ensure the backend server is running.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to delete all assessments and start fresh? This cannot be undone.")) return;
    try {
      setLoading(true);
      await resetUserData();
      // Redirect to landing page to begin assessment anew
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to reset carbon data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        {/* Sidebar navigation Skeleton */}
        <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col justify-between p-6 flex-shrink-0 md:h-screen sticky top-0">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl shimmer-effect-dark" />
              <div className="w-24 h-5 rounded-md shimmer-effect-dark" />
            </div>
            <div className="space-y-4">
              <div className="w-full h-10 rounded-xl shimmer-effect-dark" />
              <div className="w-full h-10 rounded-xl shimmer-effect-dark" />
              <div className="w-full h-10 rounded-xl shimmer-effect-dark" />
            </div>
          </div>
          <div className="w-full h-12 rounded-xl shimmer-effect-dark mt-8" />
        </aside>

        {/* Main dashboard content Skeleton */}
        <main className="flex-grow p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8 overflow-hidden">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <div className="space-y-2">
              <div className="w-48 h-8 rounded-2xl shimmer-effect" />
              <div className="w-64 h-4 rounded-xl shimmer-effect" />
            </div>
            <div className="w-10 h-10 rounded-xl shimmer-effect" />
          </div>

          {/* Active Coach Insight Banner Skeleton */}
          <div className="w-full h-20 rounded-3xl shimmer-effect" />

          {/* KPI Cards Row Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div className="w-16 h-3 rounded-full shimmer-effect" />
                  <div className="w-8 h-8 rounded-xl shimmer-effect" />
                </div>
                <div className="w-24 h-8 rounded-xl shimmer-effect" />
                <div className="w-32 h-3 rounded-full shimmer-effect" />
              </div>
            ))}
          </div>

          {/* Main Content Split Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="w-36 h-6 rounded-xl shimmer-effect" />
              <div className="w-full h-64 rounded-2xl shimmer-effect" />
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="w-36 h-6 rounded-xl shimmer-effect" />
              <div className="space-y-4">
                <div className="w-full h-16 rounded-2xl shimmer-effect" />
                <div className="w-full h-16 rounded-2xl shimmer-effect" />
                <div className="w-full h-16 rounded-2xl shimmer-effect" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Handle empty state (no assessment taken yet)
  if (!data || !data.has_assessment) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-6">
        <header className="max-w-md mx-auto w-full flex items-center justify-start mb-8">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
              <Leaf className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-slate-800 text-sm">CarbonCoach AI</span>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-10 shadow-xl text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-slate-800 mb-3">No Active Assessment</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Complete your lifestyle assessment first so CarbonCoach AI can compute your scores, priority checklist, and tailored roadmaps.
            </p>
            <Link 
              href="/assessment" 
              className="w-full inline-flex justify-center items-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Carbon Assessment
            </Link>
          </div>
        </main>

        <footer className="max-w-md mx-auto w-full text-center text-slate-400 text-xs mt-12">
          CarbonCoach AI Carbon Footprint Engine
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col justify-between p-6 flex-shrink-0 md:sticky md:top-0 md:h-screen">
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-500/20">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">CarbonCoach <span className="text-emerald-500">AI</span></span>
          </div>

          <nav className="space-y-2">
            <Link 
              href="/dashboard" 
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-800 text-emerald-400 font-semibold text-xs transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              Impact Dashboard
            </Link>
            <Link 
              href="/assessment" 
              className="w-full flex items-center gap-3 p-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-xs transition-all"
            >
              <ClipboardList className="w-4 h-4" />
              Retake Assessment
            </Link>
            <button 
              onClick={handleReset}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-xs transition-all text-left"
            >
              <Trash2 className="w-4 h-4 text-emerald-500" />
              Start Fresh
            </button>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3 px-3 py-2 text-slate-400">
            <Award className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Global Score</p>
              <p className="text-xs font-bold text-white">{data.eco_score}/100</p>
            </div>
          </div>
          <button 
            onClick={() => router.push("/")}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-semibold text-xs transition-all text-left"
          >
            <LogOut className="w-4 h-4" />
            Exit Dashboard
          </button>
        </div>
      </aside>

      {/* Main dashboard content */}
      <main className="flex-grow p-6 md:p-10 max-w-6xl mx-auto w-full overflow-x-hidden">
        {/* Header bar */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-slate-800 tracking-tight">Eco Impact Hub</h1>
            <p className="text-slate-500 text-xs mt-1">Real-time optimization tracking & sustainability critique</p>
          </div>
          <button 
            onClick={() => loadData(false)}
            disabled={loading}
            className="p-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl text-slate-600 hover:text-emerald-700 transition-all hover:scale-105 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh Dashboard Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </header>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl" role="alert">
            {error}
          </div>
        )}

        <DashboardOverview data={data} history={history} />

        {/* Floating Chatbot Overlay */}
        <Chatbot />
      </main>
    </div>
  );
}
