"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { PhoneCall, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@onyx/ui";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "http://localhost:4000/api/v1";

interface CallbackItem {
  id: string;
  name: string;
  phone: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  note?: string | null;
  createdAt: string;
  property: { title: string; slug: string };
  user?: { name?: string | null; email?: string | null } | null;
}

const statusVariants: Record<CallbackItem["status"], "warning" | "success" | "danger"> = {
  PENDING: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export default function DashboardCallbacksPage() {
  const { data: session } = useSession();
  const [callbacks, setCallbacks] = useState<CallbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.accessToken) {
      void fetchCallbacks();
    }
  }, [session?.user?.accessToken]);

  async function fetchCallbacks() {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/callbacks`, {
        headers: { Authorization: `Bearer ${session!.user.accessToken}` },
      });
      const data = await response.json();
      if (data.success) {
        setCallbacks(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: CallbackItem["status"]) {
    setUpdatingId(id);
    try {
      await fetch(`${API_BASE}/callbacks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session!.user.accessToken}`,
        },
        body: JSON.stringify({ status }),
      });
      await fetchCallbacks();
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <DashboardHeader
        title="Callbacks"
        subtitle="Track call-back requests from interested buyers"
        user={session?.user ? { name: session.user.name, avatar: session.user.avatar } : undefined}
      />

      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
          </div>
        ) : callbacks.length === 0 ? (
          <div className="rounded-2xl border border-cream/8 bg-onyx-900/30 p-10 text-center">
            <PhoneCall className="mx-auto h-10 w-10 text-cream/45" />
            <h3 className="mt-4 font-display text-xl text-cream">No callbacks yet</h3>
            <p className="mt-2 text-sm text-cream/60">Callback requests from property pages will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {callbacks.map((callback, index) => (
              <motion.div
                key={callback.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-2xl border border-cream/8 bg-onyx-900/40 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-medium text-cream">{callback.name}</p>
                      <Badge variant={statusVariants[callback.status]} className="text-[10px]">
                        {callback.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-cream/65">{callback.phone}</p>
                    <Link
                      href={`/properties/${callback.property.slug}`}
                      className="mt-3 inline-flex items-center gap-1 text-xs text-gold hover:text-gold-light"
                    >
                      {callback.property.title}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    {callback.note && <p className="mt-3 text-sm text-cream/45">{callback.note}</p>}
                  </div>

                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <div className="flex items-center gap-1 text-xs text-cream/55">
                      <Clock className="h-3 w-3" />
                      {new Date(callback.createdAt).toLocaleString("en-IN")}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus(callback.id, "COMPLETED")}
                        disabled={updatingId === callback.id}
                        className="rounded-lg border border-emerald-500/20 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
                      >
                        Mark Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(callback.id, "CANCELLED")}
                        disabled={updatingId === callback.id}
                        className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
