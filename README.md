# AeroMind Flight Predictor & Analytics

Full-stack flight price forecasting application powered by a scikit-learn machine learning pipeline and a Next.js / Tailwind CSS web interface. Includes statistical confidence intervals, real market metrics, and an integrated AI assistant.

---

## Architecture Overview

```
flight/
├── client/                     # Next.js 16 (App Router) + Tailwind CSS Frontend
│   ├── src/app/                # App router pages, layouts, global styles
│   └── src/components/         # PredictionForm, ResultsDashboard, Hero, Chatbot
├── server/                     # FastAPI ML Prediction & Analytics Backend
│   ├── app.py                  # API routes, Pydantic validation, CORS & rate limits
│   ├── constants.py            # Centralized supported categories (airports, airlines, cabins, modes)
│   ├── flight_data.csv         # Historical flight dataset for training & evaluation
│   ├── train_model.py          # Reproducible ML training pipeline with held-out validation
│   ├── model.pkl               # Serialized pipeline artifact and true evaluated metrics
│   ├── utils/predict.py        # Statistical inference & prediction interval calculation
│   ├── chatbot/rule_bot.py     # AeroBot AI flight advisor (Groq / Llama / Rule-based Fallback)
│   └── tests/                  # Automated backend test suite (pytest)
└── .github/workflows/ci.yml    # Continuous Integration pipeline (tests & builds)
```

---

## Supported Categories

To prevent out-of-vocabulary prediction errors, the frontend and backend synchronize on the following verified classes:

- **Airlines**: `Air India`, `IndiGo`, `Jet Airways`, `SpiceJet`, `Vistara`
- **Airports (Source & Destination)**: `Delhi`, `Mumbai`, `Bangalore`, `Kolkata`, `Chennai`
- **Connections / Stops**: `0`, `1`, `2`
- **Cabin Classes**: `Economy`, `Business`
- **Chatbot Modes**: `general`, `data`, `outside`

---

## AI Chatbot Assistant (AeroBot)

AeroBot is an integrated flight advisor that combines machine-learning fare forecasting with travel guidance.

### Supported Chatbot Modes
The backend validates chatbot modes and applies server-side system prompts:
- **`general` (Default / Split)**: Returns structured output divided into two sections:
  - `FROM GIVEN DATA:` Fare prediction, 95% statistical prediction interval, confidence score, fare tier, recommendation, and clearly stated defaults.
  - `FROM OUTSIDE DATA:` Practical flight information, duration estimates, luggage allowances, and travel tips.
- **`data` (Internal Data Only)**: Strictly limited to internal machine-learning prediction metrics and parameters. Outside knowledge is excluded.
- **`outside` (Outside Knowledge)**: Focuses exclusively on general airline policies, baggage guidelines, airport tips, and travel planning without citing internal ML model data.

### Required Information for Flight Predictions
- **Origin & Destination Cities**: Must be distinct cities from supported hubs (`Bangalore`, `Chennai`, `Delhi`, `Kolkata`, `Mumbai`). Requests with identical origin and destination, missing cities, or unsupported routes receive helpful explanatory guidance instead of prediction errors.
- **Travel Date**: Supports relative dates (`today`, `tomorrow`, `day after tomorrow`, `next week`, `in X days`) and explicit date formats (`YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`, Month Day). Past or invalid dates are clearly rejected with informative feedback.
- **Optional Parameters (Communicated Defaults)**:
  - *Airline*: User-specified or defaults to `IndiGo` (standard benchmark).
  - *Stops*: User-specified or defaults to `0` (non-stop / direct).
  - *Cabin*: User-specified or defaults to `Economy`.
  - *Departure Time*: User-specified or defaults to `Morning (~8:00 AM)`.
  Any assumed defaults are explicitly communicated in the response so nothing is silently assumed.

### Fallback Behavior
- **Zero Downtime**: When `GROQ_API_KEY` is not set, times out (8-second timeout limit), or encounters provider issues, AeroBot immediately activates a local rule-based NLP and ML prediction fallback.
- **Transparent Estimates**: All predictions are clearly labeled as statistical ML estimates based on historical data rather than real-time booking quotes.
- **Security & Privacy**: Server-side prompts prevent prompt injection, sanitize legacy client prefixes, and never disclose API keys or internal stack traces.

### Example Chatbot Requests
- `"Predict flight from Delhi to Mumbai tomorrow"`
- `"Vistara flight from Bangalore to Kolkata with 1 stop on 2026-11-25"`
- `"Flight from Chennai to Delhi next week in Business class"`
- `"What is Vistara's baggage allowance?"`
- `"When is the cheapest time to book flights?"`
- `"Cheapest route to Mumbai?"`

---

## Quickstart & Local Setup

### 1. Backend Service (FastAPI)

```bash
cd server
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Run the API server
uvicorn app:app --reload --port 8000
```

The backend documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Frontend Application (Next.js)

```bash
cd client
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

### Frontend (`client/.env.local`)
| Variable | Description | Default / Example |
|---|---|---|
| `NEXT_PUBLIC_ML_API_URL` | Base URL of the running FastAPI server | `http://localhost:8000` |

### Backend (`server/.env`)
| Variable | Description | Default / Example |
|---|---|---|
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed origins | `http://localhost:3000,http://127.0.0.1:3000` |
| `GROQ_API_KEY` | Optional Groq API key for Llama LLM chat completion | `your_groq_api_key` |

---

## API Contract

### `GET /categories`
Returns the single source of truth for supported airlines, sources, destinations, cabins, stops, and chat modes:
```json
{
  "airlines": ["Air India", "IndiGo", "Jet Airways", "SpiceJet", "Vistara"],
  "sources": ["Bangalore", "Chennai", "Delhi", "Kolkata", "Mumbai"],
  "destinations": ["Bangalore", "Chennai", "Delhi", "Kolkata", "Mumbai"],
  "stops": [0, 1, 2],
  "cabins": ["Economy", "Business"],
  "chat_modes": ["general", "data", "outside"]
}
```

### `GET /metrics`
Returns verified held-out test evaluation metrics from the trained model:
```json
{
  "r2": 0.8993,
  "mae": 433.11,
  "rmse": 551.02,
  "residual_std": 550.08,
  "train_samples": 1200,
  "test_samples": 300,
  "method": "Random Forest Regressor",
  "validation": "Held-out test set (80/20 split)"
}
```

### `GET /charts`
Returns empirical aggregated fare charts derived from real historical flight data.

### `POST /predict`
Generates flight fare predictions and 95% statistical confidence intervals.
```json
{
  "airline": "IndiGo",
  "source": "Delhi",
  "destination": "Mumbai",
  "total_stops": 0,
  "duration_minutes": 130,
  "date": "2026-11-20",
  "cabin": "Economy",
  "passengers": "1"
}
```
**Response (200 OK):**
```json
{
  "predicted_price": 3504.9,
  "recommendation": "Good time to book! Current rate is below historical median.",
  "confidence": 86.8,
  "price_range": "Low",
  "metrics": {
    "r2": 0.8993,
    "mae": 433.11,
    "prediction_interval_95": [2598.66, 4411.14]
  }
}
```

### `POST /chat`
Sends a user message to AeroBot with rate limiting (max 30 requests/min per IP).
```json
{
  "message": "Flight from Delhi to Mumbai tomorrow",
  "model": "general"
}
```
**Response (200 OK):**
```json
{
  "reply": "FROM GIVEN DATA:\n✈️ **Flight Route:** Delhi to Mumbai\n• **Travel Date:** November 07, 2026 (tomorrow)\n• **Operating Airline:** IndiGo (default benchmark)\n• **Flight Parameters:** Non-stop (0 stops) (default) | Cabin: Economy (default) | Departure: ~08:00 (default)\n• **Estimated Fare:** ₹3,505 (Statistical estimate)\n• **95% Prediction Interval:** ₹2,599 – ₹4,411\n• **Model Confidence:** 86.8%\n• **Fare Tier:** Low\n• **Recommendation:** Good time to book! Current rate is below historical median.\n\n*Note: Predictions are statistical machine-learning estimates based on historical flight data, not real-time airline reservation quotes.*\n\nFROM OUTSIDE DATA:\n• Non-stop flying time between Delhi and Mumbai is typically 2 hours 10 minutes.\n• Standard domestic economy baggage allowance for IndiGo is 15 kg check-in and 7 kg cabin baggage.\n• Direct flights operate daily across major carriers including IndiGo, Air India, and Vistara.\n• Booking at least 2–3 weeks in advance typically yields more competitive fares than last-minute reservations."
}
```

---

## Running Automated Tests

Run the full pytest suite for the backend:
```bash
python -m pytest server/tests -v
```

Run lint and production build for the frontend:
```bash
npm --prefix client run lint
npm --prefix client run build
```

---

## Deployment

### Deploy Backend to Render
1. Connect repository to [Render](https://render.com).
2. Use the provided [`render.yaml`](./render.yaml) blueprint or set:
   - **Root Directory**: `server`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `ALLOWED_ORIGINS`: `https://your-frontend-domain.vercel.app`
     - `GROQ_API_KEY`: `<your-groq-key>`

### Deploy Frontend to Vercel
1. Import the repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Set environment variable `NEXT_PUBLIC_ML_API_URL` to your deployed Render URL.
4. Deploy.
