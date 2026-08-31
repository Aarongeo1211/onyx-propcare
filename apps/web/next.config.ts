import path from "path";
import type { NextConfig } from "next";

const API_HOST = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).host
  : "onyx-api-production-b3da.up.railway.app";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@onyx/ui", "@onyx/types"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4000" },
      { protocol: "https", hostname: "**.up.railway.app" },
      { protocol: "https", hostname: "**.storageapi.dev" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    // No layout on this site renders an image wider than ~1536px, so the stock
    // 2048/3840 breakpoints only add memory-heavy sharp resizes nobody needs.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  async headers() {
    return [
      // Auth pages: no cache (must be fresh for every user)
      {
        source: "/login",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/register",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/forgot-password",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/reset-password",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/verify-email/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
      // Properties page: limit stale-while-revalidate to 5 min (300s) instead of default 1 year
      {
        source: "/properties/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=30, stale-while-revalidate=300",
          },
        ],
      },
      // All other pages
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=30, stale-while-revalidate=300",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: self + Next.js inline scripts (nonce not used, so unsafe-inline needed for now)
              // + Google tag manager (GA4/Google Ads loader) and Meta Pixel loader --
              // tracking-scripts.tsx renders these when their env vars are set, and
              // without them here the browser silently blocks the script fetch (no
              // visible error unless you check the console): dataLayer/gtag still get
              // defined by the *inline* init script either way, so a check for
              // `window.gtag` existing is NOT proof the real library loaded or that
              // any hit ever reached Google -- verify via an actual network request.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net",
              // Styles: self + inline (Tailwind applies inline styles)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + all configured remote patterns
              `img-src 'self' data: blob: https:${isDev ? " http://localhost:4000" : ""}`,
              // API connections + GA4/Google Ads hit collection + Meta Pixel
              `connect-src 'self' https://${API_HOST}${isDev ? " http://localhost:4000" : ""} https://*.up.railway.app https://*.storageapi.dev https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://www.facebook.com`,
              // Media (videos)
              "media-src 'self' blob: https://*.up.railway.app https://*.storageapi.dev https://res.cloudinary.com",
              // Frames: deny by default
              "frame-ancestors 'none'",
              // Forms: only submit to self
              "form-action 'self'",
              // Block mixed content
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
