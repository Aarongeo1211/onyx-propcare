"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, X } from "lucide-react";
import { Button } from "@onyx/ui";
import { useComparison } from "./comparison-provider";
import { apiFetch } from "@/lib/utils";

interface MiniProperty {
  id: string;
  title: string;
  images: { url: string }[];
}

export function ComparisonBar() {
  const { comparedIds, removeFromCompare, clearComparison } = useComparison();
  const [properties, setProperties] = useState<MiniProperty[]>([]);

  useEffect(() => {
    if (comparedIds.length === 0) {
      setProperties([]);
      return;
    }

    async function fetchMini() {
      try {
        const res = await apiFetch<{ success: boolean; data: MiniProperty[] }>(
          `/properties/compare?ids=${comparedIds.join(",")}`
        );
        if (res.success) {
          setProperties(res.data);
        }
      } catch {
        // Silently fail — bar still shows count
      }
    }
    fetchMini();
  }, [comparedIds]);

  const compareUrl = `/properties/compare?ids=${comparedIds.join(",")}`;

  return (
    <AnimatePresence>
      {comparedIds.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-onyx-900/90 backdrop-blur-xl border-t border-cream/10 shadow-2xl shadow-black/40"
        >
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center gap-4">
              {/* Count indicator */}
              <div className="flex items-center gap-2 text-cream">
                <Scale className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium">
                  {comparedIds.length} {comparedIds.length === 1 ? "property" : "properties"} selected
                </span>
              </div>

              {/* Mini property previews */}
              <div className="hidden sm:flex items-center gap-2 flex-1 min-w-0">
                {properties.map((prop) => (
                  <div
                    key={prop.id}
                    className="flex items-center gap-2 bg-onyx-800/60 rounded-lg px-3 py-1.5 border border-cream/5 max-w-[200px]"
                  >
                    {prop.images?.[0]?.url && (
                      <img
                        src={prop.images[0].url}
                        alt=""
                        className="w-6 h-6 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <span className="text-xs text-cream/81 truncate">{prop.title}</span>
                    <button
                      onClick={() => removeFromCompare(prop.id)}
                      className="text-cream/82 hover:text-cream/81 flex-shrink-0 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={clearComparison}
                  className="text-xs text-cream/82 hover:text-cream/81 transition-colors px-2 py-1"
                >
                  Clear All
                </button>
                <Link href={compareUrl}>
                  <Button size="sm">
                    Compare Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
