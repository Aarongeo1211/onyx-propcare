import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { getLocationHierarchy } from "@/lib/public-api";
import { absoluteUrl, truncateText } from "@/lib/site";

export const revalidate = 3600;

type Params = Promise<{ state: string }>;

async function loadState(stateSlug: string) {
  const hierarchy = await getLocationHierarchy();
  return hierarchy.find((s) => s.slug === stateSlug) || null;
}

export async function generateStaticParams() {
  const hierarchy = await getLocationHierarchy();
  return hierarchy.map((s) => ({ state: s.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const state = await loadState(stateSlug);

  if (!state) {
    return { title: "Location Not Found", robots: { index: false, follow: false } };
  }

  const title = `Farmland & Plots for Sale in ${state.state}`;
  const description = truncateText(
    `Browse ${state.count} verified farmland and plot listings across ${state.districts.length} districts in ${state.state}, with soil, water, legal, and drone survey data on every property.`,
    160
  );
  const canonical = `/land-for-sale/${state.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: absoluteUrl(canonical), type: "website" },
    twitter: { title, description, card: "summary_large_image" },
  };
}

export default async function StateLandingPage({ params }: { params: Params }) {
  const { state: stateSlug } = await params;
  const state = await loadState(stateSlug);
  if (!state) notFound();

  const pageUrl = absoluteUrl(`/land-for-sale/${state.slug}`);
  const title = `Farmland & Plots for Sale in ${state.state}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: state.districts.length,
      itemListElement: state.districts.map((d, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/land-for-sale/${state.slug}/${d.slug}`),
        name: d.district,
      })),
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Land for Sale", item: absoluteUrl("/land-for-sale") },
        { "@type": "ListItem", position: 3, name: state.state, item: pageUrl },
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
            <Link href="/land-for-sale" className="hover:text-gold">
              Land for Sale
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-cream/85">{state.state}</span>
          </nav>
          <h1 className="heading-lg mb-2 text-cream">
            Farmland &amp; Plots for Sale in <span className="text-gradient-gold">{state.state}</span>
          </h1>
          <p className="mb-8 max-w-3xl text-lg font-body text-cream/86">
            {state.count} verified {state.count === 1 ? "listing" : "listings"} across {state.districts.length}{" "}
            districts in {state.state}. Every property comes with soil intelligence, water analytics, drone
            surveys, and legal verification.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.districts.map((district) => (
            <Link
              key={district.slug}
              href={`/land-for-sale/${state.slug}/${district.slug}`}
              className="group flex items-center justify-between rounded-2xl border border-cream/8 bg-onyx-900/50 px-5 py-4 transition-colors hover:border-gold/30"
            >
              <div>
                <h2 className="font-display text-lg text-cream group-hover:text-gold">{district.district}</h2>
                <p className="text-xs text-cream/70">
                  {district.count} {district.count === 1 ? "listing" : "listings"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-cream/40 group-hover:text-gold" />
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href={`/properties?state=${encodeURIComponent(state.state)}`}
            className="inline-flex items-center gap-2 text-sm text-cream/78 transition-colors hover:text-gold"
          >
            Browse all {state.state} listings with full filters →
          </Link>
        </div>
      </section>
    </div>
  );
}
