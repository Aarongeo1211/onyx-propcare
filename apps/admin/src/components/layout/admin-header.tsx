"use client";

import { useSession } from "next-auth/react";

export function AdminHeader() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Admin";
  const userRole = (session?.user as any)?.role || "ADMIN";
  const initials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "A";

  return (
    <header className="h-16 border-b border-cream/5 bg-onyx-950/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 shrink-0">
      <div>
        <p className="text-sm font-medium text-cream">Operations Console</p>
        <p className="text-xs text-cream/35">Live moderation, user management, and inquiry oversight</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pl-4 border-l border-cream/8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-onyx-950 text-sm font-bold">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm text-cream font-medium">{userName}</p>
            <p className="text-[11px] text-cream/30">{userRole.replace("_", " ")}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
