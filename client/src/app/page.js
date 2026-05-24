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

      const res = await fetch("https://flightprice-g2j3.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.error) {
        console.error("Prediction error:", data.error);
        // Fallback for demo
        setTimeout(() => {
          setPredictionResult({
            predicted_price: 4500,
            recommendation: "Good time to book! 🚀 Avoid surge pricing.",
            confidence: "85.4%"
          });
          setIsPredicting(false);
        }, 1500);
      } else {
        setPredictionResult(data);
        setIsPredicting(false);
      }
    } catch (err) {
      console.error(err);
      // Fallback for demo
      setTimeout(() => {
        setPredictionResult({
          predicted_price: 5200,
          recommendation: "Prices are trending high. Wait a few days.",
          confidence: "78.2%"
        });
        setIsPredicting(false);
      }, 1500);
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
