"use client";

import { useState, useRef } from "react";
import Hero from "@/components/Hero";
import PredictionForm from "@/components/PredictionForm";
import ResultsDashboard from "@/components/ResultsDashboard";
import Chatbot from "@/components/Chatbot";

export default function Home() {
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  
  const predictRef = useRef(null);

  const handleScrollToPredict = () => {
    predictRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePredict = async (formData) => {
    setIsPredicting(true);
    setPredictionResult(null);
    
    // Simulate API call for the UI if backend isn't ready
    try {
      const payload = {
        ...formData,
        duration_minutes: 120,
        departure_hour: 8,
        day_of_week: 5,
        month: 5,
        is_weekend: 0,
        days_left: 30,
        reason: "Vacation",
        extra: "Basic",
        departureWindow: "Morning",
        isFestival: "No",
        membership: "Guest",
        amenities: "None",
        total_stops: parseInt(formData.total_stops),
        passengers: formData.passengers
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://flightprice-sghf.onrender.com";

      const res = await fetch(`${apiUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.error) {
        console.error("Prediction error:", data.error);
        alert(`Prediction Error: ${data.error}`);
        setIsPredicting(false);
      } else {
        setPredictionResult(data);
        setIsPredicting(false);
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("Failed to connect to the backend server. Is Render running?");
      setIsPredicting(false);
    }
  };

  return (
    <main className="min-h-screen relative selection:bg-primary/30">
      <Hero onScrollToPredict={handleScrollToPredict} />
      
      <div ref={predictRef} className="px-4 relative z-10">
        <PredictionForm onPredict={handlePredict} isPredicting={isPredicting} />
        <ResultsDashboard result={predictionResult} />
      </div>

      <Chatbot />
    </main>
  );
}
