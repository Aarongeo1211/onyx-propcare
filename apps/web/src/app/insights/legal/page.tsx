"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Scale,
  ShieldCheck,
  FileSearch,
  AlertTriangle,
  FileText,
  Gavel,
  Scroll,
  BookOpen,
  Stamp,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const legalProcess = [
  {
    icon: FileSearch,
    name: "Title Verification",
    description:
      "We trace the chain of ownership back through multiple generations to confirm that the seller has clear, undisputed title to the property and full authority to sell.",
  },
  {
    icon: Scale,
    name: "Encumbrance Check",
    description:
      "A thorough search of the Sub-Registrar records to ensure the property is free from mortgages, liens, pending loans, or any other financial encumbrances that could affect ownership.",
  },
  {
    icon: Gavel,
    name: "Litigation Check",
    description:
      "We verify whether the property is involved in any ongoing civil or criminal disputes by searching court records at the district and high court levels.",
  },
];

const commonIssues = [
  {
    icon: AlertTriangle,
    name: "Disputed Ownership",
    description:
      "Multiple parties claiming rights over the same land due to unclear succession, oral agreements, or forged documents. This is the most common legal issue in rural India.",
  },
  {
    icon: FileText,
    name: "Missing Mutation Records",
    description:
      "When land ownership changes hands but the revenue records are not updated, the new owner may face challenges proving title during future transactions.",
  },
  {
    icon: ShieldCheck,
    name: "Government Land Encroachment",
    description:
      "Some plots may partially or fully overlap with government-owned land, forest reserves, or tribal land. Such encroachments can lead to demolition orders and total loss of investment.",
  },
  {
    icon: Scroll,
    name: "Non-Agricultural Use Violations",
    description:
      "Agricultural land used or sold for residential or commercial purposes without proper NA (Non-Agricultural) conversion approval can result in penalties and reversal of transactions.",
  },
];

const documents = [
  {
    icon: BookOpen,
    name: "7/12 Extract (Saat Baara)",
    description:
      "The most critical land document in Maharashtra and several other states. It records the survey number, area, ownership, crop details, and any encumbrances on the land.",
  },
  {
    icon: Stamp,
    name: "Sale Deed",
    description:
      "The registered document that legally transfers ownership from the seller to the buyer. We verify its authenticity, registration status, and consistency with revenue records.",
  },
  {
    icon: FileSearch,
    name: "Mutation Records",
    description:
      "Records maintained by the local revenue authority that reflect changes in land ownership. Updated mutation entries are essential to establish the current legal owner.",
  },
  {
    icon: FileText,
    name: "Encumbrance Certificate",
    description:
      "Issued by the Sub-Registrar office, this certificate confirms that the property is free from any registered financial or legal liabilities for a specified period.",
  },
  {
    icon: Scale,
    name: "Land Use Certificate",
    description:
      "Confirms whether the land is classified as agricultural, residential, commercial, or industrial. Essential for understanding permissible uses and development potential.",
  },
  {
    icon: Gavel,
    name: "Court Order Clearance",
    description:
      "If any past litigation existed on the property, we obtain and verify court orders confirming the dispute has been resolved and the title is clear for transfer.",
  },
];

export default function LegalInsightsPage() {
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
            Legal Verification Insights
          </motion.h1>
          <motion.p
            className="text-cream/78 font-body text-lg max-w-2xl mx-auto leading-relaxed"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Legal due diligence is the most critical step in any land purchase.
            A single undetected dispute or missing document can turn a promising
            investment into years of litigation and financial loss.
          </motion.p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div className="text-center mb-12" {...fadeUp} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-3">
            Our Legal Check Process
          </h2>
          <p className="text-cream/86 font-body max-w-lg mx-auto">
            Every property on Onyx Propcare goes through a rigorous three-stage
            legal verification before listing.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {legalProcess.map((step, i) => (
            <motion.div
              key={step.name}
              className="bg-onyx-900/40 backdrop-blur-xl border border-cream/8 rounded-2xl p-6 hover:border-gold/20 transition-colors duration-300"
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center mb-5">
                <step.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-xl font-semibold text-cream mb-2">{step.name}</h3>
              <p className="text-cream/86 font-body text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div className="text-center mb-12" {...fadeUp} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-3">
            Common Legal Issues in Indian Land Deals
          </h2>
          <p className="text-cream/86 font-body max-w-lg mx-auto">
            These are the pitfalls our verification process is designed to catch
            before they become your problem.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {commonIssues.map((issue, i) => (
            <motion.div
              key={issue.name}
              className="bg-onyx-900/40 backdrop-blur-xl border border-cream/8 rounded-2xl p-6 hover:border-gold/20 transition-colors duration-300"
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-center shrink-0">
                  <issue.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-cream mb-1">{issue.name}</h3>
                  <p className="text-cream/86 font-body text-sm leading-relaxed">{issue.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <motion.div className="text-center mb-12" {...fadeUp} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-3">
            Documents We Verify
          </h2>
          <p className="text-cream/86 font-body max-w-lg mx-auto">
            A comprehensive review of every document that establishes clear
            ownership and legal standing of the property.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc, i) => (
            <motion.div
              key={doc.name}
              className="bg-onyx-900/40 backdrop-blur-xl border border-cream/8 rounded-2xl p-6 hover:border-gold/20 transition-colors duration-300"
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center mb-5">
                <doc.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-xl font-semibold text-cream mb-2">{doc.name}</h3>
              <p className="text-cream/86 font-body text-sm leading-relaxed">{doc.description}</p>
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
            Explore Verified Properties
          </h2>
          <p className="text-cream/78 font-body max-w-lg mx-auto mb-8">
            Every listing on our platform has passed a complete legal
            verification. Browse with confidence knowing the paperwork is clean.
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
