"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // NextAuth refetches the session whenever the window regains focus by default.
  // Every file upload here (property photos, videos, documents, drone maps,
  // soil/water/legal reports) opens a native file picker, which blurs then
  // re-focuses the window on close — triggering that refetch mid-selection.
  // The resulting re-render can drop the file input's pending change event
  // before React ever sees it, so a chosen file silently does nothing.
  return <NextAuthSessionProvider refetchOnWindowFocus={false}>{children}</NextAuthSessionProvider>;
}
