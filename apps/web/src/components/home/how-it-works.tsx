"use client";

import { motion } from "framer-motion";
import { Search, FileCheck, Map, Handshake } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Discover",
    description: "Browse verified farmlands and plots across 28 states. Filter by soil, water, price, and location.",
  },
  {
    icon: FileCheck,
    title: "Analyze",
    description: "Access soil reports, water data, drone maps, and legal checks. Every data point verified on-ground.",
  },
  {
    icon: Map,
    title: "Visit",
    description: "Schedule site visits with our local partners. Get guided tours with field experts.",
  },
  {
    icon: Handshake,
    title: "Acquire",
    description: "Complete documentation with our legal team. Secure, transparent, and hassle-free transactions.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 lg:py-32 noise-overlay">
      {/* Accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gold/[0.02] rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-body uppercase tracking-[0.25em] text-gold/60 mb-3 block"
          >
            Simple Process
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="heading-lg text-cream"
          >
            Four Steps to Your <span className="italic text-gold">Next Investment</span>
          </motion.h2>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative text-center group"
              >
                {/* Step number */}
                <div className="relative z-10 mx-auto mb-6">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-onyx-900/80 border border-gold/15 flex items-center justify-center group-hover:border-gold/40 group-hover:bg-gold/5 transition-all duration-500 rotate-45">
                    <step.icon className="w-8 h-8 text-gold/70 -rotate-45 group-hover:text-gold transition-colors duration-300" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-onyx-950 border border-gold/30 flex items-center justify-center text-xs font-mono text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="font-display text-xl font-semibold text-cream mb-2 group-hover:text-gold transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-sm text-cream/62 font-body leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
