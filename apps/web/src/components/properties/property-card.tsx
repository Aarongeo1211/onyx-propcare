"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Maximize2, Droplets, ShieldCheck, Route, Share2, Check } from "lucide-react";
import { Badge } from "@onyx/ui";
import {
  formatPrice,
  formatArea,
  getPropertyTypeLabel,
  getPropertyTypeBadgeVariant,
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
  soilData?: { soilType: string; fertility?: string | null } | null;
  waterData?: { waterSource?: string | null; waterQuality?: string | null } | null;
  legalCheck?: { titleStatus: string } | null;
}

interface PropertyCardProps {
  property: PropertyCardData;
  index?: number;
}

export function PropertyCard({ property, index = 0 }: PropertyCardProps) {
  const imageUrl = property.images?.[0]?.url || "/images/placeholder-property.jpg";
  const imageAlt = property.images?.[0]?.alt || property.title;
  const [shareCopied, setShareCopied] = useState(false);

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/properties/${property.slug}`;
    const shareData = {
      title: property.title,
      text: `${property.title} — ${property.district}, ${property.state} | Onyx Propcare`,
      url,
    };
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      } catch {
        // nothing
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
    >
      <Link href={`/properties/${property.slug}`} className="block group">
        <div className="relative rounded-2xl border border-cream/8 bg-onyx-900/50 backdrop-blur-sm shadow-xl shadow-black/20 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-gold/20 hover:shadow-gold/10 hover:shadow-2xl">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-onyx-950/80 via-transparent to-transparent" />

            {/* Top badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge variant={getPropertyTypeBadgeVariant(property.type)}>
                {getPropertyTypeLabel(property.type)}
              </Badge>
              {property.listingType === "LEASE" && (
                <Badge variant="outline">Lease</Badge>
              )}
              {property.listingType === "RENT" && (
                <Badge variant="outline">Rent</Badge>
              )}
            </div>

            {/* Featured badge + Compare button */}
            <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
              {property.isFeatured && (
                <Badge variant="default">Featured</Badge>
              )}
              <CompareButton propertyId={property.id} variant="card" />
            </div>

            {/* Price on image */}
            <div className="absolute bottom-3 left-3">
              <span className="font-display text-2xl font-semibold text-gold drop-shadow-lg">
                {formatPrice(property.price)}
              </span>
              {property.listingType === "LEASE" && (
                <span className="text-cream/50 text-xs ml-1">/year</span>
              )}
              {property.listingType === "RENT" && (
                <span className="text-cream/50 text-xs ml-1">/mo</span>
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
            <div className="flex items-center gap-1.5 text-cream/40 text-sm mb-3">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {property.district}, {property.state}
              </span>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5 text-cream/50 text-xs">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{formatArea(property.totalArea, property.areaUnit)}</span>
              </div>
              {property.roadAccess && (
                <div className="flex items-center gap-1.5 text-cream/50 text-xs">
                  <Route className="w-3.5 h-3.5" />
                  <span>Road Access</span>
                </div>
              )}
            </div>

            {/* Feature indicators */}
            <div className="flex items-center gap-2 pt-3 border-t border-cream/5">
              {property.waterData && (
                <div className="flex items-center gap-1 text-xs text-sky-400/70">
                  <Droplets className="w-3 h-3" />
                  <span>Water</span>
                </div>
              )}
              {(property.hasClearTitle || property.legalCheck?.titleStatus === "clear") && (
                <div className="flex items-center gap-1 text-xs text-emerald-400/70">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </div>
              )}
              {property.soilData && (
                <div className="flex items-center gap-1 text-xs text-amber-400/70">
                  <span className="w-3 h-3 flex items-center justify-center text-[10px]">🌾</span>
                  <span>{property.soilData.soilType}</span>
                </div>
              )}

              {/* Share + Price per unit on right */}
              <div className="ml-auto flex items-center gap-2">
                {property.totalArea > 0 && (
                  <span className="text-xs text-cream/30">
                    {formatPrice(property.price / property.totalArea)}/{property.areaUnit.replace(/s$/, "")}
                  </span>
                )}
                <div className="relative">
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center w-6 h-6 rounded-lg text-cream/30 hover:text-cream/70 hover:bg-cream/5 transition-colors"
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
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
