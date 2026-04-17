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
        let trendChart = null;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {

    // Chart.js Data Visualizations
    async function loadCharts() {
        try {
            const res = await fetch(`${API_URL}/charts`);
            if (!res.ok) throw new Error('Failed to fetch chart data');
            const chartData = await res.json();

            // Price vs Airline
            if (chartData.price_vs_airline) {
                const ctxAirline = document.getElementById('chart-airline').getContext('2d');
                new Chart(ctxAirline, {
                    type: 'bar',
                    data: {
                        labels: chartData.price_vs_airline.labels,
                        datasets: [{
                            label: 'Avg Price',
                            data: chartData.price_vs_airline.data,
                            backgroundColor: 'rgba(99,102,241,0.7)',
                            borderRadius: 8
                        }]
                    },
                    options: {
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }

            // Price vs Stops
            if (chartData.price_vs_stops) {
                const ctxStops = document.getElementById('chart-stops').getContext('2d');
                new Chart(ctxStops, {
                    type: 'bar',
                    data: {
                        labels: chartData.price_vs_stops.labels,
                        datasets: [{
                            label: 'Avg Price',
                            data: chartData.price_vs_stops.data,
                            backgroundColor: 'rgba(16,185,129,0.7)',
                            borderRadius: 8
                        }]
                    },
                    options: {
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }

            // Duration vs Price (Scatter)
            if (chartData.duration_vs_price) {
                const ctxDuration = document.getElementById('chart-duration').getContext('2d');
                new Chart(ctxDuration, {
                    type: 'scatter',
                    data: {
                        datasets: [{
                            label: 'Duration vs Price',
                            data: chartData.duration_vs_price,
                            backgroundColor: 'rgba(244,63,94,0.7)',
                        }]
                    },
                    options: {
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { title: { display: true, text: 'Duration (mins)' } },
                            y: { title: { display: true, text: 'Price' }, beginAtZero: true }
                        }
                    }
                });
            }
        } catch (e) {
            // Optionally show error or fallback UI
        }
    }
    loadCharts();

    // Fetch and display ML metrics
    async function loadMetrics() {
        try {
            const res = await fetch(`${API_URL}/metrics`);
            if (!res.ok) throw new Error('Failed to fetch metrics');
            const metrics = await res.json();
            document.getElementById('mae-value').textContent = metrics.mae?.toFixed(2) ?? '--';
            document.getElementById('rmse-value').textContent = metrics.rmse?.toFixed(2) ?? '--';
            document.getElementById('r2-value').textContent = metrics.r2?.toFixed(3) ?? '--';
        } catch {
            document.getElementById('mae-value').textContent = '--';
            document.getElementById('rmse-value').textContent = '--';
            document.getElementById('r2-value').textContent = '--';
        }
    }
    loadMetrics();

    // Theme toggle logic
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const root = document.documentElement;

    function setTheme(mode) {
        if (mode === 'light') {
            root.classList.add('light-mode');
            themeIcon.textContent = '☀️';
        } else {
            root.classList.remove('light-mode');
            themeIcon.textContent = '🌙';
        }
        localStorage.setItem('theme', mode);
    }

    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    setTheme(savedTheme === 'light' ? 'light' : 'dark');

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isLight = root.classList.contains('light-mode');
            setTheme(isLight ? 'dark' : 'light');
        });
    }

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

                // --- Prediction Trend Feature ---
                if (typeof data.predicted_price === 'number' && typeof data.avg_price === 'number') {
                    const trendCard = document.getElementById('trend-card');
                    const trendLabel = document.getElementById('trend-label');
                    trendCard.style.display = 'block';
                    // Destroy previous chart if exists
                    if (trendChart) { trendChart.destroy(); }
                    const ctxTrend = document.getElementById('chart-trend').getContext('2d');
                    trendChart = new Chart(ctxTrend, {
                        type: 'bar',
                        data: {
                            labels: ['Predicted', 'Average'],
                            datasets: [{
                                label: 'Price',
                                data: [data.predicted_price, data.avg_price],
                                backgroundColor: [
                                    data.predicted_price <= data.avg_price ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)',
                                    'rgba(99,102,241,0.7)'
                                ],
                                borderRadius: 8
                            }]
                        },
                        options: {
                            plugins: { legend: { display: false } },
                            scales: { y: { beginAtZero: true } }
                        }
                    });
                    // Highlight label
                    if (data.predicted_price <= data.avg_price) {
                        trendLabel.textContent = 'This prediction is cheaper than average!';
                        trendLabel.className = 'cheap';
                    } else {
                        trendLabel.textContent = 'This prediction is more expensive than average.';
                        trendLabel.className = 'expensive';
                    }
                }
                // --- End Prediction Trend Feature ---

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

    function addLoadingBubble() {
        const wrapper = document.createElement('div');
        wrapper.className = 'chat-bubble bot loading';
        wrapper.innerHTML = '<span class="loader"></span> Typing...';
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

        const tempBubble = addLoadingBubble();

        try {
            const data = await fetchWithRetry(`${API_URL}/chat`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg })
            }, 5, (a, d, m) => { tempBubble.innerHTML = `<span class="loader"></span> Connecting (${a}/${m})...`; });
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
