"use client";

import { motion } from "framer-motion";
import { PlaneTakeoff, PlaneLanding, Calendar, Building2, Briefcase, GitCommit, Search, Users, Sparkles } from "lucide-react";
import { useState } from "react";

const AIRPORTS = ["Delhi", "Mumbai", "Bangalore", "Kolkata", "Hyderabad", "Chennai"];
const AIRLINES = ["Vistara", "IndiGo", "Air India", "SpiceJet", "GoFirst", "AirAsia"];
const CABINS = ["Economy", "Premium Economy", "Business", "First"];
const STOPS = ["0", "1", "2"];
const PASSENGERS = ["1", "2", "3", "4", "5+"];

export default function PredictionForm({ onPredict, isPredicting }) {
  const [formData, setFormData] = useState({
    source: "Delhi",
    destination: "Mumbai",
    date: "",
    airline: "Vistara",
    cabin: "Economy",
    total_stops: "0",
    passengers: "1"
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onPredict(formData);
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://flightprice-sghf.onrender.com";
  const inputClasses = "w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all peer font-medium shadow-inner shadow-black/50";
  const labelClasses = "absolute left-11 -top-2.5 bg-[#050505] px-2 rounded text-xs text-primary font-medium transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary peer-focus:bg-[#050505]";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full max-w-5xl mx-auto -mt-10 mb-20 relative z-20"
    >
      <div className="glass rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden">
        {/* Decorative inner glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
            <Search size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Market Forecast</h2>
            <p className="text-sm text-slate-400">Configure your route parameters for real-time AI analysis</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Origin */}
        <div className="relative group">
          <PlaneTakeoff size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
          <select name="source" value={formData.source} onChange={handleChange} className={inputClasses}>
            {AIRPORTS.map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
          </select>
          <label className={labelClasses}>From</label>
        </div>

        {/* Destination */}
        <div className="relative group">
          <PlaneLanding size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
          <select name="destination" value={formData.destination} onChange={handleChange} className={inputClasses}>
            {AIRPORTS.map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
          </select>
          <label className={labelClasses}>To</label>
        </div>

        {/* Date */}
        <div className="relative group">
          <Calendar size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
          <input type="date" name="date" value={formData.date} onChange={handleChange} className={inputClasses} required />
          <label className={labelClasses}>Departure Date</label>
        </div>

        {/* Airline */}
        <div className="relative group">
          <Building2 size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
          <select name="airline" value={formData.airline} onChange={handleChange} className={inputClasses}>
            {AIRLINES.map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
          </select>
          <label className={labelClasses}>Airline</label>
        </div>

        {/* Cabin */}
        <div className="relative group">
          <Briefcase size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
          <select name="cabin" value={formData.cabin} onChange={handleChange} className={inputClasses}>
            {CABINS.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
          </select>
          <label className={labelClasses}>Cabin Class</label>
        </div>

        {/* Stops */}
        <div className="relative group">
          <GitCommit size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
          <select name="total_stops" value={formData.total_stops} onChange={handleChange} className={inputClasses}>
            {STOPS.map(s => <option key={s} value={s} className="bg-slate-900">{s} Stops</option>)}
          </select>
          <label className={labelClasses}>Connections</label>
        </div>
        
        {/* Passengers */}
        <div className="relative group">
          <Users size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
          <select name="passengers" value={formData.passengers} onChange={handleChange} className={inputClasses}>
            {PASSENGERS.map(p => <option key={p} value={p} className="bg-slate-900">{p} Passenger{p!=='1'?'s':''}</option>)}
          </select>
          <label className={labelClasses}>Travelers</label>
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2 lg:col-span-2 flex items-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isPredicting}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-primary/30 transition-all flex justify-center items-center gap-2 relative overflow-hidden"
          >
            {isPredicting ? (
              <span className="flex items-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Search size={20} />
                </motion.div>
                Analyzing Market...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search size={20} />
                Generate Market Forecast
              </span>
            )}
            
            {/* Shimmer effect */}
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
              className="absolute inset-0 bg-white/20 skew-x-12 w-1/4 pointer-events-none"
            />
          </motion.button>
        </div>

      </form>
    </motion.div>
  );
}
