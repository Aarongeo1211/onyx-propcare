import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

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
    { href: "/pricing", label: "Pricing" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/refund", label: "Refund Policy" },
  ],
};

export function Footer() {
  return (
    <footer className="relative bg-onyx-950 border-t border-cream/5">
      {/* Gold line */}
      <div className="divider-gold" />

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-gold rounded-lg rotate-45" />
                <span className="absolute inset-0 flex items-center justify-center font-display text-onyx-950 font-bold text-lg">
                  O
                </span>
              </div>
              <div>
                <span className="font-display text-xl font-semibold text-cream">ONYX</span>
                <span className="text-[10px] font-body uppercase tracking-[0.3em] text-gold/70 block -mt-1">Propcare</span>
              </div>
            </div>

            <p className="text-cream/40 text-sm leading-relaxed max-w-sm">
              India&apos;s most trusted platform for farmland and residential plot investments.
              Backed by verified data, drone surveys, and comprehensive legal checks.
            </p>

            <div className="space-y-3 text-sm text-cream/40">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gold/60" />
                Mumbai, Maharashtra, India
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold/60" />
                +91 98765 43210
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold/60" />
                hello@onyxpropcare.com
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display text-sm font-semibold text-cream uppercase tracking-wider mb-4">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream/35 hover:text-gold transition-colors duration-300"
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
          <p className="text-xs text-cream/25">
            &copy; {new Date().getFullYear()} Onyx Propcare. All rights reserved.
          </p>
          <p className="text-xs text-cream/25">
            Built with care for India&apos;s land ecosystem.
          </p>
        </div>
      </div>
    </footer>
  );
}
