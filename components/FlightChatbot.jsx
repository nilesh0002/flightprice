"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const ROLE_OPTIONS = [
  { value: "booking", label: "Booking" },
  { value: "refund", label: "Refunds" },
  { value: "deals", label: "Deals" },
  { value: "travel", label: "Travel" },
];

const STARTER_MESSAGE =
  "Hi, I can help with bookings, refunds, cheaper alternatives, and travel guidance. Pick a mode and ask away.";

function createMessage(role, content) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  };
}

export default function FlightChatbot({ flightContext }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("booking");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([
    createMessage("assistant", STARTER_MESSAGE),
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const feedRef = useRef(null);
  const inputRef = useRef(null);

  const hasForecastContext = useMemo(
    () => Boolean(flightContext?.prediction?.predictedPrice),
    [flightContext],
  );

  useEffect(() => {
    const feed = feedRef.current;
    if (feed) {
      feed.scrollTop = feed.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  async function handleSubmit(event) {
    event.preventDefault();

    const message = draft.trim();
    if (!message || isLoading) {
      return;
    }

    const userMessage = createMessage("user", message);
    const historyForRequest = messages.map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.content,
    }));

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          role: selectedRole,
          history: historyForRequest,
          flightContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to reach the chat service.");
      }

      setMessages((current) => [
        ...current,
        createMessage("assistant", data.reply),
      ]);
    } catch (submitError) {
      const messageText =
        submitError instanceof Error
          ? submitError.message
          : "Unable to reach the chat service.";

      setError(messageText);
      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          "I hit a temporary issue reaching the assistant. Please try again in a moment.",
        ),
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {isOpen ? (
        <div className="fixed inset-x-3 bottom-24 z-50 sm:inset-x-auto sm:right-6 sm:bottom-24">
          <section
            aria-label="Flight chatbot"
            className="flex h-[min(70vh,44rem)] w-full flex-col overflow-hidden rounded-[2rem] border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] shadow-[var(--shadow)] sm:w-[24rem]"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-[color:var(--border)] px-5 py-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--text-soft)]">
                  Omniscient AI Hub
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[color:var(--text-primary)]">
                  Flight assistant
                </h2>
              </div>
              <button
                aria-label="Close chatbot"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--text-muted)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-primary)]"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="18"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="18"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="border-b border-[color:var(--border)] px-5 py-4">
              <label
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]"
                htmlFor="chat-role"
              >
                Support mode
              </label>
              <select
                className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-sm text-[color:var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
                id="chat-role"
                onChange={(event) => setSelectedRole(event.target.value)}
                value={selectedRole}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-[color:var(--text-muted)]">
                {hasForecastContext
                  ? "Current route and forecast are being sent as chat context."
                  : "Ask general booking and travel questions, or generate a forecast for route-aware help."}
              </p>
            </div>

            <div
              className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
              ref={feedRef}
            >
              {messages.map((message) => {
                const isUser = message.role === "user";

                return (
                  <div
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    key={message.id}
                  >
                    <div
                      className={`max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sm leading-6 shadow-sm ${
                        isUser
                          ? "rounded-br-md bg-[color:var(--accent)] text-white"
                          : "rounded-bl-md bg-[color:var(--surface-muted)] text-[color:var(--text-primary)]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                );
              })}

              {isLoading ? (
                <div className="flex justify-start">
                  <div className="rounded-[1.5rem] rounded-bl-md bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)] shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-[color:var(--accent-soft)]" />
                      <span>Thinking through your request...</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-[color:var(--border)] px-5 py-4">
              {error ? (
                <p className="mb-3 text-sm text-[color:var(--danger)]">{error}</p>
              ) : null}

              <form className="space-y-3" onSubmit={handleSubmit}>
                <textarea
                  className="min-h-[7rem] w-full resize-none rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[color:var(--text-primary)] outline-none transition placeholder:text-[color:var(--text-soft)] focus:border-[color:var(--accent-soft)]"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSubmit(event);
                    }
                  }}
                  placeholder="Ask about booking, refunds, cheaper routes, baggage, visas, or travel tips..."
                  ref={inputRef}
                  value={draft}
                />

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-[color:var(--text-muted)]">
                    Press Enter to send, Shift+Enter for a new line.
                  </p>
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isLoading || !draft.trim()}
                    type="submit"
                  >
                    {isLoading ? (
                      <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    ) : (
                      <svg
                        aria-hidden="true"
                        fill="none"
                        height="16"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="16"
                      >
                        <path d="M22 2 11 13" />
                        <path d="M22 2 15 22 11 13 2 9 22 2Z" />
                      </svg>
                    )}
                    Send
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      ) : null}

      <button
        aria-expanded={isOpen}
        aria-label="Open flight chatbot"
        className="fixed bottom-6 right-6 z-50 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--accent)] text-white shadow-[var(--shadow)] transition hover:-translate-y-1 hover:bg-[color:var(--accent-soft)]"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {isOpen ? (
          <svg
            aria-hidden="true"
            fill="none"
            height="24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="24"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            fill="none"
            height="24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="24"
          >
            <path d="M7 10h10" />
            <path d="M7 14h6" />
            <path d="M12 3c5 0 9 3.58 9 8 0 2.1-.9 4.02-2.38 5.45L20 21l-5.04-1.35A10.6 10.6 0 0 1 12 20c-5 0-9-3.58-9-8s4-9 9-9Z" />
          </svg>
        )}
      </button>
    </>
  );
}
