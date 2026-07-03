"use client";

import { motion } from "framer-motion";
import { Beaker, Droplets, Camera, Scale, ArrowRight } from "lucide-react";

const insights = [
  {
    icon: Beaker,
    title: "Soil Intelligence",
    description:
      "pH levels, NPK composition, organic carbon, fertility grades. Know exactly what your land can grow.",
    metrics: [
      { label: "pH Level", value: "6.2–7.8" },
      { label: "NPK Ratio", value: "Analyzed" },
      { label: "Organic Carbon", value: "Measured" },
      { label: "Fertility Grade", value: "A–D Scale" },
    ],
    accentBar: "bg-amber-500",
    accentGlow: "bg-amber-500/5",
    accentBorder: "border-amber-500/20",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
    number: "01",
  },
  {
    icon: Droplets,
    title: "Water Analytics",
    description:
      "Water table depth, TDS levels, borewell data, rainfall patterns, and proximity to water bodies.",
    metrics: [
      { label: "Water Table", value: "Depth (m)" },
      { label: "TDS Levels", value: "PPM" },
      { label: "Rainfall Data", value: "10yr Avg" },
      { label: "Source Mapping", value: "Verified" },
    ],
    accentBar: "bg-sky-500",
    accentGlow: "bg-sky-500/5",
    accentBorder: "border-sky-500/20",
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/10",
    number: "02",
  },
  {
    icon: Camera,
    title: "Drone Surveys",
    description:
      "High-resolution aerial maps, boundary verification, terrain analysis, and 3D elevation models.",
    metrics: [
      { label: "Aerial Maps", value: "HD Quality" },
      { label: "Boundary Check", value: "Verified" },
      { label: "Terrain View", value: "3D Model" },
      { label: "Area Calc", value: "Precise" },
    ],
    accentBar: "bg-violet-500",
    accentGlow: "bg-violet-500/5",
    accentBorder: "border-violet-500/20",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10",
    number: "03",
  },
  {
    icon: Scale,
    title: "Legal Verification",
    description:
      "Title clearance, encumbrance certificates, litigation checks, revenue records, and NA order verification.",
    metrics: [
      { label: "Title Status", value: "Clear" },
      { label: "Encumbrance", value: "Nil" },
      { label: "Litigation", value: "Checked" },
      { label: "Revenue Records", value: "Verified" },
    ],
    accentBar: "bg-emerald-500",
    accentGlow: "bg-emerald-500/5",
    accentBorder: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    number: "04",
  },
];

export function DataInsights() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-gold/[0.03] rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-40 w-[400px] h-[400px] bg-earth-green/[0.03] rounded-full blur-[100px]" />

      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(30,71,147,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,71,147,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px",
        }}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* ── Section header ── */}
        <div className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-gold/15 bg-gold/[0.04] text-xs font-body uppercase tracking-[0.2em] text-gold/70"
          >
            What Sets Us Apart
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="heading-lg text-cream mb-5"
          >
            Data You Won&apos;t Find{" "}
            <span className="italic text-gold">Anywhere Else</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-cream/72 max-w-2xl mx-auto text-base lg:text-lg font-body leading-relaxed"
          >
            Every property comes with four layers of verified data — transforming
            how you evaluate land investments in India.
          </motion.p>
        </div>

        {/* ── Cards grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              className="group relative"
            >
              {/* Card */}
              <div
                className={`relative overflow-hidden rounded-2xl border ${insight.accentBorder} bg-onyx-900/40 backdrop-blur-sm transition-all duration-500 hover:border-gold/20 hover:bg-onyx-900/60 hover:shadow-lg hover:shadow-black/20`}
              >
                {/* Accent bar at top */}
                <div className={`h-1 w-full ${insight.accentBar} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="p-8 lg:p-10">
                  {/* Header row: number + icon + title */}
                  <div className="flex items-start gap-5 mb-6">
                    {/* Icon with number overlay */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-14 h-14 rounded-2xl ${insight.iconBg} flex items-center justify-center ring-1 ring-white/5`}
                      >
                        <insight.icon className={`w-7 h-7 ${insight.iconColor}`} />
                      </div>
                      <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-onyx-950 border border-cream/10 flex items-center justify-center text-[10px] font-mono font-medium text-cream/50">
                        {insight.number}
                      </span>
                    </div>

                    {/* Title + description */}
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl lg:text-3xl font-semibold text-cream/90 mb-2 group-hover:text-gold transition-colors duration-300">
                        {insight.title}
                      </h3>
                      <p className="text-sm lg:text-base text-cream/72 leading-relaxed font-body">
                        {insight.description}
                      </p>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-cream/[0.06] to-transparent mb-6" />

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {insight.metrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="flex flex-col gap-0.5 px-4 py-3 rounded-xl bg-cream/[0.02] border border-cream/[0.04] hover:bg-cream/[0.04] transition-colors duration-300"
                      >
                        <span className="text-[11px] text-cream/62 font-body uppercase tracking-wider">
                          {metric.label}
                        </span>
                        <span className={`text-sm font-mono font-medium ${insight.iconColor}`}>
                          {metric.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Corner glow on hover */}
                <div
                  className={`absolute -bottom-20 -right-20 w-60 h-60 ${insight.accentGlow} rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
