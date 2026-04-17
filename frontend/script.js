// Configuration - Update API_URL for deployment
// For local testing: const API_URL = "http://127.0.0.1:10000";
// For Render deployment, change this to your render URL and redeploy Vercel.
const API_URL = "https://flightprice-api.onrender.com";

// Helper function to handle fetch with retries for Render cold starts
async function fetchWithRetry(url, options, retries = 3, delay = 5000) {
    for (let i = 0; i <= retries; i++) {
        try {
            console.log(`[Frontend Debug] Sending request to: ${url}`);
            const response = await fetch(url, options);
            console.log(`[Frontend Debug] Received response status: ${response.status}`);
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`[Frontend Debug] Response payload:`, data);
            return data;
        } catch (error) {
            console.error(`[Frontend Debug] Attempt ${i + 1} failed:`, error);
            if (i === retries) throw error;
            console.log(`[Frontend Debug] Waiting ${delay}ms before retrying (handling potential cold start)...`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
}

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
                total_stops: parseInt(document.getElementById('total_stops').value),
                duration_minutes: parseInt(document.getElementById('duration_minutes').value)
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
                // Using retry mechanism
                const data = await fetchWithRetry(`${API_URL}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
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
                console.error("Fetch Error Final:", error);
                alert("Could not connect to the backend. The server might be waking up from sleep. Please try again in 30 seconds.");
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

        try {
            // Include visual waiting queue if retrying long
            const tempBubble = document.createElement('div');
            tempBubble.className = 'chat-message bot temp-loader';
            tempBubble.innerHTML = '<div class="msg-bubble"><i>...thinking... (might take up to 50s to wake up if Render is sleeping)</i></div>';
            chatWindow.appendChild(tempBubble);
            chatWindow.scrollTop = chatWindow.scrollHeight;
            
            const data = await fetchWithRetry(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg })
            });
            
            // Remove Temp loader
            const loaders = document.querySelectorAll('.temp-loader');
            loaders.forEach(l => l.remove());
            
            // Output Bot message
            addMessage(data.reply, 'bot');
        } catch (err) {
            console.error("Chat Error:", err);
            // Remove Temp loader
            const loaders = document.querySelectorAll('.temp-loader');
            loaders.forEach(l => l.remove());
            
            addMessage("⚠️ Sorry, I could not connect to my brain server. If the server is waking up from a cold start, please wait 30-50 seconds and try again.", 'bot');
        }
    }

    if (sendChatBtn && chatInput) {
        sendChatBtn.addEventListener('click', sendChatMessage);
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }
});
