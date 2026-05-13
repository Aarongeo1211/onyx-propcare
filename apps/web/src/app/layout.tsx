import type { Metadata } from "next";
import "@/styles/globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { LayoutProvider } from "@/components/providers/layout-provider";
import { QueryProvider } from "@/lib/query-provider";
import { ComparisonProvider, ComparisonBar } from "@/components/comparison";
import { LayoutShell } from "@/components/layout/layout-shell";

const themeScript = `
  (function () {
    try {
      var stored = localStorage.getItem('onyx-theme');
      var theme = stored === 'light' || stored === 'dark'
        ? stored
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.style.colorScheme = theme;
    } catch (error) {}
  })();
`;

export const metadata: Metadata = {
  title: "Onyx Propcare | India's Largest Farmland & Plot Marketplace",
  description:
    "Discover premium farmlands and residential plots across India. Access exclusive soil data, water reports, drone maps, and legal verification — all in one platform.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  keywords: [
    "farmland India",
    "residential plots",
    "agricultural land",
    "buy farmland",
    "NRI investment India",
    "land marketplace",
    "soil data",
    "legal verification",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-onyx-950 text-cream antialiased">
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
