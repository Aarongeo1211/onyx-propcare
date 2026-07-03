"use client";

import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using the Onyx Propcare platform ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Platform. We reserve the right to modify these Terms at any time, and your continued use of the Platform constitutes acceptance of any changes.`,
  },
  {
    title: "2. Account Terms",
    content: `You must be at least 18 years of age to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate and complete information during registration and keep your account information updated. Onyx Propcare reserves the right to suspend or terminate accounts that violate these Terms.`,
  },
  {
    title: "3. Property Listings",
    content: `All property listings must contain accurate and truthful information. Sellers are solely responsible for the accuracy of their listing data, including property dimensions, ownership details, pricing, and location information. Onyx Propcare provides data verification services as an additional layer of assurance but does not guarantee the absolute accuracy of any listing. Listings that are found to contain fraudulent or misleading information will be removed, and the associated account may be suspended.`,
  },
  {
    title: "4. Subscriptions & Payments",
    content: `Certain features of the Platform require an active subscription. Subscription access is activated against the selected plan and applies the related listing and data limits to your account. Prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. If and when external billing is enabled, the applicable payment terms will be surfaced at checkout. Refunds are governed by our Refund Policy and are generally not provided for partially used billing periods.`,
  },
  {
    title: "5. User Conduct",
    content: `You agree not to: (a) use the Platform for any unlawful purpose; (b) post false, misleading, or fraudulent property listings; (c) scrape, harvest, or collect data from the Platform without authorization; (d) interfere with or disrupt the Platform's infrastructure; (e) impersonate another person or entity; (f) upload malicious code or content; or (g) attempt to gain unauthorized access to other user accounts or Platform systems.`,
  },
  {
    title: "6. Intellectual Property",
    content: `All content on the Platform, including but not limited to text, graphics, logos, data compilations, software, and design elements, is the property of Onyx Propcare or its licensors and is protected by Indian and international intellectual property laws. You may not reproduce, distribute, modify, or create derivative works from any Platform content without prior written consent from Onyx Propcare.`,
  },
  {
    title: "7. Data & Analytics",
    content: `Onyx Propcare provides soil analysis, water reports, drone survey data, and legal verification reports as informational tools. While we strive for accuracy, these reports are not a substitute for independent professional advice. Users should conduct their own due diligence and consult qualified professionals before making investment decisions based on Platform data.`,
  },
  {
    title: "8. Limitation of Liability",
    content: `To the maximum extent permitted by applicable law, Onyx Propcare shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Platform. Our total liability for any claim arising from your use of the Platform shall not exceed the amount you paid to Onyx Propcare in the twelve months preceding the claim. The Platform is provided on an "as is" and "as available" basis without warranties of any kind.`,
  },
  {
    title: "9. Indemnification",
    content: `You agree to indemnify and hold harmless Onyx Propcare, its officers, directors, employees, and agents from and against any claims, damages, losses, liabilities, and expenses arising out of or relating to your use of the Platform, your violation of these Terms, or your violation of any rights of a third party.`,
  },
  {
    title: "10. Governing Law",
    content: `These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra, India. The parties agree to attempt to resolve any disputes through good-faith negotiation before pursuing formal legal proceedings.`,
  },
  {
    title: "11. Contact",
    content: `If you have any questions about these Terms of Service, please contact us at legal@onyxpropcare.com or write to: Onyx Propcare Pvt. Ltd., Level 5, Trade Centre, Bandra Kurla Complex, Mumbai, Maharashtra 400051, India.`,
  },
];

export default function TermsPage() {
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
            Terms of Service
          </motion.h1>
          <motion.p
            className="text-cream/68 font-body text-sm"
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
