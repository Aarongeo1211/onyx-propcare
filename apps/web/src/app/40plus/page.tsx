import type { Metadata } from "next";
import Image from "next/image";
import { Phone } from "lucide-react";
import { absoluteUrl } from "@/lib/site";

const PAGE_TITLE = "Onyx 40+ | A Premium Community for People Above 40";
const PAGE_DESCRIPTION =
  "Become a founding member of Onyx 40+ — a trusted, pan-India community for people above 40. Trips, meetups, celebrations, and genuine new friendships.";
const CONTACT_PHONE = "+919886455199";
const CONTACT_PHONE_DISPLAY = "98864 55199";
const UPI_ID = "yespay.mabs0696619ikit4760@yesbankltd";
const UPI_PAY_LINK = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent("Onyx Propcare")}&cu=INR`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/40plus",
  },
  openGraph: {
    type: "website",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [{ url: absoluteUrl("/infopage.jpeg"), width: 1024, height: 1536, alt: "Onyx 40+ membership flyer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [absoluteUrl("/infopage.jpeg")],
  },
};

export default function FortyPlusPage() {
  return (
    <div className="min-h-screen bg-onyx-950 flex flex-col items-center px-4 py-10 md:py-16">
      <Image
        src="/40pluslogo.jpeg"
        alt="Onyx 40+ — Live, Care, Share"
        width={240}
        height={240}
        priority
        className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover mb-8"
      />

      <div className="w-full max-w-2xl rounded-2xl overflow-hidden border border-cream/10 shadow-2xl">
        <Image
          src="/infopage.jpeg"
          alt="Onyx 40+ — Become a founding member. A premium community for people above 40. Membership plans: one-time registration ₹999, monthly ₹499, 6-month premium ₹2,699, 1-year elite ₹4,999."
          width={1024}
          height={1536}
          priority
          className="w-full h-auto"
        />
      </div>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
        <a
          href={`tel:${CONTACT_PHONE}`}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-onyx-950 hover:bg-gold/90 transition-colors"
        >
          <Phone className="w-4 h-4" />
          Call Sunitha Singh — {CONTACT_PHONE_DISPLAY}
        </a>
        <a
          href={UPI_PAY_LINK}
          className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-6 py-3 text-sm font-semibold text-gold hover:bg-gold/10 transition-colors"
        >
          Pay via UPI
        </a>
      </div>

      <p className="mt-6 text-xs text-cream/60">Onyx 40+ is an initiative of Onyx, the mother company.</p>
    </div>
  );
}
