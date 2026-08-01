"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  BrickWall,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Droplets,
  Eye,
  Heart,
  Loader2,
  MapPin,
  Maximize2,
  MessageSquare,
  Phone,
  Route,
  Satellite,
  Scale,
  Share2,
  ShieldCheck,
  Sprout,
  X,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Badge, Button } from "@onyx/ui";
import { CompareButton } from "@/components/comparison/compare-button";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import type { PropertyDetail, SoilData, WaterData, LegalCheck, DroneMap } from "@/lib/public-api";
import {
  apiFetch,
  formatArea,
  formatPrice,
  formatPriceFull,
  getPropertyTypeBadgeVariant,
  getPropertyTypeLabel,
  buildPropertyShareText,
} from "@/lib/utils";
import { trackLead } from "@/lib/analytics";

const PropertyMap = dynamic(() => import("@/components/properties/property-map"), { ssr: false });

type DataTab = "soil" | "water" | "legal" | "drone";

interface PropertyDetailPageClientProps {
  slug: string;
  initialProperty: PropertyDetail;
  initialSimilar: PropertyCardData[];
}

export function PropertyDetailPageClient({
  slug,
  initialProperty,
  initialSimilar,
}: PropertyDetailPageClientProps) {
  const { data: session } = useSession();
  const didHydrateRef = useRef(false);

  const [property, setProperty] = useState<PropertyDetail | null>(initialProperty);
  const [similar, setSimilar] = useState<PropertyCardData[]>(initialSimilar);
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DataTab>(() => getDefaultTab(initialProperty));
  const [inquiryForm, setInquiryForm] = useState({ name: "", phone: "", message: "" });
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [callbackSending, setCallbackSending] = useState(false);
  const [callbackSent, setCallbackSent] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    async function syncPropertyState() {
      if (!session?.user?.accessToken && !didHydrateRef.current) {
        didHydrateRef.current = true;
        return;
      }

      didHydrateRef.current = true;
      setLoading(true);
      try {
        const authOptions = session?.user?.accessToken ? { token: session.user.accessToken } : undefined;
        const res = await apiFetch<{ success: boolean; data: PropertyDetail }>(
          `/properties/${slug}`,
          authOptions
        );
        setProperty(res.data);
        setActiveTab(getDefaultTab(res.data));

        const similarRes = await apiFetch<{ success: boolean; data: PropertyCardData[] }>(
          `/properties?type=${res.data.type}&state=${res.data.state}&limit=3`,
          authOptions
        );
        setSimilar((similarRes.data || []).filter((item) => item.slug !== slug).slice(0, 3));
      } catch (error) {
        console.error("Failed to sync property:", error);
      } finally {
        setLoading(false);
      }
    }

    syncPropertyState();
  }, [session?.user?.accessToken, slug]);

  useEffect(() => {
    async function loadFavorites() {
      if (!session?.user?.accessToken || !property) return;

      try {
        const favRes = await apiFetch<{ success: boolean; data: Array<{ propertyId: string }> }>("/favorites", {
          token: session.user.accessToken,
        });
        setIsFavorited((favRes.data || []).some((favorite) => favorite.propertyId === property.id));
      } catch {
        // ignore favorites load failures
      }
    }

    loadFavorites();
  }, [property?.id, session?.user?.accessToken]);

  // Lightbox: keyboard navigation + lock body scroll while open
  useEffect(() => {
    if (!lightboxOpen) return;
    const count = property?.images?.length ?? 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      else if (e.key === "ArrowRight" && count > 1) setCurrentImage((p) => (p + 1) % count);
      else if (e.key === "ArrowLeft" && count > 1) setCurrentImage((p) => (p - 1 + count) % count);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen, property?.images?.length]);

  const handleInquiry = async () => {
    if (!property || !inquiryForm.name || !inquiryForm.phone || !inquiryForm.message) return;
    setInquirySending(true);
    try {
      await apiFetch("/inquiries", {
        method: "POST",
        token: session?.user?.accessToken,
        body: JSON.stringify({
          propertyId: property.id,
          message: `[${inquiryForm.name} | ${inquiryForm.phone}] ${inquiryForm.message}`,
          guestName: inquiryForm.name,
          guestPhone: inquiryForm.phone,
        }),
      });
      setInquirySent(true);
      trackLead("inquiry", property.id);
    } catch (error) {
      console.error("Inquiry failed:", error);
    } finally {
      setInquirySending(false);
    }
  };

  const handleCallback = async () => {
    if (!property || !inquiryForm.name || !inquiryForm.phone) return;
    setCallbackSending(true);
    try {
      await apiFetch("/callbacks", {
        method: "POST",
        token: session?.user?.accessToken,
        body: JSON.stringify({
          name: inquiryForm.name,
          phone: inquiryForm.phone,
          propertyId: property.id,
        }),
      });
      setCallbackSent(true);
      trackLead("callback", property.id);
    } catch (error) {
      console.error("Callback request failed:", error);
    } finally {
      setCallbackSending(false);
    }
  };

  const handleShare = async () => {
    if (!property) return;
    const url = window.location.href;
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
        // nothing else to do
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
    } catch {
      // ignore favorite mutation failures for now
    } finally {
      setFavLoading(false);
    }
  };

  if (loading && !property) return <PropertyDetailSkeleton />;
  if (!property) return <PropertyNotFound />;

  const hasImage = property.images.length > 0;
  const images = hasImage
    ? property.images
    : [{ id: "placeholder", url: "/images/placeholder-property.svg", alt: property.title, isPrimary: true, order: 0 }];
  const hasDataTabs = property.soilData || property.waterData || property.legalCheck || property.droneMap;

  return (
    <div className="min-h-screen bg-onyx-950 pt-20">
      <section className="relative mx-auto mb-8 max-w-7xl px-6">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-onyx-800 sm:aspect-[16/10]">
          {/* Full (uncropped) image; click to open full screen */}
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="View image full screen"
            className="absolute inset-0 z-0 cursor-zoom-in"
          >
            <Image
              src={images[currentImage].url}
              alt={images[currentImage].alt || property.title}
              fill
              unoptimized={!hasImage}
              className="object-contain"
              priority
            />
          </button>

          <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm">
            <Maximize2 className="h-3.5 w-3.5" />
            Click to enlarge
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur-sm transition-all hover:border-white/40 hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur-sm transition-all hover:border-white/40 hover:text-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      index === currentImage ? "w-6 bg-white" : "bg-white/50 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          <div className="pointer-events-none absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm">
            <Eye className="h-3.5 w-3.5" />
            {property.viewCount} views
          </div>
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setCurrentImage(index)}
                className={`relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  index === currentImage ? "border-gold" : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                <Image src={image.url} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 flex-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Badge variant={getPropertyTypeBadgeVariant(property.type)}>
                  {getPropertyTypeLabel(property.type)}
                </Badge>
                {property.listingType === "LEASE" && <Badge variant="outline">Lease</Badge>}
                {property.legalCheck?.approvalStatus === "APPROVED" && (
                  <Badge variant="success">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>

              <h1 className="heading-md mb-2 text-cream">{property.title}</h1>

              <div className="mb-4 flex items-center gap-1.5 text-sm text-cream/86">
                <MapPin className="h-4 w-4" />
                <span>
                  {property.address}
                  {property.village && `, ${property.village}`}
                  {property.taluka && `, ${property.taluka}`}, {property.district}, {property.state}
                  {property.pincode && ` - ${property.pincode}`}
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="font-display text-4xl font-semibold text-gold">{formatPrice(property.price)}</span>
                <span className="text-sm text-cream/82">({formatPriceFull(property.price)})</span>
                {property.isNegotiable && (
                  <span className="rounded-full border border-cream/10 px-2 py-0.5 text-xs text-cream/86">
                    Negotiable
                  </span>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4"
            >
              <StatCard icon={<Maximize2 />} label="Total Area" value={formatArea(property.totalArea, property.areaUnit)} />
              <StatCard
                icon={<span className="text-sm text-gold">Rs</span>}
                label="Price/Unit"
                value={
                  property.pricePerUnit
                    ? `${formatPrice(property.pricePerUnit)}/${property.priceUnit || "acre"}`
                    : `${formatPrice(property.price / property.totalArea)}/${property.areaUnit}`
                }
              />
              {property.facing && <StatCard icon={<Compass />} label="Facing" value={property.facing} />}
              <StatCard
                icon={<Route />}
                label="Road Access"
                value={property.roadAccess ? `Yes${property.roadWidth ? ` (${property.roadWidth}ft)` : ""}` : "No"}
              />
              <StatCard icon={<BrickWall />} label="Boundary" value={property.boundaryWall ? "Walled" : "Open"} />
              {property.waterSource && <StatCard icon={<Droplets />} label="Water" value={property.waterSource} />}
              {property.soilType && <StatCard icon={<Sprout />} label="Soil" value={property.soilType} />}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-10"
            >
              <h2 className="mb-4 font-display text-xl font-semibold text-cream">About this Property</h2>
              <div className="whitespace-pre-line text-sm leading-relaxed text-cream/78 font-body">
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
                <h2 className="mb-4 font-display text-xl font-semibold text-cream">Nearby Locations</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {property.nearbyLocations.slice(0, 7).map((location, index) => (
                    <div key={`${location.name}-${index}`} className="rounded-xl border border-cream/8 bg-onyx-900/30 p-4">
                      <p className="text-sm font-medium text-cream">{location.name}</p>
                      <p className="mt-1 text-xs text-cream/84">
                        {location.distanceKm} km away
                        {location.category ? ` - ${location.category}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {property.videos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.19 }}
                className="mb-10"
              >
                <h2 className="mb-4 font-display text-xl font-semibold text-cream">Walkthrough Videos</h2>
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

            {property.documents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.195 }}
                className="mb-10"
              >
                <h2 className="mb-4 font-display text-xl font-semibold text-cream">Documents</h2>
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
                      <p className="mt-1 text-xs uppercase tracking-wide text-cream/84">
                        {document.type.replace(/_/g, " ")}
                      </p>
                    </a>
                  ))}
                </div>
              </motion.div>
            )}

            {hasDataTabs && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-10"
              >
                <h2 className="mb-4 font-display text-xl font-semibold text-cream">Property Data & Reports</h2>

                <div className="mb-6 flex gap-1 overflow-x-auto border-b border-cream/8">
                  {property.soilData && (
                    <TabButton
                      icon={<Sprout className="h-4 w-4" />}
                      label="Soil Data"
                      active={activeTab === "soil"}
                      onClick={() => setActiveTab("soil")}
                    />
                  )}
                  {property.waterData && (
                    <TabButton
                      icon={<Droplets className="h-4 w-4" />}
                      label="Water Data"
                      active={activeTab === "water"}
                      onClick={() => setActiveTab("water")}
                    />
                  )}
                  {property.legalCheck && (
                    <TabButton
                      icon={<Scale className="h-4 w-4" />}
                      label="Legal Check"
                      active={activeTab === "legal"}
                      onClick={() => setActiveTab("legal")}
                    />
                  )}
                  {property.droneMap && (
                    <TabButton
                      icon={<Satellite className="h-4 w-4" />}
                      label="Drone Map"
                      active={activeTab === "drone"}
                      onClick={() => setActiveTab("drone")}
                    />
                  )}
                </div>

                <div className="rounded-xl border border-cream/8 bg-onyx-900/30 p-6">
                  {activeTab === "soil" && property.soilData && <SoilDataTab data={property.soilData} />}
                  {activeTab === "water" && property.waterData && <WaterDataTab data={property.waterData} />}
                  {activeTab === "legal" && property.legalCheck && <LegalCheckTab data={property.legalCheck} />}
                  {activeTab === "drone" && property.droneMap && <DroneMapTab data={property.droneMap} />}
                </div>
              </motion.div>
            )}

            {property.latitude !== null && property.longitude !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mb-10"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-cream">Location</h2>
                    <p className="mt-1 text-sm text-cream/84">
                      Exact property pin based on the seller&apos;s selected map location.
                    </p>
                  </div>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${property.latitude}&mlon=${property.longitude}#map=16/${property.latitude}/${property.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-gold/20 px-4 py-2 text-sm text-gold hover:bg-gold/10"
                  >
                    <MapPin className="h-4 w-4" />
                    Open in OpenStreetMap
                  </a>
                </div>
                <div className="h-[400px] overflow-hidden rounded-xl border border-cream/8">
                  <PropertyMap lat={property.latitude} lng={property.longitude} title={property.title} />
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex-shrink-0 lg:w-96">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-cream/8 bg-onyx-900/50 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cream/10 bg-onyx-800 text-lg font-display text-cream/86">
                    {property.owner.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cream">{property.owner.name}</p>
                    <p className="text-xs text-cream/82">Property Owner</p>
                  </div>
                </div>

                <div className="mb-4 flex gap-2">
                  {session?.user && property.owner.phone && (
                    <a href={`tel:${property.owner.phone}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Phone className="h-4 w-4" />
                        Call
                      </Button>
                    </a>
                  )}
                  {!session?.user && (
                    <Link href={`/login?callbackUrl=${encodeURIComponent(`/properties/${property.slug}`)}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Phone className="h-4 w-4" />
                        Log in to call
                      </Button>
                    </Link>
                  )}
                  {session?.user && !property.owner.phone && (
                    <Button variant="outline" size="sm" disabled className="flex-1">
                      <Phone className="h-4 w-4" />
                      Phone unavailable
                    </Button>
                  )}
                  <div className="relative">
                    <Button variant="ghost" size="sm" onClick={handleShare} title="Share property">
                      <Share2 className={`h-4 w-4 transition-colors ${shareCopied ? "text-emerald-400" : ""}`} />
                    </Button>
                    {shareCopied && (
                      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-cream/10 bg-onyx-800 px-2.5 py-1 text-[11px] text-emerald-400 shadow-lg">
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
                    <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
                  </Button>
                </div>

                <CompareButton propertyId={property.id} variant="detail" />

                <div className="divider-gold mb-4 mt-4" />

                {inquirySent ? (
                  <div className="py-6 text-center">
                    <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
                    <p className="font-medium text-cream">Inquiry Sent!</p>
                    <p className="mt-1 text-xs text-cream/86">The owner will contact you soon.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-medium text-cream">
                      <MessageSquare className="h-4 w-4 text-gold" />
                      Send Inquiry
                    </h3>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={inquiryForm.name}
                      onChange={(event) => setInquiryForm((prev) => ({ ...prev, name: event.target.value }))}
                      className="w-full rounded-lg border border-cream/10 bg-onyx-900/60 px-3 py-2 text-sm text-cream placeholder:text-cream/80 focus:border-gold/40 focus:outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={inquiryForm.phone}
                      onChange={(event) => setInquiryForm((prev) => ({ ...prev, phone: event.target.value }))}
                      className="w-full rounded-lg border border-cream/10 bg-onyx-900/60 px-3 py-2 text-sm text-cream placeholder:text-cream/80 focus:border-gold/40 focus:outline-none"
                    />
                    <textarea
                      placeholder="I'm interested in this property..."
                      value={inquiryForm.message}
                      onChange={(event) => setInquiryForm((prev) => ({ ...prev, message: event.target.value }))}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-cream/10 bg-onyx-900/60 px-3 py-2 text-sm text-cream placeholder:text-cream/80 focus:border-gold/40 focus:outline-none"
                    />
                    <Button
                      onClick={handleInquiry}
                      disabled={inquirySending || !inquiryForm.name || !inquiryForm.phone || !inquiryForm.message}
                      className="w-full"
                    >
                      {inquirySending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Inquiry"}
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
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Phone className="h-4 w-4" />
                            Request Callback
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-cream/8 bg-onyx-900/50 p-6 backdrop-blur-sm">
                <h3 className="mb-4 text-sm font-medium text-cream">Price Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-cream/86">Total Price</span>
                    <span className="font-medium text-cream">{formatPriceFull(property.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/86">Price per {property.areaUnit}</span>
                    <span className="text-cream">{formatPrice(property.price / property.totalArea)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/86">Total Area</span>
                    <span className="text-cream">{formatArea(property.totalArea, property.areaUnit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/86">Listing Type</span>
                    <span className="text-cream">{property.listingType === "SALE" ? "For Sale" : "For Lease"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-cream">Similar Properties</h2>
              <Link
                href={`/properties?type=${property.type}&state=${property.state}`}
                className="text-sm text-gold transition-colors hover:text-gold-light"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((item, index) => (
                <PropertyCard key={item.id} property={item} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </section>

      {/* Full-screen image lightbox — shows the complete image, uncropped */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/90 transition-all hover:bg-white/20 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {images.length > 1 && (
              <div className="absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                {currentImage + 1} / {images.length}
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
                  }}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/90 transition-all hover:bg-white/20 hover:text-white"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImage((prev) => (prev + 1) % images.length);
                  }}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/90 transition-all hover:bg-white/20 hover:text-white"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={images[currentImage].url}
              src={images[currentImage].url}
              alt={images[currentImage].alt || property.title}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] max-w-[94vw] object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getDefaultTab(property: PropertyDetail): DataTab {
  if (property.soilData) return "soil";
  if (property.waterData) return "water";
  if (property.legalCheck) return "legal";
  return "drone";
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-cream/8 bg-onyx-900/30 p-4">
      <div className="mb-1 flex items-center gap-2 text-cream/82">
        <span className="flex h-4 w-4 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-medium text-cream">{value}</p>
    </div>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-all ${
        active ? "border-gold text-gold" : "border-transparent text-cream/86 hover:border-cream/10 hover:text-cream/81"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SoilDataTab({ data }: { data: SoilData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <DataField label="Soil Type" value={data.soilType} />
        <DataField label="pH Level" value={data.ph?.toString() || "N/A"} />
        <DataField label="Texture" value={data.texture || "N/A"} />
        <DataField label="Fertility" value={data.fertility || "N/A"} highlight />
        <DataField label="Organic Carbon" value={data.organicCarbon ? `${data.organicCarbon}%` : "N/A"} />
      </div>

      {(data.nitrogen || data.phosphorus || data.potassium) && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-cream">N-P-K Levels (kg/ha)</h4>
          <div className="flex gap-4">
            <NPKBar label="N" value={data.nitrogen} max={500} color="bg-emerald-500" />
            <NPKBar label="P" value={data.phosphorus} max={100} color="bg-sky-500" />
            <NPKBar label="K" value={data.potassium} max={500} color="bg-amber-500" />
          </div>
        </div>
      )}

      {data.suitableCrops && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-cream">Suitable Crops</h4>
          <div className="flex flex-wrap gap-2">
            {data.suitableCrops.split(",").map((crop) => (
              <span
                key={crop.trim()}
                className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400"
              >
                {crop.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.testedAt && <p className="text-xs text-cream/80">Tested on {new Date(data.testedAt).toLocaleDateString("en-IN")}</p>}
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <DataField label="Water Table Depth" value={data.waterTableDepth ? `${data.waterTableDepth} ft` : "N/A"} />
        <DataField label="Water Quality" value={data.waterQuality || "N/A"} highlight />
        <DataField label="TDS Level" value={data.tdsLevel ? `${data.tdsLevel} ppm` : "N/A"} />
        <DataField label="Borewells" value={data.borewellCount ? `${data.borewellCount} (${data.borewellDepth}ft deep)` : "None"} />
        <DataField label="Canal Distance" value={data.canalDistance ? `${data.canalDistance} km` : "N/A"} />
        <DataField label="River Distance" value={data.riverDistance ? `${data.riverDistance} km` : "N/A"} />
        <DataField label="Avg Rainfall" value={data.rainfallAvg ? `${data.rainfallAvg} mm/yr` : "N/A"} />
      </div>
      {data.testedAt && <p className="text-xs text-cream/80">Tested on {new Date(data.testedAt).toLocaleDateString("en-IN")}</p>}
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        <p className="text-xs text-cream/80">
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
      <div className="relative aspect-video overflow-hidden rounded-lg bg-onyx-800/50">
        <Image src={data.mapUrl} alt="Drone survey map" fill className="object-contain" />
      </div>
      <div className="flex gap-4 text-xs text-cream/86">
        {data.resolution && <span>Resolution: {data.resolution}</span>}
        {data.capturedAt && <span>Captured: {new Date(data.capturedAt).toLocaleDateString("en-IN")}</span>}
      </div>
      {data.notes && <p className="text-sm text-cream/78">{data.notes}</p>}
    </div>
  );
}

function DataField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-xs text-cream/82">{label}</p>
      <p className={`text-sm font-medium ${highlight ? "text-gold" : "text-cream"}`}>{value}</p>
    </div>
  );
}

function NPKBar({ label, value, max, color }: { label: string; value: number | null; max: number; color: string }) {
  const pct = value ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex-1">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs text-cream/86">{label}</span>
        <span className="text-xs text-cream">{value || 0}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-onyx-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LegalItem({
  label,
  status,
  detail,
}: {
  label: string;
  status: "pass" | "fail" | "pending";
  detail: string;
}) {
  const icons = {
    pass: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    fail: <XCircle className="h-4 w-4 text-red-400" />,
    pending: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  };
  return (
    <div className="flex items-start gap-3 rounded-lg bg-onyx-900/40 p-3">
      {icons[status]}
      <div>
        <p className="text-sm font-medium text-cream">{label}</p>
        <p className="text-xs capitalize text-cream/86">{detail}</p>
      </div>
    </div>
  );
}

function PropertyDetailSkeleton() {
  return (
    <div className="min-h-screen bg-onyx-950 pt-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 aspect-[21/9] animate-pulse rounded-2xl bg-onyx-900/50" />
        <div className="flex gap-8">
          <div className="flex-1 space-y-6">
            <div className="h-8 w-2/3 animate-pulse rounded bg-onyx-800/50" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-onyx-800/50" />
            <div className="h-12 w-1/3 animate-pulse rounded bg-onyx-800/50" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-xl bg-onyx-800/50" />
              ))}
            </div>
          </div>
          <div className="h-96 w-96 animate-pulse rounded-2xl bg-onyx-900/50" />
        </div>
      </div>
    </div>
  );
}

function PropertyNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-onyx-950 pt-20">
      <div className="text-center">
        <h1 className="mb-4 font-display text-3xl text-cream">Property Not Found</h1>
        <p className="mb-6 text-cream/86">The property you are looking for does not exist or has been removed.</p>
        <Link href="/properties">
          <Button>Browse Properties</Button>
        </Link>
      </div>
    </div>
  );
}
