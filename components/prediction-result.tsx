"use client";

import { Prediction } from "@/app/page";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Sparkles,
  BarChart3,
  Activity,
  Gauge,
  Database
} from "lucide-react";

interface PredictionResultProps {
  prediction: Prediction;
}

export function PredictionResult({ prediction }: PredictionResultProps) {
  if (prediction.error) {
    return (
      <div className="gradient-border animate-slide-up">
        <div className="p-6 rounded-xl">
          <div className="flex items-center gap-3 text-destructive mb-4">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Connection Error</h3>
              <p className="text-xs text-muted-foreground">Unable to reach ML engine</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{prediction.error}</p>
          <p className="text-xs text-muted-foreground mt-3 font-mono">
            Tip: Make sure the backend is running with <code className="px-1.5 py-0.5 bg-muted rounded">uvicorn app:app --reload</code>
          </p>
        </div>
      </div>
    );
  }

  const priceRangeColor = 
    prediction.price_range === "Low" ? "text-success" :
    prediction.price_range === "Medium" ? "text-warning" : "text-destructive";

  const PriceIcon = prediction.price_range === "Low" ? TrendingDown : 
                    prediction.price_range === "High" ? TrendingUp : Activity;

  return (
    <div className="gradient-border animate-slide-up">
      <div className="p-6 rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Price Prediction</h3>
              <p className="text-xs text-muted-foreground">AI-powered forecast</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            prediction.price_range === "Low" ? "bg-success/10 text-success" :
            prediction.price_range === "Medium" ? "bg-warning/10 text-warning" : 
            "bg-destructive/10 text-destructive"
          }`}>
            <PriceIcon className="w-3.5 h-3.5" />
            {prediction.price_range} Price
          </div>
        </div>

        {/* Price Display */}
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-2">Predicted Price</p>
          <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent animate-count-up">
            ₹{(prediction.predicted_price || 0).toLocaleString("en-IN")}
          </p>
          
          {/* Confidence Bar */}
          <div className="mt-6 max-w-xs mx-auto">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Confidence</span>
              <span className="font-semibold text-foreground">{prediction.confidence || 0}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${prediction.confidence || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-4 bg-muted/30 rounded-lg border border-border mb-6">
          <p className={`text-sm font-medium ${priceRangeColor}`}>
            {prediction.recommendation || "Processing intelligence..."}
          </p>
        </div>

        {/* Metrics Grid */}
        {prediction.metrics && (
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <BarChart3 className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">R²</p>
              <p className="text-sm font-semibold">{prediction.metrics.r2}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <Gauge className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">MSE</p>
              <p className="text-sm font-semibold">{prediction.metrics.mse}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <Activity className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Volatility</p>
              <p className="text-sm font-semibold truncate">{prediction.metrics.volatility}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <Database className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sample</p>
              <p className="text-sm font-semibold truncate">{prediction.metrics.sample_size}</p>
            </div>
          </div>
        )}

        {/* Footer Metrics */}
        {prediction.metrics && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Method: {prediction.metrics.method}</span>
              <span>Split: {prediction.metrics.training_split}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
