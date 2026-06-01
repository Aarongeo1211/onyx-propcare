"use client";

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
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { INDIAN_STATES } from "@onyx/types";

const stats = [
  { value: 12500, suffix: "+", label: "Properties Listed" },
  { value: 28, suffix: "", label: "States Covered" },
  { value: 8400, suffix: "+", label: "Happy Investors" },
  { value: 3200, suffix: " Cr", prefix: "\u20B9", label: "Value Traded" },
];

const quickStates = ["Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "Rajasthan"];

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
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export function HeroSection() {
  const router = useRouter();
  const heroRef = useRef<HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<"FARMLAND" | "RESIDENTIAL_PLOT">("FARMLAND");
  const [, setHeroVisible] = useState(true);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.97]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.1 }
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

  return (
    <section
      ref={heroRef}
      className="relative min-h-[100vh] flex items-center overflow-hidden noise-overlay"
    >
      {/* ═══ BACKGROUND ═══ */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-onyx-950 via-onyx-950/95 to-onyx-950" />

        <motion.div
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-gold/[0.04] rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-earth-green/[0.05] rounded-full blur-[100px]"
        />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(201,168,76,0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 50%, rgba(201,168,76,0.1) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, rgba(74,124,89,0.1) 0%, transparent 50%)
            `,
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(201,168,76,0.25) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201,168,76,0.25) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="100%" x2="100%" y2="0" stroke="rgba(201,168,76,0.05)" strokeWidth="1" />
          <line x1="15%" y1="100%" x2="100%" y2="15%" stroke="rgba(201,168,76,0.03)" strokeWidth="0.5" />
          <line x1="0" y1="85%" x2="85%" y2="0" stroke="rgba(201,168,76,0.02)" strokeWidth="0.5" />
        </svg>

        <svg className="absolute inset-0 w-full h-full opacity-[0.015]" preserveAspectRatio="none">
          <ellipse cx="75%" cy="30%" rx="500" ry="400" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="1" />
          <ellipse cx="75%" cy="30%" rx="420" ry="330" fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="0.8" />
          <ellipse cx="75%" cy="30%" rx="340" ry="260" fill="none" stroke="rgba(201,168,76,0.3)" strokeWidth="0.6" />
          <ellipse cx="25%" cy="70%" rx="350" ry="280" fill="none" stroke="rgba(74,124,89,0.4)" strokeWidth="1" />
          <ellipse cx="25%" cy="70%" rx="280" ry="220" fill="none" stroke="rgba(74,124,89,0.3)" strokeWidth="0.6" />
        </svg>
      </div>

      {/* ═══ DRONE FLIGHT PATH ═══ */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1]" preserveAspectRatio="none">
        <motion.path
          d="M 5%,85% Q 25%,50% 45%,75% T 85%,20%"
          fill="none"
          stroke="rgba(201,168,76,0.15)"
          strokeWidth="1.5"
          strokeDasharray="8 6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, delay: 1.5, ease: "easeInOut" }}
        />
        {[
          { cx: "25%", cy: "50%", delay: 2 },
          { cx: "45%", cy: "75%", delay: 3 },
          { cx: "85%", cy: "20%", delay: 4 },
        ].map((point, i) => (
          <motion.circle
            key={i}
            cx={point.cx}
            cy={point.cy}
            r="3"
            fill="rgba(201,168,76,0.5)"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
            transition={{ duration: 2, delay: point.delay, repeat: Infinity, repeatDelay: 3 }}
          />
        ))}
      </svg>

      {/* ═══ FLOATING ELEMENTS ═══ */}
      <motion.div
        animate={{ y: [-20, 20, -20], rotate: [0, 8, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[25%] right-[12%] w-28 h-28 border border-gold/10 rounded-2xl rotate-12 hidden lg:block z-[1]"
      />
      <motion.div
        animate={{ y: [15, -15, 15], rotate: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[30%] left-[8%] w-20 h-20 border border-gold/8 rounded-full hidden lg:block z-[1]"
      />
      <motion.div
        animate={{ y: [-12, 12, -12], x: [-5, 5, -5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[45%] right-[6%] w-3 h-3 bg-gold/25 rounded-full hidden lg:block z-[1]"
      />
      <motion.div
        animate={{ y: [10, -10, 10] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-[60%] left-[15%] w-2 h-2 bg-gold/20 rounded-full hidden lg:block z-[1]"
      />
      <motion.div
        animate={{ rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[15%] left-[5%] w-4 h-4 border border-gold/12 rotate-45 hidden lg:block z-[1]"
      />

      {/* ═══ MAIN CONTENT ═══ */}
      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative z-10 max-w-7xl mx-auto px-6 py-24 lg:py-32 w-full"
      >
        <div className="max-w-4xl">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {/* Eyebrow badge */}
            <motion.div
              variants={fadeUpItem}
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full glass-gold"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span className="text-xs font-body font-medium text-gold tracking-wide">
                INDIA&apos;S FIRST DATA-DRIVEN LAND PLATFORM
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1 variants={fadeUpItem} className="heading-xl mb-6">
              <span className="text-cream">Invest in </span>
              <span className="text-gradient-gold">India&apos;s Finest</span>
              <br />
              <span className="text-cream/85 font-medium italic">Land &amp; Plots</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={fadeUpItem}
              className="text-lg lg:text-xl text-cream/50 max-w-2xl mb-3 font-body leading-relaxed"
            >
              Verified farmlands &amp; residential plots backed by real data — not broker promises.
            </motion.p>
            <motion.p
              variants={fadeUpItem}
              className="text-sm lg:text-base text-cream/35 max-w-xl mb-8 font-body"
            >
              <span className="text-gold/70">Soil reports</span> ·{" "}
              <span className="text-gold/70">Water analysis</span> ·{" "}
              <span className="text-gold/70">Drone surveys</span> ·{" "}
              <span className="text-gold/70">Legal clearance</span> — all verified before you invest.
            </motion.p>

            {/* Search bar */}
            <motion.div variants={fadeUpItem} className="max-w-2xl">
              <div className="flex gap-1 mb-3">
                {[
                  { key: "FARMLAND" as const, label: "Farmlands", icon: Leaf },
                  { key: "RESIDENTIAL_PLOT" as const, label: "Plots", icon: Building2 },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-2 text-sm rounded-t-lg transition-all duration-300 ${
                      activeTab === tab.key
                        ? "bg-onyx-900/80 text-gold border-t border-x border-gold/20"
                        : "text-cream/30 hover:text-cream/50"
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center glass rounded-xl p-2 group focus-within:border-gold/30 transition-all duration-300">
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
                  <AnimatePresence>
                    {showStateDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 z-50 mt-2 w-64 max-h-60 overflow-y-auto py-2 bg-onyx-900 border border-cream/10 rounded-xl shadow-2xl shadow-black/40"
                      >
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Search className="w-5 h-5 ml-3 text-cream/25 group-focus-within:text-gold/60 transition-colors hidden sm:block" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={activeTab === "FARMLAND" ? "Search by location, district..." : "Search residential plots..."}
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

              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-4">
                <div className="flex flex-wrap gap-2">
                  {quickStates.map((state) => (
                    <button
                      key={state}
                      onClick={() => handleQuickState(state)}
                      className="px-3 py-1.5 text-xs text-cream/30 border border-cream/8 rounded-full hover:border-gold/30 hover:text-gold/70 transition-all duration-300"
                    >
                      {state}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const el = document.getElementById("how-it-works");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex items-center gap-1.5 text-xs text-gold/50 hover:text-gold transition-colors ml-auto"
                >
                  <Play className="w-3 h-3" />
                  See How It Works
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* ═══ INLINE STATS ═══ */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mt-12"
        >
          <motion.div variants={fadeUpItem} className="glass-gold rounded-2xl p-6 lg:p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-gold/10">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center lg:px-6">
                  <div className="font-display text-2xl lg:text-3xl font-semibold text-gold mb-1">
                    <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </div>
                  <div className="text-[11px] text-cream/30 font-body uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 0.8 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2"
        >
          <span className="text-[10px] text-cream/15 uppercase tracking-[0.3em] font-body">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-6 bg-gradient-to-b from-gold/30 to-transparent"
          />
        </motion.div>
      </motion.div>

      {/* Tight bottom gradient fade — bridges into next section cleanly */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-onyx-950 to-transparent pointer-events-none" />
    </section>
  );
}

export { stats };
