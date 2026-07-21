import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const FORTY_PLUS_HOST = "40plus.onyxpropcare.com";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Onyx 40+ is a standalone info page served from the same app under a
  // dedicated subdomain — rewrite only the root path so it appears at the
  // subdomain's root. Everything else (static assets, /_next/*, etc.) must
  // pass through untouched, since those live at the same absolute paths
  // regardless of host.
  const host = request.headers.get("host") || "";
  if (host === FORTY_PLUS_HOST && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/40plus";
    return NextResponse.rewrite(url);
  }

  const response = NextResponse.next();

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
