"use client";

import { motion } from "framer-motion";
import { Search, ArrowRight, Sparkles, MapPin, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { INDIAN_STATES } from "@onyx/types";

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<"FARMLAND" | "RESIDENTIAL_PLOT">("FARMLAND");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedState) params.set("state", selectedState);
    params.set("type", activeTab);
    router.push(`/properties?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleQuickState = (state: string) => {
    const params = new URLSearchParams();
    params.set("state", state);
    params.set("type", activeTab);
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden noise-overlay">
      {/* Dramatic background layers */}
      <div className="absolute inset-0">
        {/* Deep gradient base */}
        <div className="absolute inset-0 bg-gradient-to-b from-onyx-950 via-onyx-950/95 to-onyx-950" />

        {/* Radial gold glow - top right */}
        <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-gold/[0.03] rounded-full blur-[120px]" />

        {/* Radial green glow - bottom left for earth feel */}
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-earth-green/[0.04] rounded-full blur-[100px]" />

        {/* Geometric grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(201, 168, 76, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201, 168, 76, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />

        {/* Diagonal decorative lines */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="100%" x2="100%" y2="0" stroke="rgba(201,168,76,0.04)" strokeWidth="1" />
          <line x1="20%" y1="100%" x2="100%" y2="20%" stroke="rgba(201,168,76,0.03)" strokeWidth="1" />
        </svg>
      </div>

      {/* Floating decorative elements */}
      <motion.div
        animate={{ y: [-20, 20, -20], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-[15%] w-24 h-24 border border-gold/10 rounded-2xl rotate-12 hidden lg:block"
      />
      <motion.div
        animate={{ y: [15, -15, 15], rotate: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/3 left-[10%] w-16 h-16 border border-gold/8 rounded-full hidden lg:block"
      />
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[40%] right-[8%] w-2 h-2 bg-gold/30 rounded-full hidden lg:block"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 lg:py-40">
        <div className="max-w-4xl">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full glass-gold"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-body font-medium text-gold tracking-wide">
              INDIA&apos;S FIRST DATA-DRIVEN LAND PLATFORM
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="heading-xl mb-6"
          >
            <span className="text-cream">Invest in </span>
            <span className="text-shimmer">India&apos;s Finest</span>
            <br />
            <span className="text-cream/80 font-light italic">Land & Plots</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg lg:text-xl text-cream/40 max-w-2xl mb-10 font-body font-light leading-relaxed"
          >
            Verified farmlands &amp; residential plots with exclusive soil data,
            water analysis, drone surveys, and legal checks.{" "}
            <span className="text-gold/70">Make informed decisions</span> backed by real data.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="max-w-2xl"
          >
            {/* Tabs */}
            <div className="flex gap-1 mb-3">
              {[
                { key: "FARMLAND" as const, label: "Farmlands" },
                { key: "RESIDENTIAL_PLOT" as const, label: "Plots" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-2 text-sm rounded-t-lg transition-all duration-300 ${
                    activeTab === tab.key
                      ? "bg-onyx-900/80 text-gold border-t border-x border-gold/20"
                      : "text-cream/30 hover:text-cream/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center glass rounded-xl p-2 group focus-within:border-gold/30 transition-all duration-300">
              {/* State selector */}
              <div className="relative">
                <button
                  onClick={() => setShowStateDropdown(!showStateDropdown)}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-cream/50 hover:text-cream border-r border-cream/8 whitespace-nowrap transition-colors"
                >
                  <MapPin className="w-4 h-4 text-gold/50" />
                  <span className={selectedState ? "text-cream" : ""}>
                    {selectedState || "All India"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showStateDropdown && (
                  <div className="absolute top-full left-0 z-50 mt-2 w-64 max-h-60 overflow-y-auto py-2 bg-onyx-900 border border-cream/10 rounded-xl shadow-2xl shadow-black/40">
                    <button
                      onClick={() => { setSelectedState(""); setShowStateDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-cream/50 hover:bg-cream/5 hover:text-cream transition-colors"
                    >
                      All India
                    </button>
                    {INDIAN_STATES.map((state) => (
                      <button
                        key={state}
                        onClick={() => { setSelectedState(state); setShowStateDropdown(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-cream/5 transition-colors ${
                          selectedState === state ? "text-gold" : "text-cream/60 hover:text-cream"
                        }`}
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Search className="w-5 h-5 ml-3 text-cream/25 group-focus-within:text-gold/60 transition-colors hidden sm:block" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeTab === "FARMLAND"
                    ? "Search by location, district..."
                    : "Search residential plots..."
                }
                className="flex-1 bg-transparent px-4 py-3 text-sm text-cream placeholder:text-cream/25 focus:outline-none font-body"
              />
              <button
                onClick={handleSearch}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-gold text-onyx-950 font-medium text-sm rounded-lg hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 group/btn"
              >
                Explore
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Quick tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {["Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "Rajasthan"].map((state) => (
                <button
                  key={state}
                  onClick={() => handleQuickState(state)}
                  className="px-3 py-1.5 text-xs text-cream/30 border border-cream/8 rounded-full hover:border-gold/30 hover:text-gold/70 transition-all duration-300"
                >
                  {state}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-onyx-950 to-transparent" />
    </section>
  );
}
