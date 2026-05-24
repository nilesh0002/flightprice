"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, Sparkles, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hi, I'm AeroBot ✈️ Ask me about flights, fares, or travel planning." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("https://flightprice-g2j3.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: data.reply || "I'm having trouble connecting to the network right now." 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: "Error: Unable to reach the AI server." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        id="chatbot-toggle"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.5)] z-50 hover:bg-primary/90 transition-colors"
      >
        <MessageSquare size={24} />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] glass rounded-2xl flex flex-col overflow-hidden z-50 shadow-2xl border border-white/20"
          >
            {/* Header */}
            <div className="p-4 bg-slate-900/80 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">AeroBot <Sparkles size={14} className="text-secondary" /></h3>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-slate-800 text-slate-200 border border-white/5 rounded-tl-sm'
                  }`}>
                    {msg.content.split('\\n').map((line, j) => (
                      <p key={j} className="mb-1 last:mb-0">{line}</p>
                    ))}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-sm border border-white/5 flex items-center gap-2 text-slate-400 text-sm">
                    <Loader2 size={16} className="animate-spin" /> Analyzing data...
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {["Cheapest route to Mumbai?", "When is the best time to book?", "Vistara baggage policy?"].map(prompt => (
                  <button 
                    key={prompt}
                    onClick={() => { setInput(prompt); }}
                    className="text-xs bg-slate-800 border border-white/10 px-3 py-1.5 rounded-full text-slate-300 hover:bg-primary/20 hover:text-primary transition-colors whitespace-nowrap"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-slate-900/50 border-t border-white/10">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about flights..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-full pl-4 pr-12 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
