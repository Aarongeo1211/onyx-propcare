"use client";

import Link from "next/link";
import Image from "next/image";
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
            About Onyx Prop Care
          </motion.h1>

          <motion.p
            className="text-cream/50 font-body text-lg max-w-2xl mx-auto leading-relaxed"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Onyx Prop Care is a dedicated platform built exclusively for land,
            plots, and farmlands. Unlike conventional real estate portals that
            cater to every type of property, we specialize in one asset
            class—land—allowing us to offer unmatched expertise, curated
            opportunities, and a seamless experience for buyers, sellers, and
            investors.
          </motion.p>

          <motion.p
            className="text-cream/40 font-body text-base max-w-2xl mx-auto leading-relaxed mt-4"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            We believe that every land transaction should be built on trust,
            transparency, and authenticity. Whether you&apos;re looking to invest
            in a residential plot, acquire agricultural land, or sell your
            property to the right audience, Onyx Prop Care is your trusted
            partner in making informed and confident land decisions.
          </motion.p>

          <motion.p
            className="text-gold font-display text-xl md:text-2xl font-semibold max-w-2xl mx-auto mt-8 italic"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            &ldquo;Best investment on earth is earth itself.&rdquo;
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
          <p className="text-cream/50 font-body text-base leading-relaxed mb-6">
            To deliver verified opportunities, professional service, and
            complete transparency in every land, plot, and farmland transaction
            while creating lasting value for customers, investors, and
            communities.
          </p>

          <h2 className="font-display text-2xl md:text-3xl font-semibold text-cream mb-4">
            Our Vision
          </h2>
          <p className="text-cream/50 font-body text-base leading-relaxed">
            To redefine the future of land transactions by building the most
            credible ecosystem dedicated exclusively to land. At Onyx Prop
            Care, we don&apos;t just list land—we unlock its true potential.
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
            The people behind Onyx Prop Care
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-8">
          {[
            { name: "Thanush", role: "Founder & Director", image: "/team/thanush.jpg" },
            { name: "Aaron George Abraham", role: "Senior Lead Developer", image: "/team/aaron.jpg" },
            { name: "Nayana R", role: "CSO", image: "/team/nayana.jpg" },
            { name: "Annie Dhanraj", role: "CFO", image: "/team/annie.jpg" },
            { name: "Shahid Pasha", role: "COO", image: "/team/shahid.jpg" },
          ].map((member, i) => (
            <motion.div
              key={member.name}
              className="bg-onyx-900/50 border border-cream/8 rounded-2xl p-6 text-center max-w-xs w-full"
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 * (i + 1) }}
            >
              <div className="w-36 h-36 mx-auto mb-5 rounded-full overflow-hidden border-2 border-gold/20">
                <Image
                  src={member.image}
                  alt={`${member.name} — ${member.role}`}
                  width={144}
                  height={144}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <h3 className="font-display text-xl font-semibold text-cream">
                {member.name}
              </h3>
              <p className="text-gold text-sm font-body mt-1">
                {member.role}
              </p>
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
            Join thousands of investors who trust Onyx Prop Care for verified
            land opportunities across India. Land and land only.
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
