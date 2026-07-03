import type { Metadata } from "next";
import { AboutPageContent } from "./about-content";
import { aboutFaqs } from "./about-data";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Onyx Propcare is India's dedicated land marketplace — verified farmland, plots, and agricultural land listings backed by soil, water, legal, and drone data.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: aboutFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <JsonLd data={faqSchema} />
      <AboutPageContent />
    </>
  );
}
