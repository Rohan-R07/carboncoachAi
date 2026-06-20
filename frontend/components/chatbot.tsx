"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Loader2, Leaf } from "lucide-react";
import { chatWithAssistant } from "../lib/api";

const STARTER_PROMPTS = [
  "Should I buy an EV?",
  "How can I lower electricity footprint?",
  "Tell me about meat carbon footprint.",
  "Give me shopping sustainability tips."
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    { sender: "bot", text: "Hello! I am CarbonCoach AI. Ask me anything about your footprint, EV decisions, or sustainable habits." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    setMessages(prev => [...prev, { sender: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const reply = await chatWithAssistant(text);
      setMessages(prev => [...prev, { sender: "bot", text: reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: "bot", text: err.message || "Failed to send message. Please verify connection." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded chat window */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] bg-white rounded-[2rem] border border-slate-200 shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold font-display">CarbonCoach AI</h4>
                <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Active Assistant
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none rounded-lg"
              aria-label="Close chat window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conversation list */}
          <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/50" role="log" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div 
                  className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed font-medium shadow-sm ${
                    m.sender === "user"
                      ? "bg-slate-900 text-white rounded-br-none"
                      : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-3.5 rounded-2xl rounded-bl-none flex items-center gap-2 text-slate-400 text-xs shadow-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  Formulating insight...
                </div>
              </div>
            )}
          </div>

          {/* Prompt starters */}
          {messages.length === 1 && (
            <div className="p-3 border-t border-slate-100 bg-white grid grid-cols-2 gap-2" role="group" aria-label="Suggested starter prompts">
              {STARTER_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="text-[10px] text-left font-semibold text-slate-600 border border-slate-200 p-2 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/10 transition-all focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
            className="p-3 border-t border-slate-100 bg-white flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              maxLength={400}
              className="flex-grow p-3 border border-slate-150 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center flex-shrink-0 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Launcher Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-slate-900 hover:bg-emerald-600 rounded-full text-white shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 hover:rotate-12 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        aria-label="Toggle AI Sustainability Chatbot"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
}
