"use client";

import Link from "next/link";
import { ArrowRight, Leaf, Shield, Award, LineChart, Sparkles, Zap, MessageSquare } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-emerald-50/50 via-slate-50 to-emerald-50/20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-emerald-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-200">
            <Leaf className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-slate-800">CarbonCoach <span className="text-emerald-600">AI</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</a>
          <a href="#benefits" className="hover:text-emerald-600 transition-colors">Benefits</a>
        </nav>
        <Link 
          href="/assessment" 
          className="inline-flex items-center gap-1 bg-slate-900 hover:bg-emerald-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98]"
        >
          Start Assessment
          <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="px-6 py-20 md:py-32 max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-100/60 rounded-full text-emerald-800 text-xs font-semibold tracking-wider uppercase mb-8 border border-emerald-200 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Sustainability Coach
          </div>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl lg:text-7xl text-slate-900 tracking-tight leading-[1.1] mb-6 max-w-4xl">
            Meet <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">CarbonCoach AI</span>
          </h1>
          <p className="font-display font-semibold text-lg md:text-2xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
            Your Personal Sustainability Assistant
          </p>
          <p className="text-slate-500 text-sm md:text-base mb-12 max-w-lg">
            Understand, track, and reduce your carbon footprint through mathematically prioritized recommendations, personalized 30-day roadmaps, and daily gamified challenges.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
            <Link 
              href="/assessment" 
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base px-8 py-4 rounded-2xl transition-all shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              Start Assessment
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="#features" 
              className="w-full sm:w-auto inline-flex justify-center items-center bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 font-semibold text-base px-8 py-4 rounded-2xl transition-all hover:bg-emerald-50/20 active:scale-[0.98]"
            >
              Explore Features
            </a>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 py-20 bg-slate-100/50 border-y border-slate-200/60">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display font-extrabold text-3xl md:text-4xl text-slate-900 mb-4">Scientific, Automated, and Personal</h2>
              <p className="text-slate-500 max-w-lg mx-auto">Everything you need to analyze, monitor, and optimize your environmental utility score in one unified interface.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
                  <Leaf className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-800 mb-3">Lifestyle Assessment</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Provide your habits via a guided, multi-step accessibility-focused form to compute your exact carbon baseline category-by-category.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-6">
                  <LineChart className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-800 mb-3">Mathematical Eco Score</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Track your progress using an algorithmic 0-100 Eco Score showing deductions and improvements mapped against global green targets.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-800 mb-3">What Should I Fix First</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  No guesswork. Our mathematical decision prioritizer ranks changes by carbon reduction, difficulty, and net impact.
                </p>
              </div>
              {/* Feature 4 */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-6">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-800 mb-3">Daily Eco Challenges</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Gamify your journey. Build micro-habits, log daily completions, and accumulate Eco Points to measure and share your impact.
                </p>
              </div>
              {/* Feature 5 */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-800 mb-3">30-Day Personalized Roadmaps</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  AI-designed weekly roadmap custom-tailored to target your highest emission areas with progressive behavioral improvements.
                </p>
              </div>
              {/* Feature 6 */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-800 mb-3">AI Sustainability Chatbot</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Instant guidance. Chat with CarbonCoach AI about your profile, EV decisions, energy conservation, or lifestyle tips.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="px-6 py-20 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-slate-900 mb-4">Three Simple Steps to Zero</h2>
            <p className="text-slate-500 max-w-sm mx-auto">Lowering your carbon footprint doesn't have to be overwhelming.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-900 text-white font-bold text-2xl flex items-center justify-center mb-6 shadow-lg shadow-slate-200">1</div>
              <h3 className="font-display font-bold text-lg text-slate-800 mb-2">Assess Your Lifestyle</h3>
              <p className="text-slate-500 text-sm">Fill out our quick 2-minute form detailing transport, food, energy, and flights.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white font-bold text-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-100">2</div>
              <h3 className="font-display font-bold text-lg text-slate-800 mb-2">Understand the Drivers</h3>
              <p className="text-slate-500 text-sm">Visualize your footprint breakdown and analyze recommendations prioritized by ease and impact.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-teal-600 text-white font-bold text-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-100">3</div>
              <h3 className="font-display font-bold text-lg text-slate-800 mb-2">Achieve Reduction Goals</h3>
              <p className="text-slate-500 text-sm">Complete challenges, earn points, track trends, and execute your custom 4-week roadmap.</p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="px-6 py-20 bg-slate-900 text-white rounded-[2.5rem] max-w-6xl mx-auto my-12 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent)] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <span className="text-emerald-400 font-semibold tracking-wider text-xs uppercase">Why CarbonCoach?</span>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl tracking-tight mt-2 mb-4">Make Sustainable Living Rewarding</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <h3 className="font-display font-bold text-4xl text-emerald-400 mb-2">~18%</h3>
                <p className="text-slate-400 text-sm font-medium mb-1">Average Footprint Reduction</p>
                <p className="text-slate-500 text-xs px-4">Within the first 3 months of following our tailored roadmap.</p>
              </div>
              <div className="border-y border-slate-800 md:border-y-0 md:border-x py-8 md:py-0 md:px-8">
                <h3 className="font-display font-bold text-4xl text-emerald-400 mb-2">$500+</h3>
                <p className="text-slate-400 text-sm font-medium mb-1">Potential Annual Savings</p>
                <p className="text-slate-500 text-xs px-4">From optimizations in household energy, shopping, and fuel.</p>
              </div>
              <div>
                <h3 className="font-display font-bold text-4xl text-emerald-400 mb-2">100%</h3>
                <p className="text-slate-400 text-sm font-medium mb-1">Gamified & Interactive</p>
                <p className="text-slate-500 text-xs px-4">Points, badges, and challenge tracking build long-term habits.</p>
              </div>
            </div>
            <div className="mt-16 flex justify-center">
              <Link 
                href="/assessment" 
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-4 rounded-2xl transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                Start Assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white px-6 py-12 text-slate-500 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-700">CarbonCoach AI</span>
          </div>
          <div className="flex gap-8">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</a>
            <a href="#benefits" className="hover:text-emerald-600 transition-colors">Benefits</a>
          </div>
          <p className="text-slate-400 text-xs">&copy; {new Date().getFullYear()} CarbonCoach AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
