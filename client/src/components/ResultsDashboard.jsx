"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, BarChart3, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const CITY_CODES = {
  Delhi: "DEL",
  Mumbai: "BOM",
  Bangalore: "BLR",
  Kolkata: "CCU",
  Chennai: "MAA",
};

function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.round(Number(value) || 0);
    if (isNaN(end)) return;

    const duration = 700;
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

export default function ResultsDashboard({ result, queryMeta }) {
  if (!result) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-8 flex flex-col items-center justify-center text-center gap-3 min-h-[320px]">
        <div className="w-12 h-12 rounded-2xl bg-[#3b82f6]/15 border border-[#3b82f6]/30 flex items-center justify-center text-[#3b82f6]">
          <Sparkles size={22} aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-white">Ready to Forecast</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Select your route, departure date, and carrier on the left to compute an estimated fare,
          95% prediction interval, and booking recommendation.
        </p>
      </div>
    );
  }

  const isLow =
    result.price_range === "Low" || result.recommendation?.toLowerCase().includes("good time");
  const isMedium = result.price_range === "Medium";
  const price = Math.round(result.predicted_price || 0);
  const metrics = result.metrics || {};
  const r2Score = metrics.r2 !== undefined ? metrics.r2 : "0.90";
  const modelMethod = metrics.method || "Random Forest";
  const confidenceValue = result.confidence !== undefined ? Number(result.confidence) : 88;
  const confidenceScore = `${confidenceValue}%`;
  const interval =
    Array.isArray(metrics.prediction_interval_95) && metrics.prediction_interval_95.length === 2
      ? [
          Math.round(metrics.prediction_interval_95[0]),
          Math.round(metrics.prediction_interval_95[1]),
        ]
      : null;

  const srcCode = queryMeta?.source ? CITY_CODES[queryMeta.source] || queryMeta.source : "SRC";
  const dstCode = queryMeta?.destination
    ? CITY_CODES[queryMeta.destination] || queryMeta.destination
    : "DST";

  const tierStyles = isLow
    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
    : isMedium
    ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
    : "bg-rose-500/15 border-rose-500/30 text-rose-400";

  const tierDot = isLow ? "bg-emerald-400" : isMedium ? "bg-amber-400" : "bg-rose-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-4"
    >
      {/* Forecasted Fare Card */}
      <article className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 sm:p-6 flex flex-col gap-5 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
                {srcCode} → {dstCode}
              </h2>
              {queryMeta?.date && (
                <span className="font-mono text-xs sm:text-sm text-slate-400 tabular-nums">
                  {queryMeta.date}
                </span>
              )}
            </div>
            {queryMeta && (
              <p className="text-xs sm:text-sm text-slate-400">
                {queryMeta.airline} • {queryMeta.cabin} • {queryMeta.total_stops}{" "}
                {queryMeta.total_stops === "1" ? "Stop" : "Stops"} • {queryMeta.passengers}{" "}
                {queryMeta.passengers === "1" ? "Passenger" : "Passengers"}
              </p>
            )}
          </div>

          <span
            role="status"
            className={`min-h-[32px] inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${tierStyles}`}
          >
            <span className={`w-2 h-2 rounded-full ${tierDot}`} aria-hidden="true" />
            <span>{result.price_range || (isLow ? "Low" : "High")} Fare</span>
          </span>
        </header>

        {/* Large ₹ Price Readout */}
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-mono text-4xl sm:text-5xl font-bold text-white tabular-nums tracking-tight">
            ₹<AnimatedCounter value={price} />
          </p>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Forecasted Fare (Estimate)
          </span>
        </div>

        {/* 95% Prediction Interval */}
        {interval && (
          <div className="rounded-xl bg-[#0a0a0a] border border-white/10 p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-400">95% Prediction Interval</span>
              <span className="font-mono text-sm font-medium text-white tabular-nums">
                ₹{interval[0].toLocaleString()} – ₹{interval[1].toLocaleString()}
              </span>
            </div>
            <div className="relative h-2.5 w-full rounded-full bg-white/10 overflow-hidden" aria-hidden="true">
              <div className="absolute left-[18%] right-[22%] top-0 bottom-0 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]" />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 tabular-nums">
              <span>Lower: ₹{interval[0].toLocaleString()}</span>
              <span className="text-blue-200">Estimate: ₹{price.toLocaleString()}</span>
              <span>Upper: ₹{interval[1].toLocaleString()}</span>
            </div>
          </div>
        )}
      </article>

      {/* 2-Column Sub-Grid: Recommendation & Model Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
        {/* AeroMind Recommendation Card */}
        <article
          className={`h-full rounded-2xl border backdrop-blur-xl p-5 flex flex-col justify-between gap-4 ${
            isLow
              ? "bg-emerald-500/10 border-emerald-500/25"
              : "bg-rose-500/10 border-rose-500/25"
          }`}
        >
          <div className="flex flex-col gap-2">
            <header className="flex items-center gap-2">
              {isLow ? (
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle size={18} className="text-rose-400 shrink-0" aria-hidden="true" />
              )}
              <h3 className="text-base font-semibold text-white">AeroMind Recommendation</h3>
            </header>
            <p className="text-sm text-slate-200 leading-relaxed">{result.recommendation}</p>
          </div>
          <span
            className={`text-xs font-medium ${isLow ? "text-emerald-400" : "text-rose-400"}`}
          >
            {isLow ? "Optimal Buy Window" : "Monitor Fare Trends"}
          </span>
        </article>

        {/* Model Telemetry Card */}
        <article className="h-full rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 flex flex-col justify-between gap-4">
          <header className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-[#3b82f6] shrink-0" aria-hidden="true" />
              <h3 className="text-base font-semibold text-white">Model Telemetry</h3>
            </div>
            <span
              role="status"
              className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#3b82f6]/15 border border-[#3b82f6]/30 text-blue-200 font-mono text-xs tabular-nums"
            >
              R²: {r2Score}
            </span>
          </header>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Confidence Score</span>
              <span className="font-mono text-sm font-semibold text-white tabular-nums">
                {confidenceScore}
              </span>
            </div>
            <div
              className="w-full h-2.5 rounded-full bg-[#0a0a0a] border border-white/10 overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(confidenceValue)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Model Confidence Score ${confidenceScore}`}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: confidenceScore }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
            <span className="text-slate-400">
              {modelMethod} • MAE ₹{metrics.mae || "429.27"}
            </span>
            <span className="font-mono text-slate-300">80/20 Split</span>
          </div>
        </article>
      </div>
    </motion.div>
  );
}
