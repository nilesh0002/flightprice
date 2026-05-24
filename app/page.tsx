"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { FlightSearchForm } from "@/components/flight-search-form";
import { PredictionResult } from "@/components/prediction-result";
import { ChatAssistant } from "@/components/chat-assistant";
import { TrustBadges } from "@/components/trust-badges";

export interface FormData {
  origin: string;
  destination: string;
  date: string;
  airline: string;
  stops: string;
  duration: string;
  cabin: string;
  reason: string;
  extra: string;
  departureWindow: string;
  isFestival: string;
  membership: string;
  passengers: string;
  amenities: string;
}

export interface Prediction {
  predicted_price?: number;
  confidence?: number;
  recommendation?: string;
  price_range?: string;
  error?: string;
  metrics?: {
    r2: string | number;
    mse: string | number;
    volatility: string;
    sample_size: string | number;
    method: string;
    f1_approx: string | number;
    training_split: string;
  };
}

export interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export default function Home() {
  const [mlStatus, setMlStatus] = useState<"checking" | "online" | "offline">("checking");
  const [formData, setFormData] = useState<FormData>({
    origin: "Delhi",
    destination: "Mumbai",
    date: new Date().toISOString().split("T")[0],
    airline: "Vistara",
    stops: "0",
    duration: "120",
    cabin: "Economy",
    reason: "Vacation",
    extra: "Basic",
    departureWindow: "Morning",
    isFestival: "No",
    membership: "Guest",
    passengers: "1",
    amenities: "None",
  });
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  const [useMlModel, setUseMlModel] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", text: "Hello! I'm your AI flight assistant. I can help you with booking tips, price predictions, and travel recommendations. How can I assist you today?" }
  ]);

  const API_BASE_URL = process.env.NODE_ENV === "development" 
    ? "http://127.0.0.1:8000" 
    : "https://flightprice-sghf.onrender.com";

  useEffect(() => {
    const checkStatus = async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(`${API_BASE_URL}/test`, { signal: controller.signal });
        clearTimeout(timer);
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          setMlStatus("online");
        } else {
          setMlStatus("offline");
        }
      } catch {
        clearTimeout(timer);
        setMlStatus("offline");
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 20000);
    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPrediction(null);

    const todayStr = new Date().toISOString().split("T")[0];
    const todayDate = new Date(todayStr);
    const travelDate = new Date(formData.date);
    const diffTime = Math.max(0, travelDate.getTime() - todayDate.getTime());
    const days_left = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    const day_of_week = travelDate.getDay();
    const month = travelDate.getMonth() + 1;

    const payload = {
      ...formData,
      source: formData.origin,
      total_stops: parseInt(formData.stops, 10),
      duration_minutes: parseInt(formData.duration, 10) || 120,
      day_of_week,
      month,
      is_weekend: (day_of_week === 0 || day_of_week === 6) ? 1 : 0,
      days_left: days_left || 1,
      departure_hour: formData.departureWindow === "Early Morning" ? 4 :
                      formData.departureWindow === "Morning" ? 9 :
                      formData.departureWindow === "Afternoon" ? 14 :
                      formData.departureWindow === "Evening" ? 19 : 22,
    };

    if (!useMlModel) {
      setTimeout(() => {
        const randomPrice = Math.floor(Math.random() * (15000 - 3000) + 3000);
        setPrediction({
          predicted_price: randomPrice,
          confidence: Math.floor(Math.random() * (95 - 60) + 60),
          recommendation: "Standard Market Fluctuation (Rule-Based)",
          price_range: "Stable",
          metrics: {
            r2: "N/A",
            mse: "N/A",
            volatility: "Standard",
            sample_size: "Rule Engine",
            method: "Heuristic Fallback",
            f1_approx: "N/A",
            training_split: "N/A",
          },
        });
        setIsLoading(false);
      }, 800);
      return;
    }

    try {
      setIsWaking(false);
      const controller = new AbortController();
      const wakeTimer = setTimeout(() => setIsWaking(true), 8000);
      const abortTimer = setTimeout(() => controller.abort(), 65000);

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(wakeTimer);
      clearTimeout(abortTimer);
      setIsWaking(false);

      const data = await response.json();

      if (response.ok && data.predicted_price !== undefined) {
        setPrediction(data);
      } else {
        throw new Error(data.error || "Invalid response from ML engine");
      }
    } catch (err) {
      setIsWaking(false);
      const error = err as Error & { name?: string };
      const msg = error.name === "AbortError"
        ? "ML engine took too long to respond. Please try again in 30 seconds."
        : (error.message || "Could not connect to ML engine.");
      setPrediction({ error: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-mesh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Header mlStatus={mlStatus} />
        
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Search & Results */}
          <div className="space-y-6">
            <FlightSearchForm
              formData={formData}
              setFormData={setFormData}
              useMlModel={useMlModel}
              setUseMlModel={setUseMlModel}
              isLoading={isLoading}
              isWaking={isWaking}
              onSubmit={handlePredict}
            />
            
            {prediction && (
              <PredictionResult prediction={prediction} />
            )}
            
            <TrustBadges />
          </div>

          {/* Right Column - Chat Assistant */}
          <div className="lg:sticky lg:top-6 h-fit">
            <ChatAssistant
              messages={messages}
              setMessages={setMessages}
              flightContext={{ trip: formData, prediction }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
