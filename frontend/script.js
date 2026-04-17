const API_URL = "https://flightprice-sghf.onrender.com";

// --- Theme Toggle Persistence ---
const themeBtn = document.getElementById('theme-btn');
const rootElement = document.documentElement;
let currentTheme = localStorage.getItem('theme') || 'dark';

function applyTheme(theme) {
    if (theme === 'dark') {
        rootElement.setAttribute('data-theme', 'dark');
        themeBtn.innerHTML = '☀️ Light Mode';
    } else {
        rootElement.setAttribute('data-theme', 'light');
        themeBtn.innerHTML = '🌙 Dark Mode';
    }
    localStorage.setItem('theme', theme);
}
applyTheme(currentTheme);

if(themeBtn) {
    themeBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(currentTheme);
    });
}

// --- Exponential Fetch Handler (Resilient Networking) ---
async function fetchWithRetry(url, options, retries = 5, onRetryClick) {
    let delay = 5000;
    for (let i = 0; i <= retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s absolute kill limit

        try {
            options.signal = controller.signal;
            const response = await fetch(url, options);
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`Status ${response.status}`);
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (i === retries) throw error;
            delay = 5000 + (i * 5000);
            if (onRetryClick) onRetryClick(i + 1, delay, retries);
            await new Promise(res => setTimeout(res, delay));
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {

    // Initial Warm-up
    fetch(`${API_URL}/test`, { method: "GET" }).catch(() => console.log("Warm-up ping active."));

    // Pre-fill fields beautifully
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date();
        dateInput.value = today.toISOString().split('T')[0];
        dateInput.min = today.toISOString().split('T')[0]; // Disable past dates natively
    }

    // --- Complex ML Features & Prediction Block ---
    const form = document.getElementById('flight-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('predict-btn');
            const loader = document.getElementById('pred-loader');
            const btnText = document.getElementById('btn-text');
            const resultContainer = document.getElementById('prediction-result');
            
            // Nodes
            const priceDisplay = document.getElementById('price-display');
            const recDisplay = document.getElementById('recommendation-display');
            const confNumber = document.getElementById('conf-number');
            const confFillBar = document.getElementById('conf-fill-bar');

            // Extraction & Hidden Auto-Calculation 
            const travelDate = new Date(document.getElementById('date').value);
            const todayDate = new Date();
            
            const diffTime = travelDate - todayDate;
            const days_left = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            
            const timeVal = document.getElementById('departure_time').value || "08:00";
            const departure_hour = parseInt(timeVal.split(":")[0]);
            
            const day_of_week = travelDate.getDay();
            const month = travelDate.getMonth() + 1;
            const is_weekend = (day_of_week === 0 || day_of_week === 6) ? 1 : 0;

            const payload = {
                source: document.getElementById('source').value,
                destination: document.getElementById('destination').value,
                airline: document.getElementById('airline').value,
                total_stops: parseInt(document.getElementById('total_stops').value),
                duration_minutes: parseInt(document.getElementById('duration_minutes').value),
                departure_hour,
                day_of_week,
                month,
                is_weekend,
                days_left
            };

            if(payload.source === payload.destination) {
                alert("Source and Destination cannot be the same!");
                return;
            }

            // Lock UI
            btn.disabled = true;
            btnText.style.display = 'none';
            loader.style.display = 'block';
            resultContainer.style.display = 'none'; 
            confFillBar.style.width = '0%'; // Reset

            const updateUIForRetry = (attempt, currentDelay, maxRetries) => {
                btnText.style.display = 'block';
                loader.style.display = 'none';
                btnText.innerHTML = `Waking up server... (${attempt}/${maxRetries})`;
            };

            try {
                const data = await fetchWithRetry(`${API_URL}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }, 5, updateUIForRetry);
                
                // Print UI Success
                priceDisplay.textContent = data.predicted_price.toLocaleString('en-IN');
                
                recDisplay.textContent = data.recommendation;
                recDisplay.className = 'badge';
                if (data.recommendation.toLowerCase().includes("good")) recDisplay.classList.add('good');
                else recDisplay.classList.add('wait');

                // Animate Confidence Bar
                const confidence = data.confidence || 0;
                confNumber.textContent = confidence;
                resultContainer.style.display = 'flex';
                
                // Allow exact reflow before animation slides it naturally
                setTimeout(() => { confFillBar.style.width = `${confidence}%`; }, 100);

            } catch (error) {
                console.error("Prediction Failed:", error);
                alert("Server is unconditionally unreachable at this exact moment.");
            } finally {
                btn.disabled = false;
                loader.style.display = 'none';
                btnText.style.display = 'block';
                btnText.innerHTML = `Predict Now`;
            }
        });
    }

    // --- Chatbot Hooking ---
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat');

    function addMessage(msg, type) {
        const wrapper = document.createElement('div');
        wrapper.className = `chat-message ${type}`;
        wrapper.innerHTML = `<div class="msg-bubble">${msg}</div>`; 
        chatWindow.appendChild(wrapper);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return wrapper;
    }

    async function sendChatMessage() {
        const msg = chatInput.value.trim();
        if (!msg) return;

        addMessage(msg, 'user');
        chatInput.value = '';
        sendChatBtn.disabled = true;

        const tempBubbleWrapper = addMessage('<i>typing...</i>', 'bot');
        const bubbleText = tempBubbleWrapper.querySelector('.msg-bubble');

        try {
            const data = await fetchWithRetry(`${API_URL}/chat`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg })
            }, 5, (a, d, m) => { bubbleText.innerHTML = `<i>Server waking... (${a}/${m})</i>`; });
            
            tempBubbleWrapper.remove();
            addMessage(data.reply, 'bot');
        } catch (err) {
            tempBubbleWrapper.remove();
            addMessage("⚠️ Server offline.", 'bot');
        } finally {
            sendChatBtn.disabled = false;
        }
    }

    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });
    }
});
