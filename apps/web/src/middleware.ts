import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // Auth pages: never cache (must be fresh for security)
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/verify-email")
  ) {
    response.headers.set(
      "cache-control",
      "private, no-cache, no-store, must-revalidate"
    );
    return response;
  }

  // Properties and marketplace pages: limit stale-while-revalidate to 5 minutes
  // to prevent serving stale/sold listings for up to 1 year
  if (pathname.startsWith("/properties") || pathname === "/") {
    response.headers.set(
      "cache-control",
      "s-maxage=30, stale-while-revalidate=300"
    );
    return response;
  }

  // All other pages: reasonable cache defaults
  response.headers.set(
    "cache-control",
    "s-maxage=30, stale-while-revalidate=300"
  );

  return response;
}

export const config = {
  matcher: ["/:path*"],
};
