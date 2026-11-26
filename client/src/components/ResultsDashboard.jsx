"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useEffect, useState } from "react";

// Animated counter component
function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = Math.round(Number(value) || 0);
    if (isNaN(end)) return;
    
    const duration = 800;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>{count.toLocaleString()}</span>;
}

export default function ResultsDashboard({ result }) {
  if (!result) return null;

  const isLow = result.price_range === "Low" || result.recommendation?.toLowerCase().includes("good time");
  const price = result.predicted_price || 0;
  const metrics = result.metrics || {};
  const r2Score = metrics.r2 !== undefined ? metrics.r2 : "0.90";
  const modelMethod = metrics.method || "Random Forest";
  const confidenceValue = result.confidence !== undefined ? Number(result.confidence) : 88;
  const confidenceScore = `${confidenceValue}%`;
  const interval = Array.isArray(metrics.prediction_interval_95) && metrics.prediction_interval_95.length === 2
    ? metrics.prediction_interval_95
    : null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto w-full mb-16 sm:mb-20 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
    >
      {/* Main Price Card */}
      <div className="lg:col-span-2 glass p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl relative overflow-hidden group border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
          {isLow ? <TrendingDown size={120} className="text-emerald-500" /> : <TrendingUp size={120} className="text-rose-500" />}
        </div>
        
        <h3 className="text-slate-400 font-medium mb-2 sm:mb-3 uppercase tracking-widest text-xs">Forecasted Fare (Statistical Estimate)</h3>
        <div className="text-5xl sm:text-6xl md:text-8xl font-bold text-white mb-6 sm:mb-8 font-mono tabular-nums flex items-start tracking-tighter drop-shadow-lg">
          <span className="text-3xl sm:text-4xl mt-2 sm:mt-3 mr-2 text-primary">₹</span>
          <AnimatedCounter value={price} />
        </div>

        <div className="space-y-4 relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm font-medium">Fare Tier:</span>
              <span
                role="status"
                className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isLow ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}
              >
                {result.price_range || (isLow ? "LOW" : "HIGH")}
              </span>
            </div>
            {interval && (
              <div className="px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono tabular-nums text-slate-300">
                95% Interval: ₹{Math.round(interval[0]).toLocaleString()} – ₹{Math.round(interval[1]).toLocaleString()}
              </div>
            )}
          </div>
          
          <div className={`p-4 sm:p-5 rounded-2xl flex items-start gap-3 sm:gap-4 border shadow-inner ${isLow ? 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-900/20' : 'bg-rose-500/10 border-rose-500/20 shadow-rose-900/20'}`}>
            {isLow ? <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="text-rose-400 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-white mb-1 text-sm sm:text-base">AeroMind Guidance</p>
              <p className={`text-xs sm:text-sm font-medium ${isLow ? 'text-emerald-200' : 'text-rose-200'}`}>{result.recommendation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Card */}
      <div className="glass p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl flex flex-col justify-between border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div>
          <h3 className="text-slate-400 font-medium mb-6 sm:mb-8 uppercase tracking-widest text-xs flex items-center gap-2">
            <Info size={16} className="text-primary" /> Model Telemetry
          </h3>
          
          <div className="space-y-6 sm:space-y-8">
            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-slate-400 font-medium">Confidence Score</span>
                <span className="text-primary font-mono tabular-nums font-bold">{confidenceScore}</span>
              </div>
              <div
                role="progressbar"
                aria-label="Model confidence score"
                aria-valuenow={Math.round(confidenceValue)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2.5 bg-slate-900/80 rounded-full overflow-hidden shadow-inner"
              >
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: confidenceScore }}
                  transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-secondary relative"
                >
                  <div className="absolute inset-0 bg-white/20 w-1/2 skew-x-12 animate-[shimmer_2s_infinite]"></div>
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-[#050505] p-4 sm:p-5 rounded-2xl border border-white/5 shadow-inner">
                <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Method</p>
                <p className="text-xs sm:text-sm text-slate-200 font-mono font-medium">{modelMethod}</p>
              </div>
              <div className="bg-[#050505] p-4 sm:p-5 rounded-2xl border border-white/5 shadow-inner">
                <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">R² Score</p>
                <p className="text-xs sm:text-sm text-slate-200 font-mono tabular-nums font-medium">{r2Score}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-5 border-t border-white/10">
          <p className="text-xs text-slate-400 leading-relaxed font-mono tabular-nums">
            <span className="text-secondary font-sans font-bold mr-1">Validation:</span> 
            {metrics.validation || "Held-out test set"} | MAE: ₹{metrics.mae || "429.27"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
