"use client";

import { motion } from "framer-motion";
import {
  PlaneTakeoff,
  PlaneLanding,
  Calendar,
  Search,
  ArrowLeftRight,
  AlertCircle,
  X,
} from "lucide-react";
import { useState } from "react";

// Synchronized with server supported categories
export const SUPPORTED_AIRPORTS = ["Delhi", "Mumbai", "Bangalore", "Kolkata", "Chennai"];
export const SUPPORTED_AIRLINES = ["IndiGo", "Air India", "Vistara", "SpiceJet", "Jet Airways"];
export const SUPPORTED_CABINS = ["Economy", "Business"];
export const SUPPORTED_STOPS = ["0", "1", "2"];
export const SUPPORTED_PASSENGERS = ["1", "2", "3", "4", "5+"];

export default function PredictionForm({ onPredict, isPredicting, errorMessage, onDismissError }) {
  const todayStr = typeof window !== "undefined" ? new Date().toISOString().split("T")[0] : "";

  const [formData, setFormData] = useState({
    source: "Delhi",
    destination: "Mumbai",
    date: todayStr,
    airline: "IndiGo",
    cabin: "Economy",
    total_stops: "0",
    passengers: "1",
  });

  const isSameRoute = formData.source === formData.destination;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (onDismissError) onDismissError();
  };

  const handleSwap = () => {
    setFormData((prev) => ({
      ...prev,
      source: prev.destination,
      destination: prev.source,
    }));
    if (onDismissError) onDismissError();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onPredict(formData);
  };

  const selectBase =
    "min-h-[44px] w-full rounded-xl bg-[#0a0a0a] border border-white/10 px-3 py-2 text-sm text-white focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] focus:outline-none transition-colors";

  const activeError = isSameRoute
    ? "Origin and destination cities cannot be identical."
    : errorMessage;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 sm:p-6 flex flex-col gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
    >
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/15 border border-[#3b82f6]/30 flex items-center justify-center text-[#3b82f6] shrink-0">
          <Search size={18} aria-hidden="true" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-white tracking-tight">Market Forecast</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Configure your route parameters for real-time AI analysis
          </p>
        </div>
      </header>

      {/* Inline Dismissible Error Banner */}
      {activeError && (
        <div
          role="alert"
          className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-3.5 py-2.5 flex items-start justify-between gap-2"
        >
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs sm:text-sm text-rose-300">{activeError}</p>
          </div>
          {!isSameRoute && onDismissError && (
            <button
              type="button"
              onClick={onDismissError}
              aria-label="Dismiss error"
              className="min-w-[32px] min-h-[32px] -mr-1 -mt-0.5 rounded-lg text-rose-300 hover:bg-rose-500/20 inline-flex items-center justify-center"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Row 1: From + Quick Swap + To + Departure Date */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_1fr] items-end gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400">From</span>
            <div className="relative flex items-center">
              <PlaneTakeoff
                size={16}
                aria-hidden="true"
                className="text-[#3b82f6] absolute left-3 pointer-events-none"
              />
              <select
                aria-label="Origin city"
                name="source"
                value={formData.source}
                onChange={handleChange}
                className={`${selectBase} pl-9 pr-2`}
              >
                {SUPPORTED_AIRPORTS.map((a) => (
                  <option key={a} value={a} className="bg-slate-900">
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <div className="flex justify-center sm:block">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap origin and destination cities"
              title="Swap origin and destination"
              className="w-11 h-11 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white inline-flex items-center justify-center hover:bg-white/10 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
            >
              <ArrowLeftRight size={17} className="text-[#3b82f6]" aria-hidden="true" />
            </button>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400">To</span>
            <div className="relative flex items-center">
              <PlaneLanding
                size={16}
                aria-hidden="true"
                className="text-[#8b5cf6] absolute left-3 pointer-events-none"
              />
              <select
                aria-label="Destination city"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                className={`${selectBase} pl-9 pr-2`}
              >
                {SUPPORTED_AIRPORTS.map((a) => (
                  <option key={a} value={a} className="bg-slate-900">
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400">Departure</span>
            <div className="relative flex items-center">
              <Calendar
                size={16}
                aria-hidden="true"
                className="text-[#3b82f6] absolute left-3 pointer-events-none"
              />
              <input
                aria-label="Departure date"
                type="date"
                name="date"
                value={formData.date}
                min={todayStr}
                onChange={handleChange}
                className={`${selectBase} pl-9 pr-2 font-mono text-xs [color-scheme:dark]`}
                required
              />
            </div>
          </label>
        </div>

        {/* Row 2: Balanced 2-col Mobile / 4-col Desktop Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400">Airline</span>
            <select
              aria-label="Airline"
              name="airline"
              value={formData.airline}
              onChange={handleChange}
              className={selectBase}
            >
              {SUPPORTED_AIRLINES.map((a) => (
                <option key={a} value={a} className="bg-slate-900">
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400">Cabin Class</span>
            <select
              aria-label="Cabin class"
              name="cabin"
              value={formData.cabin}
              onChange={handleChange}
              className={selectBase}
            >
              {SUPPORTED_CABINS.map((c) => (
                <option key={c} value={c} className="bg-slate-900">
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400">Connections</span>
            <select
              aria-label="Connections or stops"
              name="total_stops"
              value={formData.total_stops}
              onChange={handleChange}
              className={selectBase}
            >
              {SUPPORTED_STOPS.map((s) => (
                <option key={s} value={s} className="bg-slate-900">
                  {s} {s === "1" ? "Stop" : "Stops"}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400">Travelers</span>
            <select
              aria-label="Number of travelers"
              name="passengers"
              value={formData.passengers}
              onChange={handleChange}
              className={`${selectBase} font-mono text-xs`}
            >
              {SUPPORTED_PASSENGERS.map((p) => (
                <option key={p} value={p} className="bg-slate-900">
                  {p} {p === "1" ? "Adult" : "Adults"}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Row 3: Full-Width Symmetrical Primary CTA */}
        <footer className="pt-1">
          <button
            type="submit"
            disabled={isPredicting || isSameRoute}
            className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-gradient-to-r from-[#2573E6] to-[#6D3BD7] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] shadow-lg shadow-blue-900/20"
          >
            <Search size={17} className={isPredicting ? "animate-spin" : ""} aria-hidden="true" />
            <span>{isPredicting ? "Analyzing Market..." : "Generate Market Forecast"}</span>
          </button>
        </footer>
      </form>
    </motion.article>
  );
}
