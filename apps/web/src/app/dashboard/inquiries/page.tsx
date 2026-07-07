"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Mail,
  Phone,
  Clock,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@onyx/ui";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "http://localhost:4000/api/v1";

type InquiryStatusFilter = "ALL" | "NEW" | "CONTACTED" | "SITE_VISIT" | "NEGOTIATING" | "CLOSED_WON" | "CLOSED_LOST";

const statusTabs: { value: InquiryStatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "SITE_VISIT", label: "Site Visit" },
  { value: "NEGOTIATING", label: "Negotiating" },
  { value: "CLOSED_WON", label: "Closed Won" },
  { value: "CLOSED_LOST", label: "Closed Lost" },
];

const statusOptions = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "SITE_VISIT", label: "Site Visit" },
  { value: "NEGOTIATING", label: "Negotiating" },
  { value: "CLOSED_WON", label: "Closed Won" },
  { value: "CLOSED_LOST", label: "Closed Lost" },
];

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "NEW": return "default" as const;
    case "CONTACTED": return "residential" as const;
    case "SITE_VISIT": return "farmland" as const;
    case "NEGOTIATING": return "warning" as const;
    case "CLOSED_WON": return "success" as const;
    case "CLOSED_LOST": return "danger" as const;
    default: return "outline" as const;
  }
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

interface Inquiry {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  property: { id: string; title: string; slug: string };
  user: { id: string; name: string; email: string; phone?: string | null } | null;
  guestName?: string | null;
  guestPhone?: string | null;
}

export default function DashboardInquiriesPage() {
  const { data: session } = useSession();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<InquiryStatusFilter>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isSeller = session?.user?.role === "SELLER" || session?.user?.role === "AGENT";

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchInquiries();
    }
  }, [session, activeTab]);

  async function fetchInquiries() {
    setLoading(true);
    try {
      const params = activeTab !== "ALL" ? `?status=${activeTab}` : "";
      const res = await fetch(`${API_BASE}/users/me/inquiries${params}`, {
        headers: { Authorization: `Bearer ${session!.user.accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setInquiries(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(inquiryId: string, newStatus: string) {
    setUpdatingId(inquiryId);
    try {
      // Optimistic update
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === inquiryId ? { ...inq, status: newStatus } : inq
        )
      );

      const res = await fetch(`${API_BASE}/inquiries/${inquiryId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session!.user.accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // Revert on failure
        fetchInquiries();
      }
    } catch {
      fetchInquiries();
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <DashboardHeader
        title={isSeller ? "Inquiries" : "My Inquiries"}
        subtitle={isSeller ? "Manage inquiries from potential buyers" : "Track your property inquiries"}
        user={session?.user ? { name: session.user.name, avatar: session.user.avatar } : undefined}
      />

      <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Status Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-body transition-all whitespace-nowrap ${
                  activeTab === tab.value
                    ? "bg-gold/10 text-gold border border-gold/20"
                    : "text-cream/84 border border-cream/8 hover:text-cream/81 hover:border-cream/15"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Inquiries List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-onyx-900/50 border border-cream/8 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-cream/90" />
              </div>
              <h3 className="font-display text-xl font-semibold text-cream mb-2">
                No inquiries yet
              </h3>
              <p className="text-sm font-body text-cream/84">
                {isSeller
                  ? "Inquiries from interested buyers will appear here."
                  : "Your sent inquiries will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inquiry, i) => (
                <motion.div
                  key={inquiry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-onyx-900/50 backdrop-blur-xl border rounded-xl p-5 hover:bg-onyx-900/70 transition-all ${
                    inquiry.status === "NEW"
                      ? "border-l-2 border-l-gold border-cream/8"
                      : "border-cream/8"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Inquirer info */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-cream/5 flex items-center justify-center text-cream/78 font-display text-sm font-semibold shrink-0">
                          {(inquiry.user?.name || inquiry.guestName)?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-body text-cream font-medium">
                            {inquiry.user?.name || inquiry.guestName || "Unknown"}
                            {!inquiry.user && (
                              <span className="ml-2 text-[10px] uppercase tracking-wider text-gold/70">Guest</span>
                            )}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-cream/81">
                            {inquiry.user?.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {inquiry.user.email}
                              </span>
                            )}
                            {(inquiry.user?.phone || inquiry.guestPhone) && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {inquiry.user?.phone || inquiry.guestPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Property link */}
                      <Link
                        href={`/properties/${inquiry.property.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-body text-gold/70 hover:text-gold transition-colors mb-2"
                      >
                        {inquiry.property.title}
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      {/* Message */}
                      <p className="text-sm font-body text-cream/78 leading-relaxed">
                        {inquiry.message}
                      </p>
                    </div>

                    {/* Right side: status + time */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      {isSeller ? (
                        <div className="relative">
                          <select
                            value={inquiry.status}
                            onChange={(e) => updateStatus(inquiry.id, e.target.value)}
                            disabled={updatingId === inquiry.id}
                            className="appearance-none bg-onyx-800/50 border border-cream/10 rounded-lg px-3 py-1.5 pr-8 text-xs font-body text-cream/88 focus:outline-none focus:border-gold/30 cursor-pointer disabled:opacity-50"
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-cream/81 pointer-events-none" />
                        </div>
                      ) : (
                        <Badge variant={getStatusBadgeVariant(inquiry.status)} className="text-[10px]">
                          {inquiry.status.replace("_", " ")}
                        </Badge>
                      )}

                      <div className="flex items-center gap-1 text-xs text-cream/79">
                        <Clock className="w-3 h-3" />
                        {timeAgo(inquiry.createdAt)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
