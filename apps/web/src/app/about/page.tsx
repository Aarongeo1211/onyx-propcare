"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Droplets,
  Scale,
  Plane,
  ArrowRight,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Data",
    description:
      "Every property listing undergoes rigorous verification to ensure accuracy and authenticity of ownership records and land details.",
  },
  {
    icon: Droplets,
    title: "Soil & Water Analysis",
    description:
      "Comprehensive soil composition and water table reports help buyers assess land quality before making investment decisions.",
  },
  {
    icon: Scale,
    title: "Legal Checks",
    description:
      "Complete legal due diligence including title verification, encumbrance checks, and regulatory compliance assessments.",
  },
  {
    icon: Plane,
    title: "Drone Surveys",
    description:
      "High-resolution aerial mapping and topographic surveys give you a true picture of the land you are investing in.",
  },
];

const stats = [
  { value: "2,500+", label: "Properties Listed" },
  { value: "12+", label: "States Covered" },
  { value: "8,000+", label: "Happy Investors" },
  { value: "99.5%", label: "Verification Rate" },
];

const team = [
  { name: "Arjun Mehta", role: "Founder & CEO", initials: "AM" },
  { name: "Priya Sharma", role: "Head of Operations", initials: "PS" },
  { name: "Rohan Kapoor", role: "Chief Technology Officer", initials: "RK" },
  { name: "Sneha Patel", role: "Head of Legal & Compliance", initials: "SP" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-onyx-950">
      {/* Hero */}
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
            About Us
          </motion.span>

          <motion.h1
            className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-cream mb-6"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            About Onyx Propcare
          </motion.h1>

          <motion.p
            className="text-cream/50 font-body text-lg max-w-2xl mx-auto leading-relaxed"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            India's first data-driven land marketplace. We combine verified
            property data, advanced soil and water analytics, legal due
            diligence, and drone surveys to bring transparency and trust to
            every land transaction.
          </motion.p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div
          className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-2xl p-8 md:p-12"
          {...fadeUp}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-cream mb-4">
            Our Mission
          </h2>
          <p className="text-cream/50 font-body text-base leading-relaxed mb-4">
            Land is one of the most valuable assets in India, yet the buying
            process remains opaque and riddled with uncertainty. Onyx Propcare
            was founded with a singular mission: to make land transactions
            transparent, data-backed, and trustworthy.
          </p>
          <p className="text-cream/50 font-body text-base leading-relaxed">
            We serve everyone from first-time plot buyers to NRI investors
            seeking agricultural land, providing the verified information and
            expert analysis needed to make confident decisions. Every listing on
            our platform is backed by real data, not promises.
          </p>
        </motion.div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <motion.div
          className="text-center mb-12"
          {...fadeUp}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-3">
            Why Choose Us
          </h2>
          <p className="text-cream/40 font-body max-w-lg mx-auto">
            Four pillars that set Onyx Propcare apart from every other land
            marketplace in India.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-2xl p-6 hover:border-gold/20 transition-colors duration-300"
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-xl font-semibold text-cream mb-2">
                {feature.title}
              </h3>
              <p className="text-cream/40 font-body text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center p-6 bg-onyx-900/30 backdrop-blur-sm border border-cream/5 rounded-xl"
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <div className="font-display text-3xl md:text-4xl font-bold text-gold mb-1">
                {stat.value}
              </div>
              <div className="text-cream/40 font-body text-sm">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div
          className="text-center mb-12"
          {...fadeUp}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-3">
            Our Team
          </h2>
          <p className="text-cream/40 font-body max-w-lg mx-auto">
            A passionate team of real estate, technology, and legal experts
            building the future of land transactions in India.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-2xl p-6 text-center hover:border-gold/20 transition-colors duration-300"
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <div className="w-20 h-20 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-display text-xl font-semibold text-gold">
                  {member.initials}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-cream mb-1">
                {member.name}
              </h3>
              <p className="text-cream/40 font-body text-sm">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <motion.div
          className="bg-onyx-900/50 backdrop-blur-xl border border-gold/20 rounded-2xl p-8 md:p-12 text-center"
          {...fadeUp}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-4">
            Ready to Find Your Perfect Land?
          </h2>
          <p className="text-cream/50 font-body max-w-lg mx-auto mb-8">
            Join thousands of investors who trust Onyx Propcare for verified,
            data-backed land opportunities across India.
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
