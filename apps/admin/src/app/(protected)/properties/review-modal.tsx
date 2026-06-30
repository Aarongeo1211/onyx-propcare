"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X, MapPin, Maximize2, Route, BrickWall, Droplets, Sprout, Scale,
  Satellite, ExternalLink, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  Loader2, Star, FileText, Video as VideoIcon, Image as ImageIcon, Phone,
  Mail, User, Calendar, Tag,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PropertyDetail {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  listingType: string;
  price: number;
  totalArea: number;
  areaUnit: string;
  address: string;
  village?: string | null;
  taluka?: string | null;
  district: string;
  state: string;
  pincode?: string | null;
  facing?: string | null;
  roadAccess: boolean;
  roadWidth?: number | null;
  boundaryWall: boolean;
  soilType?: string | null;
  waterSource?: string | null;
  hasClearTitle: boolean;
  isFeatured: boolean;
  createdAt: string;
  nearbyLocations?: Array<{ name: string; distanceKm: number; category?: string | null }> | null;
  owner: { id: string; name: string; email: string; phone?: string | null };
  images: Array<{ id: string; url: string; alt?: string | null; isPrimary: boolean; order: number }>;
  videos: Array<{ id: string; url: string; title?: string | null; thumbnailUrl?: string | null }>;
  documents: Array<{ id: string; name: string; url: string; type: string }>;
  soilData?: {
    soilType: string; ph?: number | null; nitrogen?: number | null; phosphorus?: number | null;
    potassium?: number | null; organicCarbon?: number | null; texture?: string | null;
    fertility?: string | null; suitableCrops?: string | null; reportUrl?: string | null;
    testedAt?: string | null; approvalStatus: string; reviewNotes?: string | null;
  } | null;
  waterData?: {
    waterTableDepth?: number | null; waterQuality?: string | null; tdsLevel?: number | null;
    borewellCount?: number | null; borewellDepth?: number | null; canalDistance?: number | null;
    riverDistance?: number | null; rainfallAvg?: number | null; reportUrl?: string | null;
    testedAt?: string | null; approvalStatus: string; reviewNotes?: string | null;
  } | null;
  legalCheck?: {
    titleStatus: string; encumbranceCheck: boolean; encumbranceResult?: string | null;
    litigationCheck: boolean; litigationResult?: string | null; revenueRecordOk: boolean;
    verifiedBy?: string | null; verifiedAt?: string | null; reportUrl?: string | null;
    approvalStatus: string; reviewNotes?: string | null;
  } | null;
  droneMap?: {
    mapUrl: string; thumbnailUrl?: string | null; resolution?: string | null;
    capturedAt?: string | null; notes?: string | null;
  } | null;
}

interface ReviewModalProps {
  propertyId: string | null;
  token: string;
  onClose: () => void;
  onUpdated: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(2)} Cr`;
  if (price >= 100_000) return `₹${(price / 100_000).toFixed(2)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PENDING_REVIEW: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DRAFT: "bg-cream/5 text-cream/40 border-cream/10",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  SOLD: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  INACTIVE: "bg-cream/5 text-cream/25 border-cream/8",
};

function reviewBadgeClass(status?: string | null) {
  if (status === "APPROVED") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (status === "REJECTED") return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-amber-500/10 text-amber-400 border-amber-500/20";
}

function docTypeLabel(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function PropertyReviewModal({ propertyId, token, onClose, onUpdated }: ReviewModalProps) {
  const [detail, setDetail] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [dataTab, setDataTab] = useState<"soil" | "water" | "legal" | "drone">("soil");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch full detail on open
  useEffect(() => {
    if (!propertyId) { setDetail(null); return; }
    setLoading(true);
    setDetail(null);
    fetch(`${API_URL}/api/v1/admin/properties/${propertyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setDetail(d.data);
          // Pre-populate notes from existing review notes
          const n: Record<string, string> = {};
          if (d.data.soilData?.reviewNotes) n["soil"] = d.data.soilData.reviewNotes;
          if (d.data.waterData?.reviewNotes) n["water"] = d.data.waterData.reviewNotes;
          if (d.data.legalCheck?.reviewNotes) n["legal"] = d.data.legalCheck.reviewNotes;
          setNotes(n);
          // Default to first available tab
          if (d.data.soilData) setDataTab("soil");
          else if (d.data.waterData) setDataTab("water");
          else if (d.data.legalCheck) setDataTab("legal");
          else if (d.data.droneMap) setDataTab("drone");
        }
      })
      .finally(() => setLoading(false));
  }, [propertyId, token]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightbox !== null) { setLightbox(null); return; }
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, lightbox]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const patchStatus = useCallback(async (newStatus: string) => {
    if (!detail) return;
    setActionLoading(`status-${newStatus}`);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/properties/${detail.id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const d = await res.json();
      if (d.success) { onUpdated(); onClose(); }
      else alert(d.error || "Failed to update status");
    } finally { setActionLoading(null); }
  }, [detail, token, onUpdated, onClose]);

  const patchDataReview = useCallback(async (section: "soil" | "water" | "legal", approvalStatus: "APPROVED" | "REJECTED") => {
    if (!detail) return;
    setActionLoading(`data-${section}-${approvalStatus}`);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/properties/${detail.id}/review-data`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ section, approvalStatus, reviewNotes: notes[section] || "" }),
      });
      const d = await res.json();
      if (d.success) {
        // Update local state to reflect the change without refetching
        setDetail((prev) => {
          if (!prev) return prev;
          const key = section === "soil" ? "soilData" : section === "water" ? "waterData" : "legalCheck";
          const existing = prev[key];
          if (!existing) return prev;
          return { ...prev, [key]: { ...existing, approvalStatus, reviewNotes: notes[section] || "" } };
        });
        onUpdated();
      } else {
        alert(d.error || "Failed to update review");
      }
    } finally { setActionLoading(null); }
  }, [detail, token, notes, onUpdated]);

  if (!propertyId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 flex h-full w-full max-w-7xl flex-col bg-[#0d0d0d] shadow-2xl lg:flex-row">

        {/* ── Left: content (scrollable) ──────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <ModalSkeleton />
          ) : !detail ? (
            <div className="flex h-full items-center justify-center text-cream/30 text-sm">Failed to load property.</div>
          ) : (
            <>
              {/* Image gallery */}
              <div className="relative">
                {detail.images.length > 0 ? (
                  <>
                    <div className="grid grid-cols-4 grid-rows-2 gap-1 h-64 lg:h-80">
                      {detail.images.slice(0, 5).map((img, i) => (
                        <button
                          key={img.id}
                          onClick={() => setLightbox(i)}
                          className={`relative overflow-hidden bg-onyx-900 ${i === 0 ? "col-span-2 row-span-2" : ""}`}
                        >
                          <img
                            src={img.url}
                            alt={img.alt || detail.title}
                            className="h-full w-full object-cover transition-transform hover:scale-105"
                            loading={i === 0 ? "eager" : "lazy"}
                          />
                          {i === 4 && detail.images.length > 5 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-medium text-white">
                              +{detail.images.length - 5} more
                            </div>
                          )}
                        </button>
                      ))}
                      {detail.images.length < 2 && (
                        Array.from({ length: 4 }).map((_, i) => (
                          <div key={`placeholder-${i}`} className="bg-onyx-900/40" />
                        ))
                      )}
                    </div>
                    <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                      <ImageIcon className="h-3.5 w-3.5" />
                      {detail.images.length} photo{detail.images.length !== 1 ? "s" : ""}
                    </span>
                  </>
                ) : (
                  <div className="flex h-40 items-center justify-center bg-onyx-900/50 text-cream/20 text-sm">
                    No images uploaded
                  </div>
                )}
              </div>

              <div className="p-6 lg:p-8 space-y-8">
                {/* Title + badges */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-0.5 text-xs text-gold">
                      {detail.type.replace(/_/g, " ")}
                    </span>
                    <span className="rounded-full border border-cream/10 px-3 py-0.5 text-xs text-cream/50">
                      {detail.listingType}
                    </span>
                    <span className={`rounded-full border px-3 py-0.5 text-xs ${statusColors[detail.status] || statusColors.DRAFT}`}>
                      {detail.status.replace(/_/g, " ")}
                    </span>
                    {detail.isFeatured && (
                      <span className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-3 py-0.5 text-xs text-gold">
                        <Star className="h-3 w-3 fill-gold" /> Featured
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-cream">{detail.title}</h2>
                  <div className="mt-1.5 flex items-center gap-1.5 text-sm text-cream/40">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>
                      {detail.address}
                      {detail.village && `, ${detail.village}`}
                      {detail.taluka && `, ${detail.taluka}`}
                      {`, ${detail.district}, ${detail.state}`}
                      {detail.pincode && ` – ${detail.pincode}`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-cream/25">
                    Submitted {new Date(detail.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard icon={<Maximize2 className="h-4 w-4" />} label="Area" value={`${detail.totalArea} ${detail.areaUnit}`} />
                  <StatCard icon={<Route className="h-4 w-4" />} label="Road" value={detail.roadAccess ? `Yes${detail.roadWidth ? ` (${detail.roadWidth}ft)` : ""}` : "No"} />
                  <StatCard icon={<BrickWall className="h-4 w-4" />} label="Boundary" value={detail.boundaryWall ? "Walled" : "Open"} />
                  {detail.facing && <StatCard icon={<Tag className="h-4 w-4" />} label="Facing" value={detail.facing} />}
                  {detail.waterSource && <StatCard icon={<Droplets className="h-4 w-4" />} label="Water" value={detail.waterSource} />}
                  {detail.soilType && <StatCard icon={<Sprout className="h-4 w-4" />} label="Soil" value={detail.soilType} />}
                </div>

                {/* Description */}
                <div>
                  <h3 className="mb-2 text-sm font-medium uppercase tracking-wider text-cream/30">Description</h3>
                  <p className="text-sm leading-relaxed text-cream/60 whitespace-pre-line">{detail.description}</p>
                </div>

                {/* Videos */}
                {detail.videos.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-cream/30">
                      <VideoIcon className="h-4 w-4" />
                      Walkthrough Videos ({detail.videos.length})
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {detail.videos.map((v) => (
                        <div key={v.id} className="rounded-xl border border-cream/8 bg-onyx-900/30 p-3">
                          <video
                            src={v.url}
                            controls
                            poster={v.thumbnailUrl || undefined}
                            preload="metadata"
                            className="h-48 w-full rounded-lg bg-black object-cover"
                          />
                          <p className="mt-2 text-xs text-cream/50">{v.title || "Listing video"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {detail.documents.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-cream/30">
                      <FileText className="h-4 w-4" />
                      Documents ({detail.documents.length})
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {detail.documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center justify-between rounded-xl border border-cream/8 bg-onyx-900/30 px-4 py-3 transition-colors hover:border-gold/20 hover:bg-onyx-900/50"
                        >
                          <div>
                            <p className="text-sm font-medium text-cream group-hover:text-gold transition-colors">{doc.name}</p>
                            <p className="text-xs text-cream/30 mt-0.5">{docTypeLabel(doc.type)}</p>
                          </div>
                          <ExternalLink className="h-4 w-4 shrink-0 text-cream/20 group-hover:text-gold transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data reports tabs */}
                {(detail.soilData || detail.waterData || detail.legalCheck || detail.droneMap) && (
                  <div>
                    <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-cream/30">Data Reports</h3>
                    <div className="rounded-2xl border border-cream/8 bg-onyx-900/30 overflow-hidden">
                      {/* Tab headers */}
                      <div className="flex border-b border-cream/5 overflow-x-auto">
                        {detail.soilData && (
                          <DataTabBtn icon={<Sprout className="h-4 w-4" />} label="Soil" active={dataTab === "soil"} status={detail.soilData.approvalStatus} onClick={() => setDataTab("soil")} />
                        )}
                        {detail.waterData && (
                          <DataTabBtn icon={<Droplets className="h-4 w-4" />} label="Water" active={dataTab === "water"} status={detail.waterData.approvalStatus} onClick={() => setDataTab("water")} />
                        )}
                        {detail.legalCheck && (
                          <DataTabBtn icon={<Scale className="h-4 w-4" />} label="Legal" active={dataTab === "legal"} status={detail.legalCheck.approvalStatus} onClick={() => setDataTab("legal")} />
                        )}
                        {detail.droneMap && (
                          <DataTabBtn icon={<Satellite className="h-4 w-4" />} label="Drone" active={dataTab === "drone"} status={null} onClick={() => setDataTab("drone")} />
                        )}
                      </div>

                      <div className="p-5">
                        {dataTab === "soil" && detail.soilData && (
                          <SoilTab data={detail.soilData} notes={notes["soil"] || ""} onNotesChange={(v) => setNotes((n) => ({ ...n, soil: v }))} onReview={(s) => patchDataReview("soil", s)} actionLoading={actionLoading} />
                        )}
                        {dataTab === "water" && detail.waterData && (
                          <WaterTab data={detail.waterData} notes={notes["water"] || ""} onNotesChange={(v) => setNotes((n) => ({ ...n, water: v }))} onReview={(s) => patchDataReview("water", s)} actionLoading={actionLoading} />
                        )}
                        {dataTab === "legal" && detail.legalCheck && (
                          <LegalTab data={detail.legalCheck} notes={notes["legal"] || ""} onNotesChange={(v) => setNotes((n) => ({ ...n, legal: v }))} onReview={(s) => patchDataReview("legal", s)} actionLoading={actionLoading} />
                        )}
                        {dataTab === "drone" && detail.droneMap && (
                          <DroneTab data={detail.droneMap} />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Nearby locations */}
                {Array.isArray(detail.nearbyLocations) && detail.nearbyLocations.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-cream/30">
                      <MapPin className="h-4 w-4" />
                      Nearby Locations
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {detail.nearbyLocations.map((loc, i) => (
                        <div key={i} className="rounded-xl border border-cream/8 bg-onyx-900/30 px-4 py-3">
                          <p className="text-sm text-cream">{loc.name}</p>
                          <p className="text-xs text-cream/35 mt-0.5">
                            {loc.distanceKm} km{loc.category ? ` · ${loc.category}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Right: review panel (sticky) ─────────────────────────── */}
        <div className="w-full shrink-0 border-t border-cream/8 bg-onyx-900/60 lg:w-80 lg:border-l lg:border-t-0 overflow-y-auto">
          {/* Close button */}
          <div className="flex items-center justify-between border-b border-cream/8 px-5 py-4">
            <span className="text-sm font-medium text-cream">Review</span>
            <button onClick={onClose} className="rounded-lg p-1.5 text-cream/40 hover:bg-cream/5 hover:text-cream transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {detail && (
            <div className="p-5 space-y-6">
              {/* Price */}
              <div>
                <p className="text-xs uppercase tracking-wider text-cream/30 mb-1">Asking Price</p>
                <p className="font-display text-2xl font-semibold text-gold">{formatPrice(detail.price)}</p>
                <p className="text-xs text-cream/30 mt-0.5">
                  {(detail.price / detail.totalArea).toLocaleString("en-IN", { maximumFractionDigits: 0, style: "currency", currency: "INR" })}/{detail.areaUnit}
                </p>
              </div>

              {/* Owner */}
              <div className="rounded-xl border border-cream/8 bg-onyx-950/40 p-4 space-y-2">
                <p className="text-xs uppercase tracking-wider text-cream/30 mb-2">Owner</p>
                <div className="flex items-center gap-2 text-sm text-cream/70">
                  <User className="h-4 w-4 shrink-0 text-cream/30" />
                  {detail.owner.name}
                </div>
                <div className="flex items-center gap-2 text-sm text-cream/50">
                  <Mail className="h-4 w-4 shrink-0 text-cream/30" />
                  <span className="break-all">{detail.owner.email}</span>
                </div>
                {detail.owner.phone && (
                  <a href={`tel:${detail.owner.phone}`} className="flex items-center gap-2 text-sm text-cream/50 hover:text-gold">
                    <Phone className="h-4 w-4 shrink-0 text-cream/30" />
                    {detail.owner.phone}
                  </a>
                )}
                <div className="flex items-center gap-2 text-sm text-cream/40">
                  <Calendar className="h-4 w-4 shrink-0 text-cream/30" />
                  {new Date(detail.createdAt).toLocaleDateString("en-IN")}
                </div>
              </div>

              {/* Media summary */}
              <div className="rounded-xl border border-cream/8 bg-onyx-950/40 p-4">
                <p className="text-xs uppercase tracking-wider text-cream/30 mb-3">Media</p>
                <div className="space-y-1.5 text-sm text-cream/60">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-cream/30" /> Photos</span>
                    <span>{detail.images.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><VideoIcon className="h-4 w-4 text-cream/30" /> Videos</span>
                    <span>{detail.videos.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-cream/30" /> Documents</span>
                    <span>{detail.documents.length}</span>
                  </div>
                  {detail.droneMap && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2"><Satellite className="h-4 w-4 text-cream/30" /> Drone Map</span>
                      <span className="text-emerald-400">✓</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Data review status summary */}
              <div className="rounded-xl border border-cream/8 bg-onyx-950/40 p-4">
                <p className="text-xs uppercase tracking-wider text-cream/30 mb-3">Report Status</p>
                <div className="space-y-2">
                  {(["soil", "water", "legal"] as const).map((s) => {
                    const d = s === "soil" ? detail.soilData : s === "water" ? detail.waterData : detail.legalCheck;
                    return (
                      <div key={s} className="flex items-center justify-between text-sm">
                        <span className="capitalize text-cream/50">{s}</span>
                        {d ? (
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] ${reviewBadgeClass(d.approvalStatus)}`}>
                            {d.approvalStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-cream/20">Not submitted</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Listing status actions */}
              {detail.status === "PENDING_REVIEW" && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-cream/30">Listing Decision</p>
                  <button
                    onClick={() => patchStatus("ACTIVE")}
                    disabled={!!actionLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-3 text-sm font-medium text-emerald-400 hover:bg-emerald-500/15 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === "status-ACTIVE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Approve Listing
                  </button>
                  <button
                    onClick={() => patchStatus("REJECTED")}
                    disabled={!!actionLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 py-3 text-sm font-medium text-red-400 hover:bg-red-500/15 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === "status-REJECTED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject Listing
                  </button>
                </div>
              )}

              {(detail.status === "INACTIVE" || detail.status === "REJECTED") && (
                <button
                  onClick={() => patchStatus("PENDING_REVIEW")}
                  disabled={!!actionLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 py-3 text-sm font-medium text-amber-400 hover:bg-amber-500/15 transition-colors disabled:opacity-50"
                >
                  Reactivate to Review Queue
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────── */}
      {lightbox !== null && detail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90" onClick={() => setLightbox(null)}>
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox((prev) => prev !== null ? (prev - 1 + detail.images.length) % detail.images.length : 0); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-black/80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img
            src={detail.images[lightbox].url}
            alt={detail.images[lightbox].alt || detail.title}
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox((prev) => prev !== null ? (prev + 1) % detail.images.length : 0); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-black/80"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <button onClick={() => setLightbox(null)} className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80">
            <X className="h-5 w-5" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/60">
            {lightbox + 1} / {detail.images.length}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Data tab sub-components ─────────────────────────────────────────────────

type ReviewAction = (s: "APPROVED" | "REJECTED") => void;

function ReviewButtons({ section, actionLoading, onReview }: { section: string; actionLoading: string | null; onReview: ReviewAction }) {
  return (
    <div className="flex gap-2 mt-4">
      <button
        onClick={() => onReview("APPROVED")}
        disabled={!!actionLoading}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/15 disabled:opacity-50 transition-colors"
      >
        {actionLoading === `data-${section}-APPROVED` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
        Approve
      </button>
      <button
        onClick={() => onReview("REJECTED")}
        disabled={!!actionLoading}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-sm text-red-400 hover:bg-red-500/15 disabled:opacity-50 transition-colors"
      >
        {actionLoading === `data-${section}-REJECTED` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
        Reject
      </button>
    </div>
  );
}

function NotesField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      placeholder="Review notes (visible to owner after decision)…"
      className="mt-4 w-full rounded-xl border border-cream/10 bg-onyx-950/50 px-3 py-2.5 text-sm text-cream/70 placeholder:text-cream/20 focus:border-gold/30 focus:outline-none resize-none"
    />
  );
}

function DataRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <p className="text-xs text-cream/30">{label}</p>
      <p className="text-sm text-cream mt-0.5">{value}</p>
    </div>
  );
}

function SoilTab({ data, notes, onNotesChange, onReview, actionLoading }: {
  data: NonNullable<PropertyDetail["soilData"]>;
  notes: string; onNotesChange: (v: string) => void;
  onReview: ReviewAction; actionLoading: string | null;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DataRow label="Soil Type" value={data.soilType} />
        <DataRow label="pH" value={data.ph} />
        <DataRow label="Texture" value={data.texture} />
        <DataRow label="Fertility" value={data.fertility} />
        <DataRow label="Organic Carbon" value={data.organicCarbon ? `${data.organicCarbon}%` : null} />
        <DataRow label="Nitrogen" value={data.nitrogen ? `${data.nitrogen} kg/ha` : null} />
        <DataRow label="Phosphorus" value={data.phosphorus ? `${data.phosphorus} kg/ha` : null} />
        <DataRow label="Potassium" value={data.potassium ? `${data.potassium} kg/ha` : null} />
        {data.testedAt && <DataRow label="Tested On" value={new Date(data.testedAt).toLocaleDateString("en-IN")} />}
      </div>
      {data.suitableCrops && (
        <div className="mt-3">
          <p className="text-xs text-cream/30 mb-1.5">Suitable Crops</p>
          <div className="flex flex-wrap gap-1.5">
            {data.suitableCrops.split(",").map((c) => (
              <span key={c.trim()} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400">{c.trim()}</span>
            ))}
          </div>
        </div>
      )}
      {data.reportUrl && (
        <a href={data.reportUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-gold hover:underline">
          <ExternalLink className="h-3.5 w-3.5" /> Open Soil Report
        </a>
      )}
      <NotesField value={notes} onChange={onNotesChange} />
      <ReviewButtons section="soil" actionLoading={actionLoading} onReview={onReview} />
    </div>
  );
}

function WaterTab({ data, notes, onNotesChange, onReview, actionLoading }: {
  data: NonNullable<PropertyDetail["waterData"]>;
  notes: string; onNotesChange: (v: string) => void;
  onReview: ReviewAction; actionLoading: string | null;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DataRow label="Water Quality" value={data.waterQuality} />
        <DataRow label="Table Depth" value={data.waterTableDepth ? `${data.waterTableDepth} ft` : null} />
        <DataRow label="TDS Level" value={data.tdsLevel ? `${data.tdsLevel} ppm` : null} />
        <DataRow label="Borewells" value={data.borewellCount != null ? `${data.borewellCount}${data.borewellDepth ? ` (${data.borewellDepth}ft)` : ""}` : null} />
        <DataRow label="Canal Distance" value={data.canalDistance ? `${data.canalDistance} km` : null} />
        <DataRow label="River Distance" value={data.riverDistance ? `${data.riverDistance} km` : null} />
        <DataRow label="Avg Rainfall" value={data.rainfallAvg ? `${data.rainfallAvg} mm/yr` : null} />
        {data.testedAt && <DataRow label="Tested On" value={new Date(data.testedAt).toLocaleDateString("en-IN")} />}
      </div>
      {data.reportUrl && (
        <a href={data.reportUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-gold hover:underline">
          <ExternalLink className="h-3.5 w-3.5" /> Open Water Report
        </a>
      )}
      <NotesField value={notes} onChange={onNotesChange} />
      <ReviewButtons section="water" actionLoading={actionLoading} onReview={onReview} />
    </div>
  );
}

function LegalTab({ data, notes, onNotesChange, onReview, actionLoading }: {
  data: NonNullable<PropertyDetail["legalCheck"]>;
  notes: string; onNotesChange: (v: string) => void;
  onReview: ReviewAction; actionLoading: string | null;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DataRow label="Title Status" value={data.titleStatus} />
        <DataRow label="Encumbrance" value={data.encumbranceCheck ? (data.encumbranceResult || "Checked") : "Not checked"} />
        <DataRow label="Litigation" value={data.litigationCheck ? (data.litigationResult || "Checked") : "Not checked"} />
        <DataRow label="Revenue Records" value={data.revenueRecordOk ? "Verified" : "Pending"} />
        {data.verifiedBy && <DataRow label="Verified By" value={data.verifiedBy} />}
        {data.verifiedAt && <DataRow label="Verified On" value={new Date(data.verifiedAt).toLocaleDateString("en-IN")} />}
      </div>
      {data.reportUrl && (
        <a href={data.reportUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-gold hover:underline">
          <ExternalLink className="h-3.5 w-3.5" /> Open Legal Report
        </a>
      )}
      <NotesField value={notes} onChange={onNotesChange} />
      <ReviewButtons section="legal" actionLoading={actionLoading} onReview={onReview} />
    </div>
  );
}

function DroneTab({ data }: { data: NonNullable<PropertyDetail["droneMap"]> }) {
  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-onyx-800/50">
        <img src={data.mapUrl} alt="Drone map" className="h-full w-full object-contain" />
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-cream/40">
        {data.resolution && <span>Resolution: {data.resolution}</span>}
        {data.capturedAt && <span>Captured: {new Date(data.capturedAt).toLocaleDateString("en-IN")}</span>}
      </div>
      {data.notes && <p className="text-sm text-cream/50">{data.notes}</p>}
    </div>
  );
}

// ─── Small UI atoms ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-cream/8 bg-onyx-900/40 p-3">
      <div className="flex items-center gap-1.5 text-cream/30 mb-1">
        <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-medium text-cream">{value}</p>
    </div>
  );
}

function DataTabBtn({ icon, label, active, status, onClick }: {
  icon: React.ReactNode; label: string; active: boolean;
  status: string | null; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap px-5 py-3 text-sm font-medium border-b-2 transition-all ${
        active ? "border-gold text-gold" : "border-transparent text-cream/40 hover:text-cream/60"
      }`}
    >
      {icon}
      {label}
      {status && (
        <span className={`rounded-full border px-1.5 py-0.5 text-[9px] ${reviewBadgeClass(status)}`}>
          {status === "APPROVED" ? "✓" : status === "REJECTED" ? "✗" : "?"}
        </span>
      )}
    </button>
  );
}

function ModalSkeleton() {
  return (
    <div className="animate-pulse space-y-0">
      <div className="h-64 bg-onyx-800/40" />
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-3 w-32 rounded bg-onyx-800/50" />
          <div className="h-7 w-2/3 rounded bg-onyx-800/50" />
          <div className="h-3 w-1/2 rounded bg-onyx-800/50" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-onyx-800/40" />)}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-3 rounded bg-onyx-800/40" />)}
        </div>
      </div>
    </div>
  );
}
