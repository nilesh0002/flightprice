"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, Sparkles, Loader2, Settings2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const MODELS = [
  { id: "general", label: "Llama 3.3 (General / Split)" },
  { id: "data", label: "Llama 3.1 (Internal Data Only)" },
  { id: "outside", label: "Llama 3.1 (Outside Knowledge)" }
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModel, setActiveModel] = useState("general");
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hi, I'm AeroBot ✈️ Select a model mode above and ask me about flights, fares, or travel planning." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Monitor backend availability
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_ML_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://flightprice-sghf.onrender.com";
      try {
        const res = await fetch(`${apiUrl}/`, { method: "GET" });
        if (isMounted) setIsOnline(res.ok);
      } catch {
        if (isMounted) setIsOnline(false);
      }
    };
    checkHealth();
    return () => { isMounted = false; };
  }, [isOpen]);

  // Keyboard accessibility: close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (isLoading || !input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_ML_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://flightprice-sghf.onrender.com";

    try {
      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          model: activeModel 
        })
      });

      if (!res.ok) {
        let errorDetail = "";
        try {
          const errorData = await res.json();
          if (errorData.detail) {
            errorDetail = typeof errorData.detail === "string"
              ? errorData.detail
              : Array.isArray(errorData.detail)
                ? errorData.detail.map(d => d.msg || JSON.stringify(d)).join(", ")
                : JSON.stringify(errorData.detail);
          }
        } catch {
          // Response body not JSON
        }

        let displayMessage = "";
        if (res.status === 429) {
          displayMessage = errorDetail || "Rate limit exceeded (429). Please wait a minute before sending more messages.";
        } else if (res.status === 500) {
          displayMessage = errorDetail ? `Server Error (500): ${errorDetail}` : "Server Error (500): Failed to process chat response. Please try again shortly.";
        } else if (res.status === 400 || res.status === 422) {
          displayMessage = errorDetail || `Request Error (${res.status}): Please check your input.`;
        } else {
          displayMessage = errorDetail || `Error (${res.status}): Failed to receive a response from the server.`;
        }

        setMessages(prev => [...prev, { 
          role: "ai", 
          content: displayMessage 
        }]);
        return;
      }

      const data = await res.json();
      setIsOnline(true);
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: data.reply || "No response received from the assistant." 
      }]);
    } catch (error) {
      setIsOnline(false);
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: "Connection Error: Unable to reach the AeroMind backend server. Please verify your connection." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render split sections beautifully
  const renderMessageContent = (content) => {
    const parseMarkdown = (text) => {
      return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-bold text-white drop-shadow-sm">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    if (content.includes("FROM GIVEN DATA:") && content.includes("FROM OUTSIDE DATA:")) {
      const parts = content.split("FROM OUTSIDE DATA:");
      const givenData = parts[0].replace("FROM GIVEN DATA:", "").trim();
      const outsideData = parts[1].trim();

      return (
        <div className="space-y-4 w-full">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 shadow-inner">
            <p className="text-[11px] font-bold text-primary mb-2 uppercase tracking-widest flex items-center gap-1.5">
              <Settings2 size={12} /> Internal Model Data
            </p>
            <div className="text-slate-300 leading-relaxed text-[13px]">{parseMarkdown(givenData)}</div>
          </div>
          <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 shadow-inner">
            <p className="text-[11px] font-bold text-secondary mb-2 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={12} /> Outside Knowledge
            </p>
            <div className="text-slate-300 leading-relaxed text-[13px]">{parseMarkdown(outsideData)}</div>
          </div>
        </div>
      );
    }

    // Default rendering for normal text
    return content.split('\n').map((line, j) => (
      <p key={j} className="mb-2 last:mb-0 leading-relaxed text-[13px]">{parseMarkdown(line)}</p>
    ));
  };

  return (
    <>
      <motion.button
        id="chatbot-toggle"
        aria-label="Open AeroBot flight assistant"
        aria-expanded={isOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-primary to-secondary text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.6)] z-50 hover:shadow-[0_0_40px_rgba(59,130,246,0.8)] transition-all border border-white/20"
      >
        <MessageSquare size={26} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            className="fixed bottom-28 right-6 w-[420px] max-w-[calc(100vw-3rem)] h-[650px] max-h-[calc(100vh-8rem)] glass rounded-3xl flex flex-col overflow-hidden z-50 shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="p-5 bg-black/40 border-b border-white/5 flex flex-col gap-4 backdrop-blur-md relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-primary border border-white/10 shadow-inner">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white flex items-center gap-2 tracking-wide">AeroBot <Sparkles size={14} className="text-secondary" /></h3>
                    {isOnline ? (
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider font-medium mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span> Online
                      </p>
                    ) : (
                      <p className="text-[10px] text-amber-400 flex items-center gap-1.5 uppercase tracking-wider font-medium mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span> Offline
                      </p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  aria-label="Close AeroBot flight assistant"
                  className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Model Selector Dropdown */}
              <div className="relative group">
                <select 
                  id="model-selector"
                  aria-label="Select AI model mode"
                  value={activeModel}
                  onChange={(e) => setActiveModel(e.target.value)}
                  className="w-full bg-[#0a0a0a] text-xs text-slate-300 border border-white/10 rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-inner transition-colors group-hover:border-white/20 font-medium"
                >
                  {MODELS.map(m => (
                    <option key={m.id} value={m.id} className="bg-black">{m.label}</option>
                  ))}
                </select>
                <Settings2 size={14} className="absolute right-4 top-[11px] text-slate-400 pointer-events-none group-hover:text-primary transition-colors" />
              </div>
            </div>

            {/* Messages */}
            <div 
              aria-live="polite"
              className="flex-1 overflow-y-auto p-5 space-y-5 scroll-smooth bg-gradient-to-b from-black/0 to-black/20"
            >
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-primary to-blue-600 text-white rounded-tr-sm shadow-[0_8px_20px_rgba(59,130,246,0.3)]' 
                      : 'bg-white/5 border border-white/10 backdrop-blur-md text-slate-300 rounded-tl-sm shadow-inner shadow-white/5'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-[13px] leading-relaxed">{msg.content}</p>
                    ) : (
                      renderMessageContent(msg.content)
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white/5 p-4 rounded-2xl rounded-tl-sm border border-white/10 flex items-center gap-3 text-slate-400 text-xs tracking-wider uppercase font-medium backdrop-blur-md shadow-inner shadow-white/5">
                    <Loader2 size={16} className="animate-spin text-primary" /> Querying Model...
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length === 1 && (
              <div className="px-5 pb-3 flex gap-2.5 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {["Cheapest route to Mumbai?", "When is the best time to book?", "Vistara baggage policy?"].map(prompt => (
                  <button 
                    key={prompt}
                    onClick={() => { setInput(prompt); }}
                    className="text-xs bg-black/40 border border-white/10 px-4 py-2 rounded-full text-slate-300 hover:bg-primary/20 hover:text-white hover:border-primary/50 transition-all whitespace-nowrap font-medium shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-black/60 border-t border-white/10 backdrop-blur-xl relative z-10">
              <div className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={isLoading}
                  placeholder="Ask about flights..."
                  aria-label="Chat message input"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-full pl-5 pr-14 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-inner transition-all group-hover:border-white/20 disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                  className="absolute right-2 top-2 bottom-2 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors shadow-md"
                >
                  <Send size={16} className="ml-0.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
