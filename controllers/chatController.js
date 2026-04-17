exports.getChatResponse = (req, res) => {
  const { message } = req.body;
  const input = message.toLowerCase().trim();

  let response = "I'm sorry, I don't understand that. You can ask about flight prices or specific routes like 'Delhi to Mumbai tomorrow'.";

  if (input.includes("delhi to mumbai tomorrow")) {
    response = "Flights from Delhi to Mumbai tomorrow are usually cheaper if booked early.";
  } else if (input.includes("price")) {
    response = "Use the prediction form above to check the latest estimated price.";
  }

  res.json({ response });
};
