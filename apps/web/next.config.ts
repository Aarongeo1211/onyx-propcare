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
  },
  async headers() {
    return [
      // Auth pages: no cache (must be fresh for every user)
      {
        source: "/(login|register|forgot-password|reset-password|verify-email)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
      // Properties and homepage: limit stale-while-revalidate to 5 min (300s) instead of default 1 year
      {
        source: "/(properties|$)",
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles: self + inline (Tailwind applies inline styles)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + all configured remote patterns
              `img-src 'self' data: blob: https:${isDev ? " http://localhost:4000" : ""}`,
              // API connections
              `connect-src 'self' https://${API_HOST}${isDev ? " http://localhost:4000" : ""} https://*.up.railway.app https://*.storageapi.dev`,
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
