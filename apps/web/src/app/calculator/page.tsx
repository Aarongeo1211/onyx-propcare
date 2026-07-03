import type { Metadata } from "next";
import { CalculatorPageContent } from "./calculator-content";

export const metadata: Metadata = {
  title: "Land Investment ROI Calculator",
  description:
    "Estimate returns on farmland and plot investments — calculate appreciation, rental yield, and total ROI for land purchases across India with Onyx Propcare's free calculator.",
  alternates: {
    canonical: "/calculator",
  },
};

export default function CalculatorPage() {
  return <CalculatorPageContent />;
}
