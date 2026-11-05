"use client";

import { useState, useRef } from "react";
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
  
  const predictRef = useRef(null);

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

      const res = await fetch(`${resolvedApiUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorText = data?.detail || data?.error || `Server responded with status ${res.status}`;
        throw new Error(errorText);
      }
      
      setPredictionResult(data);
    } catch (err) {
      console.error("Prediction error:", err);
      setErrorMessage(err.message || "Failed to connect to the backend prediction service.");
      alert(err.message || "Failed to connect to the backend prediction service.");
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <main className="min-h-screen relative selection:bg-primary/30">
      <Hero onScrollToPredict={handleScrollToPredict} />
      
      <div ref={predictRef} className="px-4 relative z-10">
        <PredictionForm onPredict={handlePredict} isPredicting={isPredicting} />
        {errorMessage && (
          <div className="max-w-5xl mx-auto -mt-14 mb-8 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-xs uppercase font-bold tracking-wider hover:text-white">Dismiss</button>
          </div>
        )}
        <ResultsDashboard result={predictionResult} />
      </div>

      <Chatbot />
    </main>
  );
}
