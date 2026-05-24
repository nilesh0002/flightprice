"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useEffect, useState } from "react";

// Animated counter component
function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (isNaN(end)) return;
    
    const duration = 1000;
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

  const isLow = result.recommendation?.includes("Avoid surge");
  const price = result.predicted_price || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto w-full mb-20 grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Main Price Card */}
      <div className="lg:col-span-2 glass p-8 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          {isLow ? <TrendingDown size={120} /> : <TrendingUp size={120} />}
        </div>
        
        <h3 className="text-slate-400 font-medium mb-2 uppercase tracking-wider text-sm">Forecasted Liquidity</h3>
        <div className="text-5xl md:text-7xl font-bold text-white mb-6 font-mono flex items-start">
          <span className="text-3xl mt-2 mr-2 text-primary">₹</span>
          <AnimatedCounter value={price} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Trend Analysis:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isLow ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isLow ? "LOW" : "HIGH"}
            </span>
          </div>
          
          <div className={`p-4 rounded-xl flex items-start gap-3 border ${isLow ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            {isLow ? <CheckCircle2 className="text-emerald-400 shrink-0" /> : <AlertCircle className="text-rose-400 shrink-0" />}
            <div>
              <p className="font-medium text-slate-200">AeroMind Guidance</p>
              <p className={`text-sm ${isLow ? 'text-emerald-300' : 'text-rose-300'}`}>{result.recommendation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Card */}
      <div className="glass p-8 rounded-3xl flex flex-col justify-between">
        <div>
          <h3 className="text-slate-400 font-medium mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
            <Info size={16} /> Model Telemetry
          </h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">Confidence Score</span>
                <span className="text-primary font-mono">{result.confidence}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: result.confidence }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <p className="text-xs text-slate-500 mb-1">Method</p>
                <p className="text-sm text-slate-300 font-mono">Random Forest</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <p className="text-xs text-slate-500 mb-1">R² Score</p>
                <p className="text-sm text-slate-300 font-mono">0.989</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-slate-500">
            <span className="text-secondary font-bold">Intelligence Active:</span> Optimal Window & standard factors applied.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
