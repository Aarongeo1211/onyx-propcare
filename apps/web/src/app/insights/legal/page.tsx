import type { Metadata } from "next";
import { LegalInsightsPageContent } from "./legal-content";
import { legalProcess } from "./legal-data";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Legal Title Verification for Land",
  description:
    "Title deed checks, mutation records, encumbrance certificates, and court order clearance — how Onyx Propcare verifies clear legal title on every land listing.",
  alternates: {
    canonical: "/insights/legal",
  },
};

export default function LegalInsightsPage() {
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How Onyx Propcare Verifies Legal Title on Land",
    description:
      "The legal due-diligence process Onyx Propcare runs on every land listing before publishing it.",
    step: legalProcess.map((step) => ({
      "@type": "HowToStep",
      name: step.name,
      text: step.description,
    })),
  };

  return (
    <>
      <JsonLd data={howToSchema} />
      <LegalInsightsPageContent />
    </>
  );
}
