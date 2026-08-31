import type { Metadata } from "next";
import { DroneInsightsPageContent } from "./drone-content";
import { truncateText } from "@/lib/site";

export const metadata: Metadata = {
  title: "Drone Survey & Aerial Mapping for Land",
  description: truncateText(
    "Aerial boundary maps, NDVI vegetation health imaging, and topographic surveys — see exactly what you're buying with drone-verified land documentation from Onyx Propcare.",
    160
  ),
  alternates: {
    canonical: "/insights/drone",
  },
};

export default function DroneInsightsPage() {
  return <DroneInsightsPageContent />;
}
