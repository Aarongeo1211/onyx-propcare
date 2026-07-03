"use client";

import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp, Globe, Clock, Leaf, Users } from "lucide-react";

const reasons = [
  {
    icon: ShieldCheck,
    title: "100% Verified Data",
    description: "Every property undergoes rigorous on-ground verification before listing.",
  },
  {
    icon: TrendingUp,
    title: "Investment-Grade Analysis",
    description: "Detailed ROI projections, yield history, and market comparisons.",
  },
  {
    icon: Globe,
    title: "NRI-Friendly Process",
    description: "End-to-end support for overseas investors. Virtual tours & digital documentation.",
  },
  {
    icon: Clock,
    title: "Real-Time Updates",
    description: "Instant alerts on new listings, price changes, and market trends.",
  },
  {
    icon: Leaf,
    title: "Sustainable Focus",
    description: "Environmental impact assessments and sustainable farming potential ratings.",
  },
  {
    icon: Users,
    title: "Expert Network",
    description: "Access to agronomists, legal experts, and local land specialists.",
  },
];

export function WhyOnyx() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left - sticky heading */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 lg:self-start">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs font-body uppercase tracking-[0.25em] text-gold/60 mb-3 block"
            >
              Why Choose Us
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="heading-lg text-cream mb-6"
            >
              Built for <span className="italic text-gold">Serious</span> Investors
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-cream/62 text-sm font-body leading-relaxed"
            >
              Onyx Propcare isn&apos;t just another listing platform.
              We combine technology, on-ground verification, and expert
              knowledge to make land investment transparent and trustworthy.
            </motion.p>

            {/* Decorative element */}
            <div className="hidden lg:block mt-12">
              <div className="w-24 h-px bg-gradient-to-r from-gold/40 to-transparent" />
            </div>
          </div>

          {/* Right - reasons grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {reasons.map((reason, i) => (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="group p-6 rounded-xl border border-cream/5 hover:border-gold/15 bg-onyx-900/20 hover:bg-onyx-900/40 transition-all duration-500"
              >
                <reason.icon className="w-5 h-5 text-gold/50 mb-4 group-hover:text-gold transition-colors duration-300" />
                <h3 className="font-display text-lg font-semibold text-cream mb-2 group-hover:text-gold transition-colors duration-300">
                  {reason.title}
                </h3>
                <p className="text-xs text-cream/62 font-body leading-relaxed">
                  {reason.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
