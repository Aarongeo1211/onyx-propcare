"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { MapPin, Maximize2, Droplets, ShieldCheck, Route, Share2, Check, PlayCircle, Sparkles, Phone } from "lucide-react";
import {
  formatPrice,
  formatArea,
  getPropertyTypeLabel,
  getPropertyTypeBadgeVariant,
  buildPropertyShareText,
} from "@/lib/utils";
import { CompareButton } from "@/components/comparison/compare-button";

export interface PropertyCardData {
  id: string;
  slug: string;
  title: string;
  type: string;
  listingType: string;
  price: number;
  totalArea: number;
  areaUnit: string;
  district: string;
  state: string;
  roadAccess: boolean;
  hasClearTitle: boolean;
  isFeatured: boolean;
  images: { url: string; alt?: string | null }[];
  videos?: { url: string }[];
  soilData?: { soilType: string; fertility?: string | null } | null;
  waterData?: { waterSource?: string | null; waterQuality?: string | null } | null;
  legalCheck?: { titleStatus: string } | null;
  owner?: { id: string; name: string; avatar?: string | null; phone?: string | null } | null;
}

interface PropertyCardProps {
  property: PropertyCardData;
  index?: number;
}

export function PropertyCard({ property, index = 0 }: PropertyCardProps) {
  const { data: session, status } = useSession();
  const hasImage = Boolean(property.images?.[0]?.url);
  const imageUrl = property.images?.[0]?.url || "/images/placeholder-property.svg";
  const imageAlt = property.images?.[0]?.alt || property.title;
  const [shareCopied, setShareCopied] = useState(false);

  const typeVariant = getPropertyTypeBadgeVariant(property.type);
  const typePillClass =
    typeVariant === "farmland"
      ? "bg-emerald-600"
      : typeVariant === "residential"
        ? "bg-sky-600"
        : typeVariant === "warning"
          ? "bg-amber-600"
          : "bg-gold";

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/properties/${property.slug}`;
    const text = buildPropertyShareText(property);
    const shareData = { title: property.title, text, url };
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      } catch {
        // nothing
      }
    }
  }

  function handleCall(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (status !== "authenticated" || !session?.user) {
      window.location.assign(`/login?callbackUrl=${encodeURIComponent(`/properties/${property.slug}`)}`);
      return;
    }

    if (!property.owner?.phone) return;
    window.location.href = `tel:${property.owner.phone.replace(/[^\d+]/g, "")}`;
  }

  const callLabel =
    status === "authenticated"
      ? property.owner?.phone
        ? "Call"
        : "No phone"
      : "Log in to call";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
    >
      <Link href={`/properties/${property.slug}`} className="block group">
        <div className="relative rounded-2xl border border-cream/8 bg-onyx-900/50 backdrop-blur-sm shadow-lg shadow-cream/5 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-gold/15 hover:shadow-xl">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              unoptimized={!hasImage}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
            {/* Dark scrims top & bottom so badges and price stay legible on any photo */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

            {/* Top-left: type + listing badges (solid, high-contrast) */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-md ${typePillClass}`}>
                {getPropertyTypeLabel(property.type)}
              </span>
              {property.listingType === "LEASE" && (
                <span className="rounded-full border border-white/25 bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  Lease
                </span>
              )}
              {property.listingType === "RENT" && (
                <span className="rounded-full border border-white/25 bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  Rent
                </span>
              )}
            </div>

            {/* Top-right: featured + video + compare */}
            <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
              {property.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[11px] font-semibold text-white shadow-md">
                  <Sparkles className="h-3 w-3" />
                  Featured
                </span>
              )}
              {property.videos && property.videos.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/65 backdrop-blur-sm border border-white/20 px-2 py-1 text-[10px] font-medium text-white">
                  <PlayCircle className="w-3 h-3" />
                  Video Tour
                </span>
              )}
              <CompareButton propertyId={property.id} variant="card" />
            </div>

            {/* Price on image */}
            <div className="absolute bottom-3 left-3">
              <span className="font-display text-2xl font-semibold text-white drop-shadow-lg">
                {formatPrice(property.price)}
              </span>
              {property.listingType === "LEASE" && (
                <span className="text-white/70 text-xs ml-1">/year</span>
              )}
              {property.listingType === "RENT" && (
                <span className="text-white/70 text-xs ml-1">/mo</span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Title */}
            <h3 className="font-display text-lg font-semibold text-cream leading-tight mb-2 line-clamp-1 group-hover:text-gold transition-colors">
              {property.title}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-cream/86 text-sm mb-3">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {property.district}, {property.state}
              </span>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5 text-cream/78 text-xs">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{formatArea(property.totalArea, property.areaUnit)}</span>
              </div>
              {property.roadAccess && (
                <div className="flex items-center gap-1.5 text-cream/78 text-xs">
                  <Route className="w-3.5 h-3.5" />
                  <span>Road Access</span>
                </div>
              )}
            </div>

            {/* Feature indicators */}
            <div className="flex items-center gap-2 pt-3 border-t border-cream/5">
              {property.waterData && (
                <div className="flex items-center gap-1 text-xs font-medium text-sky-600">
                  <Droplets className="w-3 h-3" />
                  <span>Water</span>
                </div>
              )}
              {(property.hasClearTitle || property.legalCheck?.titleStatus === "clear") && (
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </div>
              )}
              {property.soilData && (
                <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
                  <span className="w-3 h-3 flex items-center justify-center text-[10px]">🌾</span>
                  <span>{property.soilData.soilType}</span>
                </div>
              )}

              {/* Share + Price per unit on right */}
              <div className="ml-auto flex items-center gap-2">
                {property.totalArea > 0 && (
                  <span className="text-xs text-cream/82">
                    {formatPrice(property.price / property.totalArea)}/{property.areaUnit.replace(/s$/, "")}
                  </span>
                )}
                <div className="relative">
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center w-6 h-6 rounded-lg text-cream/82 hover:text-cream/88 hover:bg-cream/5 transition-colors"
                    title="Share property"
                  >
                    {shareCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {shareCopied && (
                    <span className="absolute -top-7 right-0 whitespace-nowrap rounded-lg bg-onyx-800 border border-cream/10 px-2 py-0.5 text-[10px] text-emerald-400 shadow-lg pointer-events-none">
                      Copied!
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCall}
              disabled={status === "authenticated" && !property.owner?.phone}
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gold/20 bg-gold/10 text-sm font-medium text-gold transition-colors hover:bg-gold/15 disabled:cursor-not-allowed disabled:border-cream/10 disabled:bg-cream/5 disabled:text-cream/80"
              title={callLabel}
            >
              <Phone className="h-4 w-4" />
              {callLabel}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
