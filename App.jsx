import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
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
    <div className="app-container">
      <nav className="navbar">
        <span className="logo">AeroInsight</span>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </nav>

      <main className="content">
        <section className="form-card">
          <h2 className="section-title">Price Prediction</h2>
          <div className="form-grid">
            <div className="input-group">
              <label>Source</label>
              <input type="text" placeholder="City" />
            </div>
            <div className="input-group">
              <label>Destination</label>
              <input type="text" placeholder="City" />
            </div>
            <div className="input-group">
              <label>Date</label>
              <input type="date" />
            </div>
          </div>
          <button className="primary-button">Check Price</button>
        </section>

        <section className="chat-card">
          <div className="chat-header">Support Chat</div>
          <div className="chat-body">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-row ${msg.sender}`}>
                <div className="bubble">{msg.text}</div>
              </div>
            ))}
            {isLoading && <div className="chat-row bot"><div className="bubble typing">...</div></div>}
            <div ref={chatEndRef} />
          </div>
          <form className="chat-footer" onSubmit={handleSendMessage}>
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
