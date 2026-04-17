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
    origin: 'Delhi',
    destination: 'Mumbai',
    date: new Date().toISOString().split('T')[0],
    passengers: '1',
    airline: 'Vistara',
    stops: '0',
    duration: '120',
    departure: '10'
  });
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi, ask me anything about your upcoming flight or travel!' }
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

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!formData.origin || !formData.destination || !formData.date) return;
    
    setIsLoading(true);
    setPrediction(null);

    const travelDate = new Date(formData.date);
    const today = new Date();
    const diffTime = Math.max(0, travelDate.getTime() - today.getTime());
    const days_left = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const day_of_week = travelDate.getDay(); 
    // 0 is Sunday. In sklearn, they might use 0=Monday depending on preprocess.
    const is_weekend = (day_of_week === 0 || day_of_week === 6) ? 1 : 0;
    const month = travelDate.getMonth() + 1;

    const payload = {
        source: formData.origin,
        destination: formData.destination,
        date: formData.date,
        airline: formData.airline,
        total_stops: parseInt(formData.stops, 10),
        duration_minutes: parseInt(formData.duration, 10) || 120,
        departure_hour: parseInt(formData.departure, 10) || 10,
        day_of_week: day_of_week,
        month: month,
        is_weekend: is_weekend,
        days_left: days_left || 1
    };

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (!data.error) {
         setPrediction(data);
      } else {
         console.error("Prediction Error:", data.error);
         alert("Prediction failed: " + data.error);
      }
    } catch (err) {
      console.error("API error", err);
      // Fallback response for UI continuity when backend is completely MIA
      setPrediction({
        predicted_price: Math.floor(4000 + Math.random() * 5000),
        recommendation: "API unavailable. Showing simulated estimate.",
        confidence: 60,
        price_range: "Low"
      });
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
       const response = await fetch("http://localhost:8000/chat", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ message: currentMsg })
       });
       const data = await response.json();
       if (data.reply) {
         setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
       } else {
         setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I received an unknown error." }]);
       }
    } catch(err) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: 'I cannot connect to the backend ML service right now. Please start `uvicorn app:app`.' 
        }]);
      }, 500);
    }
  };

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
                  <select 
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => setFormData({...formData, origin: e.target.value})}
                    required
                  >
                    <option value="Delhi">Delhi</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Kolkata">Kolkata</option>
                    <option value="Chennai">Chennai</option>
                  </select>
                </div>
                <div className="input-group">
                  <label htmlFor="destination">Destination</label>
                  <select 
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    required
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Kolkata">Kolkata</option>
                    <option value="Chennai">Chennai</option>
                  </select>
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
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="airline">Airline</label>
                  <select 
                    id="airline"
                    value={formData.airline}
                    onChange={(e) => setFormData({...formData, airline: e.target.value})}
                  >
                    <option value="IndiGo">IndiGo</option>
                    <option value="Air India">Air India</option>
                    <option value="Jet Airways">Jet Airways</option>
                    <option value="SpiceJet">SpiceJet</option>
                    <option value="Vistara">Vistara</option>
                  </select>
                </div>
                <div className="input-group">
                  <label htmlFor="stops">Stops</label>
                  <select 
                    id="stops"
                    value={formData.stops}
                    onChange={(e) => setFormData({...formData, stops: e.target.value})}
                  >
                    <option value="0">Non-stop</option>
                    <option value="1">1 Stop</option>
                    <option value="2">2+ Stops</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="duration">Appx Duration (mins)</label>
                  <input
                    type="number"
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="e.g. 120"
                    min="30"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="departure">Departure Hour (24H)</label>
                  <input
                    type="number"
                    id="departure"
                    value={formData.departure}
                    onChange={(e) => setFormData({...formData, departure: e.target.value})}
                    placeholder="e.g. 14 for 2 PM"
                    min="0"
                    max="23"
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn" aria-label="Predict Price" disabled={isLoading}>
                {isLoading ? 'Analyzing...' : 'Predict Price'}
              </button>
            </form>
          </section>

          {prediction && (
            <section className="floating-card result-card">
              <div className="result-label">Estimated Result</div>
              <div className="result-price">₹{prediction.predicted_price.toLocaleString('en-IN')}</div>
              <p className="result-desc" style={{ marginTop: '0.5rem', fontWeight: 500 }}>
                {prediction.recommendation}
              </p>
              {prediction.confidence && (
                <p className="result-desc" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  Model Confidence: {prediction.confidence}% &nbsp;|&nbsp; Range: {prediction.price_range}
                </p>
              )}
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Chat */}
        <div className="right-col">
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
