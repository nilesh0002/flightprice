const API_URL = "https://flightprice-sghf.onrender.com";

async function fetchWithRetry(url, options, retries = 5, onRetryClick) {
    let delay = 5000;
    for (let i = 0; i <= retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); 

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

    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date();
        dateInput.value = today.toISOString().split('T')[0];
        dateInput.min = today.toISOString().split('T')[0]; 
    }

    const form = document.getElementById('flight-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('predict-btn');
            const loader = document.getElementById('pred-loader');
            const btnText = document.getElementById('btn-text');
            const resultContainer = document.getElementById('prediction-result');
            
            const priceDisplay = document.getElementById('price-display');
            const recDisplay = document.getElementById('recommendation-display');

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
                alert("Source and Destination cannot be the same.");
                return;
            }

            btn.disabled = true;
            btnText.style.display = 'none';
            if (loader) loader.style.display = 'block';
            resultContainer.style.display = 'none'; 

            const updateUIForRetry = (attempt, currentDelay, maxRetries) => {
                btnText.style.display = 'block';
                if (loader) loader.style.display = 'none';
                btnText.innerHTML = `Connecting... (${attempt}/${maxRetries})`;
            };

            try {
                const data = await fetchWithRetry(`${API_URL}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }, 5, updateUIForRetry);
                
                priceDisplay.textContent = data.predicted_price.toLocaleString('en-IN');
                
                recDisplay.textContent = data.recommendation;
                recDisplay.className = 'insight';
                if (data.recommendation.toLowerCase().includes("good")) recDisplay.classList.add('insight-good');
                else recDisplay.classList.add('insight-wait');

                resultContainer.style.display = 'block';

            } catch (error) {
                console.error("Prediction Failed:", error);
                alert("System offline. Please try again later.");
            } finally {
                btn.disabled = false;
                if (loader) loader.style.display = 'none';
                btnText.style.display = 'block';
                btnText.innerHTML = `Predict Price`;
            }
        });
    }

    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat');

    function addMessage(msg, type) {
        const wrapper = document.createElement('div');
        wrapper.className = `chat-bubble ${type}`;
        wrapper.innerHTML = msg; 
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

        const tempBubble = addMessage('...', 'bot');

        try {
            const data = await fetchWithRetry(`${API_URL}/chat`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg })
            }, 5, (a, d, m) => { tempBubble.innerHTML = `Connecting (${a}/${m})...`; });
            
            tempBubble.remove();
            addMessage(data.reply, 'bot');
        } catch (err) {
            tempBubble.remove();
            addMessage("Unable to process request.", 'bot');
        } finally {
            sendChatBtn.disabled = false;
        }
    }

    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });
    }
});
