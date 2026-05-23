# AeroCore Flight Predictor

Next.js + Tailwind CSS flight price prediction app with a secure Groq-powered chatbot for booking help, refunds, deals, and travel guidance.

## Stack

- Next.js App Router
- React
- Tailwind CSS
- Groq API via `groq-sdk`
- Existing ML prediction backend can remain on Render or any hosted API

## Environment Variables

Create `C:\Users\niles\Downloads\flightprice\.env.local`:

```bash
GROQ_API_KEY=your_groq_api_key_here
NEXT_PUBLIC_ML_API_URL=https://flightprice-sghf.onrender.com
```

Notes:

- `GROQ_API_KEY` is server-side only and is used exclusively inside `app/api/chat/route.js`.
- `NEXT_PUBLIC_ML_API_URL` is safe for the browser because it only points to the flight prediction API URL.

## Install

```bash
npm install
```

If you need to install from a blank checkout manually, the app depends on:

```bash
npm install next react react-dom groq-sdk tailwindcss @tailwindcss/postcss postcss
```

## Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production Chatbot Behavior

- Chat API route: [app/api/chat/route.js](/C:/Users/niles/Downloads/flightprice/app/api/chat/route.js)
- Chat UI component: [components/FlightChatbot.jsx](/C:/Users/niles/Downloads/flightprice/components/FlightChatbot.jsx)
- The Groq key never ships to the frontend.
- If a user asks for live or current fares, the bot returns:
  `Live pricing requires flight API integration.`
- Current trip and forecast details are injected into the chatbot when available.

## Deploy To Vercel

1. Import the repo into Vercel.
2. Set `GROQ_API_KEY` in the Vercel project environment variables.
3. Optionally set `NEXT_PUBLIC_ML_API_URL` if your prediction API URL changes.
4. Deploy.

Vercel will detect the root Next.js app and build it with `npm run build`.
