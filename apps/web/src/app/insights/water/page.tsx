"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Droplets,
  Waves,
  CloudRain,
  Gauge,
  TrendingUp,
  Pipette,
  ArrowDownToLine,
  ShieldCheck,
  Landmark,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const waterSources = [
  {
    icon: ArrowDownToLine,
    name: "Borewell",
    description:
      "Deep tube wells drilled into underground aquifers. Borewell depth and yield are key indicators of long-term water security for agricultural and domestic use.",
  },
  {
    icon: Landmark,
    name: "Canal Irrigation",
    description:
      "Government-managed canal networks fed by dams and reservoirs. Canal-irrigated land is highly valued due to consistent and low-cost water supply during growing seasons.",
  },
  {
    icon: Waves,
    name: "River Proximity",
    description:
      "Land near perennial rivers benefits from natural water access and fertile floodplain soil. Proximity to rivers also enables lift irrigation and fisheries potential.",
  },
  {
    icon: CloudRain,
    name: "Rainfall Dependency",
    description:
      "Rainfed agriculture depends entirely on monsoon patterns. Understanding annual rainfall averages and distribution is critical for assessing risk on non-irrigated plots.",
  },
];

const parameters = [
  {
    icon: Gauge,
    name: "Water Table Depth",
    description:
      "The depth at which groundwater is found below the surface. Shallower water tables reduce drilling costs and indicate better aquifer recharge. Depths beyond 200 feet signal potential water stress.",
  },
  {
    icon: Pipette,
    name: "TDS Level",
    description:
      "Total Dissolved Solids measure mineral concentration in water. TDS below 500 ppm is ideal for irrigation and drinking. High TDS indicates salinity that can damage crops and soil structure over time.",
  },
  {
    icon: ShieldCheck,
    name: "Water Quality Grade",
    description:
      "An overall classification based on chemical and biological testing. Our reports grade water as Excellent, Good, Moderate, or Poor, covering pH, hardness, nitrate levels, and bacterial contamination.",
  },
  {
    icon: Droplets,
    name: "Seasonal Availability",
    description:
      "Water availability can fluctuate dramatically between monsoon and dry seasons. Our reports track seasonal variation to give buyers a realistic picture of year-round water security.",
  },
  {
    icon: TrendingUp,
    name: "Aquifer Recharge Rate",
    description:
      "How quickly underground water sources replenish after extraction. Areas with high recharge rates offer sustainable long-term water access, reducing dependency on external supply.",
  },
];

export default function WaterInsightsPage() {
  return (
    <div className="min-h-screen bg-onyx-950">
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold/5 rounded-full blur-[120px]" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        </div>
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-gold text-xs font-body uppercase tracking-wider mb-6"
            {...fadeUp}
            transition={{ duration: 0.6 }}
          >
            Insights
          </motion.span>
          <motion.h1
            className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-cream mb-6"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Water Analysis Insights
          </motion.h1>
          <motion.p
            className="text-cream/50 font-body text-lg max-w-2xl mx-auto leading-relaxed"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Water availability is the single most important factor in
            agricultural land value. Our detailed water analysis reports help
            buyers understand supply, quality, and long-term sustainability
            before investing.
          </motion.p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <motion.div className="text-center mb-12" {...fadeUp} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-3">
            Water Sources
          </h2>
          <p className="text-cream/40 font-body max-w-lg mx-auto">
            Different water sources carry different levels of reliability, cost,
            and investment implications for land buyers.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {waterSources.map((source, i) => (
            <motion.div
              key={source.name}
              className="bg-onyx-900/40 backdrop-blur-xl border border-cream/8 rounded-2xl p-6 hover:border-gold/20 transition-colors duration-300"
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center shrink-0">
                  <source.icon className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-cream mb-2">{source.name}</h3>
                  <p className="text-cream/40 font-body text-sm leading-relaxed">{source.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div className="text-center mb-12" {...fadeUp} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-3">
            Key Water Parameters
          </h2>
          <p className="text-cream/40 font-body max-w-lg mx-auto">
            Our water reports measure these critical factors to give you a
            complete picture of water security for any property.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {parameters.map((param, i) => (
            <motion.div
              key={param.name}
              className="bg-onyx-900/40 backdrop-blur-xl border border-cream/8 rounded-2xl p-6 hover:border-gold/20 transition-colors duration-300"
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-center shrink-0">
                  <param.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-cream mb-1">{param.name}</h3>
                  <p className="text-cream/40 font-body text-sm leading-relaxed">{param.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div
          className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-2xl p-8 md:p-12"
          {...fadeUp}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-cream mb-4">
            How Water Availability Affects Land Value
          </h2>
          <p className="text-cream/50 font-body text-base leading-relaxed mb-4">
            Land with assured water supply can be worth two to five times more
            than similar plots without irrigation access. Canal-irrigated parcels
            in states like Punjab and Maharashtra consistently command top
            valuations in the agricultural land market.
          </p>
          <p className="text-cream/50 font-body text-base leading-relaxed">
            Conversely, falling water tables and poor water quality are leading
            causes of land value depreciation in semi-arid regions. Our water
            analysis reports quantify these risks with real data, helping buyers
            protect their capital and plan for sustainable use.
          </p>
        </motion.div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24">
        <motion.div
          className="bg-onyx-900/50 backdrop-blur-xl border border-gold/20 rounded-2xl p-8 md:p-12 text-center"
          {...fadeUp}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-4">
            Explore Properties with Water Data
          </h2>
          <p className="text-cream/50 font-body max-w-lg mx-auto mb-8">
            Find verified listings with detailed water analysis reports covering
            source, quality, and seasonal availability.
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gold to-gold-light text-onyx-950 font-body font-medium text-sm rounded-xl hover:shadow-lg hover:shadow-gold/20 hover:-translate-y-0.5 transition-all duration-300"
          >
            Explore Properties
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
