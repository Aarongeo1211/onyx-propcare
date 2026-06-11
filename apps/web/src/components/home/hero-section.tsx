"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowRight,
  Sparkles,
  MapPin,
  ChevronDown,
  Leaf,
  Building2,
  Sprout,
  Trees,
  TreePalm,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { INDIAN_STATES } from "@onyx/types";
import { formatPrice } from "@/lib/utils";
import type { PropertyCardData } from "@/components/properties/property-card";

const stats = [
  { value: 12500, suffix: "+", label: "Properties Listed" },
  { value: 28, suffix: "", label: "States Covered" },
  { value: 8400, suffix: "+", label: "Happy Investors" },
  { value: 3200, suffix: " Cr", prefix: "₹", label: "Value Traded" },
];

const quickStates = ["Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "Rajasthan"];

// Curated hero backgrounds. Drop high-res images (ideally drone/aerial shots of
// farmland/plots, ~1920×1080+) into apps/web/public/brand/hero/ and list them here.
// When this is non-empty it takes priority; otherwise the hero falls back to live
// featured-listing photos.
const CURATED_HERO_IMAGES: string[] = [
  // "/brand/hero/hero-1.jpg",
  // "/brand/hero/hero-2.jpg",
  // "/brand/hero/hero-3.jpg",
];

interface HeroSlide {
  id: string;
  url: string;
  property?: PropertyCardData;
}

type PropertyTypeValue =
  | "FARMLAND"
  | "RESIDENTIAL_PLOT"
  | "AGRICULTURAL_LAND"
  | "ORCHARD"
  | "PLANTATION";

const PROPERTY_TYPES: { value: PropertyTypeValue; label: string; icon: typeof Leaf }[] = [
  { value: "FARMLAND", label: "Farmland", icon: Leaf },
  { value: "RESIDENTIAL_PLOT", label: "Plots", icon: Building2 },
  { value: "AGRICULTURAL_LAND", label: "Agricultural", icon: Sprout },
  { value: "ORCHARD", label: "Orchard", icon: Trees },
  { value: "PLANTATION", label: "Plantation", icon: TreePalm },
];

function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [count, setCount] = useState(0);

  // Count up on mount — these sit in the hero (always seen), so don't gate on scroll.
  useEffect(() => {
    const duration = 1800;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {count.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

interface SearchPanelProps {
  activeTab: PropertyTypeValue;
  onTabChange: (tab: PropertyTypeValue) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedState: string;
  showStateDropdown: boolean;
  onToggleDropdown: () => void;
  onStateSelect: (state: string) => void;
  onSearch: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  compact?: boolean;
}

function SearchPanel({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchQueryChange,
  selectedState,
  showStateDropdown,
  onToggleDropdown,
  onStateSelect,
  onSearch,
  onKeyDown,
  compact = false,
}: SearchPanelProps) {
  const tabClass = compact ? "px-3 py-1.5 text-xs rounded-xl" : "px-3.5 py-2 text-[13px] rounded-xl";
  const wrapperClass = compact ? "rounded-2xl p-2.5" : "rounded-[1.6rem] p-3";
  const inputClass = compact ? "px-3 py-2.5 text-sm" : "px-4 py-3.5 text-sm";
  const buttonClass = compact ? "px-4 py-2.5 text-sm rounded-xl" : "px-6 py-3.5 text-sm rounded-2xl";

  // In compact mode only show the two primary tabs to save space.
  const tabs = compact ? PROPERTY_TYPES.slice(0, 2) : PROPERTY_TYPES;

  return (
    <div className={compact ? "w-full" : "w-full max-w-3xl"}>
      <div className={`flex flex-wrap gap-1.5 ${compact ? "mb-2.5" : "mb-3"}`}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`flex items-center gap-1.5 border transition-all duration-300 ${tabClass} ${
              activeTab === tab.value
                ? "border-gold/30 bg-gold/10 text-gold shadow-sm"
                : "border-cream/10 bg-onyx-900 text-cream/50 hover:text-cream/80 hover:border-cream/20"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`glass group border-gold/10 shadow-lg shadow-cream/5 ${wrapperClass}`}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            <div className="relative shrink-0">
              <button
                onClick={onToggleDropdown}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl border border-cream/10 bg-onyx-900 text-left transition-colors hover:border-gold/30 hover:text-cream lg:rounded-2xl lg:border-0 lg:bg-transparent ${compact ? "px-3 py-2 text-sm text-cream/70" : "px-3 py-2.5 text-sm text-cream/65"}`}
              >
                <MapPin className="h-4 w-4 text-gold" />
                <span className={selectedState ? "text-cream" : ""}>{selectedState || "All India"}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <AnimatePresence>
                {showStateDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full z-50 mt-2 max-h-60 w-64 overflow-y-auto rounded-2xl border border-cream/10 bg-onyx-950 py-2 shadow-2xl shadow-cream/10"
                  >
                    <button
                      onClick={() => onStateSelect("")}
                      className="w-full px-4 py-2 text-left text-sm text-cream/55 transition-colors hover:bg-gold/5 hover:text-cream"
                    >
                      All India
                    </button>
                    {INDIAN_STATES.map((state) => (
                      <button
                        key={state}
                        onClick={() => onStateSelect(state)}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gold/5 ${
                          selectedState === state ? "text-gold" : "text-cream/65 hover:text-cream"
                        }`}
                      >
                        {state}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mx-2 h-7 w-px bg-cream/10" />

            <div className="relative flex min-w-0 flex-1 items-center">
              <Search className="pointer-events-none ml-3 hidden h-4.5 w-4.5 text-cream/30 transition-colors group-focus-within:text-gold sm:block" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search by state, district, taluk or locality"
                className={`w-full flex-1 bg-transparent text-cream placeholder:text-cream/50 focus:outline-none font-body ${inputClass}`}
              />
            </div>

            <button
              onClick={onSearch}
              className={`ml-2 hidden shrink-0 items-center justify-center gap-2 bg-gradient-gold font-medium text-white shadow-md shadow-gold/20 transition-all duration-300 hover:shadow-gold/40 lg:inline-flex ${buttonClass}`}
            >
              Search
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={onSearch}
            className={`inline-flex w-full items-center justify-center gap-2 bg-gradient-gold font-medium text-white shadow-md shadow-gold/20 transition-all duration-300 hover:shadow-gold/40 lg:hidden ${buttonClass}`}
          >
            Search
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function HeroSection({ featuredProperties = [] }: { featuredProperties?: PropertyCardData[] }) {
  const router = useRouter();
  const heroRef = useRef<HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<PropertyTypeValue>("FARMLAND");
  const [heroVisible, setHeroVisible] = useState(true);

  // Hero background slides: curated images take priority, else live featured listings.
  const curatedSlides: HeroSlide[] = CURATED_HERO_IMAGES.map((url, i) => ({ id: `curated-${i}`, url }));
  const listingSlides: HeroSlide[] = featuredProperties
    .filter((p) => p.images?.[0]?.url)
    .slice(0, 5)
    .map((p) => ({ id: p.id, url: p.images[0].url, property: p }));
  const slides = curatedSlides.length > 0 ? curatedSlides : listingSlides;

  const [bgIndex, setBgIndex] = useState(0);
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setBgIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length]);
  const activeProp = slides[bgIndex]?.property;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedState) params.set("state", selectedState);
    params.set("type", activeTab);
    router.push(`/properties?${params.toString()}`);
  }, [searchQuery, selectedState, activeTab, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    setShowStateDropdown(false);
  };

  return (
    <>
      {/* Sticky compact search — appears after the hero scrolls away (desktop/tablet only) */}
      <AnimatePresence>
        {!heroVisible && (
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[4.8rem] z-40 hidden px-4 sm:block lg:top-[6.6rem]"
          >
            <div className="mx-auto max-w-5xl rounded-2xl bg-white p-1 shadow-xl shadow-black/10">
              <SearchPanel
                compact
                activeTab={activeTab}
                onTabChange={setActiveTab}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                selectedState={selectedState}
                showStateDropdown={showStateDropdown}
                onToggleDropdown={() => setShowStateDropdown((current) => !current)}
                onStateSelect={handleStateSelect}
                onSearch={handleSearch}
                onKeyDown={handleKeyDown}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section ref={heroRef} className="relative min-h-[34rem] overflow-hidden border-b border-cream/8 lg:min-h-[40rem]">
        {/* Background slides — CSS opacity crossfade (no framer layer promotion / no negative
            z-index = no mobile compositing glitch). Painted first so content stacks above it. */}
        <div className="absolute inset-0 bg-onyx-50">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                i === bgIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={slide.url}
                alt={slide.property?.title || "Verified farmland and plots on Onyx Propcare"}
                fill
                priority={i === 0}
                quality={80}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
          {/* Navy scrims for legibility (heavier bottom-left where the content sits) */}
          <div className="absolute inset-0 bg-gradient-to-t from-onyx-50/92 via-onyx-50/55 to-onyx-50/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-onyx-50/80 via-onyx-50/25 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[34rem] w-full max-w-6xl flex-col justify-center px-5 pb-16 pt-14 sm:px-6 lg:min-h-[40rem] lg:pb-20 lg:pt-20">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-gold-200" />
              <span className="text-[11px] font-body font-semibold uppercase tracking-[0.15em] text-white">
                India&apos;s verified land marketplace
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="heading-lg mb-4 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
            >
              Search verified <span className="text-gold-200">farmland &amp; plots</span>
              <br className="hidden sm:block" /> across India
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="mb-7 max-w-xl text-base font-medium leading-relaxed text-white/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)] sm:text-lg"
            >
              Soil, water, legal and drone checks on every listing. Find your next plot by
              location, type and budget — no broker fog.
            </motion.p>
          </div>

          {/* Floating white search card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="max-w-3xl rounded-2xl bg-white p-3 shadow-2xl shadow-black/25 sm:p-4"
          >
            <SearchPanel
              activeTab={activeTab}
              onTabChange={setActiveTab}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              selectedState={selectedState}
              showStateDropdown={showStateDropdown}
              onToggleDropdown={() => setShowStateDropdown((current) => !current)}
              onStateSelect={handleStateSelect}
              onSearch={handleSearch}
              onKeyDown={handleKeyDown}
            />
          </motion.div>

          {/* Quick state chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-5 flex flex-wrap items-center gap-2"
          >
            <span className="text-xs font-semibold text-white/70">Popular:</span>
            {quickStates.map((state) => (
              <Link
                key={state}
                href={`/properties?state=${encodeURIComponent(state)}`}
                className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white/85 transition-all duration-300 hover:border-white/60 hover:bg-white/20"
              >
                {state}
              </Link>
            ))}
          </motion.div>

          {/* Compact stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-x-8 gap-y-3"
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-xl font-semibold text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)] sm:text-2xl">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* "Now showing" caption for the live plot in the background (desktop) */}
        {activeProp && (
          <Link
            href={`/properties/${activeProp.slug}`}
            className="absolute bottom-5 right-5 z-10 hidden max-w-xs items-center gap-3 rounded-2xl border border-white/15 bg-black/45 px-4 py-2.5 backdrop-blur-md transition-colors hover:bg-black/60 lg:flex"
          >
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/55">Now showing</div>
              <div className="truncate text-sm font-medium text-white">{activeProp.title}</div>
              <div className="truncate text-xs text-white/70">
                {activeProp.district}, {activeProp.state} · {formatPrice(activeProp.price)}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-white/70" />
          </Link>
        )}

        {/* Image indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 left-5 z-10 flex gap-1.5 sm:left-6">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setBgIndex(i)}
                aria-label={`Show featured plot ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === bgIndex ? "w-5 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export { stats };
