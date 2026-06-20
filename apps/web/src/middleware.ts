import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // For dynamic marketplace pages, limit stale-while-revalidate to 5 minutes (300s)
  // to prevent serving stale listings to users for extended periods.
  // Default Next.js behavior can serve cached content for up to 1 year.
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/properties")) {
    const cacheControl = response.headers.get("cache-control");
    if (cacheControl?.includes("s-maxage")) {
      // Replace stale-while-revalidate with a short window (e.g., 300s)
      const updated = cacheControl.replace(
        /stale-while-revalidate=\d+/,
        "stale-while-revalidate=300"
      );
      response.headers.set("cache-control", updated);
    }
  }

  return response;
}

export const config = {
  matcher: ["/properties/:path*"],
};
