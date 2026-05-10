"use client";

import { motion } from "framer-motion";
import { Beaker, Droplets, Camera, Scale } from "lucide-react";

const insights = [
  {
    icon: Beaker,
    title: "Soil Intelligence",
    description: "pH levels, NPK composition, organic carbon, fertility grades. Know exactly what your land can grow.",
    metrics: ["pH Level", "NPK Ratio", "Organic Carbon", "Fertility Grade"],
    accent: "from-amber-500/20 to-orange-600/20",
    borderAccent: "border-amber-500/20 hover:border-amber-400/40",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    number: "01",
  },
  {
    icon: Droplets,
    title: "Water Analytics",
    description: "Water table depth, TDS levels, borewell data, rainfall patterns, and proximity to water bodies.",
    metrics: ["Water Table", "TDS Levels", "Rainfall Data", "Source Mapping"],
    accent: "from-sky-500/20 to-blue-600/20",
    borderAccent: "border-sky-500/20 hover:border-sky-400/40",
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-400",
    number: "02",
  },
  {
    icon: Camera,
    title: "Drone Surveys",
    description: "High-resolution aerial maps, boundary verification, terrain analysis, and 3D elevation models.",
    metrics: ["Aerial Maps", "Boundary Check", "Terrain View", "3D Models"],
    accent: "from-violet-500/20 to-purple-600/20",
    borderAccent: "border-violet-500/20 hover:border-violet-400/40",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    number: "03",
  },
  {
    icon: Scale,
    title: "Legal Verification",
    description: "Title clearance, encumbrance certificates, litigation checks, revenue records, and NA order verification.",
    metrics: ["Title Status", "Encumbrance", "Litigation", "Revenue Records"],
    accent: "from-emerald-500/20 to-green-600/20",
    borderAccent: "border-emerald-500/20 hover:border-emerald-400/40",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    number: "04",
  },
];

export function DataInsights() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/4 -left-40 w-80 h-80 bg-gold/[0.02] rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-earth-green/[0.03] rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-body uppercase tracking-[0.25em] text-gold/60 mb-3 block"
          >
            What Sets Us Apart
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="heading-lg text-cream mb-4"
          >
            Data You Won&apos;t Find <span className="italic text-gold">Anywhere Else</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-cream/35 max-w-xl mx-auto text-sm font-body"
          >
            Every property comes with four layers of verified data — transforming
            how you evaluate land investments in India.
          </motion.p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`group relative p-8 rounded-2xl border ${insight.borderAccent} bg-onyx-900/30 transition-all duration-500 hover:bg-onyx-900/50`}
            >
              {/* Number watermark */}
              <span className="absolute top-6 right-8 font-display text-6xl font-bold text-cream/[0.03] select-none">
                {insight.number}
              </span>

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${insight.iconBg} flex items-center justify-center mb-6`}>
                <insight.icon className={`w-6 h-6 ${insight.iconColor}`} />
              </div>

              {/* Content */}
              <h3 className="font-display text-2xl font-semibold text-cream mb-3 group-hover:text-gold transition-colors duration-300">
                {insight.title}
              </h3>
              <p className="text-sm text-cream/35 mb-6 leading-relaxed font-body">
                {insight.description}
              </p>

              {/* Metric tags */}
              <div className="flex flex-wrap gap-2">
                {insight.metrics.map((metric) => (
                  <span
                    key={metric}
                    className="px-3 py-1.5 text-xs text-cream/30 border border-cream/8 rounded-full"
                  >
                    {metric}
                  </span>
                ))}
              </div>

              {/* Hover gradient */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${insight.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
