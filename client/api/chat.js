import Groq from "groq-sdk";

const MODEL = "llama3-8b-8192";
const LIVE_PRICE_REPLY = "Live pricing requires flight API integration.";

const ROLE_PROMPTS = {
  booking: "You are a helpful flight booking assistant helping users search and understand flights.",
  refund: "You help users with cancellations, refunds, and ticket changes.",
  deals: "You help users find cheaper flight alternatives and travel hacks.",
  travel: "You are a travel assistant helping with destinations, airports, baggage, visas, and travel tips.",
};

function normalizeRole(role) {
  return ROLE_PROMPTS[role] ? role : "travel";
}

function isLivePriceRequest(message) {
  if (!message) return false;
  return (
    /(live|real[- ]?time|current|today'?s)\s+(flight\s+)?(price|prices|fare|fares|ticket|tickets|cost|costs)/i.test(message) ||
    /(price|prices|fare|fares|ticket|tickets|cost|costs).*(right now|currently|today|live|real[- ]?time)/i.test(message)
  );
}

function formatFlightContext(flightContext) {
  if (!flightContext || typeof flightContext !== "object") return "";
  const trip = flightContext.trip || {};
  const prediction = flightContext.prediction || null;
  const lines = [];

  if (trip.origin && trip.destination) lines.push(`Route: ${trip.origin} to ${trip.destination}`);
  if (trip.date) lines.push(`Departure date: ${trip.date}`);
  if (trip.airline) lines.push(`Airline: ${trip.airline}`);
  if (trip.cabin) lines.push(`Cabin: ${trip.cabin}`);
  if (trip.passengers) lines.push(`Passengers: ${trip.passengers}`);
  if (trip.amenities) lines.push(`Amenities requested: ${trip.amenities}`);
  if (trip.departureWindow) lines.push(`Departure window: ${trip.departureWindow}`);
  if (trip.isFestival) lines.push(`Festival cycle: ${trip.isFestival}`);
  if (prediction?.predicted_price) lines.push(`Predicted fare: INR ${prediction.predicted_price}`);
  if (prediction?.confidence) lines.push(`Model confidence: ${prediction.confidence}%`);
  if (prediction?.recommendation) lines.push(`Prediction guidance: ${prediction.recommendation}`);
  if (prediction?.price_range) lines.push(`Price trend: ${prediction.price_range}`);

  return lines.join("\n");
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => item && typeof item === "object" && typeof item.text === "string" && ["user", "ai", "assistant"].includes(item.role))
    .slice(-8)
    .map((item) => ({ role: item.role === "ai" ? "assistant" : item.role, content: item.text.trim() }))
    .filter((item) => item.content);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message: rawMessage, role: rawRole, history: rawHistory, flightContext: rawFlightContext, model: requestedModel } = req.body;
    const message = typeof rawMessage === "string" ? rawMessage.trim() : "";
    const role = normalizeRole(rawRole);
    const history = sanitizeHistory(rawHistory);
    const flightContext = formatFlightContext(rawFlightContext);
    const finalModel = typeof requestedModel === "string" ? requestedModel : MODEL;

    if (!message) {
      return res.status(400).json({ error: "A message is required." });
    }

    if (isLivePriceRequest(message)) {
      return res.json({ reply: LIVE_PRICE_REPLY });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Chatbot is not configured on the server yet. Add GROQ_API_KEY." });
    }

    const groq = new Groq({ apiKey });

    const systemPrompt = [
      ROLE_PROMPTS[role],
      "Keep responses concise, useful, and action-oriented.",
      "Format your responses cleanly with line breaks. Do NOT use markdown bolding (asterisks).",
      `If asked for LIVE, real-time prices, respond exactly with: "${LIVE_PRICE_REPLY}"`,
      "ALWAYS format your response into exactly two sections with these exact headers in all caps:",
      "",
      "FROM GIVEN DATA:",
      "- Answer questions about the price, route, and whether to book now based strictly on the 'Flight app context'. Quote the 'Predicted fare'.",
      "- CRITICAL: If 'Predicted fare' is missing from the context, YOU MUST SAY: 'The ML Engine has not generated a prediction yet. Please click Generate Market Forecast on the left.' DO NOT INVENT A PRICE.",
      "",
      "FROM OUTSIDE DATA:",
      "- Answer any general travel questions (baggage, visa, weather) here. If there are no outside questions, say 'No external data requested.'",
    ].join("\n");

    const userContent = [
      flightContext ? `Flight app context:\n${flightContext}` : "",
      `User message: ${message}`,
    ].filter(Boolean).join("\n\n");

    const completion = await groq.chat.completions.create({
      model: finalModel,
      temperature: 0.1,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userContent },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({ error: "The assistant did not return a reply." });
    }

    res.json({ reply });
  } catch (error) {
    console.error("Chat API Error:", error);
    if (/invalid api key|authentication|unauthorized|forbidden/i.test(error.message)) {
      return res.status(500).json({ error: "Groq authentication failed. Verify the GROQ_API_KEY value." });
    }
    res.status(500).json({ error: `Server Error: ${error.message}` });
  }
}
