import React, { useState, useEffect } from 'react';
import './App.css';

// ---- SVGs ----
const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    date: '',
    passengers: '1'
  });
  const [prediction, setPrediction] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi, ask me anything about your upcoming flight.' }
  ]);

  useEffect(() => {
    // Check initial theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const nextTheme = !prev;
      if (nextTheme) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
      }
      return nextTheme;
    });
  };

  const handlePredict = (e) => {
    e.preventDefault();
    if (!formData.origin || !formData.destination) return;
    
    // Simulate API call and prediction setting
    setPrediction(null);
    setTimeout(() => {
      // Mock calculation for demonstration
      const base = 199;
      const pass = parseInt(formData.passengers) || 1;
      setPrediction(base * pass + 86);
    }, 400);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setMessages([...messages, { role: 'user', text: chatMessage }]);
    setChatMessage('');
    
    // Mock AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'I can help find the best times to book that route based on historical data.' 
      }]);
    }, 800);
  };

  // Mock chart data
  const chartData = [40, 65, 30, 85, 55, 90, 70];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-section">
          <h1>Flight<span>Predict</span></h1>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      <main className="main-content">
        {/* LEFT COLUMN: Input & Result */}
        <div className="left-col">
          <section className="floating-card">
            <h2 className="card-title">Check Flight Price</h2>
            <form className="prediction-form" onSubmit={handlePredict}>
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="origin">Origin</label>
                  <input 
                    type="text" 
                    id="origin"
                    placeholder="e.g. NYC" 
                    value={formData.origin}
                    onChange={(e) => setFormData({...formData, origin: e.target.value})}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="destination">Destination</label>
                  <input 
                    type="text" 
                    id="destination"
                    placeholder="e.g. LAX" 
                    value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="date">Travel Date</label>
                  <input 
                    type="date" 
                    id="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="passengers">Passengers</label>
                  <select 
                    id="passengers"
                    value={formData.passengers}
                    onChange={(e) => setFormData({...formData, passengers: e.target.value})}
                  >
                    <option value="1">1 Passenger</option>
                    <option value="2">2 Passengers</option>
                    <option value="3">3 Passengers</option>
                    <option value="4">4+ Passengers</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="submit-btn" aria-label="Predict Price">
                Predict Price
              </button>
            </form>
          </section>

          {prediction !== null && (
            <section className="floating-card result-card">
              <div className="result-label">Estimated Price</div>
              <div className="result-price">${prediction}</div>
              <p className="result-desc">
                High confidence based on recent market trends. 
                Prices might increase closer to travel date.
              </p>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Charts & Chat */}
        <div className="right-col">
          <section className="floating-card">
            <h2 className="card-title">Price Trends (30 Days)</h2>
            <div className="chart-container">
              {chartData.map((height, i) => (
                <div 
                  key={i} 
                  className={`chart-bar ${i === 4 ? 'active' : ''}`}
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>
          </section>

          <section className="floating-card assistant-card">
            <h2 className="card-title">AI Assistant</h2>
            <div className="chat-container">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.role}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            
            <form className="chat-input-wrapper" onSubmit={handleSendChat}>
              <input 
                type="text" 
                className="chat-input"
                placeholder="Ask about this route..." 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <button type="submit" className="chat-send">
                <SendIcon />
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
