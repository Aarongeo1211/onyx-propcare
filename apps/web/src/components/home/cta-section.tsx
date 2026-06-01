"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-onyx-950 via-onyx-900/50 to-onyx-950" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gold/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="heading-lg text-cream mb-6">
            Ready to Discover Your{" "}
            <span className="text-gradient-gold">Perfect Land?</span>
          </h2>

          <p className="text-cream/35 text-sm font-body max-w-lg mx-auto mb-10 leading-relaxed">
            Join thousands of investors discovering land opportunities across India
            with transparent data and expert guidance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/properties"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-gold text-onyx-950 font-medium rounded-xl hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 group"
            >
              Browse Properties
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-cream/15 text-cream/60 rounded-xl hover:border-gold/30 hover:text-gold transition-all duration-300"
            >
              Talk to an Expert
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
