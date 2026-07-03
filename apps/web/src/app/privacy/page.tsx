"use client";

import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const sections = [
  {
    title: "1. Information We Collect",
    content: `We collect information you provide directly, including your name, email address, phone number, and property-related data when you create an account or list a property. We also collect usage data automatically, such as your IP address, browser type, device information, pages visited, and interaction patterns on the Platform. If you use our data services (soil analysis, drone surveys), we collect geolocation data related to the properties involved.`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use your information to: (a) provide, maintain, and improve the Platform and our services; (b) process transactions and send related notices; (c) send promotional communications, which you can opt out of at any time; (d) generate property analytics and market insights; (e) detect, prevent, and address fraud and technical issues; (f) comply with legal obligations; and (g) respond to your enquiries and provide customer support.`,
  },
  {
    title: "3. Data Sharing",
    content: `We do not sell your personal information. We may share your data with: (a) service providers who assist in operating the Platform (payment processors, hosting providers, analytics services); (b) property buyers or sellers as necessary to facilitate transactions you initiate; (c) legal authorities when required by law or to protect our rights; and (d) business partners with your explicit consent. All third-party service providers are contractually obligated to protect your data.`,
  },
  {
    title: "4. Cookies & Tracking",
    content: `We use cookies and similar technologies to enhance your experience, analyse usage patterns, and deliver relevant content. Essential cookies are required for the Platform to function. Analytics cookies help us understand how visitors interact with the Platform. You can manage cookie preferences through your browser settings. Disabling certain cookies may affect Platform functionality.`,
  },
  {
    title: "5. Data Security",
    content: `We implement industry-standard security measures including TLS encryption, secure data storage, access controls, and regular operational reviews to protect your personal information. Authentication secrets, database credentials, media service keys, and email credentials are managed through environment-based deployment configuration. While we take reasonable precautions, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.`,
  },
  {
    title: "6. Data Retention",
    content: `We retain your personal information for as long as your account is active or as needed to provide services. Transaction records are retained for seven years as required by Indian tax and accounting regulations. You may request deletion of your account data at any time, subject to our legal retention obligations. Anonymised and aggregated data may be retained indefinitely for analytical purposes.`,
  },
  {
    title: "7. Your Rights",
    content: `Under applicable Indian data protection laws, you have the right to: (a) access the personal data we hold about you; (b) correct inaccurate or incomplete data; (c) request deletion of your personal data; (d) withdraw consent for data processing; (e) object to processing for direct marketing; and (f) request data portability. To exercise these rights, contact us at privacy@onyxpropcare.com.`,
  },
  {
    title: "8. Children's Privacy",
    content: `The Platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a minor, we will take steps to delete that information promptly. If you believe a child has provided us with personal data, please contact us immediately.`,
  },
  {
    title: "9. International Data Transfers",
    content: `Your data is primarily stored and processed in India. If we transfer data to servers or service providers outside India, we ensure appropriate safeguards are in place, including contractual protections that comply with applicable data protection regulations.`,
  },
  {
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a prominent notice on the Platform or sending you an email. Your continued use of the Platform after changes are posted constitutes acceptance of the updated policy. We encourage you to review this page periodically.`,
  },
  {
    title: "11. Contact",
    content: `For any questions or concerns regarding this Privacy Policy or our data practices, please contact our Data Protection Officer at privacy@onyxpropcare.com or write to: Onyx Propcare Pvt. Ltd., Level 5, Trade Centre, Bandra Kurla Complex, Mumbai, Maharashtra 400051, India.`,
  },
];

export default function PrivacyPage() {
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
            Privacy Policy
          </motion.h1>
          <motion.p
            className="text-cream/86 font-body text-sm"
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
              <p className="text-cream/78 font-body text-sm leading-relaxed">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
