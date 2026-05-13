"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  ExternalLink,
  Eye,
  MessageSquare,
  Power,
  Building2,
} from "lucide-react";
import { Badge, Button } from "@onyx/ui";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { formatPrice } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "http://localhost:4000/api/v1";

type PropertyStatus = "ALL" | "ACTIVE" | "DRAFT" | "PENDING_REVIEW" | "INACTIVE";

const statusTabs: { value: PropertyStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_REVIEW", label: "Pending" },
  { value: "INACTIVE", label: "Inactive" },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return { variant: "farmland" as const, label: "Active" };
    case "DRAFT":
      return { variant: "outline" as const, label: "Draft" };
    case "PENDING_REVIEW":
      return { variant: "warning" as const, label: "Pending Review" };
    case "INACTIVE":
      return { variant: "danger" as const, label: "Inactive" };
    case "SOLD":
      return { variant: "success" as const, label: "Sold" };
    default:
      return { variant: "outline" as const, label: status };
  }
}

interface Property {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number;
  viewCount: number;
  createdAt: string;
  images: { url: string; alt?: string | null }[];
  _count: { inquiries: number };
}

export default function DashboardPropertiesPage() {
  const { data: session } = useSession();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PropertyStatus>("ALL");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchProperties();
    }
  }, [session, activeTab]);

  async function fetchProperties() {
    setLoading(true);
    setError(null);
    try {
      const params = activeTab !== "ALL" ? `?status=${activeTab}` : "";
      const res = await fetch(`${API_BASE}/users/me/properties${params}`, {
        headers: { Authorization: `Bearer ${session!.user.accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setProperties(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      setError("Failed to load your listings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    setTogglingId(id);
    setError(null);
    try {
      let response: Response;
      if (currentStatus === "ACTIVE") {
        // Deactivate
        response = await fetch(`${API_BASE}/properties/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session!.user.accessToken}` },
        });
      } else {
        // Reactivate
        response = await fetch(`${API_BASE}/properties/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session!.user.accessToken}`,
          },
          body: JSON.stringify({}),
        });
      }

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to update listing status.");
      }

      fetchProperties();
    } catch (error) {
      console.error("Failed to toggle status:", error);
      setError(error instanceof Error ? error.message : "Unable to update listing status.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <>
      <DashboardHeader
        title="My Properties"
        subtitle="Manage your property listings"
        user={session?.user ? { name: session.user.name, avatar: session.user.avatar } : undefined}
      >
        <Link href="/properties/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            New Listing
          </Button>
        </Link>
      </DashboardHeader>

      <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Status Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-body transition-all whitespace-nowrap ${
                  activeTab === tab.value
                    ? "bg-gold/10 text-gold border border-gold/20"
                    : "text-cream/40 border border-cream/8 hover:text-cream/60 hover:border-cream/15"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Properties List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-onyx-900/50 border border-cream/8 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-cream/20" />
              </div>
              <h3 className="font-display text-xl font-semibold text-cream mb-2">
                No properties yet
              </h3>
              <p className="text-sm font-body text-cream/40 mb-6">
                Start listing your properties to reach buyers across India.
              </p>
              <Link href="/properties/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  List Your First Property
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cream/5">
                      <th className="text-left px-5 py-3 text-xs font-body font-medium text-cream/30 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-body font-medium text-cream/30 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-body font-medium text-cream/30 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="text-center px-5 py-3 text-xs font-body font-medium text-cream/30 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="text-center px-5 py-3 text-xs font-body font-medium text-cream/30 uppercase tracking-wider">
                        Inquiries
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-body font-medium text-cream/30 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-body font-medium text-cream/30 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream/5">
                    {properties.map((property, i) => {
                      const statusBadge = getStatusBadge(property.status);
                      return (
                        <motion.tr
                          key={property.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="hover:bg-cream/[0.02] transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-onyx-800 shrink-0">
                                {property.images?.[0] ? (
                                  <Image
                                    src={property.images[0].url}
                                    alt={property.title}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-cream/20" />
                                  </div>
                                )}
                              </div>
                              <p className="text-sm font-body text-cream font-medium truncate max-w-[200px]">
                                {property.title}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={statusBadge.variant} className="text-[10px]">
                              {statusBadge.label}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-body text-gold">
                              {formatPrice(property.price)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="text-sm font-body text-cream/50">
                              {property.viewCount}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="text-sm font-body text-cream/50">
                              {property._count.inquiries}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-body text-cream/30">
                              {new Date(property.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/dashboard/properties/${property.id}/edit`}
                                className="p-2 rounded-lg text-cream/30 hover:text-gold hover:bg-gold/10 transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/properties/${property.slug}`}
                                target="_blank"
                                className="p-2 rounded-lg text-cream/30 hover:text-cream hover:bg-cream/10 transition-colors"
                                title="View on site"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => toggleStatus(property.id, property.status)}
                                disabled={togglingId === property.id}
                                className={`p-2 rounded-lg transition-colors ${
                                  property.status === "ACTIVE"
                                    ? "text-cream/30 hover:text-red-400 hover:bg-red-500/10"
                                    : "text-cream/30 hover:text-emerald-400 hover:bg-emerald-500/10"
                                }`}
                                title={property.status === "ACTIVE" ? "Deactivate" : "Activate"}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
