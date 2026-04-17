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
      setMessages(prev => [...prev, { text: 'Connection error. Please try again later.', sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Flight Price Predictor</h1>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </header>

      <main>
        <section className="prediction-form">
          <h2>Estimate Your Flight Price</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label>Source</label>
              <input type="text" placeholder="e.g. Delhi" />
            </div>
            <div className="form-group">
              <label>Destination</label>
              <input type="text" placeholder="e.g. Mumbai" />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" />
            </div>
            <button type="submit" className="predict-btn">Check Price</button>
          </form>
        </section>

        <section className="chatbot-section">
          <div className="chat-window">
            <div className="message-list">
              {messages.map((msg, index) => (
                <div key={index} className={`message-bubble ${msg.sender}`}>
                  {msg.text}
                </div>
              ))}
              {isLoading && <div className="message-bubble bot loading">Typing...</div>}
              <div ref={chatEndRef} />
            </div>
            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
              />
              <button type="submit" disabled={isLoading}>Send</button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
