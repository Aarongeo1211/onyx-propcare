"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-onyx-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 text-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gold/10 border border-gold/20 rounded-2xl mb-8"
        >
          <AlertTriangle className="w-10 h-10 text-gold" />
        </motion.div>

        <motion.h1
          className="font-display text-3xl md:text-4xl font-semibold text-cream mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Something Went Wrong
        </motion.h1>

        <motion.p
          className="text-cream/78 font-body text-lg max-w-md mx-auto mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          An unexpected error occurred. Please try again or contact support if the
          problem persists.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gold to-gold-light text-onyx-950 font-body font-medium text-sm rounded-xl hover:shadow-lg hover:shadow-gold/20 hover:-translate-y-0.5 transition-all duration-300"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </motion.div>
      </div>
    </div>
  );
}
