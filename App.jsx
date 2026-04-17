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
