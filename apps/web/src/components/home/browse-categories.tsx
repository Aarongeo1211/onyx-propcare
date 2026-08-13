"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Leaf, Building2, Sprout, Trees, TreePalm, ArrowRight } from "lucide-react";

const categories = [
  {
    type: "FARMLAND",
    label: "Farmland",
    icon: Leaf,
    blurb: "Soil, water & title-checked agricultural farms.",
  },
  {
    type: "RESIDENTIAL_PLOT",
    label: "Residential Plots",
    icon: Building2,
    blurb: "Investor-grade plotted land in growth corridors.",
  },
  {
    type: "AGRICULTURAL_LAND",
    label: "Agricultural Land",
    icon: Sprout,
    blurb: "Cultivable parcels with verified land records.",
  },
  {
    type: "ORCHARD",
    label: "Orchards",
    icon: Trees,
    blurb: "Yield-ready orchards with crop history.",
  },
  {
    type: "PLANTATION",
    label: "Plantations",
    icon: TreePalm,
    blurb: "Managed plantation estates across regions.",
  },
];

export function BrowseCategories({ availableTypes }: { availableTypes?: string[] }) {
  const visibleCategories =
    availableTypes && availableTypes.length > 0
      ? categories.filter((c) => availableTypes.includes(c.type))
      : categories;

  return (
    <section className="relative mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold">
            Browse by category
          </span>
          <h2 className="heading-md mt-2 text-cream">What are you looking for?</h2>
        </div>
        <Link
          href="/properties"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gold transition-colors hover:text-gold-dark"
        >
          View all listings
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {visibleCategories.map((category, index) => (
          <motion.div
            key={category.type}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
          >
            <Link
              href={`/properties?type=${category.type}`}
              className="group flex h-full flex-col rounded-2xl border border-gold/15 bg-onyx-900/60 p-5 shadow-md shadow-gold/5 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/10"
            >
              <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold transition-colors group-hover:bg-gold group-hover:text-white">
                <category.icon className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-semibold text-cream group-hover:text-gold">
                {category.label}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-cream/90">{category.blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-gold/0 transition-all group-hover:text-gold">
                Explore <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
