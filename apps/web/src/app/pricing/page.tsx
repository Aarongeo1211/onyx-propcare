import type { Metadata } from "next";
import type { Plan } from "@onyx/types";
import { PricingPageContent } from "./pricing-content";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_NAME, truncateText } from "@/lib/site";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "http://localhost:4000/api/v1";

export const metadata: Metadata = {
  title: "Pricing & Subscription Plans",
  description: truncateText(
    "Compare Onyx Propcare listing and subscription plans for buyers, owners, and agents — transparent pricing for verified land, plot, and farmland marketplace access.",
    160
  ),
  alternates: {
    canonical: "/pricing",
  },
};

async function getPlans(): Promise<Plan[]> {
  try {
    const res = await fetch(`${API_BASE}/plans`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

export default async function PricingPage() {
  const plans = await getPlans();

  const offerCatalogSchema =
    plans.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "OfferCatalog",
          name: `${SITE_NAME} Subscription Plans`,
          itemListElement: plans.map((plan) => ({
            "@type": "Offer",
            name: plan.name,
            priceCurrency: "INR",
            price: plan.price,
            availability: "https://schema.org/InStock",
          })),
        }
      : null;

  return (
    <>
      {offerCatalogSchema && <JsonLd data={offerCatalogSchema} />}
      <PricingPageContent />
    </>
  );
}
