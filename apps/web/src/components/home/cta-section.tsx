"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      {/* Navy band */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-onyx-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gold-400/[0.12] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="heading-lg text-white mb-6">
            Ready to Discover Your{" "}
            <span className="text-gold-200">Perfect Land?</span>
          </h2>

          <p className="text-white/60 text-sm font-body max-w-lg mx-auto mb-10 leading-relaxed">
            Join thousands of investors discovering land opportunities across India
            with transparent data and expert guidance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/properties"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-onyx-50 font-semibold rounded-xl hover:shadow-xl hover:shadow-black/20 transition-all duration-300 group"
            >
              Browse Properties
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/25 text-white/80 rounded-xl hover:border-white/60 hover:text-white transition-all duration-300"
            >
              Talk to an Expert
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
