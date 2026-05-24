"use client";

import { FormData } from "@/app/page";
import {
  PlaneTakeoff,
  PlaneLanding,
  Calendar,
  Building2,
  Users,
  Armchair,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Search,
} from "lucide-react";

const cities = [
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Kolkata",
  "Chennai",
  "Hyderabad",
  "Ahmedabad",
  "Pune",
  "Goa",
  "Jaipur",
];

const airlines = [
  { value: "Vistara", label: "Vistara" },
  { value: "Air India", label: "Air India" },
  { value: "IndiGo", label: "IndiGo" },
  { value: "SpiceJet", label: "SpiceJet" },
];

const cabinClasses = [
  { value: "Economy", label: "Economy" },
  { value: "Premium", label: "Premium Economy" },
  { value: "Business", label: "Business Class" },
];

const departureWindows = [
  { value: "Early Morning", label: "Early Morning (4-8 AM)" },
  { value: "Morning", label: "Morning (8 AM-12 PM)" },
  { value: "Afternoon", label: "Afternoon (12-5 PM)" },
  { value: "Evening", label: "Evening (5-9 PM)" },
  { value: "Night", label: "Night (9 PM+)" },
];

const amenitiesOptions = [
  { value: "None", label: "None" },
  { value: "Meals Included", label: "Meals Included" },
  { value: "Seat Selection", label: "Seat Selection" },
  { value: "Meals + Seat Selection", label: "Meals + Seat Selection" },
];

interface FlightSearchFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  useMlModel: boolean;
  setUseMlModel: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  isWaking: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function FlightSearchForm({
  formData,
  setFormData,
  useMlModel,
  setUseMlModel,
  isLoading,
  isWaking,
  onSubmit,
}: FlightSearchFormProps) {
  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="gradient-border animate-slide-up">
      <div className="relative p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Search className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Flight Search</h2>
            <p className="text-xs text-muted-foreground">Get AI-powered price predictions</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Origin & Destination */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <PlaneTakeoff className="w-4 h-4" />
                From
              </label>
              <select
                value={formData.origin}
                onChange={(e) => updateField("origin", e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <PlaneLanding className="w-4 h-4" />
                To
              </label>
              <select
                value={formData.destination}
                onChange={(e) => updateField("destination", e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                {[...cities].reverse().map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Airline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Departure Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => updateField("date", e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="w-4 h-4" />
                Airline
              </label>
              <select
                value={formData.airline}
                onChange={(e) => updateField("airline", e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                {airlines.map((airline) => (
                  <option key={airline.value} value={airline.value}>
                    {airline.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Passengers & Cabin */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="w-4 h-4" />
                Passengers
              </label>
              <select
                value={formData.passengers}
                onChange={(e) => updateField("passengers", e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                <option value="1">1 Passenger</option>
                <option value="2">2 Passengers</option>
                <option value="3">3 Passengers</option>
                <option value="4">4 Passengers</option>
                <option value="5+">5+ Passengers</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Armchair className="w-4 h-4" />
                Cabin Class
              </label>
              <select
                value={formData.cabin}
                onChange={(e) => updateField("cabin", e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                {cabinClasses.map((cabin) => (
                  <option key={cabin.value} value={cabin.value}>
                    {cabin.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Departure Time & Peak */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="w-4 h-4" />
                Departure Time
              </label>
              <select
                value={formData.departureWindow}
                onChange={(e) => updateField("departureWindow", e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                {departureWindows.map((window) => (
                  <option key={window.value} value={window.value}>
                    {window.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Sparkles className="w-4 h-4" />
                Peak / Festival
              </label>
              <select
                value={formData.isFestival}
                onChange={(e) => updateField("isFestival", e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                <option value="No">Off-Peak (Standard)</option>
                <option value="Yes">Peak Cycle (+30%)</option>
              </select>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              Add-ons & Amenities
            </label>
            <select
              value={formData.amenities}
              onChange={(e) => updateField("amenities", e.target.value)}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            >
              {amenitiesOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* ML Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              {useMlModel ? (
                <ToggleRight className="w-5 h-5 text-primary" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">ML Engine</p>
                <p className="text-xs text-muted-foreground">
                  {useMlModel ? "Using trained model" : "Using rule-based fallback"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUseMlModel(!useMlModel)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                useMlModel ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  useMlModel ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isWaking ? "Waking ML Engine..." : "Analyzing..."}
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Get Price Prediction
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
