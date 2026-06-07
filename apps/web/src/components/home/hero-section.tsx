"use client";

import Image from "next/image";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowRight,
  Sparkles,
  MapPin,
  ChevronDown,
  Leaf,
  Building2,
  Play,
  ShieldCheck,
  Droplets,
  Scale,
  TrendingUp,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { INDIAN_STATES } from "@onyx/types";
import { formatArea, formatPrice } from "@/lib/utils";
import type { PropertyCardData } from "@/components/properties/property-card";

const stats = [
  { value: 12500, suffix: "+", label: "Properties Listed" },
  { value: 28, suffix: "", label: "States Covered" },
  { value: 8400, suffix: "+", label: "Happy Investors" },
  { value: 3200, suffix: " Cr", prefix: "\u20B9", label: "Value Traded" },
];

const quickStates = ["Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "Rajasthan"];

const journeyCards = [
  {
    title: "Verified Farmland",
    description: "Soil, water, access and title stacked into one decision flow.",
    href: "/properties?type=FARMLAND",
  },
  {
    title: "Residential Plots",
    description: "Shortlist investor-grade plotted land with faster local discovery.",
    href: "/properties?type=RESIDENTIAL_PLOT",
  },
  {
    title: "ROI Calculator",
    description: "Model returns before you talk to anyone or book a visit.",
    href: "/calculator",
  },
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
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
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
  }, [isInView, value]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {count.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

interface SearchPanelProps {
  activeTab: "FARMLAND" | "RESIDENTIAL_PLOT";
  onTabChange: (tab: "FARMLAND" | "RESIDENTIAL_PLOT") => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedState: string;
  showStateDropdown: boolean;
  onToggleDropdown: () => void;
  onStateSelect: (state: string) => void;
  onSearch: () => void;
  onQuickState: (state: string) => void;
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
  onQuickState,
  onKeyDown,
  compact = false,
}: SearchPanelProps) {
  const tabClass = compact ? "px-3.5 py-2 text-xs rounded-xl" : "px-5 py-2.5 text-sm rounded-t-2xl";
  const wrapperClass = compact ? "rounded-2xl p-2.5" : "rounded-[1.6rem] p-3";
  const inputClass = compact ? "px-3 py-2.5 text-sm" : "px-4 py-3.5 text-sm";
  const buttonClass = compact ? "px-4 py-2.5 text-sm rounded-xl" : "px-6 py-3.5 text-sm rounded-2xl";
  const showQuickActions = !compact;

  return (
    <div className={compact ? "w-full" : "max-w-3xl"}>
      <div className={`flex flex-wrap gap-1.5 ${compact ? "mb-2.5" : "mb-3"}`}>
        {[
          { key: "FARMLAND" as const, label: "Farmlands", icon: Leaf },
          { key: "RESIDENTIAL_PLOT" as const, label: "Plots", icon: Building2 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 border transition-all duration-300 ${tabClass} ${
              activeTab === tab.key
                ? "border-gold/25 bg-onyx-900/90 text-gold shadow-[0_10px_30px_rgba(201,168,76,0.10)]"
                : "border-transparent bg-transparent text-cream/40 hover:text-cream/70"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`glass group border-gold/10 shadow-2xl shadow-black/25 ${wrapperClass}`}>
        <div className="flex flex-col gap-2">
          {/* Row 1: state dropdown + divider + search input (+ explore on desktop) */}
          <div className="flex items-center">
            <div className="relative shrink-0">
              <button
                onClick={onToggleDropdown}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl border border-cream/8 bg-cream/[0.03] text-left transition-colors hover:border-gold/20 hover:text-cream lg:rounded-2xl lg:border-0 lg:bg-transparent ${compact ? "px-3 py-2 text-sm text-cream/60" : "px-3 py-2.5 text-sm text-cream/55"}`}
              >
                <MapPin className="h-4 w-4 text-gold/55" />
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
                    className="absolute left-0 top-full z-50 mt-2 max-h-60 w-64 overflow-y-auto rounded-2xl border border-cream/10 bg-onyx-900 py-2 shadow-2xl shadow-black/40"
                  >
                    <button
                      onClick={() => onStateSelect("")}
                      className="w-full px-4 py-2 text-left text-sm text-cream/50 transition-colors hover:bg-cream/5 hover:text-cream"
                    >
                      All India
                    </button>
                    {INDIAN_STATES.map((state) => (
                      <button
                        key={state}
                        onClick={() => onStateSelect(state)}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-cream/5 ${
                          selectedState === state ? "text-gold" : "text-cream/60 hover:text-cream"
                        }`}
                      >
                        {state}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mx-2 h-7 w-px bg-cream/8" />

            <div className="relative flex min-w-0 flex-1 items-center">
              <Search className="pointer-events-none ml-3 hidden h-4.5 w-4.5 text-cream/25 transition-colors group-focus-within:text-gold/65 sm:block" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  activeTab === "FARMLAND"
                    ? "Search by state, district, taluk or region"
                    : "Search plots by city, district or locality"
                }
                className={`w-full flex-1 bg-transparent text-cream placeholder:text-cream/25 focus:outline-none font-body ${inputClass}`}
              />
            </div>

            {/* Explore — desktop: inline in the input row */}
            <button
              onClick={onSearch}
              className={`ml-2 hidden shrink-0 items-center justify-center gap-2 bg-gradient-gold font-medium text-onyx-950 shadow-lg shadow-gold/15 transition-all duration-300 hover:shadow-gold/30 lg:inline-flex ${buttonClass}`}
            >
              Explore
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Row 2: Explore — mobile only, full-width below input row */}
          <button
            onClick={onSearch}
            className={`inline-flex w-full items-center justify-center gap-2 bg-gradient-gold font-medium text-onyx-950 shadow-lg shadow-gold/15 transition-all duration-300 hover:shadow-gold/30 lg:hidden ${buttonClass}`}
          >
            Explore
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showQuickActions && (
        <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {quickStates.map((state) => (
              <button
                key={state}
                onClick={() => onQuickState(state)}
                className="rounded-full border border-cream/10 px-3 py-1.5 text-xs text-cream/45 transition-all duration-300 hover:border-gold/30 hover:text-gold/80"
              >
                {state}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              const el = document.getElementById("featured-properties");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="inline-flex items-center gap-1.5 text-xs text-gold/60 transition-colors hover:text-gold xl:ml-auto"
          >
            <Play className="h-3 w-3" />
            Browse live inventory
          </button>
        </div>
      )}
    </div>
  );
}

function HeroPreview({ properties }: { properties: PropertyCardData[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance every 3 s; restarting when user manually picks a dot
  useEffect(() => {
    if (properties.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % properties.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [currentIndex, properties.length]);

  const primaryProperty = properties[currentIndex];
  const secondaryProperty = properties.length > 1
    ? properties[(currentIndex + 1) % properties.length]
    : null;

  return (
    <div className="relative">
      <div className="absolute -right-14 top-10 hidden h-48 w-48 rounded-full bg-gold/[0.06] blur-[90px] lg:block" />
      <div className="absolute -left-10 bottom-6 hidden h-32 w-32 rounded-full bg-earth-green/[0.08] blur-[80px] lg:block" />

      <div className="relative grid gap-4">
        <div className="overflow-hidden rounded-[2rem] border border-cream/10 bg-onyx-900/55 shadow-2xl shadow-black/35 backdrop-blur-sm">
          <div className="relative aspect-[4/3]">
            {/* Crossfading image layer */}
            <AnimatePresence mode="sync">
              <motion.div
                key={primaryProperty?.id ?? currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={primaryProperty?.images?.[0]?.url || "/images/placeholder-property.jpg"}
                  alt={primaryProperty?.images?.[0]?.alt || primaryProperty?.title || "Onyx Propcare featured property"}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-onyx-950 via-onyx-950/10 to-transparent" />

            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-onyx-950/60 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-gold/85 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              Featured Pick
            </div>

            {/* Dot indicators — only when multiple properties */}
            {properties.length > 1 && (
              <div className="absolute right-4 top-4 flex items-center gap-1.5">
                {properties.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentIndex
                        ? "w-5 bg-gold"
                        : "w-1.5 bg-cream/30 hover:bg-cream/50"
                    }`}
                    aria-label={`Go to featured property ${i + 1}`}
                  />
                ))}
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 p-5">
              {/* Sliding text content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={primaryProperty?.id ?? currentIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-cream/10 bg-onyx-950/55 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-cream/70">
                      {primaryProperty ? primaryProperty.type.replaceAll("_", " ") : "Verified listing"}
                    </span>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                      Legal Ready
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-cream">
                    {primaryProperty?.title || "Verified land with on-ground due diligence"}
                  </h3>
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-cream/65">
                    <MapPin className="h-4 w-4 text-gold/65" />
                    <span>
                      {primaryProperty ? `${primaryProperty.district}, ${primaryProperty.state}` : "Pan-India coverage"}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="font-display text-3xl font-semibold text-gold">
                        {primaryProperty ? formatPrice(primaryProperty.price) : "Verified pricing"}
                      </div>
                      <div className="text-xs uppercase tracking-[0.18em] text-cream/45">
                        {primaryProperty
                          ? formatArea(primaryProperty.totalArea, primaryProperty.areaUnit)
                          : "Soil, water and legal layers included"}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-cream/60">
                      <div className="rounded-2xl border border-cream/8 bg-onyx-950/45 px-3 py-2">
                        <div className="mb-1 text-gold/75">Soil</div>
                        <div>{primaryProperty?.soilData?.soilType || "Analyzed"}</div>
                      </div>
                      <div className="rounded-2xl border border-cream/8 bg-onyx-950/45 px-3 py-2">
                        <div className="mb-1 text-gold/75">Water</div>
                        <div>{primaryProperty?.waterData?.waterSource || "Mapped"}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.6rem] border border-cream/10 bg-onyx-900/55 p-5 shadow-xl shadow-black/20 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gold/70">
              <ShieldCheck className="h-3.5 w-3.5" />
              Why buyers trust Onyx
            </div>
            <div className="space-y-3">
              {[
                { icon: Scale, label: "Title clearance", value: "Checked before listing" },
                { icon: Droplets, label: "Water analysis", value: "Source and quality mapped" },
                { icon: TrendingUp, label: "Decision support", value: "ROI-ready evaluation flow" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-2xl border border-cream/8 bg-cream/[0.02] px-3.5 py-3"
                >
                  <item.icon className="mt-0.5 h-4 w-4 text-gold/75" />
                  <div>
                    <div className="text-sm text-cream/90">{item.label}</div>
                    <div className="text-xs text-cream/50">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.6rem] border border-gold/15 bg-gold/[0.06] p-5 shadow-xl shadow-black/15 backdrop-blur-sm">
            <div className="mb-3 text-xs uppercase tracking-[0.18em] text-gold/75">
              Next best region
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={secondaryProperty?.id ?? "fallback"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <h4 className="font-display text-2xl text-cream">
                  {secondaryProperty ? secondaryProperty.state : "Curated investor regions"}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-cream/55">
                  {secondaryProperty
                    ? `${secondaryProperty.district} is already showing live inventory with verified access, pricing and diligence layers.`
                    : "Browse the strongest live markets first instead of starting from a blank search."}
                </p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {quickStates.slice(0, 4).map((state) => (
                <div
                  key={state}
                  className="rounded-2xl border border-gold/12 bg-onyx-950/35 px-3 py-2 text-xs text-cream/70"
                >
                  {state}
                </div>
              ))}
            </div>
          </div>
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
  const [activeTab, setActiveTab] = useState<"FARMLAND" | "RESIDENTIAL_PLOT">("FARMLAND");
  const [heroVisible, setHeroVisible] = useState(true);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 320], [1, 0.88]);
  const heroScale = useTransform(scrollY, [0, 320], [1, 0.985]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.35 }
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

  const handleQuickState = (state: string) => {
    const params = new URLSearchParams();
    params.set("state", state);
    params.set("type", activeTab);
    router.push(`/properties?${params.toString()}`);
  };

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    setShowStateDropdown(false);
  };

  return (
    <>
      <AnimatePresence>
        {!heroVisible && (
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[4.8rem] z-40 hidden px-4 sm:block lg:top-[6.6rem]"
          >
            <div className="mx-auto max-w-5xl">
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
                onQuickState={handleQuickState}
                onKeyDown={handleKeyDown}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section
        ref={heroRef}
        className="relative overflow-hidden border-b border-cream/6 noise-overlay"
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-onyx-950 via-onyx-950/96 to-onyx-950" />
          <div className="absolute -right-20 top-0 h-[40rem] w-[40rem] rounded-full bg-gold/[0.05] blur-[120px]" />
          <div className="absolute -left-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-earth-green/[0.07] blur-[110px]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(201,168,76,0.22) 1px, transparent 1px),
                linear-gradient(90deg, rgba(201,168,76,0.22) 1px, transparent 1px)
              `,
              backgroundSize: "72px 72px",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: `
                radial-gradient(circle at 18% 28%, rgba(201,168,76,0.22) 0%, transparent 30%),
                radial-gradient(circle at 78% 32%, rgba(201,168,76,0.14) 0%, transparent 28%),
                radial-gradient(circle at 62% 78%, rgba(74,124,89,0.16) 0%, transparent 28%)
              `,
            }}
          />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 mx-auto flex min-h-[78svh] w-full max-w-7xl items-center px-6 pb-14 pt-12 lg:min-h-[82svh] lg:pb-16 lg:pt-20"
        >
          <div className="grid w-full gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-center">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.div
                variants={fadeUpItem}
                className="mb-7 inline-flex items-center gap-2 rounded-full border border-gold/15 bg-gold/[0.06] px-4 py-2"
              >
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                <span className="text-xs font-body font-medium tracking-wide text-gold">
                  SEARCH-FIRST LAND DISCOVERY FOR INDIA
                </span>
              </motion.div>

              <motion.h1 variants={fadeUpItem} className="heading-xl mb-5 max-w-4xl">
                <span className="text-cream">Find verified </span>
                <span className="text-gradient-gold">farmland and plots</span>
                <br />
                <span className="text-cream/88 text-[0.88em]">without broker fog.</span>
              </motion.h1>

              <motion.p
                variants={fadeUpItem}
                className="mb-3 max-w-2xl text-lg leading-relaxed text-cream/60 lg:text-xl"
              >
                Onyx Propcare helps investors search land the way they actually decide:
                location first, then legal readiness, water, soil, access and pricing clarity.
              </motion.p>
              <motion.p
                variants={fadeUpItem}
                className="mb-8 max-w-2xl text-sm text-cream/42 lg:text-base"
              >
                <span className="text-gold/78">Soil reports</span> ·{" "}
                <span className="text-gold/78">Water analysis</span> ·{" "}
                <span className="text-gold/78">Drone surveys</span> ·{" "}
                <span className="text-gold/78">Legal clearance</span>
              </motion.p>

              <motion.div
                variants={fadeUpItem}
                className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
              >
                {[
                  "Search by state, district or locality",
                  "Verified before inquiry",
                  "Farmland and plot flows separated",
                  "Built for serious investors",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-cream/8 bg-onyx-900/35 px-4 py-3 text-sm text-cream/68 backdrop-blur-sm"
                  >
                    {item}
                  </div>
                ))}
              </motion.div>

              <motion.div variants={fadeUpItem}>
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
                  onQuickState={handleQuickState}
                  onKeyDown={handleKeyDown}
                />
              </motion.div>

              <motion.div
                variants={fadeUpItem}
                className="mt-8 grid gap-3 md:grid-cols-3"
              >
                {journeyCards.map((card) => (
                  <button
                    key={card.title}
                    onClick={() => router.push(card.href)}
                    className="group rounded-[1.4rem] border border-cream/8 bg-onyx-900/28 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/18 hover:bg-onyx-900/45"
                  >
                    <div className="mb-2 font-display text-2xl text-cream transition-colors duration-300 group-hover:text-gold">
                      {card.title}
                    </div>
                    <div className="text-sm leading-relaxed text-cream/48">{card.description}</div>
                  </button>
                ))}
              </motion.div>

              <motion.div
                variants={fadeUpItem}
                className="mt-8 rounded-[1.6rem] border border-gold/12 bg-gold/[0.05] p-5 backdrop-blur-sm"
              >
                <div className="grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-3">
                  {stats.map((stat) => (
                    <div key={stat.label} className="text-left lg:px-2">
                      <div className="font-display text-2xl font-semibold text-gold lg:text-3xl">
                        <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                      </div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-cream/38">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
            >
              <HeroPreview properties={featuredProperties} />
            </motion.div>
          </div>
        </motion.div>
      </section>
    </>
  );
}

export { stats };
