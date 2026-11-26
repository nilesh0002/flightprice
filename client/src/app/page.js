"use client";

import { useState, useRef, useEffect } from "react";
import Hero from "@/components/Hero";
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

  const dayOfWeek = departureDate.getDay(); // 0 is Sunday, 6 is Saturday
  const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6) ? 1 : 0;

  return {
    journey_day: day,
    month: month,
    day_of_week: dayOfWeek,
    is_weekend: isWeekend,
    days_left: daysLeft
  };
}

export default function Home() {
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [apiOnline, setApiOnline] = useState(true);
  
  const predictRef = useRef(null);

  // Silently wake up backend (e.g., Render free-tier cold start) on page load
  useEffect(() => {
    let mounted = true;
    const apiUrl = process.env.NEXT_PUBLIC_ML_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://flightprice-sghf.onrender.com";
    fetch(`${apiUrl}/health`, { method: "GET" })
      .then((res) => { if (mounted) setApiOnline(res.ok); })
      .catch(() => { if (mounted) setApiOnline(false); });
    return () => { mounted = false; };
  }, []);

  const handleScrollToPredict = () => {
    predictRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePredict = async (formData) => {
    setIsPredicting(true);
    setPredictionResult(null);
    setErrorMessage(null);
    
    try {
      if (formData.source === formData.destination) {
        throw new Error("Origin and destination cities cannot be the same.");
      }

      const dateFeatures = deriveDateFeatures(formData.date);

      const payload = {
        ...formData,
        ...dateFeatures,
        duration_minutes: 120 + (parseInt(formData.total_stops || 0) * 150),
        departure_hour: 10,
        total_stops: parseInt(formData.total_stops || 0, 10),
        passengers: formData.passengers || "1"
      };

      // Standardized ML API environment variable with backward compatibility
      const apiUrl = process.env.NEXT_PUBLIC_ML_API_URL || process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.warn("NEXT_PUBLIC_ML_API_URL is not defined in environment, falling back to default API.");
      }
      const resolvedApiUrl = apiUrl || "https://flightprice-sghf.onrender.com";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      let res;
      try {
        res = await fetch(`${resolvedApiUrl}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }
      
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorText = data?.detail || data?.error || `Server responded with status ${res.status}`;
        throw new Error(errorText);
      }
      
      setPredictionResult(data);
    } catch (err) {
      console.error("Prediction error:", err);
      const msg = err.name === "AbortError"
        ? "Request timed out while waiting for the prediction server. Please try again."
        : (err.message || "Failed to connect to the backend prediction service.");
      setErrorMessage(msg);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <main className="min-h-screen relative selection:bg-primary/30 pb-20 sm:pb-10">
      {/* Compact Sticky Top Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#050505]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs shadow-md">
              AM
            </div>
            <span className="font-bold text-white tracking-tight text-sm sm:text-base">AeroMind</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              role="status"
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 border ${
                apiOnline
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${apiOnline ? "bg-emerald-400" : "bg-amber-400"}`} />
              {apiOnline ? "Online" : "Offline"}
            </span>
            <button
              type="button"
              onClick={handleScrollToPredict}
              className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-semibold transition-colors"
            >
              Predict
            </button>
          </div>
        </div>
      </header>

      <Hero onScrollToPredict={handleScrollToPredict} />
      
      <div ref={predictRef} className="px-4 relative z-10">
        <PredictionForm onPredict={handlePredict} isPredicting={isPredicting} />
        {errorMessage && (
          <div role="alert" className="max-w-5xl mx-auto -mt-8 sm:-mt-14 mb-8 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm flex items-center justify-between gap-4">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-xs uppercase font-bold tracking-wider hover:text-white shrink-0 min-h-[36px] px-2">Dismiss</button>
          </div>
        )}
        <ResultsDashboard result={predictionResult} />
      </div>

      <Chatbot />
    </main>
  );
}
