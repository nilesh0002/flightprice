import "./globals.css";

export const metadata = {
  title: "AeroCore Flight Price Predictor",
  description:
    "Flight price forecasting with a secure Groq chatbot for booking, refunds, deals, and travel support.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
