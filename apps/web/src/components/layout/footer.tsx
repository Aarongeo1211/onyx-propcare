import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const footerLinks = {
  marketplace: [
    { href: "/properties?type=FARMLAND", label: "Farmlands" },
    { href: "/properties?type=RESIDENTIAL_PLOT", label: "Residential Plots" },
    { href: "/properties?type=AGRICULTURAL_LAND", label: "Agricultural Land" },
    { href: "/properties?type=ORCHARD", label: "Orchards" },
  ],
  insights: [
    { href: "/insights/soil", label: "Soil Reports" },
    { href: "/insights/water", label: "Water Analysis" },
    { href: "/insights/legal", label: "Legal Verification" },
    { href: "/insights/drone", label: "Drone Surveys" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/insights/soil", label: "Insights" },
    { href: "/blog", label: "Blog" },
    { href: "/pricing", label: "Pricing" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/refund", label: "Refund Policy" },
  ],
};

export function Footer({ availableTypes }: { availableTypes?: string[] }) {
  const marketplaceLinks =
    availableTypes && availableTypes.length > 0
      ? footerLinks.marketplace.filter((link) => {
          const type = new URLSearchParams(link.href.split("?")[1]).get("type");
          return !type || availableTypes.includes(type);
        })
      : footerLinks.marketplace;
  const links = { ...footerLinks, marketplace: marketplaceLinks };

  return (
    <footer className="relative bg-onyx-950 border-t border-cream/8">
      {/* Brand line */}
      <div className="divider-gold" />

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" aria-label="Onyx Propcare home" className="inline-block">
              <Logo className="h-16 w-auto" />
            </Link>

            <p className="text-cream/84 text-sm leading-relaxed max-w-sm">
              Your trusted partner for land. A dedicated platform built
              exclusively for land, plots, and farmlands — land and land only.
            </p>
            <p className="text-gold/70 text-xs font-display italic mt-2">
              Best investment on earth is earth itself.
            </p>

            <div className="space-y-3 text-sm text-cream/84">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gold/60" />
                Byrathi, Bengaluru, Karnataka 560077
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold/60" />
                +91 81470 57801
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold/60" />
                hello@onyxpropcare.com
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([title, sectionLinks]) => (
            <div key={title}>
              <h3 className="font-display text-sm font-semibold text-cream uppercase tracking-wider mb-4">
                {title}
              </h3>
              <ul className="space-y-3">
                {sectionLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream/81 hover:text-gold transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-cream/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cream/79">
            &copy; {new Date().getFullYear()} Onyx Propcare. All rights reserved.
          </p>
          <p className="text-xs text-cream/79">
            Built with care for India&apos;s land ecosystem.
          </p>
        </div>
      </div>
    </footer>
  );
}
