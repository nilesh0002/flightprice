"use client";

import { useState, useRef, useEffect } from "react";
import { Bot } from "lucide-react";
import PredictionForm from "@/components/PredictionForm";
import ResultsDashboard from "@/components/ResultsDashboard";
import Chatbot from "@/components/Chatbot";

function deriveDateFeatures(dateString) {
  if (!dateString) {
    throw new Error("Please select a departure date.");
  }

  const parts = dateString.split("-").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((p) => isNaN(p))) {
    throw new Error("Invalid departure date format.");
  }

  const [year, month, day] = parts;
  const departureDate = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = departureDate.getTime() - today.getTime();
  const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    throw new Error("Departure date cannot be in the past. Please select today or a future date.");
  }

  const dayOfWeek = departureDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0;

  return {
    journey_day: day,
    month: month,
    day_of_week: dayOfWeek,
    is_weekend: isWeekend,
    days_left: daysLeft,
  };
}

export default function Home() {
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [apiOnline, setApiOnline] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  const predictRef = useRef(null);

  // Silently wake up backend (e.g., Render free-tier cold start) on page load
  useEffect(() => {
    let mounted = true;
    const apiUrl =
      process.env.NEXT_PUBLIC_ML_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://flightprice-sghf.onrender.com";
    fetch(`${apiUrl}/health`, { method: "GET" })
      .then((res) => {
        if (mounted) setApiOnline(res.ok);
      })
      .catch(() => {
        if (mounted) setApiOnline(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handlePredict = async (formData) => {
    setIsPredicting(true);
    setPredictionResult(null);
    setErrorMessage(null);

    try {
      if (formData.source === formData.destination) {
        throw new Error("Origin and destination cities cannot be identical.");
      }

      const dateFeatures = deriveDateFeatures(formData.date);

      const payload = {
        ...formData,
        ...dateFeatures,
        duration_minutes: 120 + parseInt(formData.total_stops || 0, 10) * 150,
        departure_hour: 10,
        total_stops: parseInt(formData.total_stops || 0, 10),
        passengers: formData.passengers || "1",
      };

      const resolvedApiUrl =
        process.env.NEXT_PUBLIC_ML_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "https://flightprice-sghf.onrender.com";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      let res;
      try {
        res = await fetch(`${resolvedApiUrl}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorText = data?.detail || data?.error || `Server responded with status ${res.status}`;
        throw new Error(errorText);
      }

      setApiOnline(true);
      setPredictionResult(data);
    } catch (err) {
      console.error("Prediction error:", err);
      const msg =
        err.name === "AbortError"
          ? "Request timed out while waiting for the prediction server. Please try again."
          : err.message || "Failed to connect to the backend prediction service.";
      setErrorMessage(msg);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-[#E5E2E1] relative flex flex-col selection:bg-[#3b82f6]/30 pb-20 lg:pb-8">
      {/* Subtle ambient obsidian glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-gradient-to-b from-[#3b82f6]/10 via-[#8b5cf6]/5 to-transparent"
      />

      {/* Unobstructed Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#050505]/85 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6D3BD7] flex items-center justify-center text-white font-bold text-sm shrink-0">
              AM
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <span className="font-bold text-white tracking-tight text-base sm:text-lg">
                AeroMind
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                AI Flight Price Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              role="status"
              className={`min-h-[32px] inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                apiOnline
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/15 border-amber-500/30 text-amber-400"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${apiOnline ? "bg-emerald-400" : "bg-amber-400"}`}
                aria-hidden="true"
              />
              {apiOnline ? "Online" : "Offline"}
            </span>

            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="lg:hidden min-h-[40px] px-3.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-medium inline-flex items-center gap-1.5 hover:bg-white/10"
            >
              <Bot size={15} className="text-[#3b82f6]" aria-hidden="true" />
              AeroBot
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace: 12-Column Responsive Layout */}
      <main className="relative z-10 flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Hero + Market Forecast Form + Results */}
        <section className="lg:col-span-7 flex flex-col gap-6" aria-labelledby="hero-heading">
          <div className="flex flex-col gap-2">
            <h1
              id="hero-heading"
              className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight"
            >
              Predict Domestic Flight Fares Instantly with AI
            </h1>
            <p className="text-sm text-slate-400 max-w-prose leading-relaxed">
              Forecast airline pricing trends with statistical confidence intervals so you know
              exactly when to book.
            </p>
          </div>

          <div ref={predictRef}>
            <PredictionForm
              onPredict={handlePredict}
              isPredicting={isPredicting}
              errorMessage={errorMessage}
              onDismissError={() => setErrorMessage(null)}
            />
          </div>

          <ResultsDashboard result={predictionResult} />
        </section>

        {/* Right Column (5 cols): Docked AeroBot on Desktop + Mobile Drawer */}
        <div className="lg:col-span-5">
          <Chatbot isOpen={chatOpen} onToggle={setChatOpen} />
        </div>
      </main>
    </div>
  );
}
