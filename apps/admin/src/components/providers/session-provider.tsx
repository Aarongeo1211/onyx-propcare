"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // NextAuth refetches the session whenever the window regains focus by default.
  // Opening a native file picker (for any upload) blurs then re-focuses the
  // window on close, so that refetch fires mid-selection — the resulting
  // re-render can drop the file input's pending change event before React
  // ever sees it. Disabling this is the fix; a stale-until-next-navigation
  // session is a fine tradeoff for an internal admin panel.
  return <NextAuthSessionProvider refetchOnWindowFocus={false}>{children}</NextAuthSessionProvider>;
}
