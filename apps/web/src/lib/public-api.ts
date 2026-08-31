import type { PropertyCardData } from "@/components/properties/property-card";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "https://onyx-api-production-b3da.up.railway.app/api/v1";

export interface PropertiesResponse {
  success: boolean;
  data: PropertyCardData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PropertyImage {
  id: string;
  url: string;
  alt?: string | null;
  isPrimary: boolean;
  order: number;
}

export interface PropertyVideo {
  id: string;
  url: string;
  title: string | null;
  thumbnailUrl: string | null;
}

export interface PropertyDocument {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface SoilData {
  soilType: string;
  ph: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  organicCarbon: number | null;
  texture: string | null;
  fertility: string | null;
  suitableCrops: string | null;
  testedAt: string | null;
  reportUrl?: string | null;
}

export interface WaterData {
  waterTableDepth: number | null;
  waterQuality: string | null;
  tdsLevel: number | null;
  borewellCount: number | null;
  borewellDepth: number | null;
  canalDistance: number | null;
  riverDistance: number | null;
  rainfallAvg: number | null;
  testedAt: string | null;
  reportUrl?: string | null;
}

export interface LegalCheck {
  approvalStatus: string;
  titleStatus: string;
  encumbranceCheck: boolean;
  encumbranceResult: string | null;
  litigationCheck: boolean;
  litigationResult: string | null;
  revenueRecordOk: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
  reportUrl?: string | null;
}

export interface DroneMap {
  mapUrl: string;
  thumbnailUrl: string | null;
  resolution: string | null;
  capturedAt: string | null;
  notes: string | null;
}

export interface PropertyDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  status: string;
  listingType: string;
  price: number;
  pricePerUnit: number | null;
  priceUnit: string | null;
  isNegotiable: boolean;
  address: string;
  village: string | null;
  taluka: string | null;
  district: string;
  state: string;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  nearbyLocations: Array<{ name: string; distanceKm: number; category?: string | null }> | null;
  totalArea: number;
  areaUnit: string;
  facing: string | null;
  roadAccess: boolean;
  roadWidth: number | null;
  boundaryWall: boolean;
  soilType: string | null;
  waterSource: string | null;
  hasClearTitle: boolean;
  isFeatured: boolean;
  viewCount: number;
  images: PropertyImage[];
  videos: PropertyVideo[];
  documents: PropertyDocument[];
  owner: { id: string; name: string; avatar: string | null; phone?: string | null };
  soilData: SoilData | null;
  waterData: WaterData | null;
  legalCheck: LegalCheck | null;
  droneMap: DroneMap | null;
  sellerOtherListings: PropertyCardData[];
}

export interface PropertyDetailResponse {
  success: boolean;
  data: PropertyDetail;
}

class PublicApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PublicApiError";
    this.status = status;
  }
}

async function fetchPublicApi<T>(endpoint: string, revalidate = 300): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    next: { revalidate },
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new PublicApiError(body.error || "Request failed", res.status);
  }

  return res.json() as Promise<T>;
}

export function buildPropertyQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    query.set(key, String(value));
  });

  return query.toString();
}

export async function getFeaturedProperties() {
  // Redis on the API already caches this for 5 min and is busted immediately
  // on any featured/archive/status change. Use a short Next.js revalidate (30s)
  // so stale data doesn't outlive a Redis bust by another 5 minutes.
  const response = await fetchPublicApi<{ success: boolean; data: PropertyCardData[] }>("/properties/featured", 30);
  return response.data || [];
}

export async function getProperties(params: Record<string, string | number | undefined>, revalidate = 300) {
  const query = buildPropertyQuery(params);
  return fetchPublicApi<PropertiesResponse>(`/properties${query ? `?${query}` : ""}`, revalidate);
}

export async function getPropertyBySlug(slug: string, revalidate = 300) {
  return fetchPublicApi<PropertyDetailResponse>(`/properties/${slug}`, revalidate);
}

export interface LocationDistrict {
  district: string;
  slug: string;
  values: string[];
  count: number;
}

export interface LocationState {
  state: string;
  slug: string;
  values: string[];
  count: number;
  districts: LocationDistrict[];
}

// State/district hierarchy with active listing counts, for the
// /land-for-sale location landing pages and their sitemap entries.
// `values` on each entry lists every raw casing/whitespace variant of that
// place name in the data (e.g. "Bangalore", "Bangalore ", "BANGALORE URBAN")
// -- pass values.join(",") as the state/district filter to getProperties()
// to match all of them, since a plain name match would miss variants that
// don't equal the canonical display name character-for-character.
export async function getLocationHierarchy(revalidate = 3600) {
  const response = await fetchPublicApi<{ success: boolean; data: LocationState[] }>("/properties/locations", revalidate);
  return response.data || [];
}

export interface PropertyTypeCount {
  type: string;
  count: number;
}

// Active listing count per PropertyType -- used to hide category filters
// (Orchard, Plantation, ...) until at least one active listing exists in
// that category, instead of offering a filter that always dead-ends.
export async function getPropertyTypeCounts(revalidate = 3600) {
  const response = await fetchPublicApi<{ success: boolean; data: PropertyTypeCount[] }>("/properties/type-counts", revalidate);
  return response.data || [];
}

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  tags: string[];
  authorName: string;
  createdAt: string;
}

export interface BlogPostDetail extends BlogPostSummary {
  content: string;
  metaDescription: string | null;
  updatedAt: string;
}

export interface BlogListResponse {
  success: boolean;
  data: BlogPostSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getBlogPosts(params: { page?: number; limit?: number } = {}, revalidate = 300) {
  const query = buildPropertyQuery(params);
  return fetchPublicApi<BlogListResponse>(`/blog${query ? `?${query}` : ""}`, revalidate);
}

export async function getBlogPostBySlug(slug: string, revalidate = 300) {
  const response = await fetchPublicApi<{ success: boolean; data: BlogPostDetail }>(`/blog/${slug}`, revalidate);
  return response.data;
}
