"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";

const PLAN_CONTENT: Record<string, { title: string; description: string }> = {
  FREE_ALL: {
    title: "Free Pack Activated",
    description: "You can now publish one basic listing and test the full seller workflow before moving to a paid plan.",
  },
  BASIC_FARMLAND: {
    title: "Basic Farmland Pack Activated",
    description: "Your farmland listing slot is ready with standard visibility and support for up to 5 images.",
  },
  BASIC_RESIDENTIAL_PLOT: {
    title: "Basic Residential Pack Activated",
    description: "Your residential plot listing slot is live with standard visibility and support for up to 5 images.",
  },
  FEATURED_FARMLAND: {
    title: "Featured Farmland Pack Activated",
    description: "Your farmland listing is now eligible for top section placement, highlighted presentation, and richer media.",
  },
  FEATURED_RESIDENTIAL_PLOT: {
    title: "Featured Residential Pack Activated",
    description: "Your residential plot listing now gets featured placement, highlight treatment, and richer media support.",
  },
  PREMIUM_FARMLAND: {
    title: "Premium Farmland Pack Activated",
    description: "Your farmland inventory is configured for homepage visibility, top rank positioning, unlimited media, and verified presentation.",
  },
  PREMIUM_RESIDENTIAL_PLOT: {
    title: "Premium Residential Pack Activated",
    description: "Your residential listings now have homepage visibility, top rank positioning, unlimited media, and verified presentation.",
  },
};

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams();
  const planCode = searchParams.get("plan") ?? "FREE_ALL";
  const content = useMemo(
    () =>
      PLAN_CONTENT[planCode] ?? {
        title: "Plan Activated",
        description: "Your listing plan is active. You can head straight into the seller dashboard and publish your next property.",
      },
    [planCode]
  );

  return (
    <div className="min-h-screen bg-onyx-950 px-6 py-20">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex-1"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-4 py-1.5 text-xs uppercase tracking-[0.24em] text-gold">
            <Sparkles className="h-3.5 w-3.5" />
            Success
          </span>
          <h1 className="mt-6 font-display text-4xl text-cream md:text-5xl">{content.title}</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-cream/60">{content.description}</p>

          <div className="mt-8 space-y-3">
            {[
              "Plan limits are now enforced in the listing workflow",
              "Admin and seller dashboards reflect the active pack",
              "You can immediately create a new property with the matching category rules",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-cream/70">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/properties/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-light px-6 py-3.5 text-sm font-medium text-onyx-950 transition hover:shadow-[0_14px_36px_rgba(201,168,76,0.35)]"
            >
              Create Listing
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center justify-center rounded-xl border border-cream/10 bg-onyx-900/50 px-6 py-3.5 text-sm text-cream/70 transition hover:border-gold/25 hover:text-cream"
            >
              Review My Plans
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="glass grain flex w-full max-w-md flex-col rounded-[2rem] p-8"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-light">
              <Check className="h-8 w-8 text-onyx-950" />
            </div>
          </div>
          <h2 className="mt-6 font-display text-3xl text-cream">Ready to publish</h2>
          <p className="mt-3 text-sm leading-7 text-cream/60">
            Your plan is active and the listing flow will now apply category, media, and visibility rules automatically.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function SuccessFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-onyx-950 px-6">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
    </div>
  );
}
