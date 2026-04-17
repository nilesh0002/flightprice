import React, { useState, useEffect, useRef } from "react";
import { Bar, Line } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend } from "chart.js";
Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

const icons = {
  source: <svg width="20" height="20" fill="none"><path d="M10 2a6 6 0 016 6c0 4.418-6 10-6 10S4 12.418 4 8a6 6 0 016-6zm0 8a2 2 0 100-4 2 2 0 000 4z" stroke="#64748b" strokeWidth="1.5"/></svg>,
  destination: <svg width="20" height="20" fill="none"><path d="M10 2a6 6 0 016 6c0 4.418-6 10-6 10S4 12.418 4 8a6 6 0 016-6zm0 8a2 2 0 100-4 2 2 0 000 4z" stroke="#64748b" strokeWidth="1.5"/></svg>,
  date: <svg width="20" height="20" fill="none"><rect x="3" y="5" width="14" height="12" rx="2" stroke="#64748b" strokeWidth="1.5"/><path d="M7 3v2M13 3v2" stroke="#64748b" strokeWidth="1.5"/><path d="M3 9h14" stroke="#64748b" strokeWidth="1.5"/></svg>,
  time: <svg width="20" height="20" fill="none"><circle cx="10" cy="10" r="8" stroke="#64748b" strokeWidth="1.5"/><path d="M10 6v4l2 2" stroke="#64748b" strokeWidth="1.5"/></svg>,
  airline: <svg width="20" height="20" fill="none"><path d="M2 16l16-6-7-7-2 2 3 3-8 8z" stroke="#64748b" strokeWidth="1.5"/></svg>,
  duration: <svg width="20" height="20" fill="none"><circle cx="10" cy="10" r="8" stroke="#64748b" strokeWidth="1.5"/><path d="M10 6v4l2 2" stroke="#64748b" strokeWidth="1.5"/></svg>,
  stops: <svg width="20" height="20" fill="none"><circle cx="5" cy="10" r="2" stroke="#64748b" strokeWidth="1.5"/><circle cx="15" cy="10" r="2" stroke="#64748b" strokeWidth="1.5"/><path d="M7 10h6" stroke="#64748b" strokeWidth="1.5"/></svg>
};

const airlines = ["IndiGo", "Air India", "SpiceJet", "Vistara", "GoAir", "AirAsia"];
const stopsOptions = ["Non-stop", "1 Stop", "2+ Stops"];

const dummyDataset = [
  { airline: "IndiGo", price: 4800, stops: 0, duration: 120 },
  { airline: "Air India", price: 5200, stops: 1, duration: 150 },
  { airline: "SpiceJet", price: 5000, stops: 2, duration: 180 },
  { airline: "Vistara", price: 5400, stops: 0, duration: 110 },
  { airline: "GoAir", price: 4700, stops: 1, duration: 140 },
  { airline: "AirAsia", price: 5100, stops: 2, duration: 170 }
];

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || getSystemTheme());
  const [form, setForm] = useState({
    source: "",
    destination: "",
    travelDate: "",
    departureTime: "",
    airline: "",
    duration: "",
    stops: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState([]);
  const [toast, setToast] = useState("");
  const [chartData, setChartData] = useState(dummyDataset);
  const [showChart, setShowChart] = useState("airline");
  const [searches, setSearches] = useState([]);
  const toastTimeout = useRef(null);

  useEffect(() => {
    document.body.classList.remove("dark", "light");
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (toast) {
      clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(""), 2500);
    }
  }, [toast]);

  function handleThemeToggle() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleReset() {
    setForm({
      source: "",
      destination: "",
      travelDate: "",
      departureTime: "",
      airline: "",
      duration: "",
      stops: ""
    });
    setResult(null);
    setError("");
    setToast("Form reset");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Prediction failed");
      const data = await res.json();
      setResult(data);
      setSearches((s) => [{ ...form, ...data, ts: Date.now() }, ...s.slice(0, 4)]);
      setToast("Prediction successful");
    } catch {
      setError("Could not fetch prediction. Please try again.");
      setToast("Prediction failed");
    }
    setLoading(false);
  }

  function renderChart() {
    if (!chartData || chartData.length === 0) {
      return <div className="chart-placeholder">No data available</div>;
    }
    if (showChart === "airline") {
      return (
        <Bar
          data={{
            labels: chartData.map(d => d.airline),
            datasets: [{
              label: "Price",
              data: chartData.map(d => d.price),
              backgroundColor: "var(--accent)"
            }]
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: "var(--muted)" } },
              y: { ticks: { color: "var(--muted)" } }
            }
          }}
        />
      );
    }
    if (showChart === "stops") {
      return (
        <Bar
          data={{
            labels: chartData.map(d => d.stops + (d.stops === 0 ? " (Non-stop)" : "")),
            datasets: [{
              label: "Price",
              data: chartData.map(d => d.price),
              backgroundColor: "var(--accent)"
            }]
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: "var(--muted)" } },
              y: { ticks: { color: "var(--muted)" } }
            }
          }}
        />
      );
    }
    if (showChart === "duration") {
      return (
        <Line
          data={{
            labels: chartData.map(d => d.duration + " min"),
            datasets: [{
              label: "Price",
              data: chartData.map(d => d.price),
              borderColor: "var(--accent)",
              backgroundColor: "rgba(99,102,241,0.15)",
              tension: 0.4
            }]
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: "var(--muted)" } },
              y: { ticks: { color: "var(--muted)" } }
            }
          }}
        />
      );
    }
    return null;
  }

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-title">Flight Price Predictor</div>
        <div className="navbar-subtitle">Get instant flight price predictions</div>
        <button className="theme-toggle-btn" onClick={handleThemeToggle} aria-label="Toggle theme">
          <span className="theme-toggle-thumb" />
        </button>
      </nav>
      <main className="main-content">
        <section className="card form-card">
          <form className="predict-form" onSubmit={handleSubmit} autoComplete="off">
            <div className="form-row">
              <span className="input-icon">{icons.source}</span>
              <input name="source" value={form.source} onChange={handleFormChange} placeholder="Source" required />
            </div>
            <div className="form-row">
              <span className="input-icon">{icons.destination}</span>
              <input name="destination" value={form.destination} onChange={handleFormChange} placeholder="Destination" required />
            </div>
            <div className="form-row">
              <span className="input-icon">{icons.date}</span>
              <input type="date" name="travelDate" value={form.travelDate} onChange={handleFormChange} required />
            </div>
            <div className="form-row">
              <span className="input-icon">{icons.time}</span>
              <input type="time" name="departureTime" value={form.departureTime} onChange={handleFormChange} required />
            </div>
            <div className="form-row">
              <span className="input-icon">{icons.airline}</span>
              <select name="airline" value={form.airline} onChange={handleFormChange} required>
                <option value="">Airline</option>
                {airlines.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <span className="input-icon">{icons.duration}</span>
              <input name="duration" type="number" min="1" value={form.duration} onChange={handleFormChange} placeholder="Duration (min)" required />
            </div>
            <div className="form-row">
              <span className="input-icon">{icons.stops}</span>
              <select name="stops" value={form.stops} onChange={handleFormChange} required>
                <option value="">Stops</option>
                {stopsOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : "Predict"}
              </button>
              <button className="reset-btn" type="button" onClick={handleReset} disabled={loading}>
                Reset Form
              </button>
            </div>
            {error && <div className="error-msg">{error}</div>}
          </form>
          <div className="result-section">
            {loading && <div className="result-loading"><span className="spinner" /> Loading...</div>}
            {result && (
              <div className="result-content">
                <div className="result-price">₹{result.price}</div>
                <div className="result-metrics">
                  <span>MAE: {result.mae}</span>
                  <span>RMSE: {result.rmse}</span>
                  <span>R²: {result.r2}</span>
                </div>
              </div>
            )}
          </div>
        </section>
        <section className="card chart-card">
          <div className="chart-tabs">
            <button className={showChart === "airline" ? "active" : ""} onClick={() => setShowChart("airline")}>Price vs Airline</button>
            <button className={showChart === "stops" ? "active" : ""} onClick={() => setShowChart("stops")}>Price vs Stops</button>
            <button className={showChart === "duration" ? "active" : ""} onClick={() => setShowChart("duration")}>Price vs Duration</button>
          </div>
          <div className="chart-area">{renderChart()}</div>
        </section>
        <section className="card recent-card">
          <div className="recent-title">Recent Searches</div>
          <div className="recent-list">
            {searches.length === 0 && <div className="recent-placeholder">No recent searches</div>}
            {searches.map((s, i) => (
              <div className="recent-item" key={i}>
                <span>{s.source} → {s.destination}</span>
                <span>₹{s.price}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
import React, { useState, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from "recharts";

const COLOR_PRIMARY = "#6366f1";
const COLOR_BG_LIGHT = "#f8fafc";
const COLOR_BG_DARK = "#0f172a";
const COLOR_CARD_LIGHT = "#ffffff";
const COLOR_CARD_DARK = "#1e293b";
const COLOR_BORDER = "#e5e7eb";

const airlines = [
  "IndiGo", "Air India", "SpiceJet", "Vistara", "GoAir", "AirAsia"
];
const stopsOptions = ["Non-stop", "1 Stop", "2+ Stops"];

const chartSample = [
  { airline: "IndiGo", price: 4800 },
  { airline: "Air India", price: 5200 },
  { airline: "SpiceJet", price: 5000 },
  { airline: "Vistara", price: 5400 },
  { airline: "GoAir", price: 4700 },
  { airline: "AirAsia", price: 5100 }
];

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || getSystemTheme());
  const [form, setForm] = useState({
    source: "",
    destination: "",
    travelDate: "",
    departureTime: "",
    airline: "",
    duration: "",
    stops: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [chat, setChat] = useState([{ type: "bot", text: "Ask me anything about flights." }]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    document.body.className = theme === "dark" ? "dark" : "";
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  function handleThemeToggle() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Prediction failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Could not fetch prediction. Please try again.");
    }
    setLoading(false);
  }

  async function handleChatSend(e) {
    e && e.preventDefault();
    if (!chatInput.trim()) return;
    setChat((c) => [...c, { type: "user", text: chatInput }]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatInput })
      });
      let data = { reply: "Sorry, I can only answer flight-related questions." };
      if (res.ok) data = await res.json();
      setChat((c) => [...c, { type: "bot", text: data.reply }]);
    } catch {
      setChat((c) => [...c, { type: "bot", text: "Sorry, something went wrong." }]);
    }
    setChatInput("");
    setChatLoading(false);
  }

  const isMobile = window.innerWidth <= 600;

  return (
    <div className="app-root">
      <div className="theme-toggle">
        <button onClick={handleThemeToggle} aria-label="Toggle dark/light mode">
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>
      <div className={`main-container${isMobile ? " mobile" : ""}`}>
        <div className="left-col">
          <form className="predict-form" onSubmit={handleSubmit} autoComplete="off">
            <div className="form-title">Flight Price Prediction</div>
            <div className="form-row">
              <label>Source</label>
              <input name="source" value={form.source} onChange={handleFormChange} required />
            </div>
            <div className="form-row">
              <label>Destination</label>
              <input name="destination" value={form.destination} onChange={handleFormChange} required />
            </div>
            <div className="form-row">
              <label>Travel Date</label>
              <input type="date" name="travelDate" value={form.travelDate} onChange={handleFormChange} required />
            </div>
            <div className="form-row">
              <label>Departure Time</label>
              <input type="time" name="departureTime" value={form.departureTime} onChange={handleFormChange} required />
            </div>
            <div className="form-row">
              <label>Airline</label>
              <select name="airline" value={form.airline} onChange={handleFormChange} required>
                <option value="">Select</option>
                {airlines.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Duration (mins)</label>
              <input name="duration" type="number" min="1" value={form.duration} onChange={handleFormChange} required />
            </div>
            <div className="form-row">
              <label>Stops</label>
              <select name="stops" value={form.stops} onChange={handleFormChange} required>
                <option value="">Select</option>
                {stopsOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? "Predicting..." : "Predict"}
            </button>
            {error && <div className="error-msg">{error}</div>}
          </form>
          <div className="result-card">
            {loading && <div className="result-loading">Loading...</div>}
            {result && (
              <div className="result-content">
                <div className="result-price">₹{result.price}</div>
                <div className="result-message">
                  {result.recommendation === "good"
                    ? "Good time to book"
                    : "Prices may increase"}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="right-col">
          <div className="chart-card">
            <div className="chart-title">Price vs Airline</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartSample}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#334155" : "#e5e7eb"} />
                <XAxis dataKey="airline" stroke={theme === "dark" ? "#cbd5e1" : "#334155"} />
                <YAxis stroke={theme === "dark" ? "#cbd5e1" : "#334155"} />
                <Tooltip contentStyle={{ background: theme === "dark" ? COLOR_CARD_DARK : COLOR_CARD_LIGHT, borderColor: COLOR_BORDER }} />
                <Bar dataKey="price" fill={COLOR_PRIMARY} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chat-card">
            <div className="chat-title">AI Assistant</div>
            <div className="chat-window">
              {chat.map((msg, i) => (
                <div key={i} className={`chat-msg ${msg.type}`}>{msg.text}</div>
              ))}
              <div ref={chatEndRef} />
              {chatLoading && <div className="chat-msg bot">...</div>}
            </div>
            <form className="chat-input-row" onSubmit={handleChatSend} autoComplete="off">
              <input
                className="chat-input"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about flights..."
                disabled={chatLoading}
                maxLength={300}
              />
              <button className="chat-send-btn" type="submit" disabled={chatLoading || !chatInput.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { 
  Bar, 
  Scatter 
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { 
  Sun, 
  Moon, 
  Send, 
  Plane, 
  Info, 
  TrendingUp, 
  Activity,
  BarChart3
} from 'lucide-react';
import './App.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your AI flight assistant. Ask me about flight prices or routes like 'Delhi to Mumbai tomorrow'.", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [activeTab, setActiveTab] = useState('airline');
  const chatEndRef = useRef(null);

  const [formData, setFormData] = useState({
    source: 'Delhi',
    destination: 'Mumbai',
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    airline: 'IndiGo',
    stops: 0,
    duration: 120
  });

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const modelMetrics = { mae: 1250, rmse: 2100, r2: 0.89 };

  const chartData = {
    airline: {
      labels: ['IndiGo', 'Air India', 'Vistara', 'SpiceJet', 'AirAsia'],
      datasets: [{
        label: 'Avg Price (₹)',
        data: [4500, 6200, 7800, 4200, 4100],
        backgroundColor: '#6366f1',
        borderRadius: 8
      }]
    },
    stops: {
      labels: ['0 Stops', '1 Stop', '2+ Stops'],
      datasets: [{
        label: 'Avg Price (₹)',
        data: [4200, 7500, 11000],
        backgroundColor: '#818cf8',
        borderRadius: 8
      }]
    },
    duration: {
      datasets: [{
        label: 'Duration vs Price',
        data: Array.from({ length: 30 }, () => ({
          x: Math.floor(Math.random() * 500) + 60,
          y: Math.floor(Math.random() * 10000) + 2000
        })),
        backgroundColor: '#6366f1'
      }]
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const travelDate = new Date(formData.date);
    const today = new Date();
    const diffTime = Math.abs(travelDate - today);
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const payload = {
      source: formData.source,
      destination: formData.destination,
      airline: formData.airline,
      total_stops: parseInt(formData.stops),
      duration_minutes: parseInt(formData.duration),
      departure_hour: parseInt(formData.time.split(':')[0]),
      day_of_week: travelDate.getDay(),
      month: travelDate.getMonth() + 1,
      is_weekend: [0, 6].includes(travelDate.getDay()) ? 1 : 0,
      days_left: days_left,
      date: formData.date
    };

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setPrediction({ 
        price: data.predicted_price, 
        avgPrice: data.avg_price,
        status: data.recommendation,
        confidence: data.confidence,
        range: data.price_range
      });
    } catch (error) {
      alert("Prediction error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { text: data.reply || data.response, sender: 'bot' }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: 'Connection error.', sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <nav className="navbar">
        <div className="brand">
          <Plane className="logo-icon" />
          <div>
            <h1 className="title">AeroInsight</h1>
            <p className="subtitle">AI Flight Analytics</p>
          </div>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </nav>

      <main className="dashboard-grid">
        <div className="side-panel">
          <section className="card">
            <h2 className="section-label"><TrendingUp size={16} /> Predict Price</h2>
            <form className="form" onSubmit={handlePredict}>
              <div className="form-row">
                <div className="field">
                  <label>Source</label>
                  <input type="text" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} placeholder="Delhi" required />
                </div>
                <div className="field">
                  <label>Destination</label>
                  <input type="text" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} placeholder="Mumbai" required />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div className="field">
                  <label>Time</label>
                  <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Airline</label>
                  <select value={formData.airline} onChange={e => setFormData({...formData, airline: e.target.value})}>
                    <option>IndiGo</option>
                    <option>Air India</option>
                    <option>Vistara</option>
                    <option>SpiceJet</option>
                  </select>
                </div>
                <div className="field">
                  <label>Stops</label>
                  <select value={formData.stops} onChange={e => setFormData({...formData, stops: e.target.value})}>
                    <option value="0">0 Stops</option>
                    <option value="1">1 Stop</option>
                    <option value="2">2+ Stops</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Duration (min)</label>
                <input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} required />
              </div>
              <button type="submit" className="button-primary" disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Analyze Flight'}
              </button>
            </form>
          </section>

          <section className="card metrics-card">
            <h2 className="section-label"><Activity size={16} /> Model Metrics</h2>
            <div className="metrics-grid">
              <div className="metric-item tooltip">
                <span className="metric-val">{modelMetrics.mae}</span>
                <span className="metric-label">MAE</span>
                <span className="tooltip-text">Mean Absolute Error: Average prediction deviation.</span>
              </div>
              <div className="metric-item tooltip">
                <span className="metric-val">{modelMetrics.rmse}</span>
                <span className="metric-label">RMSE</span>
                <span className="tooltip-text">Root Mean Square Error.</span>
              </div>
              <div className="metric-item tooltip">
                <span className="metric-val">{modelMetrics.r2}</span>
                <span className="metric-label">R²</span>
                <span className="tooltip-text">Accuracy score.</span>
              </div>
            </div>
          </section>
        </div>

        <div className="main-panel">
          {prediction && (
            <section className="card result-card highlight">
              <div className="result-header">
                <h2 className="section-label">Prediction</h2>
                <span className={`badge ${prediction.range.toLowerCase()}`}>{prediction.range} Price</span>
              </div>
              <div className="price-main"><span className="currency">₹</span><span className="amount">{prediction.price}</span></div>
              <p className="recommendation">{prediction.status}</p>
              <div className="confidence-bar">
                <div className="confidence-fill" style={{ width: `${prediction.confidence}%` }}></div>
                <span className="confidence-label">AI Confidence: {prediction.confidence}%</span>
              </div>
              <div className="trend-viz">
                <div className="trend-item"><span className="trend-label">Market Avg</span><span className="trend-val">₹{prediction.avgPrice}</span></div>
                <div className="trend-arrow">{prediction.price < prediction.avgPrice ? '↓' : '↑'}</div>
                <div className="trend-item">
                  <span className="trend-label">Difference</span>
                  <span className={`trend-val ${prediction.price < prediction.avgPrice ? 'success' : ''}`}>
                    ₹{Math.abs(prediction.avgPrice - prediction.price)}
                  </span>
                </div>
              </div>
            </section>
          )}

          <section className="card chart-section">
            <h2 className="section-label"><BarChart3 size={16} /> Market Insights</h2>
            <div className="tabs">
              <button className={`tab-btn ${activeTab === 'airline' ? 'active' : ''}`} onClick={() => setActiveTab('airline')}>Airlines</button>
              <button className={`tab-btn ${activeTab === 'stops' ? 'active' : ''}`} onClick={() => setActiveTab('stops')}>Stops</button>
              <button className={`tab-btn ${activeTab === 'duration' ? 'active' : ''}`} onClick={() => setActiveTab('duration')}>Duration</button>
            </div>
            <div className="chart-container">
              {activeTab === 'airline' && <Bar data={chartData.airline} options={{ responsive: true, maintainAspectRatio: false }} />}
              {activeTab === 'stops' && <Bar data={chartData.stops} options={{ responsive: true, maintainAspectRatio: false }} />}
              {activeTab === 'duration' && <Scatter data={chartData.duration} options={{ responsive: true, maintainAspectRatio: false }} />}
            </div>
          </section>
        </div>

        <div className="support-panel">
          <section className="card chat-card">
            <div className="chat-header"><h2 className="section-label">Support</h2><div className="status-dot"></div></div>
            <div className="chat-viewport">
              {messages.map((msg, i) => (<div key={i} className={`chat-message ${msg.sender}`}><div className="chat-bubble">{msg.text}</div></div>))}
              {isLoading && <div className="chat-message bot"><div className="chat-bubble typing">...</div></div>}
              <div ref={chatEndRef} />
            </div>
            <form className="chat-controls" onSubmit={handleSendMessage}>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask AeroInsight..." />
              <button type="submit" className="send-btn"><Send size={18} /></button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
