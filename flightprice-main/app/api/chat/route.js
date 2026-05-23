import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "llama-3.3-70b-versatile";
const LIVE_PRICE_REPLY = "Live pricing requires flight API integration.";

const ROLE_PROMPTS = {
  booking:
    "You are a helpful flight booking assistant helping users search and understand flights.",
  refund:
    "You help users with cancellations, refunds, and ticket changes.",
  deals: "You help users find cheaper flight alternatives and travel hacks.",
  travel:
    "You are a travel assistant helping with destinations, airports, baggage, visas, and travel tips.",
};

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("CHATBOT_CONFIG_MISSING");
  }

  return new Groq({ apiKey });
}

function normalizeRole(role) {
  return ROLE_PROMPTS[role] ? role : "travel";
}

function isLivePriceRequest(message) {
  if (!message) {
    return false;
  }

  return (
    /(live|real[- ]?time|current|today'?s)\s+(flight\s+)?(price|prices|fare|fares|ticket|tickets|cost|costs)/i.test(
      message,
    ) ||
    /(price|prices|fare|fares|ticket|tickets|cost|costs).*(right now|currently|today|live|real[- ]?time)/i.test(
      message,
    )
  );
}

function formatFlightContext(flightContext) {
  if (!flightContext || typeof flightContext !== "object") {
    return "";
  }

  const trip = flightContext.trip ?? {};
  const prediction = flightContext.prediction ?? null;

  const lines = [];

  if (trip.origin && trip.destination) {
    lines.push(`Route: ${trip.origin} to ${trip.destination}`);
  }

  if (trip.date) {
    lines.push(`Departure date: ${trip.date}`);
  }

  if (trip.airline) {
    lines.push(`Airline: ${trip.airline}`);
  }

  if (trip.cabin) {
    lines.push(`Cabin: ${trip.cabin}`);
  }

  if (trip.departureWindow) {
    lines.push(`Departure window: ${trip.departureWindow}`);
  }

  if (trip.isFestival) {
    lines.push(`Festival cycle: ${trip.isFestival}`);
  }

  if (prediction?.predictedPrice) {
    lines.push(`Predicted fare: INR ${prediction.predictedPrice}`);
  }

  if (prediction?.confidence) {
    lines.push(`Model confidence: ${prediction.confidence}%`);
  }

  if (prediction?.recommendation) {
    lines.push(`Prediction guidance: ${prediction.recommendation}`);
  }

  if (prediction?.priceRange) {
    lines.push(`Price trend: ${prediction.priceRange}`);
  }

  return lines.join("\n");
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.content === "string" &&
        ["user", "assistant"].includes(item.role),
    )
    .slice(-8)
    .map((item) => ({
      role: item.role,
      content: item.content.trim(),
    }))
    .filter((item) => item.content);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const role = normalizeRole(body?.role);
    const history = sanitizeHistory(body?.history);
    const flightContext = formatFlightContext(body?.flightContext);

    if (!message) {
      return NextResponse.json(
        { error: "A message is required." },
        { status: 400 },
      );
    }

    if (isLivePriceRequest(message)) {
      return NextResponse.json({ reply: LIVE_PRICE_REPLY });
    }

    const groq = getGroqClient();
    const systemPrompt = [
      ROLE_PROMPTS[role],
      "Keep responses concise, useful, and action-oriented.",
      `If asked for live or current prices, respond exactly with: "${LIVE_PRICE_REPLY}"`,
      "Use provided flight app context when it exists. If context is missing, ask only for the minimum needed details.",
      "Do not invent airline inventory, real-time prices, refunds, or visa rules when they are not provided in context.",
    ].join("\n");

    const userContent = [
      flightContext ? `Flight app context:\n${flightContext}` : "",
      `User message: ${message}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      max_completion_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userContent },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return NextResponse.json(
        { error: "The assistant did not return a reply." },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    if (message === "CHATBOT_CONFIG_MISSING") {
      return NextResponse.json(
        {
          error:
            "Chatbot is not configured on the server yet. Add GROQ_API_KEY in Vercel, then redeploy.",
        },
        { status: 500 },
      );
    }

    if (
      /invalid api key|authentication|unauthorized|forbidden/i.test(message)
    ) {
      return NextResponse.json(
        {
          error:
            "Groq authentication failed. Verify the GROQ_API_KEY value in Vercel and redeploy.",
        },
        { status: 500 },
      );
    }

    console.error("Chat route error:", message);

    return NextResponse.json(
      { error: "Unable to process chat right now." },
      { status: 500 },
    );
  }
}
