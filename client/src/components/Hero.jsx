"use client";

import { motion } from "framer-motion";
import { Plane, ChevronRight, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";

export default function Hero({ onScrollToPredict }) {
  const [text, setText] = useState("");
  const fullText = "Predict flight prices instantly with AI";
  
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setText(fullText.substring(0, index));
      index++;
      if (index > fullText.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full min-h-[80vh] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Particles / Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [0, 1000], y: [0, -200], opacity: [0, 1, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-0 text-white/10"
        >
          <Plane size={120} />
        </motion.div>
      </div>

      <div className="z-10 text-center px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          AeroMind is Live
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] min-h-[80px]">
          {text}
          <motion.span 
            animate={{ opacity: [1, 0] }} 
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-1 h-12 md:h-16 bg-primary ml-1 align-middle"
          />
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          Leverage the power of advanced machine learning models to forecast airline pricing trends. Know exactly when to book your next flight to maximize savings.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onScrollToPredict}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_30px_rgba(56,189,248,0.6)] transition-all"
          >
            Predict Now <ChevronRight size={18} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-8 py-4 glass border border-white/10 rounded-full font-semibold hover:bg-white/5 transition-all"
            onClick={() => document.getElementById("chatbot-toggle")?.click()}
          >
            <MessageSquare size={18} className="text-secondary" />
            Ask AI Assistant
          </motion.button>
        </div>
      </div>
    </section>
  );
}
