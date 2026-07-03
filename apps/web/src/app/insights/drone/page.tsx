"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Plane,
  MapPin,
  Mountain,
  TreePine,
  Ruler,
  Eye,
  Layers,
  Compass,
  ScanLine,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const surveyFeatures = [
  {
    icon: MapPin,
    name: "Boundary Mapping",
    description:
      "GPS-precise aerial mapping of property boundaries overlaid on high-resolution imagery. Confirms actual plot dimensions and identifies any encroachments or boundary discrepancies.",
  },
  {
    icon: Mountain,
    name: "Topographic Analysis",
    description:
      "Detailed elevation models showing slopes, contours, and drainage patterns. Essential for understanding flood risk, irrigation planning, and construction feasibility.",
  },
  {
    icon: TreePine,
    name: "Vegetation Analysis",
    description:
      "Multispectral imaging to assess crop health, tree density, and land cover. Identifies productive zones, barren patches, and areas affected by waterlogging or erosion.",
  },
];

const benefits = [
  {
    icon: Ruler,
    name: "Accurate Area Measurement",
    description:
      "Drone surveys measure land area with centimeter-level precision, often revealing discrepancies between official records and actual ground reality that manual surveys miss.",
  },
  {
    icon: Eye,
    name: "Land Use Verification",
    description:
      "Aerial imagery confirms how the land is actually being used, whether it matches official records, and whether neighboring activities pose any risk to the property.",
  },
  {
    icon: ScanLine,
    name: "Infrastructure Assessment",
    description:
      "Identifies existing structures, access roads, fencing, wells, and utility connections on the property. Helps buyers understand what is already in place before visiting.",
  },
  {
    icon: Layers,
    name: "3D Terrain Models",
    description:
      "Photogrammetry-based 3D models allow buyers to virtually explore the terrain, assess slope gradients, and plan construction or farm layout before making a purchase decision.",
  },
  {
    icon: Compass,
    name: "Orientation and Access",
    description:
      "Maps the property's orientation relative to roads, water bodies, and neighboring plots. Identifies access points and potential right-of-way issues that ground visits may overlook.",
  },
  {
    icon: Plane,
    name: "Time-Stamped Evidence",
    description:
      "Every drone survey is date-stamped and geo-tagged, creating a verifiable record of the property's condition at the time of listing. Useful for legal and insurance purposes.",
  },
];

const mapGuide = [
  {
    title: "Orthomosaic Map",
    description:
      "A stitched aerial photograph corrected for distortion. It shows the property as if viewed directly from above with accurate scale, allowing you to measure distances and areas directly on the image.",
  },
  {
    title: "Digital Elevation Model",
    description:
      "A color-coded height map where each pixel represents ground elevation. Blue indicates low-lying areas, green represents mid-range elevations, and red or brown marks high points and ridges.",
  },
  {
    title: "NDVI Vegetation Map",
    description:
      "A Normalized Difference Vegetation Index map that uses infrared imaging to show plant health. Deep green areas indicate healthy vegetation, yellow suggests stress, and red marks barren or dead zones.",
  },
];

export default function DroneInsightsPage() {
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
            Drone Survey Insights
          </motion.h1>
          <motion.p
            className="text-cream/50 font-body text-lg max-w-2xl mx-auto leading-relaxed"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Aerial drone surveys provide an unbiased, high-resolution view of
            any property. From precise boundary mapping to vegetation health
            analysis, drone data eliminates guesswork from land investment.
          </motion.p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div className="text-center mb-12" {...fadeUp} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-3">
            What Our Drone Surveys Cover
          </h2>
          <p className="text-cream/68 font-body max-w-lg mx-auto">
            Three core capabilities that give buyers a complete aerial
            perspective of the property.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {surveyFeatures.map((feature, i) => (
            <motion.div
              key={feature.name}
              className="bg-onyx-900/40 backdrop-blur-xl border border-cream/8 rounded-2xl p-6 hover:border-gold/20 transition-colors duration-300"
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-xl font-semibold text-cream mb-2">{feature.name}</h3>
              <p className="text-cream/68 font-body text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <motion.div className="text-center mb-12" {...fadeUp} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-3">
            Benefits of Drone Data
          </h2>
          <p className="text-cream/68 font-body max-w-lg mx-auto">
            Why aerial survey data is becoming essential for informed land
            investment decisions in India.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.name}
              className="bg-onyx-900/40 backdrop-blur-xl border border-cream/8 rounded-2xl p-6 hover:border-gold/20 transition-colors duration-300"
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center mb-5">
                <benefit.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-xl font-semibold text-cream mb-2">{benefit.name}</h3>
              <p className="text-cream/68 font-body text-sm leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div className="text-center mb-12" {...fadeUp} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-3">
            How to Read a Drone Map
          </h2>
          <p className="text-cream/68 font-body max-w-lg mx-auto">
            Understanding the three primary map types included in our drone
            survey reports.
          </p>
        </motion.div>
        <div className="space-y-6">
          {mapGuide.map((guide, i) => (
            <motion.div
              key={guide.title}
              className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-2xl p-8"
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <h3 className="font-display text-xl font-semibold text-gold mb-3">{guide.title}</h3>
              <p className="text-cream/50 font-body text-base leading-relaxed">{guide.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24">
        <motion.div
          className="bg-onyx-900/50 backdrop-blur-xl border border-gold/20 rounded-2xl p-8 md:p-12 text-center"
          {...fadeUp}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-4">
            Explore Properties with Drone Data
          </h2>
          <p className="text-cream/50 font-body max-w-lg mx-auto mb-8">
            Browse listings that include high-resolution aerial surveys, 3D
            terrain models, and vegetation health maps.
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
