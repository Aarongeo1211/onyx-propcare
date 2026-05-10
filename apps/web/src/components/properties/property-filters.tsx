"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "@onyx/ui";
import { INDIAN_STATES, PRICE_RANGES } from "@onyx/types";
import type { PropertyFilters } from "@onyx/types";

const PROPERTY_TYPES = [
  { value: "FARMLAND", label: "Farmland" },
  { value: "RESIDENTIAL_PLOT", label: "Residential Plot" },
  { value: "AGRICULTURAL_LAND", label: "Agricultural Land" },
  { value: "ORCHARD", label: "Orchard" },
  { value: "PLANTATION", label: "Plantation" },
] as const;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "area_desc", label: "Area: Largest" },
  { value: "area_asc", label: "Area: Smallest" },
] as const;

interface PropertyFiltersProps {
  filters: PropertyFilters;
  onChange: (filters: PropertyFilters) => void;
  totalResults: number;
}

export function PropertyFiltersSidebar({ filters, onChange, totalResults }: PropertyFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    type: true,
    listing: true,
    location: true,
    price: true,
    sort: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateFilter = (key: keyof PropertyFilters, value: unknown) => {
    onChange({ ...filters, [key]: value || undefined, page: 1 });
  };

  const clearFilters = () => {
    onChange({ page: 1, limit: 12, sortBy: "newest" });
  };

  const activeFilterCount = [
    filters.type,
    filters.listingType,
    filters.state,
    filters.district,
    filters.minPrice || filters.maxPrice,
  ].filter(Boolean).length;

  const filterContent = (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cream/8">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gold" />
          <span className="text-sm font-medium text-cream">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gold/20 text-gold text-[10px] font-medium">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-xs text-cream/40 hover:text-gold transition-colors">
            Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <FilterSection title="Sort By" isOpen={openSections.sort} onToggle={() => toggleSection("sort")}>
        <select
          value={filters.sortBy || "newest"}
          onChange={(e) => updateFilter("sortBy", e.target.value as PropertyFilters["sortBy"])}
          className="w-full bg-onyx-900/60 border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-gold/40 appearance-none cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-onyx-900">
              {opt.label}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* Property Type */}
      <FilterSection title="Property Type" isOpen={openSections.type} onToggle={() => toggleSection("type")}>
        <div className="space-y-2">
          {PROPERTY_TYPES.map((pt) => (
            <label key={pt.value} className="flex items-center gap-2.5 cursor-pointer group/check">
              <input
                type="checkbox"
                checked={filters.type === pt.value}
                onChange={() => updateFilter("type", filters.type === pt.value ? undefined : pt.value)}
                className="w-4 h-4 rounded border-cream/20 bg-onyx-900/60 text-gold focus:ring-gold/30 focus:ring-offset-0 accent-gold cursor-pointer"
              />
              <span className="text-sm text-cream/60 group-hover/check:text-cream transition-colors">
                {pt.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Listing Type */}
      <FilterSection title="Listing Type" isOpen={openSections.listing} onToggle={() => toggleSection("listing")}>
        <div className="flex gap-2">
          {(["SALE", "LEASE"] as const).map((lt) => (
            <button
              key={lt}
              onClick={() => updateFilter("listingType", filters.listingType === lt ? undefined : lt)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filters.listingType === lt
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "bg-onyx-900/40 text-cream/40 border border-cream/8 hover:border-cream/15 hover:text-cream/60"
              }`}
            >
              {lt === "SALE" ? "Buy" : "Lease"}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Location */}
      <FilterSection title="Location" isOpen={openSections.location} onToggle={() => toggleSection("location")}>
        <div className="space-y-3">
          <select
            value={filters.state || ""}
            onChange={(e) => updateFilter("state", e.target.value)}
            className="w-full bg-onyx-900/60 border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-gold/40 appearance-none cursor-pointer"
          >
            <option value="" className="bg-onyx-900">All States</option>
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state} className="bg-onyx-900">
                {state}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={filters.district || ""}
            onChange={(e) => updateFilter("district", e.target.value)}
            placeholder="District"
            className="w-full bg-onyx-900/60 border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:border-gold/40"
          />
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range" isOpen={openSections.price} onToggle={() => toggleSection("price")}>
        <div className="space-y-2">
          {PRICE_RANGES.map((range) => (
            <label key={range.label} className="flex items-center gap-2.5 cursor-pointer group/check">
              <input
                type="radio"
                name="priceRange"
                checked={filters.minPrice === range.min && (filters.maxPrice === range.max || (range.max === Infinity && !filters.maxPrice))}
                onChange={() => {
                  onChange({
                    ...filters,
                    minPrice: range.min || undefined,
                    maxPrice: range.max === Infinity ? undefined : range.max,
                    page: 1,
                  });
                }}
                className="w-4 h-4 border-cream/20 bg-onyx-900/60 text-gold focus:ring-gold/30 focus:ring-offset-0 accent-gold cursor-pointer"
              />
              <span className="text-sm text-cream/60 group-hover/check:text-cream transition-colors">
                {range.label}
              </span>
            </label>
          ))}
          {(filters.minPrice || filters.maxPrice) && (
            <button
              onClick={() => {
                onChange({ ...filters, minPrice: undefined, maxPrice: undefined, page: 1 });
              }}
              className="text-xs text-cream/30 hover:text-gold transition-colors mt-1"
            >
              Clear price filter
            </button>
          )}
        </div>
      </FilterSection>

      {/* Results count */}
      <div className="pt-4 border-t border-cream/8">
        <p className="text-xs text-cream/30 text-center">
          {totalResults} {totalResults === 1 ? "property" : "properties"} found
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile filter trigger */}
      <div className="lg:hidden mb-4">
        <Button variant="outline" size="sm" onClick={() => setMobileOpen(true)} className="w-full">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 flex items-center justify-center w-5 h-5 rounded-full bg-gold/20 text-gold text-[10px]">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-24 rounded-2xl border border-cream/8 bg-onyx-900/50 backdrop-blur-sm p-5">
          {filterContent}
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-onyx-950 border-r border-cream/8 p-6 overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-cream">Filters</h2>
                <button onClick={() => setMobileOpen(false)} className="p-2 text-cream/40 hover:text-cream">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {filterContent}
              <div className="mt-6">
                <Button onClick={() => setMobileOpen(false)} className="w-full">
                  Show Results
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Filter Section Accordion ────────────────────────────

function FilterSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4 border-b border-cream/5">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-medium text-cream/80">{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-cream/30 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
