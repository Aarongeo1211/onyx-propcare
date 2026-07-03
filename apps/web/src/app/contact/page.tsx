import type { Metadata } from "next";
import { ContactPageContent } from "./contact-content";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Onyx Propcare for property inquiries, seller support, or partnership opportunities — reach our land marketplace team by phone, email, or form.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/brand/onyx-propcare-email.png"),
    email: "support@onyxpropcare.com",
    telephone: "+91-8147057801",
    address: {
      "@type": "PostalAddress",
      streetAddress:
        "1st Floor, No.36, Shop No.4, Bidarahalli Hobli, Dr SRK Nagar Post, Near Anjaneya Temple, Byrathi",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      postalCode: "560077",
      addressCountry: "IN",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday"],
        opens: "10:00",
        closes: "14:00",
      },
    ],
  };

  return (
    <>
      <JsonLd data={localBusinessSchema} />
      <ContactPageContent />
    </>
  );
}
