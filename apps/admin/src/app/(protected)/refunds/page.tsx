"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface RefundRequestItem {
  id: string;
  reason: string;
  details?: string | null;
  preferredContact?: string | null;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PROCESSED";
  adminNotes?: string | null;
  createdAt: string;
  user: { name: string; email: string };
  subscription?: { plan?: { name: string; price: number; category: string } | null } | null;
}

export default function AdminRefundsPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken as string | undefined;
  const [requests, setRequests] = useState<RefundRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      void fetchRequests();
    }
  }, [token]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/admin/refund-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setRequests(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: RefundRequestItem["status"]) {
    await fetch(`${API_URL}/api/v1/admin/refund-requests/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    await fetchRequests();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-cream">Refund Requests</h1>
        <p className="mt-1 text-sm text-cream/35">Review and resolve subscription refund requests.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-cream/8 bg-onyx-900/30 p-10 text-center text-sm text-cream/35">
          No refund requests found.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded-2xl border border-cream/8 bg-onyx-900/30 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium text-cream">{request.user.name}</p>
                    <span className="rounded-full border border-cream/10 px-3 py-1 text-[10px] text-cream/55">
                      {request.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-cream/25">{request.user.email}</p>
                  {request.subscription?.plan && (
                    <p className="mt-2 text-xs text-gold/70">
                      {request.subscription.plan.name} • ₹{request.subscription.plan.price.toLocaleString("en-IN")}
                    </p>
                  )}
                  <p className="mt-3 text-sm text-cream/55">{request.reason}</p>
                  {request.details && <p className="mt-2 text-sm text-cream/35">{request.details}</p>}
                  {request.preferredContact && <p className="mt-2 text-xs text-cream/25">Preferred contact: {request.preferredContact}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  {(["UNDER_REVIEW", "APPROVED", "REJECTED", "PROCESSED"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateStatus(request.id, status)}
                      className="rounded-lg border border-cream/10 px-3 py-2 text-xs text-cream/55 hover:border-gold/20 hover:text-gold"
                    >
                      {status.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
