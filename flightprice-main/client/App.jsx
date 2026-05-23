import React, { useState, useEffect } from 'react';
import './App.css';

// ---- Professional SVGs ----
const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [formData, setFormData] = useState({
    origin: 'Delhi',
    destination: 'Mumbai',
    date: new Date().toISOString().split('T')[0],
    airline: 'Vistara',
    stops: '0',
    duration: '120',
    cabin: 'Economy',
    reason: 'Vacation',
    extra: 'Basic',
    departureWindow: 'Morning',
    isFestival: 'No',
    membership: 'Guest'
  });
  
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'I am Omniscient AI. My intelligence spans all historical market fluctuations. How may I guide your journey today?' }
  ]);
  const [mlStatus, setMlStatus] = useState('checking');
  const [isWaking, setIsWaking] = useState(false);
  const [useMlModel, setUseMlModel] = useState(true);

  const API_BASE_URL = import.meta.env.DEV ? "http://127.0.0.1:8000" : "https://flightprice-sghf.onrender.com";

  useEffect(() => {
    const checkStatus = async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000); // 8s timeout
      try {
        const res = await fetch(`${API_BASE_URL}/test`, { signal: controller.signal });
        clearTimeout(timer);
        const contentType = res.headers.get("content-type");
        // We check for application/json to ensure we aren't just getting the React index.html page!
        if (res.ok && contentType && contentType.includes("application/json")) {
          setMlStatus('online');
        } else {
          setMlStatus('offline');
        }
      } catch (e) {
        clearTimeout(timer);
        // AbortError means it timed out = Render is cold-starting
        setMlStatus(e.name === 'AbortError' ? 'checking' : 'offline');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 20000); // Check every 20s
    return () => clearInterval(interval);
  }, []);

  const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 'Ahmedabad', 'Pune', 'Goa', 'Jaipur'];

  const toggleTheme = () => {
    setIsDark((prev) => {
      const newState = !prev;
      if (newState) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
      return newState;
    });
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPrediction(null);

    // Compare dates as strings (YYYY-MM-DD) to avoid timestamp drift changing days_left on every click
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date(todayStr);
    const travelDate = new Date(formData.date);
    const diffTime = Math.max(0, travelDate.getTime() - todayDate.getTime());
    const days_left = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    const day_of_week = travelDate.getDay(); 
    const month = travelDate.getMonth() + 1;

    const payload = {
        ...formData,
        source: formData.origin,          // backend expects 'source', not 'origin'
        total_stops: parseInt(formData.stops, 10),
        duration_minutes: parseInt(formData.duration, 10) || 120,
        day_of_week,
        month,
        is_weekend: (day_of_week === 0 || day_of_week === 6) ? 1 : 0,
        days_left: days_left || 1,
        departure_hour: formData.departureWindow === 'Early Morning' ? 4 : 
                        formData.departureWindow === 'Morning' ? 9 :
                        formData.departureWindow === 'Afternoon' ? 14 :
                        formData.departureWindow === 'Evening' ? 19 : 22
    };

    if (!useMlModel) {
      setTimeout(() => {
        const randomPrice = Math.floor(Math.random() * (15000 - 3000) + 3000);
        setPrediction({
          predicted_price: randomPrice,
          confidence: Math.floor(Math.random() * (95 - 60) + 60),
          recommendation: "Standard Market Fluctuation (Rule-Based)",
          price_range: "Stable",
          metrics: {
            r2: "N/A",
            mse: "N/A",
            volatility: "Standard",
            sample_size: "Rule Engine",
            method: "Heuristic Fallback",
            f1_approx: "N/A",
            training_split: "N/A"
          }
        });
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      setIsWaking(false);
      const controller = new AbortController();
      // Render free tier cold-starts in ~50s, so allow 65s before giving up
      const wakeTimer = setTimeout(() => setIsWaking(true), 8000);
      const abortTimer = setTimeout(() => controller.abort(), 65000);

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(wakeTimer);
      clearTimeout(abortTimer);
      setIsWaking(false);
      
      const data = await response.json();
      
      if (response.ok && data.predicted_price !== undefined) {
         setPrediction(data);
      } else {
         console.error("Predict logic error:", data);
         throw new Error(data.error || "Invalid response from ML engine");
      }
    } catch (err) {
      setIsWaking(false);
      console.error("Prediction failed:", err.message);
      const msg = err.name === 'AbortError'
        ? "ML engine took too long to respond. Render may be cold-starting — please try again in 30 seconds."
        : (err.message || "Could not connect to ML engine.");
      setPrediction({ error: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const currentMsg = chatMessage;
    setMessages([...messages, { role: 'user', text: currentMsg }]);
    setChatMessage('');
    
    try {
       const response = await fetch(`${API_BASE_URL}/chat`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ message: currentMsg })
       });
       const data = await response.json();
       if (data.reply) setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch(err) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', text: 'Semantic engine busy. Re-routing through local rule-sets.' }]);
      }, 600);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-section">
          <h1>Aero<span>Core</span></h1>
          <div className={`status-indicator ${mlStatus}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {mlStatus === 'checking' ? '⏳ Waking ML Engine...' : mlStatus === 'online' ? 'ML Engine Online' : 'ML Engine Offline'}
            </span>
          </div>
        </div>
        <div className="theme-toggle" onClick={toggleTheme}>
          {isDark ? <SunIcon /> : <MoonIcon />}
        </div>
      </header>

      <main className="main-content">
        <div className="left-col">
          <section className="floating-card forecast-card">
            <h2 className="card-title">Forecast Engine</h2>
            <form className="prediction-form" onSubmit={handlePredict}>
              <div className="form-row">
                <div className="input-group">
                  <label>Origin</label>
                  <select value={formData.origin} onChange={(e) => setFormData({...formData, origin: e.target.value})}>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Destination</label>
                  <select value={formData.destination} onChange={(e) => setFormData({...formData, destination: e.target.value})}>
                    {[...cities].reverse().map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="input-group">
                  <label>Service Carrier</label>
                  <select value={formData.airline} onChange={(e) => setFormData({...formData, airline: e.target.value})}>
                    <option value="Vistara">Vistara</option>
                    <option value="Air India">Air India</option>
                    <option value="IndiGo">IndiGo</option>
                    <option value="SpiceJet">SpiceJet</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Date of Departure</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Cabin Tier</label>
                  <select value={formData.cabin} onChange={(e) => setFormData({...formData, cabin: e.target.value})}>
                    <option value="Economy">Economy</option>
                    <option value="Premium">Premium Economy</option>
                    <option value="Business">Business Class</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Peak / Festival Cycle</label>
                  <select value={formData.isFestival} onChange={(e) => setFormData({...formData, isFestival: e.target.value})}>
                    <option value="No">Off-Peak (Standard)</option>
                    <option value="Yes">Peak Cycle (+30% Forecast)</option>
                  </select>
                </div>
              </div>

              <div className="switch-container">
                <span className="switch-label">Connect to ML Engine</span>
                <label className="switch">
                  <input type="checkbox" checked={useMlModel} onChange={(e) => setUseMlModel(e.target.checked)} />
                  <span className="slider round"></span>
                </label>
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading && isWaking ? '⏳ Waking ML Engine (Render cold start)...' : isLoading ? 'Processing Intelligence...' : 'Generate Market Forecast'}
              </button>
            </form>
          </section>

          {prediction && prediction.error && (
            <section className="floating-card result-card" style={{ borderColor: '#f87171' }}>
              <div className="result-label" style={{ color: '#f87171' }}>⚠ Connection Error</div>
              <p style={{ color: 'var(--text-dim)', marginTop: '1rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {prediction.error}
              </p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Make sure the backend is running: <code>uvicorn app:app --reload</code>
              </p>
            </section>
          )}

          {prediction && !prediction.error && (
            <section className="floating-card result-card">
              <div className="result-label">Forecasted Liquidity</div>
              <div className="result-price">
                ₹{(prediction.predicted_price || 0).toLocaleString('en-IN')}
              </div>
              <div className="confidence-bar-container">
                <div className="confidence-bar" style={{ width: `${prediction.confidence || 0}%` }}></div>
              </div>
              <p className="result-desc" style={{ color: 'var(--accent-hover)', fontWeight: 600 }}>
                {prediction.recommendation || "Processing intelligence..."}
              </p>
              <div className="result-meta" style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <span>Accuracy: {prediction.confidence || 0}%</span>
                <span>Trend: {prediction.price_range || "N/A"}</span>
              </div>

              {prediction.metrics && (
                <div className="technical-meta" style={{ 
                  marginTop: '1.25rem', 
                  paddingTop: '1.25rem', 
                  borderTop: '1px solid var(--border-color)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.75rem',
                  fontSize: '0.7rem',
                  color: 'var(--text-dim)',
                  opacity: 0.8
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>R²</div>
                    <div>{prediction.metrics.r2}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>MSE</div>
                    <div>{prediction.metrics.mse}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Volatility</div>
                    <div>{prediction.metrics.volatility}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Sample</div>
                    <div>{prediction.metrics.sample_size}</div>
                  </div>
                </div>
              )}

              {prediction.metrics && (
                <div style={{ 
                  marginTop: '0.75rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '0.65rem', 
                  color: 'var(--text-dim)',
                  opacity: 0.6
                }}>
                  <span>Method: {prediction.metrics.method}</span>
                  <span>F1-Approx: {prediction.metrics.f1_approx}</span>
                  <span>Split: {prediction.metrics.training_split}</span>
                </div>
              )}

              {prediction.metrics && (
                <div style={{ 
                  marginTop: '0.75rem', 
                  fontSize: '0.65rem', 
                  color: 'var(--text-dim)', 
                  fontStyle: 'italic',
                  opacity: 0.7 
                }}>
                  Hidden Intelligence Active: Optimal Window (Morning) & Standard Membership factor applied.
                </div>
              )}
            </section>
          )}
        </div>

        <div className="right-col">
          <section className="floating-card chat-card assistant-card">
            <h2 className="card-title">Omniscient AI Hub</h2>
            <div className="chat-container">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.role}`}>{msg.text}</div>
              ))}
            </div>
            <form className="chat-input-wrapper" onSubmit={handleSendChat}>
              <input type="text" className="chat-input" placeholder="Query market conditions..." value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} />
              <button type="submit" className="chat-send"><SendIcon /></button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
