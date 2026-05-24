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
      <div className="lg:col-span-2 glass p-8 md:p-10 rounded-3xl relative overflow-hidden group border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          {isLow ? <TrendingDown size={140} className="text-emerald-500" /> : <TrendingUp size={140} className="text-rose-500" />}
        </div>
        
        <h3 className="text-slate-500 font-medium mb-3 uppercase tracking-widest text-xs">Forecasted Liquidity</h3>
        <div className="text-6xl md:text-8xl font-bold text-white mb-8 font-mono flex items-start tracking-tighter drop-shadow-lg">
          <span className="text-4xl mt-3 mr-2 text-primary">₹</span>
          <AnimatedCounter value={price} />
        </div>

        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Trend Analysis:</span>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${isLow ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
              {isLow ? "LOW" : "HIGH"}
            </span>
          </div>
          
          <div className={`p-5 rounded-2xl flex items-start gap-4 border shadow-inner ${isLow ? 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-900/20' : 'bg-rose-500/10 border-rose-500/20 shadow-rose-900/20'}`}>
            {isLow ? <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="text-rose-400 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-white mb-1">AeroMind Guidance</p>
              <p className={`text-sm font-medium ${isLow ? 'text-emerald-200' : 'text-rose-200'}`}>{result.recommendation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Card */}
      <div className="glass p-8 md:p-10 rounded-3xl flex flex-col justify-between border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div>
          <h3 className="text-slate-500 font-medium mb-8 uppercase tracking-widest text-xs flex items-center gap-2">
            <Info size={16} className="text-primary" /> Model Telemetry
          </h3>
          
          <div className="space-y-8">
            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-slate-400 font-medium">Confidence Score</span>
                <span className="text-primary font-mono font-bold">{result.confidence}</span>
              </div>
              <div className="h-2.5 bg-slate-900/80 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: result.confidence }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-secondary relative"
                >
                  <div className="absolute inset-0 bg-white/20 w-1/2 skew-x-12 animate-[shimmer_2s_infinite]"></div>
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#050505] p-5 rounded-2xl border border-white/5 shadow-inner">
                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Method</p>
                <p className="text-sm text-slate-200 font-mono font-medium">Random Forest</p>
              </div>
              <div className="bg-[#050505] p-5 rounded-2xl border border-white/5 shadow-inner">
                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">R² Score</p>
                <p className="text-sm text-slate-200 font-mono font-medium">0.989</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="text-secondary font-bold mr-1">Intelligence Active:</span> 
            Optimal Window & standard factors applied.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
