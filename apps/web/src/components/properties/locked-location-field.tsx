"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Pencil } from "lucide-react";
import { parseResolvedLocation, type SearchResult } from "@/lib/location-resolve";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "http://localhost:4000/api/v1";

interface LockedLocationFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  emptyHint?: string;
}

interface DistrictSuggestion {
  district: string;
  context: string;
}

// District (and similar location fields resolved from the map/search picker
// above) used to be a plain free-text input a seller could retype over the
// autofilled value -- the reason the same real district ends up in the data
// as a dozen casing/spelling variants. Once a value is set, this renders it
// read-only with an explicit "Change" action, so the default path is
// re-resolving via the location picker rather than hand-typing.
//
// The picker can't always find a plot's exact location (common for rural
// farmland with no formal address), so there's an escape hatch: "Enter
// manually" switches to a free-text input that still queries the same
// autocomplete endpoint for live suggestions, but never blocks on picking
// one -- whatever's typed is the value, suggestions are just a shortcut.
export function LockedLocationField({ label, value, onChange, required, emptyHint }: LockedLocationFieldProps) {
  const [manualMode, setManualMode] = useState(false);
  const [suggestions, setSuggestions] = useState<DistrictSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    }
    if (suggestionsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [suggestionsOpen]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleManualInput(next: string) {
    onChange(next);
    setSuggestionsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = next.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/location/autocomplete?q=${encodeURIComponent(query)}&country=in&limit=8`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const payload = (await res.json()) as { success?: boolean; data?: SearchResult[] };
        const results = Array.isArray(payload.data) ? payload.data : [];
        const seen = new Set<string>();
        const parsed: DistrictSuggestion[] = [];
        for (const result of results) {
          const district = parseResolvedLocation(result).district.trim();
          if (!district || seen.has(district.toLowerCase())) continue;
          seen.add(district.toLowerCase());
          parsed.push({ district, context: result.display_name });
          if (parsed.length >= 5) break;
        }
        setSuggestions(parsed);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);
  }

  function selectSuggestion(suggestion: DistrictSuggestion) {
    onChange(suggestion.district);
    setSuggestions([]);
    setSuggestionsOpen(false);
  }

  function exitManualMode() {
    setManualMode(false);
    setSuggestions([]);
    setSuggestionsOpen(false);
    onChange("");
  }

  if (manualMode) {
    return (
      <div ref={containerRef} className="relative">
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className="font-body text-sm text-cream/81">
            {label} {required && "*"}
          </label>
          <button type="button" onClick={exitManualMode} className="text-xs font-medium text-gold hover:underline">
            Use location search instead
          </button>
        </div>
        <input
          value={value}
          onChange={(e) => handleManualInput(e.target.value)}
          onFocus={() => setSuggestionsOpen(true)}
          placeholder="Type your district"
          className="w-full rounded-xl border border-cream/10 bg-onyx-800/50 px-4 py-3 font-body text-sm text-cream placeholder:text-cream/79 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20"
        />
        {suggestionsOpen && (loadingSuggestions || suggestions.length > 0) && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-xl border border-cream/10 bg-onyx-900 shadow-2xl shadow-black/40">
            {loadingSuggestions ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-cream/90">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion.district}
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  className="block w-full border-b border-cream/5 px-4 py-3 text-left transition last:border-b-0 hover:bg-gold/5"
                >
                  <div className="flex items-center gap-1.5 text-sm text-cream">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" />
                    {suggestion.district}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-cream/70">{suggestion.context}</div>
                </button>
              ))
            )}
          </div>
        )}
        <p className="mt-2 text-xs text-cream/70">
          Suggestions are just a shortcut — you can type anything if your district isn&apos;t listed.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-2 block font-body text-sm text-cream/81">
        {label} {required && "*"}
      </label>
      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-cream/10 bg-onyx-800/50 px-4 py-3">
          <span className="truncate text-sm text-cream">{value}</span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gold hover:underline"
          >
            <Pencil className="h-3 w-3" />
            Change
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-cream/15 bg-onyx-800/30 px-4 py-3 text-sm text-cream/70">
          <p>{emptyHint || "Search or pick a location above to fill this in"}</p>
          <button
            type="button"
            onClick={() => setManualMode(true)}
            className="mt-1.5 text-xs font-medium text-gold hover:underline"
          >
            Can&apos;t find this location? Enter manually
          </button>
        </div>
      )}
    </div>
  );
}
