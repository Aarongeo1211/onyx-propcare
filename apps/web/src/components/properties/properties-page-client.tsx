"use client";

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { MapPin, SearchX, Loader2 } from "lucide-react";
import type { PropertyFilters } from "@onyx/types";
import { SearchBar } from "@/components/properties/search-bar";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { PropertyFiltersSidebar } from "@/components/properties/property-filters";
import { apiFetch } from "@/lib/utils";
import type { PropertiesResponse } from "@/lib/public-api";

const PROPERTY_LIMIT = 12;

function filtersFromParams(sp: URLSearchParams): PropertyFilters {
  const num = (v: string | null) => (v ? Number(v) : undefined);
  return {
    search: sp.get("search") || undefined,
    state: sp.get("state") || undefined,
    district: sp.get("district") || undefined,
    type: (sp.get("type") as PropertyFilters["type"]) || undefined,
    listingType: (sp.get("listingType") as PropertyFilters["listingType"]) || undefined,
    minPrice: num(sp.get("minPrice")),
    maxPrice: num(sp.get("maxPrice")),
    sortBy: (sp.get("sortBy") as PropertyFilters["sortBy"]) || "newest",
    page: 1,
    limit: PROPERTY_LIMIT,
  };
}

function filterSignatureWithoutPage(f: PropertyFilters): string {
  return [
    f.search,
    f.state,
    f.district,
    f.type,
    f.listingType,
    f.minPrice,
    f.maxPrice,
    f.sortBy || "newest",
  ].join("|");
}

interface PropertiesPageClientProps {
  initialFilters: PropertyFilters;
  initialProperties: PropertyCardData[];
  initialPagination: PropertiesResponse["pagination"];
}

export function PropertiesPageClient({
  initialFilters,
  initialProperties,
  initialPagination,
}: PropertiesPageClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const didHydrateRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  const [properties, setProperties] = useState<PropertyCardData[]>(initialProperties);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);
  const [page, setPage] = useState(initialPagination.page);

  const hasMore = page < pagination.totalPages;
  const accessToken = session?.user?.accessToken;

  const fetchProperties = useCallback(async (currentFilters: PropertyFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFilters.search) params.set("search", currentFilters.search);
      if (currentFilters.state) params.set("state", currentFilters.state);
      if (currentFilters.district) params.set("district", currentFilters.district);
      if (currentFilters.type) params.set("type", currentFilters.type);
      if (currentFilters.listingType) params.set("listingType", currentFilters.listingType);
      if (currentFilters.minPrice) params.set("minPrice", String(currentFilters.minPrice));
      if (currentFilters.maxPrice) params.set("maxPrice", String(currentFilters.maxPrice));
      if (currentFilters.sortBy) params.set("sortBy", currentFilters.sortBy);
      params.set("page", "1");
      params.set("limit", String(PROPERTY_LIMIT));

      const data = await apiFetch<PropertiesResponse>(
        `/properties?${params.toString()}`,
        accessToken ? { token: accessToken } : undefined
      );
      setProperties(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 });
      setPage(1);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      setProperties([]);
      setPagination({ page: 1, limit: 12, total: 0, totalPages: 0 });
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.state) params.set("state", filters.state);
      if (filters.district) params.set("district", filters.district);
      if (filters.type) params.set("type", filters.type);
      if (filters.listingType) params.set("listingType", filters.listingType);
      if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
      if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      params.set("page", String(nextPage));
      params.set("limit", String(PROPERTY_LIMIT));

      const data = await apiFetch<PropertiesResponse>(
        `/properties?${params.toString()}`,
        accessToken ? { token: accessToken } : undefined
      );
      setProperties((prev) => [...prev, ...(data.data || [])]);
      setPagination(data.pagination || pagination);
      setPage(nextPage);
    } catch (error) {
      console.error("Failed to load more properties:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, hasMore, page, filters, pagination, accessToken]);

  useEffect(() => {
    if (status === "authenticated" && accessToken) {
      fetchProperties(filters);
    }
  }, [accessToken, status]);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Trigger well before the sentinel is actually visible — 400px was only ~1 row of
    // lead time, not enough to cover a full request round-trip at normal scroll speed,
    // so users caught up to the loading boundary before the next page had arrived.
    // 1500px gives ~3 rows of buffer — but on tall/zoomed-out viewports that range can
    // already cover the sentinel on initial mount, which would fire loadMore() before
    // the user has done anything. hasScrolledRef guards against that.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasScrolledRef.current) {
          loadMore();
        }
      },
      { rootMargin: "1500px 0px" }
    );
    observer.observe(sentinel);

    // IntersectionObserver only calls back on state *transitions* — if the sentinel is
    // already intersecting at mount (the tall-viewport case above), it won't fire again
    // just because hasScrolledRef later flips true, since intersection never changed.
    // So the first real scroll needs its own one-off geometry check to unblock that case.
    const onScroll = () => {
      if (hasScrolledRef.current) return;
      hasScrolledRef.current = true;
      const rect = sentinel.getBoundingClientRect();
      if (rect.top - window.innerHeight < 1500) {
        loadMore();
      }
    };
    window.addEventListener("scroll", onScroll, { once: true, passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [loadMore]);

  // Sync URL → filter state for external navigation (navbar links etc.)
  useEffect(() => {
    const fromUrl = filtersFromParams(new URLSearchParams(searchParams.toString()));
    setFilters((prev) =>
      filterSignatureWithoutPage(prev) === filterSignatureWithoutPage(fromUrl) ? prev : fromUrl
    );
  }, [searchParams]);

  // When filters change, fetch fresh results (page 1) and update URL
  useEffect(() => {
    if (!didHydrateRef.current) {
      didHydrateRef.current = true;
    } else {
      fetchProperties(filters);
    }

    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.state) params.set("state", filters.state);
    if (filters.district) params.set("district", filters.district);
    if (filters.type) params.set("type", filters.type);
    if (filters.listingType) params.set("listingType", filters.listingType);
    if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
    if (filters.sortBy && filters.sortBy !== "newest") params.set("sortBy", filters.sortBy);

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.replace(`/properties${newUrl}`, { scroll: false });
  }, [filters, fetchProperties, router]);

  const handleSearch = (search: string, state: string) => {
    setFilters((prev) => ({
      ...prev,
      search: search || undefined,
      state: state || prev.state,
      page: 1,
    }));
  };

  const handleFilterChange = (newFilters: PropertyFilters) => {
    setFilters({ ...newFilters, page: 1 });
  };

  return (
    <div className="min-h-screen bg-onyx-950">
      <section className="relative px-6 pb-8 pt-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-gold/[0.02] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="heading-lg mb-2 text-cream">
              Explore <span className="text-gradient-gold">Properties</span>
            </h1>
            <p className="mb-8 text-lg font-body text-cream/86">
              Discover verified farmlands, plots, and orchards across India
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-3xl"
          >
            <SearchBar
              initialSearch={filters.search}
              initialState={filters.state}
              onSearch={handleSearch}
              variant="page"
            />
          </motion.div>

          {(filters.state || filters.type || filters.search) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex flex-wrap items-center gap-2"
            >
              <span className="text-xs text-cream/82">Active:</span>
              {filters.state && (
                <FilterTag
                  label={filters.state}
                  icon={<MapPin className="h-3 w-3" />}
                  onRemove={() => setFilters((prev) => ({ ...prev, state: undefined, page: 1 }))}
                />
              )}
              {filters.type && (
                <FilterTag
                  label={filters.type.replace(/_/g, " ")}
                  onRemove={() => setFilters((prev) => ({ ...prev, type: undefined, page: 1 }))}
                />
              )}
              {filters.search && (
                <FilterTag
                  label={`"${filters.search}"`}
                  onRemove={() => setFilters((prev) => ({ ...prev, search: undefined, page: 1 }))}
                />
              )}
            </motion.div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
          <PropertyFiltersSidebar
            filters={filters}
            onChange={handleFilterChange}
            totalResults={pagination.total}
          />

          <div className="min-w-0 flex-1">
            {loading ? (
              <PropertyGridSkeleton />
            ) : properties.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {properties.map((property, index) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      index={index}
                      eagerImage={index >= PROPERTY_LIMIT}
                    />
                  ))}
                </div>

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="h-px" />

                {loadingMore && (
                  <div className="mt-8 flex items-center justify-center gap-2 text-sm text-cream/86">
                    <Loader2 className="h-5 w-5 animate-spin text-gold" />
                    Loading more properties...
                  </div>
                )}

                {!hasMore && properties.length > PROPERTY_LIMIT && (
                  <p className="mt-10 text-center text-sm text-cream/80">
                    You&apos;ve seen all {pagination.total} properties
                  </p>
                )}
              </>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterTag({
  label,
  icon,
  onRemove,
}: {
  label: string;
  icon?: ReactNode;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/10 px-2.5 py-1 text-xs text-gold">
      {icon}
      <span className="capitalize">{label}</span>
      <button onClick={onRemove} className="ml-0.5 hover:text-gold-light">
        <span className="sr-only">Remove</span>
        &times;
      </button>
    </span>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-cream/8 bg-onyx-900/50">
        <SearchX className="h-8 w-8 text-cream/79" />
      </div>
      <h3 className="mb-2 font-display text-2xl text-cream">No properties found</h3>
      <p className="max-w-md text-sm text-cream/86">
        Try adjusting your filters or search terms to find the perfect property.
      </p>
    </motion.div>
  );
}

function PropertyGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-cream/8 bg-onyx-900/50 animate-pulse"
        >
          <div className="aspect-[4/3] bg-onyx-800/50" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-3/4 rounded bg-onyx-800/50" />
            <div className="h-4 w-1/2 rounded bg-onyx-800/50" />
            <div className="h-4 w-1/3 rounded bg-onyx-800/50" />
          </div>
        </div>
      ))}
    </div>
  );
}
