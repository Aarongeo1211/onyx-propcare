import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { SessionProvider } from "@/components/providers/session-provider";

// Self-hosted via next/font (non-render-blocking, replaces the CSS @import).
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});
import { LayoutProvider } from "@/components/providers/layout-provider";
import { QueryProvider } from "@/lib/query-provider";
import { ComparisonProvider, ComparisonBar } from "@/components/comparison";
import { LayoutShell } from "@/components/layout/layout-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { TrackingScripts } from "@/components/analytics/tracking-scripts";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Verified Farmland & Plot Marketplace in India`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  keywords: SITE_KEYWORDS,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Verified Farmland & Plot Marketplace in India`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: absoluteUrl("/brand/onyx-propcare-email.png"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Verified Farmland & Plot Marketplace in India`,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/brand/onyx-propcare-email.png")],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/brand/onyx-propcare-email.png"),
    sameAs: [SITE_URL],
  };

  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable} ${jetbrains.variable}`}>
      <head>
        {/* Speed up the LCP hero image fetched from the API/bucket origin */}
        <link rel="preconnect" href="https://onyx-api-production-b3da.up.railway.app" />
        <link rel="preconnect" href="https://t3.storageapi.dev" />
      </head>
      <body className="min-h-screen bg-onyx-950 text-cream antialiased">
        <TrackingScripts />
        <JsonLd data={organizationSchema} />
        <SessionProvider>
          <QueryProvider>
            <LayoutProvider>
              <ComparisonProvider>
                <LayoutShell>{children}</LayoutShell>
                <ComparisonBar />
              </ComparisonProvider>
            </LayoutProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
