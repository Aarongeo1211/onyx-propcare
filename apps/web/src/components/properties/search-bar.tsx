"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { INDIAN_STATES } from "@onyx/types";

interface SearchBarProps {
  initialSearch?: string;
  initialState?: string;
  onSearch?: (search: string, state: string) => void;
  variant?: "hero" | "page";
  className?: string;
}

// Districts mapped by state for autocomplete
const STATE_DISTRICTS: Record<string, string[]> = {
  Maharashtra: ["Pune", "Mumbai", "Nashik", "Nagpur", "Satara", "Kolhapur", "Sangli", "Ratnagiri", "Amravati", "Aurangabad"],
  Karnataka: ["Bangalore Rural", "Mysuru", "Mangalore", "Hubli", "Belgaum", "Tumkur", "Hassan", "Shimoga", "Dharwad"],
  Gujarat: ["Ahmedabad", "Surat", "Rajkot", "Vadodara", "Kutch", "Junagadh", "Mehsana", "Anand", "Bhavnagar"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Erode", "Tirunelveli", "Vellore", "Thanjavur"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar", "Sikar", "Bharatpur"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Agra", "Varanasi", "Kanpur", "Meerut", "Prayagraj", "Bareilly"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Satna"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kannur", "Palakkad", "Malappuram"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Medak", "Rangareddy"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Kakinada"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali"],
  Haryana: ["Gurugram", "Faridabad", "Karnal", "Panipat", "Hisar", "Rohtak", "Ambala"],
};

export function SearchBar({
  initialSearch = "",
  initialState = "",
  onSearch,
  variant = "page",
  className = "",
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialSearch);
  const [selectedState, setSelectedState] = useState(initialState);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{ type: "state" | "district"; value: string; parent?: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateSuggestions = useCallback((value: string) => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    const lower = value.toLowerCase();
    const results: { type: "state" | "district"; value: string; parent?: string }[] = [];

    // Match states
    for (const state of INDIAN_STATES) {
      if (state.toLowerCase().includes(lower)) {
        results.push({ type: "state", value: state });
      }
    }

    // Match districts
    for (const [state, districts] of Object.entries(STATE_DISTRICTS)) {
      for (const district of districts) {
        if (district.toLowerCase().includes(lower)) {
          results.push({ type: "district", value: district, parent: state });
        }
      }
    }

    setSuggestions(results.slice(0, 8));
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    updateSuggestions(value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: { type: "state" | "district"; value: string; parent?: string }) => {
    if (suggestion.type === "state") {
      setSelectedState(suggestion.value);
      setQuery("");
    } else {
      setQuery(suggestion.value);
      if (suggestion.parent) setSelectedState(suggestion.parent);
    }
    setShowSuggestions(false);
    handleSubmit(
      suggestion.type === "district" ? suggestion.value : "",
      suggestion.type === "state" ? suggestion.value : suggestion.parent || selectedState
    );
  };

  const handleSubmit = (searchOverride?: string, stateOverride?: string) => {
    const s = searchOverride ?? query;
    const st = stateOverride ?? selectedState;

    if (onSearch) {
      onSearch(s, st);
      return;
    }

    const params = new URLSearchParams();
    if (s) params.set("search", s);
    if (st) params.set("state", st);
    router.push(`/properties${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setShowSuggestions(false);
      handleSubmit();
    }
  };

  const clearState = () => {
    setSelectedState("");
    inputRef.current?.focus();
  };

  const isHero = variant === "hero";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`relative flex items-center rounded-xl transition-all duration-300 ${
          isHero
            ? "glass p-2 group focus-within:border-gold/30"
            : "bg-onyx-900/60 border border-cream/10 p-1.5 focus-within:border-gold/40 focus-within:ring-2 focus-within:ring-gold/20"
        }`}
      >
        <Search className={`w-5 h-5 ml-3 text-cream/25 transition-colors ${isHero ? "group-focus-within:text-gold/60" : ""}`} />

        {/* Selected state pill */}
        {selectedState && (
          <div className="flex items-center gap-1 ml-2 px-2.5 py-1 bg-gold/10 border border-gold/20 rounded-lg text-xs text-gold">
            <MapPin className="w-3 h-3" />
            {selectedState}
            <button onClick={clearState} className="ml-0.5 hover:text-gold-light">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => query && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search by location, state, or district..."
          className={`flex-1 bg-transparent px-4 text-sm text-cream placeholder:text-cream/25 focus:outline-none font-body ${
            isHero ? "py-3" : "py-2.5"
          }`}
        />

        <button
          onClick={() => {
            setShowSuggestions(false);
            handleSubmit();
          }}
          className={`flex items-center gap-2 px-6 bg-gradient-gold text-onyx-950 font-medium text-sm rounded-lg hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 ${
            isHero ? "py-3" : "py-2.5"
          }`}
        >
          Search
        </button>
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 right-0 mt-2 py-2 bg-onyx-900 border border-cream/10 rounded-xl shadow-2xl shadow-black/40 backdrop-blur-xl overflow-hidden"
          >
            {suggestions.map((suggestion, i) => (
              <button
                key={`${suggestion.type}-${suggestion.value}-${i}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-cream/5 transition-colors"
              >
                <MapPin className="w-4 h-4 text-cream/30 flex-shrink-0" />
                <div>
                  <span className="text-cream">{suggestion.value}</span>
                  {suggestion.type === "district" && suggestion.parent && (
                    <span className="text-cream/30 ml-1.5 text-xs">{suggestion.parent}</span>
                  )}
                  {suggestion.type === "state" && (
                    <span className="text-gold/50 ml-1.5 text-xs">State</span>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
