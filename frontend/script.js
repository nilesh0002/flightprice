// Configuration - Update API_URL for deployment
// For local testing: const API_URL = "http://127.0.0.1:10000";
// For Render deployment, change this to your render URL and redeploy Vercel.
const API_URL = "http://127.0.0.1:10000";

document.addEventListener('DOMContentLoaded', () => {

    // Initialize Date input to today
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    // --- Prediction Form Logic ---
    const form = document.getElementById('flight-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // UI Elements
            const btn = document.getElementById('predict-btn');
            const loader = document.getElementById('pred-loader');
            const btnText = document.getElementById('btn-text');
            const resultContainer = document.getElementById('prediction-result');
            const priceDisplay = document.getElementById('price-display');
            const recDisplay = document.getElementById('recommendation-display');

            // Gather data
            const payload = {
                source: document.getElementById('source').value,
                destination: document.getElementById('destination').value,
                date: document.getElementById('date').value,
                airline: document.getElementById('airline').value,
                stops: parseInt(document.getElementById('stops').value),
                duration: parseInt(document.getElementById('duration').value)
            };

            if(payload.source === payload.destination) {
                alert("Source and Destination cannot be the same!");
                return;
            }

            // Loading State Setup
            btn.disabled = true;
            loader.style.display = 'block';
            btnText.style.display = 'none';
            resultContainer.style.display = 'none'; // hide previous results

            try {
                const response = await fetch(`${API_URL}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}`);
                }
                
                const data = await response.json();
                
                // Construct result
                priceDisplay.textContent = data.predicted_price.toLocaleString('en-IN');
                recDisplay.textContent = data.recommendation;
                
                // Style recommendation badge
                recDisplay.className = 'recommendation badge';
                if (data.recommendation.toLowerCase().includes("good")) {
                    recDisplay.classList.add('good');
                } else if (data.recommendation.toLowerCase().includes("wait") || data.recommendation.toLowerCase().includes("high")) {
                    recDisplay.classList.add('wait');
                }

                // Show result with animation
                resultContainer.style.display = 'block';

            } catch (error) {
                console.error("Fetch Error:", error);
                alert("Could not connect to the backend. Please ensure the FastAPI server is running.");
            } finally {
                // Reset Output State
                btn.disabled = false;
                loader.style.display = 'none';
                btnText.style.display = 'inline';
            }
        });
    }

    // --- Chatbot Logic ---
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat');

    function addMessage(msg, type) {
        const wrapper = document.createElement('div');
        wrapper.className = `chat-message ${type}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        
        // Handling basic formatting (like strong tags mapped in JS)
        bubble.innerHTML = msg; 
        
        wrapper.appendChild(bubble);
        chatWindow.appendChild(wrapper);
        
        // Auto-scroll to bottom
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    async function sendChatMessage() {
        const msg = chatInput.value.trim();
        if (!msg) return;

        // Display user message
        addMessage(msg, 'user');
        chatInput.value = '';

        // Optional: show a typing indicator
        
        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg })
            });
            
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            
            const data = await response.json();
            
            // Output Bot message
            addMessage(data.reply, 'bot');
        } catch (err) {
            console.error("Chat Error:", err);
            addMessage("⚠️ Sorry, I'm having trouble connecting to my brain server right now. Is the backend running?", 'bot');
        }
    }

    if (sendChatBtn && chatInput) {
        sendChatBtn.addEventListener('click', sendChatMessage);
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }
});
