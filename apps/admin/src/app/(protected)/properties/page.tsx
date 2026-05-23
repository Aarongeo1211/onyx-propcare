"use client";

import { motion } from "framer-motion";
import { Search, CheckCircle, XCircle, Archive, RotateCcw } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Property {
  id: string;
  title: string;
  type: string;
  status: string;
  price: number;
  district: string;
  state: string;
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
  return `₹${price.toLocaleString("en-IN")}`;
}

function getReviewBadge(status?: string | null) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "REJECTED":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }
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
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  async function fetchProperties() {
    if (!session) return;
    const token = (session.user as any).accessToken;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      });

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`${API_URL}/api/v1/admin/properties?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

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

  useEffect(() => {
    fetchProperties();
  }, [session, statusFilter, page]);

  async function handleStatusChange(propertyId: string, newStatus: string) {
    if (!session) return;
    const token = (session.user as any).accessToken;
    setActionLoading(propertyId);

    try {
      const response = await fetch(`${API_URL}/api/v1/admin/properties/${propertyId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (data.success) {
        await fetchProperties();
      } else {
        alert(data.error || "Failed to update property status");
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleArchive(propertyId: string) {
    if (!session || !confirm("Archive this property listing?")) return;
    const token = (session.user as any).accessToken;
    setActionLoading(propertyId);

    try {
      const response = await fetch(`${API_URL}/api/v1/admin/properties/${propertyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        await fetchProperties();
      } else {
        alert(data.error || "Failed to archive property");
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDataReview(
    propertyId: string,
    section: "soil" | "water" | "legal",
    approvalStatus: "APPROVED" | "REJECTED"
  ) {
    if (!session) return;
    const token = (session.user as any).accessToken;
    setActionLoading(`${propertyId}-${section}-${approvalStatus}`);

    try {
      const response = await fetch(`${API_URL}/api/v1/admin/properties/${propertyId}/review-data`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ section, approvalStatus, reviewNotes: reviewNotes[`${propertyId}-${section}`] || "" }),
      });
      const data = await response.json();

      if (data.success) {
        await fetchProperties();
      } else {
        alert(data.error || "Failed to review property data");
      }
    } finally {
      setActionLoading(null);
    }
  }

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return properties;

    return properties.filter((property) =>
      [property.title, property.type, property.district, property.state, property.owner?.name, property.owner?.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [properties, search]);

  const totalPages = Math.max(1, Math.ceil(total / 12));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-cream">Properties</h1>
        <p className="text-sm text-cream/35 mt-1">Approve, reject, and archive listings before they affect live inventory.</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/20" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter current page by title, owner, state, or type"
            className="w-full bg-onyx-900/50 border border-cream/8 rounded-xl pl-10 pr-4 py-2.5 text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-gold/30"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {["ALL", "PENDING_REVIEW", "ACTIVE", "DRAFT", "REJECTED", "INACTIVE"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 text-xs transition-all ${
                statusFilter === status
                  ? "bg-gold/15 text-gold border border-gold/20"
                  : "text-cream/40 border border-cream/8 hover:text-cream/70 hover:border-cream/15"
              }`}
            >
              {status === "ALL" ? "All Listings" : status.replace(/_/g, " ")}
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
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-cream/5">
                <th className="px-5 py-3.5 text-left text-xs uppercase tracking-[0.2em] text-cream/25">Property</th>
                <th className="px-5 py-3.5 text-left text-xs uppercase tracking-[0.2em] text-cream/25">Type</th>
                <th className="px-5 py-3.5 text-left text-xs uppercase tracking-[0.2em] text-cream/25">Location</th>
                <th className="px-5 py-3.5 text-left text-xs uppercase tracking-[0.2em] text-cream/25">Owner</th>
                <th className="px-5 py-3.5 text-left text-xs uppercase tracking-[0.2em] text-cream/25">Price</th>
                <th className="px-5 py-3.5 text-left text-xs uppercase tracking-[0.2em] text-cream/25">Reports</th>
                <th className="px-5 py-3.5 text-left text-xs uppercase tracking-[0.2em] text-cream/25">Status</th>
                <th className="px-5 py-3.5 text-right text-xs uppercase tracking-[0.2em] text-cream/25">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/[0.03]">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={8} className="px-5 py-5">
                      <div className="h-4 rounded bg-onyx-800/50 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-cream/25">
                    No properties match the current filter set.
                  </td>
                </tr>
              ) : (
                filteredProperties.map((property, index) => (
                  <motion.tr
                    key={property.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="hover:bg-cream/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-cream">{property.title}</p>
                        <p className="text-xs text-cream/25 mt-1">
                          Added {new Date(property.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-cream/50">{property.type.replace(/_/g, " ")}</td>
                    <td className="px-5 py-4 text-sm text-cream/50">
                      {property.district}, {property.state}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-cream/70">{property.owner?.name || "Unknown owner"}</p>
                      <p className="text-xs text-cream/25">{property.owner?.email || "No email"}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gold">{formatPrice(property.price)}</td>
                    <td className="px-5 py-4">
                      <div className="space-y-2 min-w-[210px]">
                        {(["soil", "water", "legal"] as const).map((section) => {
                          const data = property[section === "soil" ? "soilData" : section === "water" ? "waterData" : "legalCheck"];
                          if (!data) {
                            return (
                              <div key={section} className="flex items-center justify-between gap-2 text-xs text-cream/20">
                                <span className="capitalize">{section}</span>
                                <span>No submission</span>
                              </div>
                            );
                          }

                          return (
                            <div key={section} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="capitalize text-xs text-cream/50">{section}</span>
                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${getReviewBadge(data.approvalStatus)}`}>
                                  {data.approvalStatus}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDataReview(property.id, section, "APPROVED")}
                                  disabled={actionLoading === `${property.id}-${section}-APPROVED`}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                                  title={`Approve ${section} report`}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDataReview(property.id, section, "REJECTED")}
                                  disabled={actionLoading === `${property.id}-${section}-REJECTED`}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10"
                                  title={`Reject ${section} report`}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        <div className="rounded-lg border border-cream/8 bg-onyx-950/40 px-3 py-2 text-xs text-cream/45">
                          <span className="font-medium text-cream/60">Media:</span>{" "}
                          {property.videos?.length || 0} video(s), {property.documents?.length || 0} document(s)
                          {property.droneMap ? ", drone map attached" : ""}
                        </div>
                        {(["soil", "water", "legal"] as const).map((section) => {
                          const data = property[section === "soil" ? "soilData" : section === "water" ? "waterData" : "legalCheck"];
                          if (!data) return null;

                          return (
                            <textarea
                              key={`${property.id}-${section}-notes`}
                              value={reviewNotes[`${property.id}-${section}`] ?? data.reviewNotes ?? ""}
                              onChange={(event) =>
                                setReviewNotes((prev) => ({
                                  ...prev,
                                  [`${property.id}-${section}`]: event.target.value,
                                }))
                              }
                              rows={2}
                              placeholder={`Review notes for ${section}`}
                              className="w-full rounded-lg border border-cream/10 bg-onyx-950/50 px-3 py-2 text-xs text-cream/70 focus:border-gold/30 focus:outline-none"
                            />
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] ${statusColors[property.status] || statusColors.DRAFT}`}>
                        {property.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {property.status === "PENDING_REVIEW" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(property.id, "ACTIVE")}
                              disabled={actionLoading === property.id}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                              title="Approve listing"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(property.id, "REJECTED")}
                              disabled={actionLoading === property.id}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10"
                              title="Reject listing"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {(property.status === "INACTIVE" || property.status === "REJECTED") && (
                          <button
                            onClick={() => handleStatusChange(property.id, "PENDING_REVIEW")}
                            disabled={actionLoading === property.id}
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-500/20 px-3 text-xs text-emerald-400 hover:bg-emerald-500/10"
                            title="Send back to review queue"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reactivate
                          </button>
                        )}

                        {property.status !== "INACTIVE" && (
                          <button
                            onClick={() => handleArchive(property.id)}
                            disabled={actionLoading === property.id}
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-cream/10 px-3 text-xs text-cream/50 hover:border-red-500/20 hover:text-red-400"
                          >
                            <Archive className="h-3.5 w-3.5" />
                            Archive
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
            Showing {(page - 1) * 12 + 1}-{Math.min(page * 12, total)} of {total.toLocaleString("en-IN")} listings
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-lg border border-cream/10 px-3 py-1.5 text-xs text-cream/40 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-cream/10 px-3 py-1.5 text-xs text-cream/40 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
