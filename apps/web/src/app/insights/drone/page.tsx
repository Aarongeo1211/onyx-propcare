import type { Metadata } from "next";
import { DroneInsightsPageContent } from "./drone-content";

export const metadata: Metadata = {
  title: "Drone Survey & Aerial Mapping for Land",
  description:
    "Aerial boundary maps, NDVI vegetation health imaging, and topographic surveys — see exactly what you're buying with drone-verified land documentation from Onyx Propcare.",
  alternates: {
    canonical: "/insights/drone",
  },
};

export default function DroneInsightsPage() {
  return <DroneInsightsPageContent />;
}
