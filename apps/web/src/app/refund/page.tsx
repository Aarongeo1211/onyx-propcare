"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@onyx/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "http://localhost:4000/api/v1";

interface RefundRequestItem {
  id: string;
  reason: string;
  details?: string | null;
  preferredContact?: string | null;
  status: string;
  createdAt: string;
  subscription?: { plan?: { name: string; price: number } | null } | null;
}

export default function RefundPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<RefundRequestItem[]>([]);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [preferredContact, setPreferredContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session?.user?.accessToken) {
      void fetchRequests();
    }
  }, [session?.user?.accessToken]);

  async function fetchRequests() {
    const response = await fetch(`${API_BASE}/refunds`, {
      headers: { Authorization: `Bearer ${session!.user.accessToken}` },
    });
    const data = await response.json();
    if (data.success) {
      setRequests(data.data || []);
    }
  }

  async function submitRequest(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/refunds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session!.user.accessToken}`,
        },
        body: JSON.stringify({
          reason,
          details,
          preferredContact,
        }),
      });
      setReason("");
      setDetails("");
      setPreferredContact("");
      await fetchRequests();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-onyx-950 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-sm uppercase tracking-[0.35em] text-gold/60">Billing</p>
          <h1 className="mt-3 font-display text-4xl text-cream">Refund Requests</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-cream/45">
            Use this page to submit, track, and document subscription refund requests. The support team reviews each case inside the admin console with a full audit trail.
          </p>
        </motion.div>

        {!session?.user ? (
          <div className="rounded-3xl border border-cream/8 bg-onyx-900/35 p-8">
            <p className="text-sm text-cream/45">Log in to submit and track refund requests for your account.</p>
            <div className="mt-6">
              <Link href="/login">
                <Button>Log In</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <form onSubmit={submitRequest} className="rounded-3xl border border-cream/8 bg-onyx-900/35 p-8">
              <h2 className="font-display text-2xl text-cream">Submit Request</h2>
              <div className="mt-6 space-y-4">
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={4}
                  minLength={20}
                  required
                  placeholder="Describe the billing issue, outage, duplicate charge, or service concern."
                  className="w-full rounded-2xl border border-cream/10 bg-onyx-950/40 px-4 py-3 text-sm text-cream focus:border-gold/30 focus:outline-none"
                />
                <textarea
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  rows={5}
                  placeholder="Add transaction context, timelines, or screenshots/links if helpful."
                  className="w-full rounded-2xl border border-cream/10 bg-onyx-950/40 px-4 py-3 text-sm text-cream focus:border-gold/30 focus:outline-none"
                />
                <input
                  value={preferredContact}
                  onChange={(event) => setPreferredContact(event.target.value)}
                  placeholder="Preferred contact: email, phone, or time window"
                  className="w-full rounded-2xl border border-cream/10 bg-onyx-950/40 px-4 py-3 text-sm text-cream focus:border-gold/30 focus:outline-none"
                />
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Refund Request"}
                </Button>
              </div>
            </form>

            <div className="rounded-3xl border border-cream/8 bg-onyx-900/35 p-8">
              <h2 className="font-display text-2xl text-cream">Request History</h2>
              <div className="mt-6 space-y-4">
                {requests.length === 0 ? (
                  <p className="text-sm text-cream/40">No refund requests submitted yet.</p>
                ) : (
                  requests.map((request) => (
                    <div key={request.id} className="rounded-2xl border border-cream/8 bg-onyx-950/35 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-full border border-cream/10 px-3 py-1 text-[10px] uppercase tracking-wide text-cream/55">
                          {request.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-cream/25">{new Date(request.createdAt).toLocaleDateString("en-IN")}</span>
                      </div>
                      {request.subscription?.plan && (
                        <p className="mt-3 text-xs text-gold/70">
                          {request.subscription.plan.name} • ₹{request.subscription.plan.price.toLocaleString("en-IN")}
                        </p>
                      )}
                      <p className="mt-3 text-sm text-cream/50">{request.reason}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
