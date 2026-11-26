"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, Sparkles, Loader2, Settings2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const MODELS = [
  { id: "general", label: "general: Llama 3.3 (General / Split)" },
  { id: "data", label: "data: Llama 3.1 (Internal Data Only)" },
  { id: "outside", label: "outside: Llama 3.1 (Outside Knowledge)" },
];

export default function Chatbot({ isOpen: controlledOpen, onToggle }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = (val) => {
    if (onToggle) onToggle(val);
    else setInternalOpen(val);
  };

  const [activeModel, setActiveModel] = useState("general");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Hi, I'm AeroBot ✈️ Select a model mode above and ask me about domestic fares, booking windows, or baggage rules.",
    },
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

  // Monitor backend availability using lightweight /health endpoint
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    const checkHealth = async () => {
      const apiUrl =
        process.env.NEXT_PUBLIC_ML_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "https://flightprice-sghf.onrender.com";
      try {
        const res = await fetch(`${apiUrl}/health`, { method: "GET", signal: controller.signal });
        if (isMounted) setIsOnline(res.ok);
      } catch {
        if (isMounted) setIsOnline(false);
      } finally {
        clearTimeout(timeoutId);
      }
    };
    checkHealth();
    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [isOpen]);

  // Keyboard accessibility: close mobile drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handleSend = async (e) => {
    e?.preventDefault();
    if (isLoading || !input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    const apiUrl =
      process.env.NEXT_PUBLIC_ML_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://flightprice-sghf.onrender.com";

    try {
      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          model: activeModel,
        }),
      });

      if (!res.ok) {
        let errorDetail = "";
        try {
          const errorData = await res.json();
          if (errorData.detail) {
            errorDetail =
              typeof errorData.detail === "string"
                ? errorData.detail
                : Array.isArray(errorData.detail)
                ? errorData.detail.map((d) => d.msg || JSON.stringify(d)).join(", ")
                : JSON.stringify(errorData.detail);
          }
        } catch {
          // Response body not JSON
        }

        let displayMessage = "";
        if (res.status === 429) {
          displayMessage =
            errorDetail ||
            "Rate limit exceeded (429). Please wait a minute before sending more messages.";
        } else if (res.status === 500) {
          displayMessage = errorDetail
            ? `Server Error (500): ${errorDetail}`
            : "Server Error (500): Failed to process chat response. Please try again shortly.";
        } else if (res.status === 400 || res.status === 422) {
          displayMessage = errorDetail || `Request Error (${res.status}): Please check your input.`;
        } else {
          displayMessage =
            errorDetail || `Error (${res.status}): Failed to receive a response from the server.`;
        }

        setMessages((prev) => [...prev, { role: "ai", content: displayMessage }]);
        return;
      }

      const data = await res.json();
      setIsOnline(true);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: data.reply || "No response received from the assistant." },
      ]);
    } catch {
      setIsOnline(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "Connection Error: Unable to reach the AeroMind backend server. Please verify your connection.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (content) => {
    const parseMarkdown = (text) =>
      text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

    if (content.includes("FROM GIVEN DATA:") && content.includes("FROM OUTSIDE DATA:")) {
      const parts = content.split("FROM OUTSIDE DATA:");
      const givenData = parts[0].replace("FROM GIVEN DATA:", "").trim();
      const outsideData = parts[1].trim();

      return (
        <div className="space-y-2.5 w-full">
          <section
            aria-label="Internal Model Data"
            className="bg-[#3b82f6]/10 border border-[#3b82f6]/25 rounded-xl p-3"
          >
            <p className="text-[11px] font-semibold text-[#3b82f6] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 size={12} /> Internal Model Data
            </p>
            <div className="text-slate-300 leading-relaxed text-[13px] whitespace-pre-line">
              {parseMarkdown(givenData)}
            </div>
          </section>
          <section
            aria-label="Outside Knowledge"
            className="bg-[#8b5cf6]/10 border border-[#8b5cf6]/25 rounded-xl p-3"
          >
            <p className="text-[11px] font-semibold text-[#8b5cf6] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} /> Outside Knowledge
            </p>
            <div className="text-slate-300 leading-relaxed text-[13px] whitespace-pre-line">
              {parseMarkdown(outsideData)}
            </div>
          </section>
        </div>
      );
    }

    return content.split("\n").map((line, j) => (
      <p key={j} className="mb-1.5 last:mb-0 leading-relaxed text-[13px]">
        {parseMarkdown(line)}
      </p>
    ));
  };

  const panelBody = (isMobileOverlay) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="p-4 bg-[#050505]/85 border-b border-white/10 flex flex-col gap-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#2573E6] to-[#6D3BD7] flex items-center justify-center text-white shrink-0">
              <Bot size={20} aria-hidden="true" />
              <span
                aria-hidden="true"
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#050505] ${
                  isOnline ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-white text-base tracking-tight">AeroBot</h2>
                <span
                  role="status"
                  className={`text-[11px] font-medium ${
                    isOnline ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
              <p className="text-xs text-slate-400">AI Fare &amp; Travel Assistant</p>
            </div>
          </div>

          {isMobileOverlay && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close AeroBot flight assistant"
              className="w-11 h-11 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 inline-flex items-center justify-center"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Mode Selector */}
        <label className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 shrink-0">Mode</span>
          <select
            id={isMobileOverlay ? "model-selector-mobile" : "model-selector"}
            aria-label="Select AI model mode"
            value={activeModel}
            onChange={(e) => setActiveModel(e.target.value)}
            className="min-h-[42px] min-w-0 flex-1 bg-[#0a0a0a] text-xs text-slate-200 border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id} className="bg-black">
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      {/* Messages */}
      <div
        aria-live="polite"
        className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth min-h-[260px] lg:max-h-[420px]"
      >
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] p-3 rounded-2xl ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-[#2573E6] to-[#6D3BD7] text-white rounded-br-sm"
                  : "bg-white/5 border border-white/10 text-slate-200 rounded-bl-sm"
              }`}
            >
              {msg.role === "user" ? (
                <p className="text-[13px] leading-relaxed">{msg.content}</p>
              ) : (
                renderMessageContent(msg.content)
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 px-3.5 py-2.5 rounded-2xl rounded-bl-sm border border-white/10 flex items-center gap-2 text-slate-400 text-xs">
              <Loader2 size={14} className="animate-spin text-[#3b82f6]" /> Querying Model...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts + Input */}
      <footer className="bg-[#050505]/90 border-t border-white/10 p-3 flex flex-col gap-2.5">
        <div
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
          role="list"
          aria-label="Quick prompts"
        >
          {[
            "Flight from Delhi to Mumbai tomorrow",
            "When is the best time to book?",
            "Vistara baggage policy?",
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setInput(prompt)}
              className="min-h-[34px] shrink-0 text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask about flights, fares, or timing..."
            aria-label="Chat message input"
            className="min-h-[44px] flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-r from-[#2573E6] to-[#6D3BD7] text-white inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 transition-opacity"
          >
            <Send size={16} />
          </button>
        </form>
      </footer>
    </div>
  );

  return (
    <>
      {/* Floating AeroBot FAB (All Viewports) */}
      <motion.button
        id="chatbot-toggle"
        aria-label="Open AeroBot Travel Assistant"
        aria-expanded={isOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-[#2573E6] to-[#6D3BD7] text-white rounded-full flex items-center justify-center shadow-[0_0_28px_rgba(59,130,246,0.55)] border border-white/20"
      >
        <MessageSquare size={22} />
        <span
          aria-hidden="true"
          className={`absolute top-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-[#050505] ${
            isOnline ? "bg-emerald-400" : "bg-amber-400"
          }`}
        />
      </motion.button>

      {/* Responsive Drawer: Full-Screen on Mobile, Floating Glass Card on Desktop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 w-full sm:w-[420px] h-[100dvh] sm:h-[620px] sm:max-h-[calc(100vh-8rem)] z-50 bg-[#050505] sm:bg-[#0a0a0a]/95 sm:backdrop-blur-2xl sm:rounded-2xl sm:border sm:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
          >
            {panelBody(true)}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
