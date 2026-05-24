import { NextRequest, NextResponse } from "next/server";

interface ChatRequest {
  message: string;
  history: Array<{ role: string; text: string }>;
  flightContext: {
    trip: Record<string, string>;
    prediction: Record<string, unknown> | null;
  };
  model: string;
  mode: "data" | "general";
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history, flightContext, mode } = body;

    // Build context for the AI
    const tripInfo = flightContext?.trip
      ? `Current search: ${flightContext.trip.origin} to ${flightContext.trip.destination} on ${flightContext.trip.date}, ${flightContext.trip.passengers} passenger(s), ${flightContext.trip.cabin} class, ${flightContext.trip.airline}.`
      : "";

    const predictionInfo = flightContext?.prediction?.predicted_price
      ? `Predicted price: ₹${flightContext.prediction.predicted_price.toLocaleString()}, confidence: ${flightContext.prediction.confidence}%, trend: ${flightContext.prediction.price_range}.`
      : "";

    // Build conversation history
    const conversationHistory = history
      .slice(-6)
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.text}`)
      .join("\n");

    // System prompt based on mode
    const systemPrompt = mode === "data"
      ? `You are an expert flight data analyst AI assistant. You help users understand flight prices, booking trends, and travel patterns. You have access to the user's current search details and price predictions. Be concise, data-driven, and helpful. Use specific numbers when available.

${tripInfo}
${predictionInfo}

Previous conversation:
${conversationHistory}`
      : `You are a friendly AI travel assistant. Help users with general travel questions, tips, and recommendations. Be helpful, conversational, and concise.

${tripInfo}

Previous conversation:
${conversationHistory}`;

    // Simple rule-based responses for demo (since we don't have Groq API key)
    const reply = generateRuleBasedResponse(message, mode, flightContext);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}

function generateRuleBasedResponse(
  message: string,
  mode: "data" | "general",
  context: ChatRequest["flightContext"]
): string {
  const lowerMessage = message.toLowerCase();
  const trip = context?.trip;
  const prediction = context?.prediction;

  // Price-related queries
  if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("cheap")) {
    if (prediction?.predicted_price) {
      return `Based on my analysis, the predicted price for your ${trip?.origin} to ${trip?.destination} flight is ₹${Number(prediction.predicted_price).toLocaleString()}. The current trend shows ${prediction.price_range || "moderate"} prices. ${prediction.price_range === "Low" ? "This looks like a good time to book!" : "You might want to wait for better deals or book early."}`;
    }
    return "I'd recommend running a price prediction first using the search form. Once you have a prediction, I can give you more specific insights about the pricing trends!";
  }

  // Booking time queries
  if (lowerMessage.includes("when") || lowerMessage.includes("best time") || lowerMessage.includes("book")) {
    return "Generally, the best time to book domestic flights in India is 3-6 weeks before departure. For your route, early morning or late night flights tend to be cheaper. Avoid booking during festival seasons unless necessary - prices can spike by 30-50%.";
  }

  // Airline comparison
  if (lowerMessage.includes("airline") || lowerMessage.includes("compare") || lowerMessage.includes("better")) {
    return "Here's a quick comparison:\n\n• **Vistara**: Best for comfort & service, premium pricing\n• **IndiGo**: Most punctual, budget-friendly\n• **Air India**: Good for international connections\n• **SpiceJet**: Cheapest fares, basic service\n\nFor your route, I'd recommend IndiGo for value or Vistara for comfort.";
  }

  // Route queries
  if (lowerMessage.includes("route") || lowerMessage.includes("cheapest")) {
    if (trip) {
      return `For ${trip.origin} to ${trip.destination}, here are some tips:\n\n1. Direct flights are often cheaper than connecting ones\n2. Tuesday and Wednesday typically have lower fares\n3. Early morning (6 AM) and late night (10 PM+) slots are usually cheaper\n4. Consider nearby airports if available`;
    }
    return "Select your origin and destination in the search form, and I can give you specific route recommendations!";
  }

  // Peak season
  if (lowerMessage.includes("peak") || lowerMessage.includes("festival") || lowerMessage.includes("season")) {
    return "Peak travel seasons in India:\n\n• **Diwali** (Oct-Nov): +40-60% prices\n• **Christmas/New Year**: +30-50%\n• **Summer holidays** (May-June): +20-30%\n• **Holi** (March): +25-35%\n\nBook 4-8 weeks in advance during these periods to get better deals.";
  }

  // Tips
  if (lowerMessage.includes("tip") || lowerMessage.includes("advice") || lowerMessage.includes("suggest")) {
    return "Here are my top flight booking tips:\n\n1. 🎯 Book 3-6 weeks ahead for best prices\n2. 📅 Fly on Tuesday or Wednesday\n3. ⏰ Choose early morning or late night flights\n4. 🔔 Set price alerts for your route\n5. 💳 Use credit card points when available\n6. 📱 Check airline apps for exclusive deals";
  }

  // Greeting
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hello! I'm your AI flight assistant. I can help you with:\n\n• Price predictions and trends\n• Best time to book\n• Airline comparisons\n• Travel tips\n\nFeel free to ask anything about your flight search!";
  }

  // Default response
  if (mode === "data") {
    return "I can help you analyze flight prices and booking patterns. Try asking about:\n• Price predictions for your route\n• Best time to book\n• Airline comparisons\n• Peak season pricing\n\nOr run a search to get specific predictions!";
  }

  return "I'm here to help with your travel plans! You can ask me about flight prices, booking tips, airline comparisons, or general travel advice. What would you like to know?";
}
