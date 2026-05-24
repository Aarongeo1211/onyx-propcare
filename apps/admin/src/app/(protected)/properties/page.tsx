"use client";

import { motion } from "framer-motion";
import { Search, CheckCircle, XCircle, Archive, RotateCcw, Star, Eye } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PropertyReviewModal } from "./review-modal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Property {
  id: string;
  title: string;
  type: string;
  status: string;
  price: number;
  district: string;
  state: string;
  isFeatured: boolean;
  featuredAt?: string | null;
  owner?: { name: string; email: string } | null;
  createdAt: string;
  videos?: Array<{ url: string }>;
  documents?: Array<{ name: string; url: string; type: string }>;
  droneMap?: { mapUrl: string } | null;
  soilData?: { approvalStatus: string; reviewNotes?: string | null } | null;
  waterData?: { approvalStatus: string; reviewNotes?: string | null } | null;
  legalCheck?: { approvalStatus: string; reviewNotes?: string | null; verifiedBy?: string | null } | null;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PENDING_REVIEW: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DRAFT: "bg-cream/5 text-cream/40 border-cream/10",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  SOLD: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  INACTIVE: "bg-cream/5 text-cream/25 border-cream/8",
};

function formatPrice(price: number) {
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(2)} Cr`;
  if (price >= 100_000) return `₹${(price / 100_000).toFixed(2)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

function ReportDot({ status }: { status?: string | null }) {
  if (status === "APPROVED") return <span className="h-2 w-2 rounded-full bg-emerald-400" title="Approved" />;
  if (status === "REJECTED") return <span className="h-2 w-2 rounded-full bg-red-400" title="Rejected" />;
  if (status) return <span className="h-2 w-2 rounded-full bg-amber-400" title="Pending review" />;
  return <span className="h-2 w-2 rounded-full bg-cream/15" title="No submission" />;
}

export default function PropertiesPage() {
  const { data: session } = useSession();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewPropertyId, setReviewPropertyId] = useState<string | null>(null);

  const token = (session?.user as any)?.accessToken as string | undefined;

  async function fetchProperties() {
    if (!session) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "15" });
      if (statusFilter === "FEATURED") params.set("featured", "true");
      else if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`${API_URL}/api/v1/admin/properties?${params}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setProperties(data.data || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProperties(); }, [session, statusFilter, page]);

  async function handleStatusChange(propertyId: string, newStatus: string) {
    if (!token) return;
    setActionLoading(propertyId);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/properties/${propertyId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) await fetchProperties();
      else alert(data.error || "Failed to update status");
    } finally { setActionLoading(null); }
  }

  async function handleArchive(propertyId: string) {
    if (!token || !confirm("Archive this property listing?")) return;
    setActionLoading(propertyId);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/properties/${propertyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) await fetchProperties();
      else alert(data.error || "Failed to archive property");
    } finally { setActionLoading(null); }
  }

  async function handleToggleFeatured(propertyId: string, currentlyFeatured: boolean) {
    if (!token) return;
    setActionLoading(`${propertyId}-featured`);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/properties/${propertyId}/featured`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !currentlyFeatured }),
      });
      const data = await res.json();
      if (data.success) {
        setProperties((prev) =>
          prev.map((p) =>
            p.id === propertyId
              ? { ...p, isFeatured: !currentlyFeatured, featuredAt: !currentlyFeatured ? new Date().toISOString() : null }
              : p
          )
        );
      } else {
        alert(data.error || "Failed to update featured status");
      }
    } finally { setActionLoading(null); }
  }

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return properties;
    return properties.filter((p) =>
      [p.title, p.type, p.district, p.state, p.owner?.name, p.owner?.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query))
    );
  }, [properties, search]);

  const totalPages = Math.max(1, Math.ceil(total / 15));

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-cream">Properties</h1>
          <p className="text-sm text-cream/35 mt-1">Approve, reject, and archive listings before they go live.</p>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/20" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title, owner, state, or type…"
              className="w-full bg-onyx-900/50 border border-cream/8 rounded-xl pl-10 pr-4 py-2.5 text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-gold/30"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {["ALL", "PENDING_REVIEW", "ACTIVE", "FEATURED", "DRAFT", "REJECTED", "INACTIVE"].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`rounded-full px-4 py-2 text-xs transition-all ${
                  statusFilter === s
                    ? "bg-gold/15 text-gold border border-gold/20"
                    : "text-cream/40 border border-cream/8 hover:text-cream/70 hover:border-cream/15"
                }`}
              >
                {s === "ALL" ? "All Listings" : s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-cream/8 bg-onyx-900/25 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-cream/5">
                  <th className="px-5 py-3.5 text-left text-xs uppercase tracking-[0.2em] text-cream/25">Property</th>
                  <th className="px-5 py-3.5 text-left text-xs uppercase tracking-[0.2em] text-cream/25">Owner</th>
                  <th className="px-5 py-3.5 text-left text-xs uppercase tracking-[0.2em] text-cream/25">Price</th>
                  <th className="px-5 py-3.5 text-left text-xs uppercase tracking-[0.2em] text-cream/25">Reports</th>
                  <th className="px-5 py-3.5 text-left text-xs uppercase tracking-[0.2em] text-cream/25">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs uppercase tracking-[0.2em] text-cream/25">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream/[0.03]">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-5 py-4">
                        <div className="h-4 rounded bg-onyx-800/50 animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-cream/25">
                      No properties match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map((property, index) => (
                    <motion.tr
                      key={property.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-cream/[0.02]"
                    >
                      {/* Property */}
                      <td className="px-5 py-4 max-w-[280px]">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-cream truncate">{property.title}</p>
                              {property.isFeatured && (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] text-gold">
                                  <Star className="h-2.5 w-2.5 fill-gold" /> Featured
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-cream/30 mt-0.5">
                              {property.type.replace(/_/g, " ")} · {property.district}, {property.state}
                            </p>
                            <p className="text-xs text-cream/20 mt-0.5">
                              {new Date(property.createdAt).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-cream/70">{property.owner?.name || "—"}</p>
                        <p className="text-xs text-cream/25 mt-0.5">{property.owner?.email || ""}</p>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4 text-sm font-medium text-gold whitespace-nowrap">
                        {formatPrice(property.price)}
                      </td>

                      {/* Reports — compact dot indicators */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5" title="Soil report">
                            <ReportDot status={property.soilData?.approvalStatus} />
                            <span className="text-xs text-cream/30">S</span>
                          </div>
                          <div className="flex items-center gap-1.5" title="Water report">
                            <ReportDot status={property.waterData?.approvalStatus} />
                            <span className="text-xs text-cream/30">W</span>
                          </div>
                          <div className="flex items-center gap-1.5" title="Legal check">
                            <ReportDot status={property.legalCheck?.approvalStatus} />
                            <span className="text-xs text-cream/30">L</span>
                          </div>
                          <span className="text-xs text-cream/20">
                            {(property.videos?.length || 0) + (property.documents?.length || 0) > 0
                              ? `${property.videos?.length || 0}v ${property.documents?.length || 0}d`
                              : "no media"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] ${statusColors[property.status] || statusColors.DRAFT}`}>
                          {property.status.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Review button — always visible */}
                          <button
                            onClick={() => setReviewPropertyId(property.id)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gold/20 bg-gold/5 px-3 text-xs text-gold hover:bg-gold/10 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Review
                          </button>

                          {/* Quick approve/reject for pending */}
                          {property.status === "PENDING_REVIEW" && (
                            <>
                              <button
                                onClick={() => handleStatusChange(property.id, "ACTIVE")}
                                disabled={actionLoading === property.id}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                title="Quick approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(property.id, "REJECTED")}
                                disabled={actionLoading === property.id}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Quick reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          {(property.status === "INACTIVE" || property.status === "REJECTED") && (
                            <button
                              onClick={() => handleStatusChange(property.id, "PENDING_REVIEW")}
                              disabled={actionLoading === property.id}
                              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-500/20 px-3 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reactivate
                            </button>
                          )}

                          {property.status === "ACTIVE" && (
                            <button
                              onClick={() => handleToggleFeatured(property.id, property.isFeatured)}
                              disabled={actionLoading === `${property.id}-featured`}
                              title={property.isFeatured ? "Remove from featured" : "Add to featured"}
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                                property.isFeatured
                                  ? "border-gold/30 bg-gold/10 text-gold hover:bg-gold/5"
                                  : "border-cream/10 text-cream/40 hover:border-gold/20 hover:text-gold"
                              }`}
                            >
                              <Star className={`h-4 w-4 ${property.isFeatured ? "fill-gold" : ""}`} />
                            </button>
                          )}

                          {property.status !== "INACTIVE" && (
                            <button
                              onClick={() => handleArchive(property.id)}
                              disabled={actionLoading === property.id}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cream/10 text-cream/40 hover:border-red-500/20 hover:text-red-400 transition-colors"
                              title="Archive"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-cream/5 px-5 py-4">
            <p className="text-xs text-cream/25">
              {total > 0
                ? `Showing ${(page - 1) * 15 + 1}–${Math.min(page * 15, total)} of ${total.toLocaleString("en-IN")} listings`
                : "No listings"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((c) => Math.max(1, c - 1))}
                disabled={page === 1}
                className="rounded-lg border border-cream/10 px-3 py-1.5 text-xs text-cream/40 disabled:opacity-40 hover:border-cream/20 hover:text-cream/60 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((c) => Math.min(totalPages, c + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-cream/10 px-3 py-1.5 text-xs text-cream/40 disabled:opacity-40 hover:border-cream/20 hover:text-cream/60 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Review modal — rendered outside table to avoid overflow clipping */}
      {reviewPropertyId && token && (
        <PropertyReviewModal
          propertyId={reviewPropertyId}
          token={token}
          onClose={() => setReviewPropertyId(null)}
          onUpdated={() => { fetchProperties(); }}
        />
      )}
    </>
  );
}
