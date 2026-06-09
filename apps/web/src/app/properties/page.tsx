import type { Metadata } from "next";
import type { PropertyFilters } from "@onyx/types";
import { PropertiesPageClient } from "@/components/properties/properties-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import { getProperties } from "@/lib/public-api";
import { absoluteUrl, truncateText } from "@/lib/site";
import { getPropertyTypeLabel } from "@/lib/utils";

export const revalidate = 300;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getSingle(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function toNumber(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildFilters(searchParams: Record<string, string | string[] | undefined>): PropertyFilters {
  return {
    search: getSingle(searchParams, "search") || undefined,
    state: getSingle(searchParams, "state") || undefined,
    district: getSingle(searchParams, "district") || undefined,
    type: (getSingle(searchParams, "type") as PropertyFilters["type"]) || undefined,
    listingType: (getSingle(searchParams, "listingType") as PropertyFilters["listingType"]) || undefined,
    minPrice: toNumber(getSingle(searchParams, "minPrice")),
    maxPrice: toNumber(getSingle(searchParams, "maxPrice")),
    sortBy: (getSingle(searchParams, "sortBy") as PropertyFilters["sortBy"]) || "newest",
    page: toNumber(getSingle(searchParams, "page")) || 1,
    limit: 12,
  };
}

function buildCanonical(filters: PropertyFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.state) params.set("state", filters.state);
  if (filters.district) params.set("district", filters.district);
  if (filters.type) params.set("type", filters.type);
  if (filters.listingType) params.set("listingType", filters.listingType);
  if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  return params.toString() ? `/properties?${params.toString()}` : "/properties";
}

function buildListingCopy(filters: PropertyFilters) {
  const propertyType = filters.type ? getPropertyTypeLabel(filters.type) : "Properties";
  const state = filters.state ? ` in ${filters.state}` : " across India";
  const district = filters.district ? `, ${filters.district}` : "";
  const search = filters.search ? ` matching "${filters.search}"` : "";
  const title = `${propertyType}${district}${state}`;
  const description = truncateText(
    `Browse verified ${propertyType.toLowerCase()}${district}${state}${search} on Onyx Propcare. Compare listings with soil reports, water analysis, legal checks, and drone data.`,
    160
  );

  return { title, description };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const filters = buildFilters(resolvedSearchParams);
  const { title, description } = buildListingCopy(filters);

  return {
    title,
    description,
    alternates: {
      canonical: buildCanonical(filters),
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(buildCanonical(filters)),
      type: "website",
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
    },
  };
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const filters = buildFilters(resolvedSearchParams);
  const response = await getProperties({
    search: filters.search,
    state: filters.state,
    district: filters.district,
    type: filters.type,
    listingType: filters.listingType,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sortBy: filters.sortBy,
    page: filters.page,
    limit: filters.limit,
  });
  const canonical = buildCanonical(filters);
  const { title, description } = buildListingCopy(filters);
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: absoluteUrl(canonical),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: response.pagination.total,
      itemListElement: response.data.map((property, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/properties/${property.slug}`),
        name: property.title,
      })),
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: absoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Properties",
          item: absoluteUrl("/properties"),
        },
      ],
    },
  };

  return (
    <>
      <JsonLd data={collectionSchema} />
      <PropertiesPageClient
        initialFilters={filters}
        initialProperties={response.data}
        initialPagination={response.pagination}
      />
    </>
  );
}
