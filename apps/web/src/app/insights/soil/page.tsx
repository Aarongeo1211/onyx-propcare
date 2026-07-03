"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Leaf,
  FlaskConical,
  TrendingUp,
  Mountain,
  Droplets,
  Sun,
  Layers,
  Gauge,
  Wheat,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const soilTypes = [
  {
    icon: Layers,
    name: "Black / Regur Soil",
    description:
      "Found in the Deccan Plateau, this moisture-retentive soil is ideal for cotton, sugarcane, and soybean cultivation. High clay content gives it excellent water-holding capacity.",
  },
  {
    icon: Droplets,
    name: "Alluvial Soil",
    description:
      "Deposited by rivers across the Indo-Gangetic plains, alluvial soil is the most fertile and widely distributed. Ideal for rice, wheat, and vegetables.",
  },
  {
    icon: Sun,
    name: "Red Soil",
    description:
      "Rich in iron and found across Tamil Nadu, Karnataka, and Odisha. Well-suited for groundnut, millet, and tobacco with proper irrigation and nutrient management.",
  },
  {
    icon: Leaf,
    name: "Laterite Soil",
    description:
      "Formed in high-rainfall regions of Kerala and Assam. Acidic in nature and low in fertility but suitable for tea, coffee, and cashew with adequate treatment.",
  },
  {
    icon: Mountain,
    name: "Desert Soil",
    description:
      "Sandy and low in organic matter, found in Rajasthan and Gujarat. Can become productive with irrigation. Suitable for drought-resistant crops like bajra and pulses.",
  },
  {
    icon: Wheat,
    name: "Mountain Soil",
    description:
      "Found in the Himalayan region and Western Ghats. Rich in humus at higher altitudes and supports fruit orchards, tea plantations, and spice cultivation.",
  },
];

const parameters = [
  {
    icon: FlaskConical,
    name: "pH Level",
    description:
      "Measures soil acidity or alkalinity on a scale of 0 to 14. Most crops thrive between pH 6.0 and 7.5. Extreme pH levels can lock out essential nutrients.",
  },
  {
    icon: Leaf,
    name: "NPK Ratio",
    description:
      "Nitrogen, Phosphorus, and Potassium are the three primary macronutrients. Their ratio determines what the soil can support and how much amendment it needs.",
  },
  {
    icon: Gauge,
    name: "Organic Carbon",
    description:
      "Indicates the amount of decomposed organic matter. Higher organic carbon means better soil structure, water retention, and microbial activity for sustained fertility.",
  },
  {
    icon: Layers,
    name: "Soil Texture",
    description:
      "The ratio of sand, silt, and clay particles. Texture affects drainage, aeration, and root penetration. Loamy textures are generally the most desirable for agriculture.",
  },
  {
    icon: TrendingUp,
    name: "Fertility Rating",
    description:
      "An overall score combining nutrient content, organic matter, and biological health. Our reports classify soil as Low, Medium, or High fertility for quick assessment.",
  },
];

export default function SoilInsightsPage() {
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
            Soil Analysis Insights
          </motion.h1>
          <motion.p
            className="text-cream/78 font-body text-lg max-w-2xl mx-auto leading-relaxed"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Soil is the foundation of every land investment. Understanding its
            composition, fertility, and suitability helps buyers make informed
            decisions and avoid costly surprises after purchase.
          </motion.p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <motion.div className="text-center mb-12" {...fadeUp} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-3">
            Types of Soil in India
          </h2>
          <p className="text-cream/86 font-body max-w-lg mx-auto">
            India has diverse soil types, each with unique characteristics that
            determine agricultural potential and land value.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {soilTypes.map((soil, i) => (
            <motion.div
              key={soil.name}
              className="bg-onyx-900/40 backdrop-blur-xl border border-cream/8 rounded-2xl p-6 hover:border-gold/20 transition-colors duration-300"
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center mb-5">
                <soil.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-xl font-semibold text-cream mb-2">{soil.name}</h3>
              <p className="text-cream/86 font-body text-sm leading-relaxed">{soil.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div className="text-center mb-12" {...fadeUp} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-3">
            Key Soil Parameters We Test
          </h2>
          <p className="text-cream/86 font-body max-w-lg mx-auto">
            Every property on Onyx Propcare includes a detailed soil report
            covering these critical metrics.
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
                  <p className="text-cream/86 font-body text-sm leading-relaxed">{param.description}</p>
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
            How Soil Quality Affects Land Value
          </h2>
          <p className="text-cream/78 font-body text-base leading-relaxed mb-4">
            Fertile land with balanced nutrients and good texture commands
            premium prices in the agricultural market. Buyers evaluating land for
            farming, plantation, or even future development need to understand
            what lies beneath the surface.
          </p>
          <p className="text-cream/78 font-body text-base leading-relaxed">
            Poor soil can reduce crop yield by up to 60%, increase input costs
            through excessive fertilizer use, and limit the range of viable crops.
            Our soil analysis reports help buyers quantify these risks before
            committing capital, ensuring every investment is backed by science.
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
            Explore Properties with Soil Data
          </h2>
          <p className="text-cream/78 font-body max-w-lg mx-auto mb-8">
            Browse verified listings that include comprehensive soil analysis
            reports so you can invest with confidence.
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
