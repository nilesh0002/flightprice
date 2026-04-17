// Configuration - Update API_URL for deployment
const API_URL = "https://flightprice-api.onrender.com";

// Advanced fetch logic with exponentially increasing backoff
async function fetchWithRetry(url, options, retries = 5, onRetryClick) {
    let delay = 5000; // Base delay

    for (let i = 0; i <= retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second explicit timeout per request to catch stalled sleep instances

        try {
            console.log(`[Attempt ${i + 1}/${retries + 1}] Sending request to: ${url}`);
            
            options.signal = controller.signal;
            const response = await fetch(url, options);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            console.warn(`[Attempt ${i + 1} Failed]: ${error.message}`);
            
            if (i === retries) {
                console.error("All retry attempts exhausted.");
                throw error;
            }

            // Calculate next delay (Exponential-like backoff 5s -> 10s -> 15s)
            delay = 5000 + (i * 5000);
            
            // Trigger UI update callback if provided
            if (onRetryClick) {
                onRetryClick(i + 1, delay, retries);
            }
            
            console.log(`Waiting ${delay}ms before next attempt to allow Render to wake up...`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {

    // 1. Initial background warmup ping
    // This calls the /test route immediately so the server starts booting up the moment the page loads
    console.log("Sending initial background warm-up ping to Render backend...");
    fetch(`${API_URL}/test`, { method: "GET" })
        .then(res => console.log("Backend Warm-up Ping Response:", res.status))
        .catch(err => console.log("Warm-up ping (server is likely asleep, waking process started)."));

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
            resultContainer.style.display = 'none'; 
            
            btnText.innerHTML = `Sending request...`;

            // UI Retry Updater
            const updateUIForRetry = (attempt, currentDelay, maxRetries) => {
                btnText.innerHTML = `Waking up server... attempt ${attempt + 1}/${maxRetries + 1} <br><small style="font-size: 0.7em;">(First request may take 30-50s)</small>`;
            };

            try {
                const data = await fetchWithRetry(`${API_URL}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }, 5, updateUIForRetry);
                
                // Success! Restore Button
                btnText.innerHTML = `Predict Now`;
                
                priceDisplay.textContent = data.predicted_price.toLocaleString('en-IN');
                recDisplay.textContent = data.recommendation;
                
                recDisplay.className = 'recommendation badge';
                if (data.recommendation.toLowerCase().includes("good")) {
                    recDisplay.classList.add('good');
                } else if (data.recommendation.toLowerCase().includes("wait") || data.recommendation.toLowerCase().includes("high")) {
                    recDisplay.classList.add('wait');
                }

                resultContainer.style.display = 'block';

            } catch (error) {
                console.error("Prediction Request Failed:", error);
                btnText.innerHTML = `Prediction Failed`;
                alert("Error: Render Backend is unreachable after 5 attempts. Please check if the web server is online.");
            } finally {
                btn.disabled = false;
                loader.style.display = 'none';
                if (btnText.innerHTML === `Prediction Failed`) {
                    setTimeout(() => { btnText.innerHTML = `Predict Now`; }, 3000);
                }
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
        bubble.innerHTML = msg; 
        
        wrapper.appendChild(bubble);
        chatWindow.appendChild(wrapper);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return wrapper; // Return the DOM element so we can modify it later
    }

    async function sendChatMessage() {
        const msg = chatInput.value.trim();
        if (!msg) return;

        addMessage(msg, 'user');
        chatInput.value = '';
        sendChatBtn.disabled = true;

        // Temporary Loading Bubble
        const tempBubbleWrapper = addMessage('<i>...thinking...</i>', 'bot');
        const bubbleText = tempBubbleWrapper.querySelector('.msg-bubble');

        const updateChatForRetry = (attempt, currentDelay, maxRetries) => {
            bubbleText.innerHTML = `<i>Waking up server... (Attempt ${attempt + 1}/${maxRetries + 1}). Please wait roughly 30-50s.</i>`;
        };

        try {
            const data = await fetchWithRetry(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg })
            }, 5, updateChatForRetry);
            
            tempBubbleWrapper.remove();
            addMessage(data.reply, 'bot');
        } catch (err) {
            console.error("Chat Error:", err);
            tempBubbleWrapper.remove();
            addMessage("⚠️ Sorry, the server is unreachable after all retries. Please verify your Render service is active.", 'bot');
        } finally {
            sendChatBtn.disabled = false;
        }
    }

    if (sendChatBtn && chatInput) {
        sendChatBtn.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }
});
