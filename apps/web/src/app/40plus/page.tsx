import type { Metadata } from "next";
import { FortyPlusContent } from "./forty-plus-content";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/site";

const PAGE_TITLE = "Onyx 40+ | A Premium Community for People Above 40";
const PAGE_DESCRIPTION =
  "Onyx 40+ is a trusted, members-only lifestyle community for people above 40. Farm visits, nature experiences, business networking, wellness retreats, and lifelong friendships across India.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/40plus",
  },
  keywords: [
    "Onyx 40+",
    "community for people above 40",
    "lifestyle community India",
    "networking events India",
    "farm visits community",
    "wellness retreats India",
    "50+ community India",
  ],
  openGraph: {
    type: "website",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [{ url: absoluteUrl("/40plus/hero.jpg"), width: 1240, height: 1860, alt: "Onyx 40+ — the journey begins now" }],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [absoluteUrl("/40plus/hero.jpg")],
  },
};

export default function FortyPlusPage() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Onyx 40+",
    description: PAGE_DESCRIPTION,
    url: absoluteUrl("/40plus"),
    logo: absoluteUrl("/40plus/logo.jpg"),
    parentOrganization: {
      "@type": "Organization",
      name: "Onyx",
    },
    sameAs: [absoluteUrl("/40plus")],
  };

  return (
    <>
      <JsonLd data={organizationSchema} />
      <FortyPlusContent />
    </>
  );
}
