"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin, Maximize2, Compass, Route, BrickWall, ChevronLeft,
  ChevronRight, Droplets, Sprout, Scale, Satellite, Eye,
  Phone, MessageSquare, Share2, Heart, ShieldCheck, AlertTriangle,
  CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button, Badge } from "@onyx/ui";
import {
  formatPrice,
  formatPriceFull,
  formatArea,
  getPropertyTypeLabel,
  getPropertyTypeBadgeVariant,
  apiFetch,
} from "@/lib/utils";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { CompareButton } from "@/components/comparison/compare-button";

// Dynamically import Leaflet map to avoid SSR issues
const PropertyMap = dynamic(() => import("@/components/properties/property-map"), { ssr: false });

// ─── Types ───────────────────────────────────────────────

interface PropertyImage {
  id: string;
  url: string;
  alt?: string | null;
  isPrimary: boolean;
  order: number;
}

interface PropertyVideo {
  id: string;
  url: string;
  title: string | null;
  thumbnailUrl: string | null;
}

interface PropertyDocument {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface SoilData {
  soilType: string;
  ph: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  organicCarbon: number | null;
  texture: string | null;
  fertility: string | null;
  suitableCrops: string | null;
  testedAt: string | null;
  reportUrl?: string | null;
}

interface WaterData {
  waterTableDepth: number | null;
  waterQuality: string | null;
  tdsLevel: number | null;
  borewellCount: number | null;
  borewellDepth: number | null;
  canalDistance: number | null;
  riverDistance: number | null;
  rainfallAvg: number | null;
  testedAt: string | null;
  reportUrl?: string | null;
}

interface LegalCheck {
  approvalStatus: string;
  titleStatus: string;
  encumbranceCheck: boolean;
  encumbranceResult: string | null;
  litigationCheck: boolean;
  litigationResult: string | null;
  revenueRecordOk: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
  reportUrl?: string | null;
}

interface DroneMap {
  mapUrl: string;
  thumbnailUrl: string | null;
  resolution: string | null;
  capturedAt: string | null;
  notes: string | null;
}

interface PropertyDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  status: string;
  listingType: string;
  price: number;
  pricePerUnit: number | null;
  priceUnit: string | null;
  isNegotiable: boolean;
  address: string;
  village: string | null;
  taluka: string | null;
  district: string;
  state: string;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  nearbyLocations: Array<{ name: string; distanceKm: number; category?: string | null }> | null;
  totalArea: number;
  areaUnit: string;
  facing: string | null;
  roadAccess: boolean;
  roadWidth: number | null;
  boundaryWall: boolean;
  soilType: string | null;
  waterSource: string | null;
  hasClearTitle: boolean;
  isFeatured: boolean;
  viewCount: number;
  images: PropertyImage[];
  videos: PropertyVideo[];
  documents: PropertyDocument[];
  owner: { id: string; name: string; avatar: string | null; phone: string | null };
  soilData: SoilData | null;
  waterData: WaterData | null;
  legalCheck: LegalCheck | null;
  droneMap: DroneMap | null;
}

type DataTab = "soil" | "water" | "legal" | "drone";

// ─── Page Component ──────────────────────────────────────

export default function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const { data: session } = useSession();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [similar, setSimilar] = useState<PropertyCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [activeTab, setActiveTab] = useState<DataTab>("soil");
  const [inquiryForm, setInquiryForm] = useState({ name: "", phone: "", message: "" });
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [callbackSending, setCallbackSending] = useState(false);
  const [callbackSent, setCallbackSent] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ success: boolean; data: PropertyDetail }>(
          `/properties/${resolvedParams.slug}`,
          session?.user?.accessToken ? { token: session.user.accessToken } : undefined
        );
        setProperty(res.data);

        // Set default active tab based on available data
        if (res.data.soilData) setActiveTab("soil");
        else if (res.data.waterData) setActiveTab("water");
        else if (res.data.legalCheck) setActiveTab("legal");
        else if (res.data.droneMap) setActiveTab("drone");

        // Fetch similar properties
        const similarRes = await apiFetch<{ success: boolean; data: PropertyCardData[] }>(
          `/properties?type=${res.data.type}&state=${res.data.state}&limit=3`
        );
        setSimilar((similarRes.data || []).filter((p) => p.slug !== resolvedParams.slug).slice(0, 3));

        if (session?.user?.accessToken) {
          try {
            const favRes = await apiFetch<{ success: boolean; data: Array<{ propertyId: string }> }>("/favorites", { token: session.user.accessToken });
            setIsFavorited((favRes.data || []).some((f) => f.propertyId === res.data.id));
          } catch { /* ignore */ }
        }
      } catch (error) {
        console.error("Failed to fetch property:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [resolvedParams.slug, session?.user?.accessToken]);

  const handleInquiry = async () => {
    if (!property || !session?.user?.id || !inquiryForm.name || !inquiryForm.phone || !inquiryForm.message) return;
    setInquirySending(true);
    try {
      await apiFetch("/inquiries", {
        method: "POST",
        token: session.user.accessToken,
        body: JSON.stringify({
          propertyId: property.id,
          message: `[${inquiryForm.name} | ${inquiryForm.phone}] ${inquiryForm.message}`,
        }),
      });
      setInquirySent(true);
    } catch (error) {
      console.error("Inquiry failed:", error);
    } finally {
      setInquirySending(false);
    }
  };

  const handleCallback = async () => {
    if (!property || !session?.user?.id || !inquiryForm.name || !inquiryForm.phone) return;
    setCallbackSending(true);
    try {
      await apiFetch("/callbacks", {
        method: "POST",
        token: session.user.accessToken,
        body: JSON.stringify({
          name: inquiryForm.name,
          phone: inquiryForm.phone,
          propertyId: property.id,
        }),
      });
      setCallbackSent(true);
    } catch (error) {
      console.error("Callback request failed:", error);
    } finally {
      setCallbackSending(false);
    }
  };

  const handleShare = async () => {
    if (!property) return;
    const url = window.location.href;
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
      // user cancelled or clipboard unavailable — try clipboard fallback
      try {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      } catch {
        // nothing we can do
      }
    }
  };

  const toggleFavorite = async () => {
    if (!property || !session?.user?.accessToken) return;
    setFavLoading(true);
    try {
      if (isFavorited) {
        await apiFetch(`/favorites/${property.id}`, { method: "DELETE", token: session.user.accessToken });
        setIsFavorited(false);
      } else {
        await apiFetch("/favorites", {
          method: "POST",
          token: session.user.accessToken,
          body: JSON.stringify({ propertyId: property.id }),
        });
        setIsFavorited(true);
      }
    } catch { /* ignore */ }
    setFavLoading(false);
  };

  if (loading) return <PropertyDetailSkeleton />;
  if (!property) return <PropertyNotFound />;

  const images = property.images.length > 0 ? property.images : [{ id: "placeholder", url: "/images/placeholder-property.jpg", alt: property.title, isPrimary: true, order: 0 }];
  const hasDataTabs = property.soilData || property.waterData || property.legalCheck || property.droneMap;

  return (
    <div className="min-h-screen bg-onyx-950 pt-20">
      {/* ── Image Gallery ─────────────────────────────────── */}
      <section className="relative max-w-7xl mx-auto px-6 mb-8">
        <div className="relative aspect-[21/9] md:aspect-[21/8] rounded-2xl overflow-hidden bg-onyx-900/50">
          <Image
            src={images[currentImage].url}
            alt={images[currentImage].alt || property.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-onyx-950/60 via-transparent to-onyx-950/20" />

          {/* Image navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-onyx-950/60 backdrop-blur-sm border border-cream/10 flex items-center justify-center text-cream/70 hover:text-cream hover:border-cream/30 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-onyx-950/60 backdrop-blur-sm border border-cream/10 flex items-center justify-center text-cream/70 hover:text-cream hover:border-cream/30 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentImage ? "bg-gold w-6" : "bg-cream/30 hover:bg-cream/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* View count */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-onyx-950/60 backdrop-blur-sm rounded-full border border-cream/10 text-xs text-cream/50">
            <Eye className="w-3.5 h-3.5" />
            {property.viewCount} views
          </div>
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setCurrentImage(i)}
                className={`relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                  i === currentImage ? "border-gold" : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                <Image src={img.url} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Main Content ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            {/* Title + Price */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Badge variant={getPropertyTypeBadgeVariant(property.type)}>
                  {getPropertyTypeLabel(property.type)}
                </Badge>
                {property.listingType === "LEASE" && <Badge variant="outline">Lease</Badge>}
                {property.legalCheck?.approvalStatus === "APPROVED" && (
                  <Badge variant="success">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <h1 className="heading-md text-cream mb-2">{property.title}</h1>

              <div className="flex items-center gap-1.5 text-cream/40 text-sm mb-4">
                <MapPin className="w-4 h-4" />
                <span>
                  {property.address}
                  {property.village && `, ${property.village}`}
                  {property.taluka && `, ${property.taluka}`}
                  , {property.district}, {property.state}
                  {property.pincode && ` - ${property.pincode}`}
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="font-display text-4xl font-semibold text-gold">
                  {formatPrice(property.price)}
                </span>
                <span className="text-cream/30 text-sm">
                  ({formatPriceFull(property.price)})
                </span>
                {property.isNegotiable && (
                  <span className="text-xs text-cream/40 border border-cream/10 rounded-full px-2 py-0.5">Negotiable</span>
                )}
              </div>
            </motion.div>

            {/* Quick Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
            >
              <StatCard icon={<Maximize2 />} label="Total Area" value={formatArea(property.totalArea, property.areaUnit)} />
              <StatCard
                icon={<span className="text-gold text-sm">₹</span>}
                label="Price/Unit"
                value={property.pricePerUnit ? formatPrice(property.pricePerUnit) + `/${property.priceUnit || "acre"}` : formatPrice(property.price / property.totalArea) + `/${property.areaUnit}`}
              />
              {property.facing && <StatCard icon={<Compass />} label="Facing" value={property.facing} />}
              <StatCard icon={<Route />} label="Road Access" value={property.roadAccess ? `Yes${property.roadWidth ? ` (${property.roadWidth}ft)` : ""}` : "No"} />
              <StatCard icon={<BrickWall />} label="Boundary" value={property.boundaryWall ? "Walled" : "Open"} />
              {property.waterSource && <StatCard icon={<Droplets />} label="Water" value={property.waterSource} />}
              {property.soilType && <StatCard icon={<Sprout />} label="Soil" value={property.soilType} />}
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-10"
            >
              <h2 className="font-display text-xl font-semibold text-cream mb-4">About this Property</h2>
              <div className="text-cream/50 text-sm leading-relaxed whitespace-pre-line font-body">
                {property.description}
              </div>
            </motion.div>

            {property.nearbyLocations && property.nearbyLocations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="mb-10"
              >
                <h2 className="font-display text-xl font-semibold text-cream mb-4">Nearby Locations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {property.nearbyLocations.slice(0, 7).map((location, index) => (
                    <div key={`${location.name}-${index}`} className="rounded-xl border border-cream/8 bg-onyx-900/30 p-4">
                      <p className="text-sm font-medium text-cream">{location.name}</p>
                      <p className="text-xs text-cream/35 mt-1">
                        {location.distanceKm} km away
                        {location.category ? ` • ${location.category}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {property.videos && property.videos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.19 }}
                className="mb-10"
              >
                <h2 className="font-display text-xl font-semibold text-cream mb-4">Walkthrough Videos</h2>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {property.videos.map((video) => (
                    <div key={video.id} className="rounded-xl border border-cream/8 bg-onyx-900/30 p-4">
                      <video
                        src={video.url}
                        controls
                        className="h-64 w-full rounded-lg bg-black object-cover"
                        poster={video.thumbnailUrl || undefined}
                      />
                      <p className="mt-3 text-sm font-medium text-cream">{video.title || "Listing video"}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {property.documents && property.documents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.195 }}
                className="mb-10"
              >
                <h2 className="font-display text-xl font-semibold text-cream mb-4">Documents</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {property.documents.map((document) => (
                    <a
                      key={document.id}
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-cream/8 bg-onyx-900/30 p-4 transition-colors hover:border-gold/20 hover:bg-onyx-900/50"
                    >
                      <p className="text-sm font-medium text-cream">{document.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-cream/35">{document.type.replace(/_/g, " ")}</p>
                    </a>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Data Tabs ───────────────────────────────── */}
            {hasDataTabs && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-10"
              >
                <h2 className="font-display text-xl font-semibold text-cream mb-4">Property Data & Reports</h2>

                {/* Tab headers */}
                <div className="flex gap-1 border-b border-cream/8 mb-6 overflow-x-auto">
                  {property.soilData && (
                    <TabButton icon={<Sprout className="w-4 h-4" />} label="Soil Data" active={activeTab === "soil"} onClick={() => setActiveTab("soil")} />
                  )}
                  {property.waterData && (
                    <TabButton icon={<Droplets className="w-4 h-4" />} label="Water Data" active={activeTab === "water"} onClick={() => setActiveTab("water")} />
                  )}
                  {property.legalCheck && (
                    <TabButton icon={<Scale className="w-4 h-4" />} label="Legal Check" active={activeTab === "legal"} onClick={() => setActiveTab("legal")} />
                  )}
                  {property.droneMap && (
                    <TabButton icon={<Satellite className="w-4 h-4" />} label="Drone Map" active={activeTab === "drone"} onClick={() => setActiveTab("drone")} />
                  )}
                </div>

                {/* Tab content */}
                <div className="rounded-xl border border-cream/8 bg-onyx-900/30 p-6">
                  {activeTab === "soil" && property.soilData && <SoilDataTab data={property.soilData} />}
                  {activeTab === "water" && property.waterData && <WaterDataTab data={property.waterData} />}
                  {activeTab === "legal" && property.legalCheck && <LegalCheckTab data={property.legalCheck} />}
                  {activeTab === "drone" && property.droneMap && <DroneMapTab data={property.droneMap} />}
                </div>
              </motion.div>
            )}

            {/* ── Map Section ─────────────────────────────── */}
            {property.latitude && property.longitude && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mb-10"
              >
                <h2 className="font-display text-xl font-semibold text-cream mb-4">Location</h2>
                <div className="rounded-xl overflow-hidden border border-cream/8 h-[400px]">
                  <PropertyMap lat={property.latitude} lng={property.longitude} title={property.title} />
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right Sidebar ─────────────────────────────── */}
          <div className="lg:w-96 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Owner card */}
              <div className="rounded-2xl border border-cream/8 bg-onyx-900/50 backdrop-blur-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-onyx-800 border border-cream/10 flex items-center justify-center text-cream/40 text-lg font-display">
                    {property.owner.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-cream font-medium text-sm">{property.owner.name}</p>
                    <p className="text-cream/30 text-xs">Property Owner</p>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  {property.owner.phone && (
                    <a href={`tel:${property.owner.phone}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Phone className="w-4 h-4" />
                        Call
                      </Button>
                    </a>
                  )}
                  <div className="relative">
                    <Button variant="ghost" size="sm" onClick={handleShare} title="Share property">
                      <Share2 className={`w-4 h-4 transition-colors ${shareCopied ? "text-emerald-400" : ""}`} />
                    </Button>
                    {shareCopied && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-onyx-800 border border-cream/10 px-2.5 py-1 text-[11px] text-emerald-400 shadow-lg pointer-events-none">
                        Link copied!
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFavorite}
                    disabled={favLoading || !session?.user}
                    className={isFavorited ? "text-red-400" : ""}
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
                  </Button>
                </div>

                <CompareButton propertyId={property.id} variant="detail" />

                <div className="divider-gold mb-4 mt-4" />

                {/* Inquiry form */}
                {inquirySent ? (
                  <div className="text-center py-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <p className="text-cream font-medium">Inquiry Sent!</p>
                    <p className="text-cream/40 text-xs mt-1">The owner will contact you soon.</p>
                  </div>
                ) : !session?.user ? (
                  <div className="text-center py-6">
                    <MessageSquare className="w-8 h-8 text-cream/20 mx-auto mb-3" />
                    <p className="text-cream/60 text-sm mb-3">Please log in to send an inquiry.</p>
                    <Link href="/login">
                      <Button variant="outline" size="sm" className="w-full">Log in</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-cream flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gold" />
                      Send Inquiry
                    </h3>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-onyx-900/60 border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:border-gold/40"
                    />
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-onyx-900/60 border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:border-gold/40"
                    />
                    <textarea
                      placeholder="I'm interested in this property..."
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm((prev) => ({ ...prev, message: e.target.value }))}
                      rows={3}
                      className="w-full bg-onyx-900/60 border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:border-gold/40 resize-none"
                    />
                    <Button
                      onClick={handleInquiry}
                      disabled={inquirySending || !inquiryForm.name || !inquiryForm.phone || !inquiryForm.message}
                      className="w-full"
                    >
                      {inquirySending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Send Inquiry"
                      )}
                    </Button>
                    {callbackSent ? (
                      <p className="text-center text-xs text-emerald-400">Callback requested!</p>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={handleCallback}
                        disabled={callbackSending || !inquiryForm.name || !inquiryForm.phone}
                        className="w-full"
                      >
                        {callbackSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Phone className="w-4 h-4" />
                            Request Callback
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Price breakdown card */}
              <div className="rounded-2xl border border-cream/8 bg-onyx-900/50 backdrop-blur-sm p-6">
                <h3 className="text-sm font-medium text-cream mb-4">Price Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-cream/40">Total Price</span>
                    <span className="text-cream font-medium">{formatPriceFull(property.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/40">Price per {property.areaUnit}</span>
                    <span className="text-cream">{formatPrice(property.price / property.totalArea)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/40">Total Area</span>
                    <span className="text-cream">{formatArea(property.totalArea, property.areaUnit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/40">Listing Type</span>
                    <span className="text-cream">{property.listingType === "SALE" ? "For Sale" : "For Lease"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Similar Properties ──────────────────────────── */}
        {similar.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-semibold text-cream">Similar Properties</h2>
              <Link href={`/properties?type=${property.type}&state=${property.state}`} className="text-sm text-gold hover:text-gold-light transition-colors">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similar.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-cream/8 bg-onyx-900/30 p-4">
      <div className="flex items-center gap-2 text-cream/30 mb-1">
        <span className="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-cream font-medium text-sm">{value}</p>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
        active
          ? "text-gold border-gold"
          : "text-cream/40 border-transparent hover:text-cream/60 hover:border-cream/10"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Data Tab Content ────────────────────────────────────

function SoilDataTab({ data }: { data: SoilData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <DataField label="Soil Type" value={data.soilType} />
        <DataField label="pH Level" value={data.ph?.toString() || "N/A"} />
        <DataField label="Texture" value={data.texture || "N/A"} />
        <DataField label="Fertility" value={data.fertility || "N/A"} highlight />
        <DataField label="Organic Carbon" value={data.organicCarbon ? `${data.organicCarbon}%` : "N/A"} />
      </div>

      {/* NPK Levels */}
      {(data.nitrogen || data.phosphorus || data.potassium) && (
        <div>
          <h4 className="text-sm font-medium text-cream mb-3">N-P-K Levels (kg/ha)</h4>
          <div className="flex gap-4">
            <NPKBar label="N" value={data.nitrogen} max={500} color="bg-emerald-500" />
            <NPKBar label="P" value={data.phosphorus} max={100} color="bg-sky-500" />
            <NPKBar label="K" value={data.potassium} max={500} color="bg-amber-500" />
          </div>
        </div>
      )}

      {data.suitableCrops && (
        <div>
          <h4 className="text-sm font-medium text-cream mb-2">Suitable Crops</h4>
          <div className="flex flex-wrap gap-2">
            {data.suitableCrops.split(",").map((crop) => (
              <span key={crop.trim()} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">
                {crop.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.testedAt && (
        <p className="text-xs text-cream/25">Tested on {new Date(data.testedAt).toLocaleDateString("en-IN")}</p>
      )}
      {data.reportUrl && (
        <a href={data.reportUrl} target="_blank" rel="noreferrer" className="inline-flex text-sm text-gold hover:text-gold-light">
          Open soil report
        </a>
      )}
    </div>
  );
}

function WaterDataTab({ data }: { data: WaterData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <DataField label="Water Table Depth" value={data.waterTableDepth ? `${data.waterTableDepth} ft` : "N/A"} />
        <DataField label="Water Quality" value={data.waterQuality || "N/A"} highlight />
        <DataField label="TDS Level" value={data.tdsLevel ? `${data.tdsLevel} ppm` : "N/A"} />
        <DataField label="Borewells" value={data.borewellCount ? `${data.borewellCount} (${data.borewellDepth}ft deep)` : "None"} />
        <DataField label="Canal Distance" value={data.canalDistance ? `${data.canalDistance} km` : "N/A"} />
        <DataField label="River Distance" value={data.riverDistance ? `${data.riverDistance} km` : "N/A"} />
        <DataField label="Avg Rainfall" value={data.rainfallAvg ? `${data.rainfallAvg} mm/yr` : "N/A"} />
      </div>
      {data.testedAt && (
        <p className="text-xs text-cream/25">Tested on {new Date(data.testedAt).toLocaleDateString("en-IN")}</p>
      )}
      {data.reportUrl && (
        <a href={data.reportUrl} target="_blank" rel="noreferrer" className="inline-flex text-sm text-gold hover:text-gold-light">
          Open water report
        </a>
      )}
    </div>
  );
}

function LegalCheckTab({ data }: { data: LegalCheck }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LegalItem
          label="Title Status"
          status={data.titleStatus === "clear" ? "pass" : data.titleStatus === "disputed" ? "fail" : "pending"}
          detail={data.titleStatus}
        />
        <LegalItem
          label="Encumbrance Check"
          status={data.encumbranceCheck ? (data.encumbranceResult === "clear" ? "pass" : "fail") : "pending"}
          detail={data.encumbranceResult || "Not checked"}
        />
        <LegalItem
          label="Litigation Check"
          status={data.litigationCheck ? (data.litigationResult === "none" ? "pass" : "fail") : "pending"}
          detail={data.litigationResult || "Not checked"}
        />
        <LegalItem
          label="Revenue Records"
          status={data.revenueRecordOk ? "pass" : "pending"}
          detail={data.revenueRecordOk ? "Verified" : "Pending verification"}
        />
      </div>
      {data.verifiedBy && (
        <p className="text-xs text-cream/25">
          Verified by {data.verifiedBy}
          {data.verifiedAt && ` on ${new Date(data.verifiedAt).toLocaleDateString("en-IN")}`}
        </p>
      )}
      {data.reportUrl && (
        <a href={data.reportUrl} target="_blank" rel="noreferrer" className="inline-flex text-sm text-gold hover:text-gold-light">
          Open legal report
        </a>
      )}
    </div>
  );
}

function DroneMapTab({ data }: { data: DroneMap }) {
  return (
    <div className="space-y-4">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-onyx-800/50">
        <Image src={data.mapUrl} alt="Drone survey map" fill className="object-contain" />
      </div>
      <div className="flex gap-4 text-xs text-cream/40">
        {data.resolution && <span>Resolution: {data.resolution}</span>}
        {data.capturedAt && <span>Captured: {new Date(data.capturedAt).toLocaleDateString("en-IN")}</span>}
      </div>
      {data.notes && <p className="text-sm text-cream/50">{data.notes}</p>}
    </div>
  );
}

function DataField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-cream/30 mb-1">{label}</p>
      <p className={`text-sm font-medium ${highlight ? "text-gold" : "text-cream"}`}>{value}</p>
    </div>
  );
}

function NPKBar({ label, value, max, color }: { label: string; value: number | null; max: number; color: string }) {
  const pct = value ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex-1">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-cream/40">{label}</span>
        <span className="text-xs text-cream">{value || 0}</span>
      </div>
      <div className="h-2 bg-onyx-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LegalItem({ label, status, detail }: { label: string; status: "pass" | "fail" | "pending"; detail: string }) {
  const icons = {
    pass: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    fail: <XCircle className="w-4 h-4 text-red-400" />,
    pending: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  };
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-onyx-900/40">
      {icons[status]}
      <div>
        <p className="text-sm text-cream font-medium">{label}</p>
        <p className="text-xs text-cream/40 capitalize">{detail}</p>
      </div>
    </div>
  );
}

// ─── Loading & Error States ──────────────────────────────

function PropertyDetailSkeleton() {
  return (
    <div className="min-h-screen bg-onyx-950 pt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="aspect-[21/9] rounded-2xl bg-onyx-900/50 animate-pulse mb-8" />
        <div className="flex gap-8">
          <div className="flex-1 space-y-6">
            <div className="h-8 w-2/3 bg-onyx-800/50 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-onyx-800/50 rounded animate-pulse" />
            <div className="h-12 w-1/3 bg-onyx-800/50 rounded animate-pulse" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-onyx-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
          <div className="w-96 h-96 bg-onyx-900/50 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function PropertyNotFound() {
  return (
    <div className="min-h-screen bg-onyx-950 pt-20 flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-3xl text-cream mb-4">Property Not Found</h1>
        <p className="text-cream/40 mb-6">The property you are looking for does not exist or has been removed.</p>
        <Link href="/properties">
          <Button>Browse Properties</Button>
        </Link>
      </div>
    </div>
  );
}
