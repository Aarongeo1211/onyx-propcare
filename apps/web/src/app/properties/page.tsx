"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, SearchX } from "lucide-react";
import { Button } from "@onyx/ui";
import type { PropertyFilters } from "@onyx/types";
import { SearchBar } from "@/components/properties/search-bar";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { PropertyFiltersSidebar } from "@/components/properties/property-filters";
import { apiFetch } from "@/lib/utils";

interface PropertiesResponse {
  success: boolean;
  data: PropertyCardData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<PropertiesPageFallback />}>
      <PropertiesPageContent />
    </Suspense>
  );
}

function PropertiesPageFallback() {
  return (
    <div className="min-h-screen bg-onyx-950 pt-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="h-10 w-64 bg-onyx-800/50 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-cream/8 bg-onyx-900/50 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-onyx-800/50" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-onyx-800/50 rounded w-3/4" />
                <div className="h-4 bg-onyx-800/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PropertiesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [properties, setProperties] = useState<PropertyCardData[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PropertyFilters>(() => ({
    search: searchParams.get("search") || undefined,
    state: searchParams.get("state") || undefined,
    district: searchParams.get("district") || undefined,
    type: (searchParams.get("type") as PropertyFilters["type"]) || undefined,
    listingType: (searchParams.get("listingType") as PropertyFilters["listingType"]) || undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    sortBy: (searchParams.get("sortBy") as PropertyFilters["sortBy"]) || "newest",
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: 12,
  }));

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
      if (currentFilters.page) params.set("page", String(currentFilters.page));
      if (currentFilters.limit) params.set("limit", String(currentFilters.limit));

      const data = await apiFetch<PropertiesResponse>(`/properties?${params.toString()}`);
      setProperties(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 });
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on filter change
  useEffect(() => {
    fetchProperties(filters);

    // Sync URL params
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.state) params.set("state", filters.state);
    if (filters.district) params.set("district", filters.district);
    if (filters.type) params.set("type", filters.type);
    if (filters.listingType) params.set("listingType", filters.listingType);
    if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
    if (filters.sortBy && filters.sortBy !== "newest") params.set("sortBy", filters.sortBy);
    if (filters.page && filters.page > 1) params.set("page", String(filters.page));

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
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-onyx-950">
      {/* Page header */}
      <section className="relative pt-28 pb-8 px-6">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gold/[0.02] rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="heading-lg text-cream mb-2">
              Explore <span className="text-gradient-gold">Properties</span>
            </h1>
            <p className="text-cream/40 font-body text-lg mb-8">
              Discover verified farmlands, plots, and orchards across India
            </p>
          </motion.div>

          {/* Search bar */}
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

          {/* Active filter tags */}
          {(filters.state || filters.type || filters.search) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap items-center gap-2 mt-4"
            >
              <span className="text-xs text-cream/30">Active:</span>
              {filters.state && (
                <FilterTag
                  label={filters.state}
                  icon={<MapPin className="w-3 h-3" />}
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

      {/* Main content */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex gap-8">
          {/* Sidebar */}
          <PropertyFiltersSidebar
            filters={filters}
            onChange={handleFilterChange}
            totalResults={pagination.total}
          />

          {/* Properties grid */}
          <div className="flex-1 min-w-0">
            {/* Mobile filters button is inside the sidebar component */}

            {loading ? (
              <PropertyGridSkeleton />
            ) : properties.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {properties.map((property, i) => (
                    <PropertyCard key={property.id} property={property} index={i} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      Previous
                    </Button>

                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        const current = pagination.page;
                        return p === 1 || p === pagination.totalPages || Math.abs(p - current) <= 2;
                      })
                      .map((p, i, arr) => {
                        const showEllipsis = i > 0 && p - arr[i - 1] > 1;
                        return (
                          <span key={p} className="flex items-center">
                            {showEllipsis && <span className="px-2 text-cream/20">...</span>}
                            <button
                              onClick={() => handlePageChange(p)}
                              className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                                p === pagination.page
                                  ? "bg-gold text-onyx-950"
                                  : "text-cream/40 hover:text-cream hover:bg-cream/5"
                              }`}
                            >
                              {p}
                            </button>
                          </span>
                        );
                      })}

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
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

// ─── Sub-components ──────────────────────────────────────

function FilterTag({
  label,
  icon,
  onRemove,
}: {
  label: string;
  icon?: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gold/10 border border-gold/20 rounded-full text-xs text-gold">
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
      <div className="w-20 h-20 rounded-full bg-onyx-900/50 border border-cream/8 flex items-center justify-center mb-6">
        <SearchX className="w-8 h-8 text-cream/20" />
      </div>
      <h3 className="font-display text-2xl text-cream mb-2">No properties found</h3>
      <p className="text-cream/40 text-sm max-w-md mb-6">
        Try adjusting your filters or search terms to find the perfect property.
      </p>
    </motion.div>
  );
}

function PropertyGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-cream/8 bg-onyx-900/50 overflow-hidden animate-pulse">
          <div className="aspect-[4/3] bg-onyx-800/50" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-onyx-800/50 rounded w-3/4" />
            <div className="h-4 bg-onyx-800/50 rounded w-1/2" />
            <div className="h-4 bg-onyx-800/50 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
