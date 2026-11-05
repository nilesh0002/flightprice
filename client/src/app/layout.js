import "./globals.css";

export const metadata = {
  title: "AeroMind | Premium Flight Predictor",
  description: "Predict flight prices instantly with AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
