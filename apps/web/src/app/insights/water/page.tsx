import type { Metadata } from "next";
import { WaterInsightsPageContent } from "./water-content";

export const metadata: Metadata = {
  title: "Water Analysis for Land & Farmland",
  description:
    "Understand water availability before you buy — groundwater depth, borewell yield, recharge rate, and water quality data for every Onyx Propcare land listing.",
  alternates: {
    canonical: "/insights/water",
  },
};

export default function WaterInsightsPage() {
  return <WaterInsightsPageContent />;
}
