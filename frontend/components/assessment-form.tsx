"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitAssessment, analyzeLifestyle, generateRoadmap, fetchAssessmentQuestions, AIQuestion } from "../lib/api";
import { ArrowRight, ArrowLeft, Loader2, Sparkles, Leaf, AlertCircle } from "lucide-react";

export default function AssessmentForm() {
  const router = useRouter();
  const [steps, setSteps] = useState<AIQuestion[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState("");
  const [isAdvancing, setIsAdvancing] = useState(false);

  const [formData, setFormData] = useState({
    transportation: "",
    electricity: "",
    diet: "",
    shopping: "",
    flights: "",
    notes: ""
  });

  useEffect(() => {
    async function loadQuestions() {
      try {
        setLoadingQuestions(true);
        const data = await fetchAssessmentQuestions();
        
        // Append notes as the final step
        const allSteps = [
          ...data,
          {
            id: "notes",
            title: "Lifestyle Notes",
            description: "Any other details about your lifestyle?",
            options: []
          }
        ];
        setSteps(allSteps);
      } catch (err: any) {
        console.error("Failed to load questions from AI:", err);
        setError(err.message || "Failed to load questions from AI.");
      } finally {
        setLoadingQuestions(false);
      }
    }
    loadQuestions();
  }, []);

  const currentStep = steps[currentStepIndex];
  const progressPercent = steps.length ? Math.round(((currentStepIndex + 1) / steps.length) * 100) : 0;

  const handleSelect = (field: string, value: string) => {
    if (isAdvancing || loading) return;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto advance for select options, except for the last notes step
    if (currentStepIndex < steps.length - 2) {
      setIsAdvancing(true);
      setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
        setIsAdvancing(false);
      }, 200);
    }
  };

  const handleNext = () => {
    if (isAdvancing || loading) return;
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (isAdvancing || loading) return;
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const isStepValid = () => {
    if (!currentStep) return false;
    const val = formData[currentStep.id as keyof typeof formData];
    if (currentStep.id === "notes") return true; // Optional
    return val !== "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isAdvancing) return;

    setError("");
    setLoading(true);

    try {
      setLoadingText("Calculating carbon footprint & Eco Score...");
      await submitAssessment({
        transportation: formData.transportation,
        electricity: formData.electricity,
        diet: formData.diet,
        shopping: formData.shopping,
        flights: formData.flights,
        notes: formData.notes
      });

      setLoadingText("Analyzing behavior patterns via CarbonCoach AI...");
      await analyzeLifestyle();

      setLoadingText("Formulating personalized 30-day roadmap...");
      await generateRoadmap();

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to process assessment. Please check backend connection.");
      setLoading(false);
    }
  };

  if (loadingQuestions) {
    return (
      <div className="w-full max-w-xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <header className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
              <Leaf className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-slate-800 text-sm">CarbonCoach AI</span>
          </div>
          <span className="text-slate-300 text-xs font-semibold cursor-not-allowed">
            Cancel & Exit
          </span>
        </header>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
          {/* Shimmer progress bar */}
          <div className="h-2 w-full shimmer-effect" />
          
          <div className="p-8 md:p-10 space-y-6">
            {/* Animated Header */}
            <div className="flex flex-col items-center justify-center text-center py-4 space-y-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl animate-pulse ring-4 ring-emerald-500/5">
                <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: "3s" }} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-slate-800 text-sm tracking-tight animate-pulse">
                  AI is preparing your assessment...
                </h3>
                <p className="text-[11px] font-medium text-slate-400 max-w-xs leading-normal">
                  Analyzing prior habits to generate your personalized questions.
                </p>
              </div>
            </div>

            {/* Options grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
                  <div className="w-5 h-5 rounded-full shimmer-effect flex-shrink-0" />
                  <div className="w-20 h-4 rounded-md shimmer-effect" />
                </div>
              ))}
            </div>
            
            {/* Footer buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
              <div className="w-20 h-10 rounded-xl shimmer-effect" />
              <div className="w-24 h-10 rounded-xl shimmer-effect" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && steps.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <header className="w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
              <Leaf className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-slate-800 text-sm">CarbonCoach AI</span>
          </Link>
          <Link href="/" className="text-slate-400 hover:text-slate-600 text-xs font-semibold">
            Cancel & Exit
          </Link>
        </header>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="font-display font-extrabold text-xl text-slate-800 mb-2">Question Generation Failed</h3>
          <p className="text-red-600 font-semibold text-sm mb-8 leading-relaxed max-w-md">{error}</p>
          <button
            onClick={() => {
              setError("");
              setLoadingQuestions(true);
              window.location.reload();
            }}
            className="bg-slate-900 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentStep) return null;

  return (
    <div className="w-full max-w-xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <header className="w-full flex items-center justify-between">
        {loading ? (
          <>
            <div className="flex items-center gap-2 opacity-50">
              <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
                <Leaf className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-slate-800 text-sm">CarbonCoach AI</span>
            </div>
            <span className="text-slate-300 text-xs font-semibold cursor-not-allowed">
              Cancel & Exit
            </span>
          </>
        ) : (
          <>
            <Link href="/" className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
                <Leaf className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-slate-800 text-sm">CarbonCoach AI</span>
            </Link>
            <Link href="/" className="text-slate-400 hover:text-slate-600 text-xs font-semibold">
              Cancel & Exit
            </Link>
          </>
        )}
      </header>

      {/* Card wrapper */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-slate-100 w-full relative">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        <div className="p-8 md:p-10">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-slate-400 text-xs font-medium">{progressPercent}% Completed</span>
          </div>

          {/* Heading */}
          <h2 className="font-display font-extrabold text-2xl text-slate-800 mb-2">{currentStep.title}</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">{currentStep.description}</p>

          {error && (
            <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl" role="alert">
              {error}
            </div>
          )}

          {/* Wizard Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {loading ? (
              <div className="p-2 md:p-4 space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: "3s" }} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-800 text-sm">CarbonCoach AI Analysis</h3>
                    <p className="text-[10px] text-slate-400">Running our priority engines & roadmap synthesizers</p>
                  </div>
                </div>

                {/* Shimmering Phase items */}
                <div className="space-y-4 pt-2">
                  {/* Phase 1 */}
                  <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    loadingText.includes("Calculating") 
                      ? "border-emerald-200 bg-emerald-50/20 ring-2 ring-emerald-500/5" 
                      : "border-slate-100 bg-slate-50/50"
                  }`}>
                    <div className="flex items-center gap-3 w-full">
                      {loadingText.includes("Calculating") ? (
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin flex-shrink-0" />
                      ) : (loadingText.includes("Analyzing") || loadingText.includes("Formulating")) ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">✓</div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                      )}
                      <div className="flex-grow space-y-2">
                        <span className={`text-xs font-semibold ${loadingText.includes("Calculating") ? "text-slate-800" : "text-slate-500"}`}>Calculating Carbon Footprint & Eco Score</span>
                        {loadingText.includes("Calculating") && (
                          <div className="h-2 w-3/4 rounded-full shimmer-effect" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Phase 2 */}
                  <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    loadingText.includes("Analyzing") 
                      ? "border-emerald-200 bg-emerald-50/20 ring-2 ring-emerald-500/5" 
                      : "border-slate-100 bg-slate-50/50"
                  }`}>
                    <div className="flex items-center gap-3 w-full">
                      {loadingText.includes("Analyzing") ? (
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin flex-shrink-0" />
                      ) : loadingText.includes("Formulating") ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">✓</div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                      )}
                      <div className="flex-grow space-y-2">
                        <span className={`text-xs font-semibold ${loadingText.includes("Analyzing") ? "text-slate-800" : "text-slate-500"}`}>Analyzing Behavior Patterns</span>
                        {loadingText.includes("Analyzing") && (
                          <div className="h-2 w-5/6 rounded-full shimmer-effect" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Phase 3 */}
                  <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    loadingText.includes("Formulating") 
                      ? "border-emerald-200 bg-emerald-50/20 ring-2 ring-emerald-500/5" 
                      : "border-slate-100 bg-slate-50/50"
                  }`}>
                    <div className="flex items-center gap-3 w-full">
                      {loadingText.includes("Formulating") ? (
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                      )}
                      <div className="flex-grow space-y-2">
                        <span className={`text-xs font-semibold ${loadingText.includes("Formulating") ? "text-slate-800" : "text-slate-500"}`}>Formulating 30-Day Roadmap</span>
                        {loadingText.includes("Formulating") && (
                          <div className="h-2 w-2/3 rounded-full shimmer-effect" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status message */}
                <div className="text-center pt-2">
                  <p className="text-xs font-bold text-emerald-700 animate-pulse">{loadingText}</p>
                </div>
              </div>
            ) : (
              <div className="min-h-[220px]">
                {/* Dynamic select options */}
                {currentStep.id !== "notes" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label={currentStep.title}>
                    {currentStep.options.map(opt => {
                      const isSelected = formData[currentStep.id as keyof typeof formData] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSelect(currentStep.id, opt)}
                          disabled={isAdvancing || loading}
                          className={`flex items-center gap-4 p-5 rounded-2xl border text-left font-medium transition-all ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-500/20"
                              : "border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/50"
                          } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
                        >
                          <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center flex-shrink-0">
                            {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Notes Step */
                  <div className="space-y-2">
                    <label htmlFor="notes-input" className="block text-sm font-semibold text-slate-700">
                      Additional notes (optional)
                    </label>
                    <textarea
                      id="notes-input"
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="E.g., I live in an apartment, commute by train sometimes..."
                      className="w-full p-4 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-700 transition-all font-medium resize-none"
                      maxLength={400}
                    />
                    <div className="text-right text-xs text-slate-400">
                      {formData.notes.length}/400 characters
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Controls */}
            {!loading && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                <button
                  key="prev-btn"
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0 || isAdvancing}
                  className={`inline-flex items-center gap-1.5 font-bold text-sm px-5 py-3 rounded-xl transition-all ${
                    currentStepIndex === 0 || isAdvancing
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>

                {currentStepIndex === steps.length - 1 ? (
                  <button
                    key="submit-btn"
                    type="submit"
                    disabled={!isStepValid() || isAdvancing}
                    className={`inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-100 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      !isStepValid() || isAdvancing ? "opacity-50 cursor-not-allowed shadow-none" : ""
                    }`}
                  >
                    Generate Dashboard
                    <Sparkles className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    key="next-btn"
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid() || isAdvancing}
                    className={`inline-flex items-center gap-2 bg-slate-900 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      !isStepValid() || isAdvancing ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
