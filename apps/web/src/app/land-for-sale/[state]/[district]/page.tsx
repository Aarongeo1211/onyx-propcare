import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin } from "lucide-react";
import { PropertyCard } from "@/components/properties/property-card";
import { JsonLd } from "@/components/seo/json-ld";
import { getLocationHierarchy, getProperties } from "@/lib/public-api";
import { absoluteUrl, truncateText } from "@/lib/site";

export const revalidate = 300;

type Params = Promise<{ state: string; district: string }>;

async function loadDistrict(stateSlug: string, districtSlug: string) {
  const hierarchy = await getLocationHierarchy();
  const state = hierarchy.find((s) => s.slug === stateSlug);
  const district = state?.districts.find((d) => d.slug === districtSlug);
  if (!state || !district) return null;
  return { state, district };
}

export async function generateStaticParams() {
  const hierarchy = await getLocationHierarchy();
  return hierarchy.flatMap((s) => s.districts.map((d) => ({ state: s.slug, district: d.slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { state: stateSlug, district: districtSlug } = await params;
  const found = await loadDistrict(stateSlug, districtSlug);

  if (!found) {
    return { title: "Location Not Found", robots: { index: false, follow: false } };
  }

  const { state, district } = found;
  const title = `Farmland & Plots for Sale in ${district.district}, ${state.state}`;
  const description = truncateText(
    `Browse ${district.count} verified farmland and plot listings in ${district.district}, ${state.state} with soil reports, water analysis, legal checks, and drone survey data.`,
    160
  );
  const canonical = `/land-for-sale/${state.slug}/${district.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: absoluteUrl(canonical), type: "website" },
    twitter: { title, description, card: "summary_large_image" },
  };
}

export default async function DistrictLandingPage({ params }: { params: Params }) {
  const { state: stateSlug, district: districtSlug } = await params;
  const found = await loadDistrict(stateSlug, districtSlug);
  if (!found) notFound();
  const { state, district } = found;

  const response = await getProperties(
    {
      state: state.values.join(","),
      district: district.values.join(","),
      sortBy: "newest",
      limit: 24,
    },
    300
  );
  const properties = response.data;

  const canonical = `/land-for-sale/${state.slug}/${district.slug}`;
  const pageUrl = absoluteUrl(canonical);
  const title = `Farmland & Plots for Sale in ${district.district}, ${state.state}`;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: response.pagination.total,
      itemListElement: properties.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/properties/${p.slug}`),
        name: p.title,
      })),
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Land for Sale", item: absoluteUrl("/land-for-sale") },
        { "@type": "ListItem", position: 3, name: state.state, item: absoluteUrl(`/land-for-sale/${state.slug}`) },
        { "@type": "ListItem", position: 4, name: district.district, item: pageUrl },
      ],
    },
  };

  const otherDistricts = state.districts.filter((d) => d.slug !== district.slug).slice(0, 8);

  return (
    <div className="min-h-screen bg-onyx-950">
      <JsonLd data={collectionSchema} />
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
            <Link href={`/land-for-sale/${state.slug}`} className="hover:text-gold">
              {state.state}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-cream/85">{district.district}</span>
          </nav>
          <h1 className="heading-lg mb-2 text-cream">
            Farmland &amp; Plots for Sale in <span className="text-gradient-gold">{district.district}</span>
          </h1>
          <p className="mb-6 max-w-3xl text-lg font-body text-cream/86">
            {district.count} verified {district.count === 1 ? "listing" : "listings"} in {district.district},{" "}
            {state.state} — every property comes with soil intelligence, water analytics, drone surveys, and
            legal verification.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/properties?state=${encodeURIComponent(state.state)}&district=${encodeURIComponent(district.district)}`}
              className="inline-flex items-center gap-2 rounded-full border border-gold/25 px-4 py-2 text-xs font-medium text-gold transition-colors hover:bg-gold/10"
            >
              <MapPin className="h-3.5 w-3.5" />
              Filter by price, type &amp; more
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {properties.map((property, index) => (
              <PropertyCard key={property.id} property={property} index={index} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-cream/8 bg-onyx-900/40 p-10 text-center">
            <h3 className="mb-2 font-display text-2xl text-cream">No active listings right now</h3>
            <p className="text-cream/80">Check back soon, or explore nearby districts below.</p>
          </div>
        )}

        {otherDistricts.length > 0 && (
          <div className="mt-16 border-t border-cream/8 pt-10">
            <h2 className="mb-4 text-sm uppercase tracking-[0.2em] text-gold/60">More in {state.state}</h2>
            <div className="flex flex-wrap gap-2">
              {otherDistricts.map((d) => (
                <Link
                  key={d.slug}
                  href={`/land-for-sale/${state.slug}/${d.slug}`}
                  className="rounded-full border border-cream/12 px-3 py-1.5 text-xs text-cream/78 transition-colors hover:border-gold/40 hover:text-gold"
                >
                  {d.district} ({d.count})
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
