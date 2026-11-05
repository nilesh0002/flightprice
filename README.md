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
│   ├── constants.py            # Centralized supported categories (airports, airlines, cabins)
│   ├── flight_data.csv         # Historical flight dataset for training & evaluation
│   ├── train_model.py          # Reproducible ML training pipeline with held-out validation
│   ├── model.pkl               # Serialized pipeline artifact and true evaluated metrics
│   ├── utils/predict.py        # Statistical inference & prediction interval calculation
│   ├── chatbot/rule_bot.py     # Omniscient AI flight advisor (Groq / Llama)
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
| `NEXT_PUBLIC_ML_API_URL` | URL of the running FastAPI server | `http://localhost:8000` |

### Backend (`server/.env`)
| Variable | Description | Default / Example |
|---|---|---|
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed origins | `http://localhost:3000,http://127.0.0.1:3000` |
| `GROQ_API_KEY` | Optional API key for AI Chatbot | `your_groq_api_key` |

---

## API Contract

### `GET /categories`
Returns the single source of truth for supported airlines, sources, destinations, cabins, and stops.

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

---

## Running Automated Tests

Run the full pytest suite for the backend:
```bash
python -m pytest server/tests -v
```

Run production build for the frontend:
```bash
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
