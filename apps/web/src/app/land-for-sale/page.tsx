import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { getLocationHierarchy } from "@/lib/public-api";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

const TITLE = "Land for Sale Across India";
const DESCRIPTION =
  "Browse verified farmland, plots, and agricultural land for sale by state and district across India. Every listing includes soil, water, legal, and drone survey data.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/land-for-sale" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl("/land-for-sale"), type: "website" },
  twitter: { title: TITLE, description: DESCRIPTION, card: "summary_large_image" },
};

export default async function LandForSaleIndexPage() {
  const hierarchy = await getLocationHierarchy();
  const pageUrl = absoluteUrl("/land-for-sale");

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITLE,
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: hierarchy.length,
      itemListElement: hierarchy.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/land-for-sale/${s.slug}`),
        name: s.state,
      })),
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Land for Sale", item: pageUrl },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-onyx-950">
      <JsonLd data={schema} />
      <section className="relative px-6 pb-8 pt-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-gold/[0.02] blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-cream/60">
            <Link href="/" className="hover:text-gold">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-cream/85">Land for Sale</span>
          </nav>
          <h1 className="heading-lg mb-2 text-cream">
            Land for Sale <span className="text-gradient-gold">Across India</span>
          </h1>
          <p className="mb-8 max-w-3xl text-lg font-body text-cream/86">
            Verified farmland, plots, and agricultural land, browsable by state and district. Every listing
            comes with soil intelligence, water analytics, drone surveys, and legal verification.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        {hierarchy.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hierarchy.map((state) => (
              <Link
                key={state.slug}
                href={`/land-for-sale/${state.slug}`}
                className="group flex items-center justify-between rounded-2xl border border-cream/8 bg-onyx-900/50 px-5 py-4 transition-colors hover:border-gold/30"
              >
                <div>
                  <h2 className="font-display text-lg text-cream group-hover:text-gold">{state.state}</h2>
                  <p className="text-xs text-cream/70">
                    {state.count} {state.count === 1 ? "listing" : "listings"} · {state.districts.length}{" "}
                    {state.districts.length === 1 ? "district" : "districts"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-cream/40 group-hover:text-gold" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-cream/8 bg-onyx-900/40 p-10 text-center">
            <h3 className="mb-2 font-display text-2xl text-cream">Listings coming soon</h3>
            <p className="text-cream/80">Check back soon as new verified land listings are published.</p>
          </div>
        )}
      </section>
    </div>
  );
}
