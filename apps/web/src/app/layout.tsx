import type { Metadata } from "next";
import "@/styles/globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { LayoutProvider } from "@/components/providers/layout-provider";
import { QueryProvider } from "@/lib/query-provider";
import { ComparisonProvider, ComparisonBar } from "@/components/comparison";
import { LayoutShell } from "@/components/layout/layout-shell";
import { JsonLd } from "@/components/seo/json-ld";
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
    <html lang="en">
      <body className="min-h-screen bg-onyx-950 text-cream antialiased">
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
