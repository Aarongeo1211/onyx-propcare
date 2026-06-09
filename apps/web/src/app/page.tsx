import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { BrowseCategories } from "@/components/home/browse-categories";
import { DataInsights } from "@/components/home/data-insights";
import { FeaturedProperties } from "@/components/home/featured-properties";
import { HowItWorks } from "@/components/home/how-it-works";
import { WhyOnyx } from "@/components/home/why-onyx";
import { CTASection } from "@/components/home/cta-section";
import { JsonLd } from "@/components/seo/json-ld";
import { getFeaturedProperties } from "@/lib/public-api";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} | Verified Farmland & Plot Marketplace in India`,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const featuredProperties = await getFeaturedProperties().catch(() => []);
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/properties?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  const homePageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${SITE_NAME} homepage`,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    primaryImageOfPage: absoluteUrl("/brand/onyx-propcare_logo.png"),
  };

  return (
    <>
      <JsonLd data={[websiteSchema, homePageSchema]} />
      <HeroSection featuredProperties={featuredProperties} />
      <BrowseCategories />
      <FeaturedProperties initialProperties={featuredProperties} />
      <DataInsights />
      <HowItWorks />
      <WhyOnyx />
      <CTASection />
    </>
  );
}
