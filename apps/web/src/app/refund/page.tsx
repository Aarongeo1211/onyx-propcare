"use client";

import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const sections = [
  {
    title: "1. Subscription Cancellation Policy",
    content: `You may cancel your Onyx Propcare subscription at any time through your account settings. Upon cancellation, your subscription will remain active until the end of the current billing period. No further charges will be applied after cancellation. Access to premium features, including soil reports, drone surveys, and legal verification tools, will continue until the billing period concludes.`,
  },
  {
    title: "2. Refund Eligibility",
    content: `Refund requests are considered on a case-by-case basis. You may be eligible for a refund if: (a) you were charged incorrectly due to a billing error; (b) the Platform experienced a significant service outage lasting more than 72 consecutive hours during your billing period; or (c) you cancel within 48 hours of your initial subscription purchase and have not accessed any premium reports or data. Refund requests must be submitted within 15 days of the charge in question.`,
  },
  {
    title: "3. Refund Process",
    content: `To request a refund, email refunds@onyxpropcare.com with your registered email address, subscription plan details, and the reason for your request. Our team will review your request and respond within 5 business days. Approved refunds will be processed through the same billing method used for the original transaction once payment gateway support is connected for your account. You will receive email confirmation once the refund has been initiated.`,
  },
  {
    title: "4. Non-Refundable Items",
    content: `The following are not eligible for refunds: (a) partially used billing periods after the 48-hour cancellation window; (b) one-time report purchases, including individual soil analysis, water quality, or legal verification reports that have already been generated and delivered; (c) subscription upgrades where premium features have been accessed; (d) accounts terminated due to violation of our Terms of Service; and (e) any promotional or discounted subscription plans unless explicitly stated otherwise.`,
  },
  {
    title: "5. Contact for Refund Queries",
    content: `For any questions regarding refunds or cancellations, please reach out to our support team at refunds@onyxpropcare.com or call +91 98765 43210 (Monday to Friday, 10:00 AM - 6:00 PM IST). You may also write to: Onyx Propcare Pvt. Ltd., Level 5, Trade Centre, Bandra Kurla Complex, Mumbai, Maharashtra 400051, India. We aim to resolve all refund-related queries within 5 business days.`,
  },
];

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-onyx-950">
      <section className="relative pt-20 pb-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold/5 rounded-full blur-[120px]" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        </div>

        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <motion.h1
            className="font-display text-4xl md:text-5xl font-semibold text-cream mb-4"
            {...fadeUp}
            transition={{ duration: 0.6 }}
          >
            Refund &amp; Cancellation Policy
          </motion.h1>
          <motion.p
            className="text-cream/40 font-body text-sm"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Last updated: April 2026
          </motion.p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="space-y-8">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.05 * i }}
            >
              <h2 className="font-display text-xl font-semibold text-cream mb-3">
                {section.title}
              </h2>
              <p className="text-cream/50 font-body text-sm leading-relaxed">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
