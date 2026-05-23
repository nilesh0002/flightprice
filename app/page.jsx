"use client";

import { useEffect, useMemo, useState } from "react";
import FlightChatbot from "../components/FlightChatbot";

const CITIES = [
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Kolkata",
  "Chennai",
  "Hyderabad",
  "Ahmedabad",
  "Pune",
  "Goa",
  "Jaipur",
];

const AIRLINES = ["Vistara", "Air India", "IndiGo", "SpiceJet"];
const CABIN_OPTIONS = ["Economy", "Premium Economy", "Business Class"];
const FESTIVAL_OPTIONS = ["Off-Peak (Standard)", "Peak Cycle (+30% Forecast)"];
const DEPARTURE_WINDOWS = [
  "Early Morning",
  "Morning",
  "Afternoon",
  "Evening",
  "Late Night",
];

const DEFAULT_ML_API_URL =
  "https://flightprice-sghf.onrender.com";

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function statusCopy(status) {
  if (status === "online") {
    return "ML engine online";
  }

  if (status === "offline") {
    return "ML engine offline";
  }

  return "Waking ML engine";
}

export default function HomePage() {
  const [isDark, setIsDark] = useState(false);
  const [formData, setFormData] = useState({
    origin: "Delhi",
    destination: "Mumbai",
    date: getTodayString(),
    airline: "Vistara",
    cabin: "Economy",
    isFestival: "No",
    departureWindow: "Morning",
    stops: "0",
    duration: "120",
    reason: "Vacation",
    extra: "Basic",
    membership: "Guest",
  });
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  const [mlStatus, setMlStatus] = useState("checking");

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_ML_API_URL || DEFAULT_ML_API_URL;

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, [isDark]);

  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(`${apiBaseUrl}/test`, {
          signal: controller.signal,
        });
        const contentType = response.headers.get("content-type") || "";

        if (!isMounted) {
          return;
        }

        if (
          response.ok &&
          contentType.toLowerCase().includes("application/json")
        ) {
          setMlStatus("online");
        } else {
          setMlStatus("offline");
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setMlStatus(error?.name === "AbortError" ? "checking" : "offline");
      } finally {
        clearTimeout(timer);
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [apiBaseUrl]);

  const flightContext = useMemo(
    () => ({
      trip: {
        origin: formData.origin,
        destination: formData.destination,
        date: formData.date,
        airline: formData.airline,
        cabin: formData.cabin,
        departureWindow: formData.departureWindow,
        isFestival:
          formData.isFestival === "Yes"
            ? "Peak Cycle (+30% Forecast)"
            : "Off-Peak (Standard)",
      },
      prediction: prediction?.error
        ? null
        : prediction
          ? {
              predictedPrice: prediction.predicted_price,
              confidence: prediction.confidence,
              recommendation: prediction.recommendation,
              priceRange: prediction.price_range,
            }
          : null,
    }),
    [formData, prediction],
  );

  function handleFieldChange(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handlePredict(event) {
    event.preventDefault();
    setIsLoading(true);
    setIsWaking(false);
    setPrediction(null);

    const todayDate = new Date(getTodayString());
    const travelDate = new Date(formData.date);
    const diffTime = Math.max(0, travelDate.getTime() - todayDate.getTime());
    const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const dayOfWeek = travelDate.getDay();
    const month = travelDate.getMonth() + 1;

    const payload = {
      ...formData,
      source: formData.origin,
      total_stops: Number.parseInt(formData.stops, 10),
      duration_minutes: Number.parseInt(formData.duration, 10) || 120,
      day_of_week: dayOfWeek,
      month,
      is_weekend: dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0,
      days_left: daysLeft || 1,
      departure_hour:
        formData.departureWindow === "Early Morning"
          ? 4
          : formData.departureWindow === "Morning"
            ? 9
            : formData.departureWindow === "Afternoon"
              ? 14
              : formData.departureWindow === "Evening"
                ? 19
                : 22,
    };

    try {
      const controller = new AbortController();
      const wakeTimer = setTimeout(() => setIsWaking(true), 8000);
      const abortTimer = setTimeout(() => controller.abort(), 65000);

      const response = await fetch(`${apiBaseUrl}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(wakeTimer);
      clearTimeout(abortTimer);
      setIsWaking(false);

      const data = await response.json();

      if (!response.ok || data.predicted_price === undefined) {
        throw new Error(data.error || "Invalid response from the ML engine.");
      }

      setPrediction(data);
    } catch (error) {
      const errorMessage =
        error?.name === "AbortError"
          ? "The ML engine took too long to respond. If the Render service is cold-starting, please try again in a few seconds."
          : error?.message || "Unable to connect to the ML engine.";

      setPrediction({ error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }

  const resultCards = prediction?.error ? (
    <section className="rounded-[2rem] border border-rose-300/40 bg-[color:var(--surface-strong)] p-6 shadow-[var(--shadow)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
        Connection issue
      </p>
      <p className="mt-4 text-base leading-7 text-[color:var(--text-primary)]">
        {prediction.error}
      </p>
      <p className="mt-3 text-sm text-[color:var(--text-muted)]">
        Confirm your prediction API is available at{" "}
        <code className="rounded bg-[color:var(--surface-soft)] px-2 py-1 text-xs">
          {apiBaseUrl}
        </code>
        .
      </p>
    </section>
  ) : prediction ? (
    <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6 shadow-[var(--shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--text-soft)]">
            Forecasted fare
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            {formatCurrency(prediction.predicted_price || 0)}
          </h2>
        </div>
        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-600">
          Confidence {prediction.confidence || 0}%
        </div>
      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-[color:var(--border)]">
        <div
          className="h-full rounded-full bg-[color:var(--accent)] transition-[width] duration-700"
          style={{ width: `${prediction.confidence || 0}%` }}
        />
      </div>

      <p className="mt-5 text-lg font-medium text-[color:var(--text-primary)]">
        {prediction.recommendation}
      </p>
      <p className="mt-2 text-sm text-[color:var(--text-muted)]">
        Trend: {prediction.price_range || "Unavailable"}
      </p>

      {prediction.metrics ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "R2", value: prediction.metrics.r2 },
              { label: "MSE", value: prediction.metrics.mse },
              { label: "Volatility", value: prediction.metrics.volatility },
              { label: "Sample", value: prediction.metrics.sample_size },
            ].map((metric) => (
              <div
                className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4"
                key={metric.label}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                  {metric.label}
                </p>
                <p className="mt-3 text-xl font-semibold text-[color:var(--text-primary)]">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-[color:var(--text-muted)]">
            <span className="rounded-full border border-[color:var(--border)] px-3 py-1.5">
              Method: {prediction.metrics.method}
            </span>
            <span className="rounded-full border border-[color:var(--border)] px-3 py-1.5">
              F1 Approx: {prediction.metrics.f1_approx}
            </span>
            <span className="rounded-full border border-[color:var(--border)] px-3 py-1.5">
              Split: {prediction.metrics.training_split}
            </span>
          </div>
        </>
      ) : null}
    </section>
  ) : (
    <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6 shadow-[var(--shadow)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--text-soft)]">
        Forecast overview
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--text-primary)]">
        Generate a route forecast to unlock contextual chat support
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--text-muted)]">
        The assistant can use the current route, airline, cabin, and price
        forecast as context when you need help booking, finding deals, or
        understanding the recommendation.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          "Forecasts remain connected to your existing prediction API.",
          "Chat replies are generated securely on the server with Groq.",
          "Live prices are intentionally blocked unless a real flight API is added.",
        ].map((item) => (
          <div
            className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4 text-sm leading-6 text-[color:var(--text-muted)]"
            key={item}
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <>
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(140,214,202,0.22),_transparent_58%)]" />

        <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-28 pt-6 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--text-muted)] shadow-sm">
                <span
                  className={`inline-flex h-2.5 w-2.5 rounded-full ${
                    mlStatus === "online"
                      ? "bg-emerald-500"
                      : mlStatus === "offline"
                        ? "bg-rose-500"
                        : "animate-pulse bg-amber-400"
                  }`}
                />
                {statusCopy(mlStatus)}
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[color:var(--text-primary)] sm:text-6xl">
                AeroCore forecast studio
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[color:var(--text-muted)] sm:text-lg">
                Predict fare movement, review model confidence, and launch a
                secure Groq assistant for bookings, refunds, deals, and travel
                support without exposing any API secrets to the browser.
              </p>
            </div>

            <button
              aria-label="Toggle theme"
              className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-primary)] shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--border-strong)]"
              onClick={() => setIsDark((current) => !current)}
              type="button"
            >
              {isDark ? (
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="22"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="22"
                >
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2" />
                  <path d="M12 21v2" />
                  <path d="m4.22 4.22 1.42 1.42" />
                  <path d="m18.36 18.36 1.42 1.42" />
                  <path d="M1 12h2" />
                  <path d="M21 12h2" />
                  <path d="m4.22 19.78 1.42-1.42" />
                  <path d="m18.36 5.64 1.42-1.42" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="22"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="22"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>
          </header>

          <section className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <div className="space-y-8">
              <article className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6 shadow-[var(--shadow)] sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--text-soft)]">
                      Forecast engine
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--text-primary)]">
                      Model-assisted fare prediction
                    </h2>
                  </div>
                  <div className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-2 text-sm text-[color:var(--text-muted)]">
                    Chatbot ready for Vercel
                  </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handlePredict}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                        Origin
                      </span>
                      <select
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-[color:var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
                        onChange={(event) =>
                          handleFieldChange("origin", event.target.value)
                        }
                        value={formData.origin}
                      >
                        {CITIES.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                        Destination
                      </span>
                      <select
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-[color:var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
                        onChange={(event) =>
                          handleFieldChange("destination", event.target.value)
                        }
                        value={formData.destination}
                      >
                        {[...CITIES].reverse().map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                        Service carrier
                      </span>
                      <select
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-[color:var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
                        onChange={(event) =>
                          handleFieldChange("airline", event.target.value)
                        }
                        value={formData.airline}
                      >
                        {AIRLINES.map((airline) => (
                          <option key={airline} value={airline}>
                            {airline}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                        Date of departure
                      </span>
                      <input
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-[color:var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
                        min={getTodayString()}
                        onChange={(event) =>
                          handleFieldChange("date", event.target.value)
                        }
                        required
                        type="date"
                        value={formData.date}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                        Cabin tier
                      </span>
                      <select
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-[color:var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
                        onChange={(event) => {
                          const cabinValue =
                            event.target.value === "Premium Economy"
                              ? "Premium"
                              : event.target.value === "Business Class"
                                ? "Business"
                                : "Economy";
                          handleFieldChange("cabin", cabinValue);
                        }}
                        value={
                          formData.cabin === "Premium"
                            ? "Premium Economy"
                            : formData.cabin === "Business"
                              ? "Business Class"
                              : "Economy"
                        }
                      >
                        {CABIN_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                        Peak / festival cycle
                      </span>
                      <select
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-[color:var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
                        onChange={(event) =>
                          handleFieldChange(
                            "isFestival",
                            event.target.value === FESTIVAL_OPTIONS[1]
                              ? "Yes"
                              : "No",
                          )
                        }
                        value={
                          formData.isFestival === "Yes"
                            ? FESTIVAL_OPTIONS[1]
                            : FESTIVAL_OPTIONS[0]
                        }
                      >
                        {FESTIVAL_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                        Departure window
                      </span>
                      <select
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-[color:var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
                        onChange={(event) =>
                          handleFieldChange(
                            "departureWindow",
                            event.target.value,
                          )
                        }
                        value={formData.departureWindow}
                      >
                        {DEPARTURE_WINDOWS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                        Stops
                      </span>
                      <select
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-[color:var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
                        onChange={(event) =>
                          handleFieldChange("stops", event.target.value)
                        }
                        value={formData.stops}
                      >
                        <option value="0">Non-stop</option>
                        <option value="1">1 stop</option>
                        <option value="2">2+ stops</option>
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                      Approximate duration in minutes
                    </span>
                    <input
                      className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-[color:var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
                      min="30"
                      onChange={(event) =>
                        handleFieldChange("duration", event.target.value)
                      }
                      step="15"
                      type="number"
                      value={formData.duration}
                    />
                  </label>

                  <div className="flex flex-col gap-4 rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                        Groq assistant is now part of the experience
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                        The floating chatbot stays secure by calling a server-side
                        route on Vercel.
                      </p>
                    </div>
                    <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-600">
                      Server-side key only
                    </div>
                  </div>

                  <button
                    className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[color:var(--accent)] px-5 py-4 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-65"
                    disabled={isLoading}
                    type="submit"
                  >
                    {isLoading ? (
                      <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    ) : null}
                    {isLoading
                      ? isWaking
                        ? "Waking ML engine..."
                        : "Generating forecast..."
                      : "Generate market forecast"}
                  </button>
                </form>
              </article>
            </div>

            <div className="space-y-8">
              {resultCards}

              <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6 shadow-[var(--shadow)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--text-soft)]">
                  Chatbot modes
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      title: "Booking",
                      text: "Understands route details and helps explain the current forecast.",
                    },
                    {
                      title: "Refund",
                      text: "Guides users through cancellations, ticket changes, and refund flows.",
                    },
                    {
                      title: "Deals",
                      text: "Suggests cheaper alternatives without pretending to know live market fares.",
                    },
                    {
                      title: "Travel",
                      text: "Answers airport, baggage, visa, and destination planning questions.",
                    },
                  ].map((mode) => (
                    <div
                      className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5"
                      key={mode.title}
                    >
                      <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">
                        {mode.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                        {mode.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </section>
      </main>

      <FlightChatbot flightContext={flightContext} />
    </>
  );
}
