"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

const STORAGE_KEY = "onyx-compare";
const MAX_COMPARE = 3;

interface ComparisonContextValue {
  comparedIds: string[];
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  clearComparison: () => void;
  isCompared: (id: string) => boolean;
  canAddMore: boolean;
}

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setComparedIds(parsed.slice(0, MAX_COMPARE));
        }
      }
    } catch {
      // Ignore parse errors
    }
    setMounted(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comparedIds));
    }
  }, [comparedIds, mounted]);

  const addToCompare = useCallback((id: string) => {
    setComparedIds((prev) => {
      if (prev.includes(id) || prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setComparedIds((prev) => prev.filter((pid) => pid !== id));
  }, []);

  const clearComparison = useCallback(() => {
    setComparedIds([]);
  }, []);

  const isCompared = useCallback(
    (id: string) => comparedIds.includes(id),
    [comparedIds]
  );

  const canAddMore = comparedIds.length < MAX_COMPARE;

  return (
    <ComparisonContext.Provider
      value={{
        comparedIds,
        addToCompare,
        removeFromCompare,
        clearComparison,
        isCompared,
        canAddMore,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
}
