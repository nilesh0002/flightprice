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
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-0 text-white/5"
        >
          <Plane size={120} />
        </motion.div>
      </div>

      <div className="z-10 text-center px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-300 text-sm font-medium backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          AeroMind Intelligence
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 min-h-[80px] text-gradient">
          {text}
          <motion.span 
            animate={{ opacity: [1, 0] }} 
            transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
            className="inline-block w-1 h-10 md:h-14 bg-primary ml-2 align-middle opacity-80"
          />
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
          Leverage the power of advanced machine learning models to forecast airline pricing trends. Know exactly when to book your next flight to maximize savings.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onScrollToPredict}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold hover:shadow-[0_0_24px_rgba(59,130,246,0.5)] transition-all"
          >
            Predict Now <ChevronRight size={18} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-semibold hover:bg-white/10 transition-all backdrop-blur-md"
            onClick={() => document.getElementById("chatbot-toggle")?.click()}
          >
            <MessageSquare size={18} className="text-primary" />
            Ask AI Assistant
          </motion.button>
        </div>
      </div>
    </section>
  );
}
