"use client";

import { useState } from "react";
import { ChatMessage, FormData, Prediction } from "@/app/page";
import { Bot, User, Send, Loader2, Sparkles } from "lucide-react";

interface ChatAssistantProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  flightContext: {
    trip: FormData;
    prediction: Prediction | null;
  };
}

export function ChatAssistant({ messages, setMessages, flightContext }: ChatAssistantProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama-3.1-8b-instant");
  const [chatMode, setChatMode] = useState<"data" | "general">("data");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          role: "travel",
          history: messages,
          flightContext,
          model: selectedModel,
          mode: chatMode,
        }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
      } else if (data.error) {
        setMessages((prev) => [...prev, { role: "ai", text: `Error: ${data.error}` }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "I'm having trouble connecting. Please try again in a moment." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "Best time to book?",
    "Compare airlines",
    "Cheapest route?",
    "Peak season tips",
  ];

  return (
    <div className="gradient-border h-[600px] flex flex-col animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <div className="p-6 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-xs text-muted-foreground">Powered by Groq</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={chatMode}
              onChange={(e) => setChatMode(e.target.value as "data" | "general")}
              className="px-3 py-1.5 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="data">Data Analyst</option>
              <option value="general">General</option>
            </select>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-1.5 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
              <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
            </select>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="flex flex-wrap gap-2 mt-4">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="px-3 py-1.5 text-xs bg-muted/30 hover:bg-muted/50 border border-border rounded-full transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === "user"
                  ? "bg-primary/10 text-primary"
                  : "bg-gradient-to-br from-primary/20 to-accent/20 text-primary"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>
            <div
              className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : "bg-muted/50 border border-border rounded-tl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted/50 border border-border rounded-xl rounded-tl-none p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about flights, prices, tips..."
            className="flex-1 px-4 py-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-11 h-11 bg-gradient-to-r from-primary to-accent text-white rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
