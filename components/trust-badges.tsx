"use client";

import { Shield, CheckCircle, Star, Users } from "lucide-react";

export function TrustBadges() {
  const badges = [
    {
      icon: Shield,
      label: "256-bit SSL",
      description: "Secure connection",
    },
    {
      icon: CheckCircle,
      label: "96% Accuracy",
      description: "ML precision",
    },
    {
      icon: Star,
      label: "4.9 Rating",
      description: "User reviews",
    },
    {
      icon: Users,
      label: "10k+ Users",
      description: "Trust us",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {badges.map((badge) => (
        <div
          key={badge.label}
          className="flex items-center gap-3 p-3 bg-card/50 border border-border rounded-lg"
        >
          <badge.icon className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{badge.label}</p>
            <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
