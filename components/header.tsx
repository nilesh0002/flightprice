"use client";

import { Plane, Zap, ZapOff, Loader2 } from "lucide-react";

interface HeaderProps {
  mlStatus: "checking" | "online" | "offline";
}

export function Header({ mlStatus }: HeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-card border-2 border-background flex items-center justify-center">
              {mlStatus === "online" ? (
                <div className="w-2 h-2 rounded-full bg-success" />
              ) : mlStatus === "checking" ? (
                <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-destructive" />
              )}
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Aero<span className="text-primary">Core</span>
            </h1>
            <p className="text-xs text-muted-foreground">Flight Intelligence</p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
          {mlStatus === "checking" ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-warning animate-spin" />
              <span className="text-xs font-medium text-warning">Waking ML Engine...</span>
            </>
          ) : mlStatus === "online" ? (
            <>
              <Zap className="w-3.5 h-3.5 text-success" />
              <span className="text-xs font-medium text-success">ML Engine Online</span>
            </>
          ) : (
            <>
              <ZapOff className="w-3.5 h-3.5 text-destructive" />
              <span className="text-xs font-medium text-destructive">ML Engine Offline</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="https://github.com/nilesh0002/flightprice"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          GitHub
        </a>
        <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          Sign In
        </button>
      </div>
    </header>
  );
}
