import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const chatEndRef = useRef(null);

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

  const handlePredict = async (e) => {
    e.preventDefault();
    setPrediction({ price: 4500, status: 'Good time to book' });
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
      setMessages(prev => [...prev, { text: data.response, sender: 'bot' }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: 'Connection error.', sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <header className="header">
        <div className="brand">
          <h1 className="title">AeroInsight</h1>
          <p className="subtitle">Flight Price Prediction</p>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </header>

      <main className="container">
        <section className="card">
          <form className="form" onSubmit={handlePredict}>
            <div className="field">
              <label>Source</label>
              <input type="text" placeholder="Departure city" />
            </div>
            <div className="field">
              <label>Destination</label>
              <input type="text" placeholder="Arrival city" />
            </div>
            <div className="field">
              <label>Travel Date</label>
              <input type="date" />
            </div>
            <div className="field">
              <label>Departure Time</label>
              <input type="time" />
            </div>
            <div className="field">
              <label>Airline</label>
              <select>
                <option>IndiGo</option>
                <option>Air India</option>
                <option>Vistara</option>
                <option>SpiceJet</option>
              </select>
            </div>
            <div className="field">
              <label>Duration</label>
              <input type="text" placeholder="e.g. 120 min" />
            </div>
            <div className="field">
              <label>Stops</label>
              <select>
                <option>Non-stop</option>
                <option>1 Stop</option>
                <option>2+ Stops</option>
              </select>
            </div>
            <button type="submit" className="button-primary">Check Price</button>
          </form>
        </section>

        {prediction && (
          <section className="card result-card">
            <h2 className="section-label">Predicted Price</h2>
            <div className="price-display">₹{prediction.price}</div>
            <p className="status-text">{prediction.status}</p>
          </section>
        )}

        <section className="card chat-card">
          <h2 className="section-label">Support Assistant</h2>
          <div className="chat-viewport">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.sender}`}>
                <div className="chat-bubble">{msg.text}</div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message bot">
                <div className="chat-bubble typing">...</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form className="chat-controls" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message..."
            />
            <button type="submit" disabled={isLoading}>Send</button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;
