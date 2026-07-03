"use client";

import { Search } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  user?: {
    name: string;
    avatar?: string | null;
  };
  children?: React.ReactNode;
}

export function DashboardHeader({
  title,
  subtitle,
  user,
  children,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-onyx-950/80 backdrop-blur-xl border-b border-cream/5 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cream">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm font-body text-cream/65 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/72" />
            <input
              type="text"
              placeholder="Search..."
              className="w-56 pl-10 pr-4 py-2 bg-onyx-900/50 border border-cream/8 rounded-lg text-sm font-body text-cream placeholder:text-cream/72 focus:outline-none focus:border-gold/30 transition-colors"
            />
          </div>

          {/* User avatar */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center text-gold font-display text-xs font-semibold">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="text-sm font-body text-cream/70 hidden lg:block">
                {user.name}
              </span>
            </div>
          )}

          {children}
        </div>
      </div>
    </header>
  );
}
