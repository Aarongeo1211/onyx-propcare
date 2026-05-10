"use client";

import { HeroSection } from "@/components/home/hero-section";
import { StatsBar } from "@/components/home/stats-bar";
import { DataInsights } from "@/components/home/data-insights";
import { FeaturedProperties } from "@/components/home/featured-properties";
import { HowItWorks } from "@/components/home/how-it-works";
import { WhyOnyx } from "@/components/home/why-onyx";
import { CTASection } from "@/components/home/cta-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <FeaturedProperties />
      <DataInsights />
      <HowItWorks />
      <WhyOnyx />
      <CTASection />
    </>
  );
}
