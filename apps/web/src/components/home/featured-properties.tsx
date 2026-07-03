"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { useApiQuery } from "@/lib/hooks";

interface FeaturedResponse {
  success: boolean;
  data: PropertyCardData[];
}

interface FeaturedPropertiesProps {
  initialProperties?: PropertyCardData[];
}

export function FeaturedProperties({ initialProperties }: FeaturedPropertiesProps) {
  const shouldFetch = !initialProperties;
  const { data: response, isLoading } = useApiQuery<FeaturedResponse>(
    ["properties", "featured"],
    "/properties/featured",
    { auth: false, enabled: shouldFetch }
  );
  const properties = initialProperties || response?.data || [];
  const loading = shouldFetch && isLoading;

  return (
    <section id="featured-properties" className="relative grain pb-24 pt-16 lg:pb-32 lg:pt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-xs font-body uppercase tracking-[0.25em] text-gold/60 mb-3 block">
              Live Inventory
            </span>
            <h2 className="heading-lg text-cream">
              Featured <span className="italic text-gold">Properties</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 text-sm text-cream/78 hover:text-gold transition-colors duration-300 group"
            >
              View all properties
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-cream/8 bg-onyx-900/50 overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-onyx-800/50" />
                <div className="p-4 space-y-3">
                  <div className="h-5 rounded bg-onyx-800/50 w-3/4" />
                  <div className="h-4 rounded bg-onyx-800/50 w-1/2" />
                  <div className="h-4 rounded bg-onyx-800/50 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {properties.slice(0, 4).map((property, index) => (
              <PropertyCard key={property.id} property={property} index={index} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-cream/8 bg-onyx-900/40 p-10 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-gold/60 mb-2">No featured properties yet</p>
            <h3 className="font-display text-3xl text-cream mb-3">Inventory will appear here as soon as listings are approved.</h3>
            <p className="text-cream/90 max-w-2xl mx-auto">
              Publish your first premium listing or return later once the marketplace inventory is seeded.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
