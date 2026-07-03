import type { Metadata } from "next";
import { SoilInsightsPageContent } from "./soil-content";

export const metadata: Metadata = {
  title: "Soil Analysis for Farmland & Agricultural Land",
  description:
    "Check soil type, pH, fertility rating, and nutrient content before buying farmland — detailed soil analysis reports on every Onyx Propcare agricultural listing.",
  alternates: {
    canonical: "/insights/soil",
  },
};

export default function SoilInsightsPage() {
  return <SoilInsightsPageContent />;
}
