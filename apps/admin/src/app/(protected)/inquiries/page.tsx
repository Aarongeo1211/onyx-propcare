"use client";

import { motion } from "framer-motion";
import { Search, MessageSquare } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Inquiry {
  id: string;
  user?: { name: string; email: string } | null;
  guestName?: string | null;
  guestPhone?: string | null;
  property?: { title: string } | null;
  message: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  NEW: "bg-gold/10 text-gold border-gold/20",
  CONTACTED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  SITE_VISIT: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  NEGOTIATING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CLOSED_WON: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CLOSED_LOST: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusOptions = ["NEW", "CONTACTED", "SITE_VISIT", "NEGOTIATING", "CLOSED_WON", "CLOSED_LOST"];

export default function InquiriesPage() {
  const { data: session } = useSession();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchInquiries() {
    if (!session) return;
    const token = (session.user as any).accessToken;

    try {
      const response = await fetch(`${API_URL}/api/v1/inquiries?limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (data.success) {
        setInquiries(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInquiries();
  }, [session]);

  async function handleStatusUpdate(inquiryId: string, newStatus: string) {
    if (!session) return;
    const token = (session.user as any).accessToken;
    setUpdatingId(inquiryId);

    try {
      const response = await fetch(`${API_URL}/api/v1/inquiries/${inquiryId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (data.success) {
        await fetchInquiries();
      } else {
        alert(data.error || "Failed to update inquiry status");
      }
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredInquiries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return inquiries;

    return inquiries.filter((inquiry) =>
      [
        inquiry.user?.name,
        inquiry.user?.email,
        inquiry.guestName,
        inquiry.guestPhone,
        inquiry.property?.title,
        inquiry.message,
        inquiry.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [inquiries, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-cream">Inquiries</h1>
        <p className="text-sm text-cream/35 mt-1">Monitor buyer intent and advance conversations without losing context.</p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/20" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by buyer, property, message, or status"
          className="w-full bg-onyx-900/50 border border-cream/8 rounded-xl pl-10 pr-4 py-2.5 text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-gold/30"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="p-5 rounded-2xl border border-cream/5 bg-onyx-900/20 animate-pulse h-36" />
          ))
        ) : filteredInquiries.length === 0 ? (
          <div className="p-12 text-center text-sm text-cream/25 rounded-2xl border border-cream/8 bg-onyx-900/20">
            No inquiries match the current search.
          </div>
        ) : (
          filteredInquiries.map((inquiry, index) => (
            <motion.div
              key={inquiry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 rounded-2xl border border-cream/8 bg-onyx-900/20 hover:border-cream/15"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-onyx-800/50 text-gold">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <p className="text-sm font-medium text-cream">{inquiry.user?.name || inquiry.guestName || "Unknown buyer"}</p>
                      {!inquiry.user && (
                        <span className="inline-flex rounded-full border border-gold/20 bg-gold/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold/70">
                          Guest
                        </span>
                      )}
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] ${statusColors[inquiry.status] || statusColors.NEW}`}>
                        {inquiry.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-cream/35">{inquiry.user?.email || inquiry.guestPhone || "No contact supplied"}</p>
                    <p className="text-xs text-gold/65 mt-2">Property: {inquiry.property?.title || "Unknown property"}</p>
                    <p className="text-sm text-cream/55 leading-relaxed mt-3">{inquiry.message}</p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <p className="text-xs text-cream/25">
                    {new Date(inquiry.createdAt).toLocaleString("en-IN")}
                  </p>
                  <select
                    value={inquiry.status}
                    disabled={updatingId === inquiry.id}
                    onChange={(event) => handleStatusUpdate(inquiry.id, event.target.value)}
                    className="rounded-xl border border-cream/10 bg-onyx-900/60 px-3 py-2 text-xs text-cream focus:outline-none focus:border-gold/30"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status} className="bg-onyx-950 text-cream">
                        {status.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
