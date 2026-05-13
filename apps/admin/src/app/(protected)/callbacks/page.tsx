"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { PhoneCall, Clock } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

export default function AdminCallbacksPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken as string | undefined;
  const [callbacks, setCallbacks] = useState<CallbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      void fetchCallbacks();
    }
  }, [token]);

  async function fetchCallbacks() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/callbacks`, {
        headers: { Authorization: `Bearer ${token}` },
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
    await fetch(`${API_URL}/api/v1/callbacks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    await fetchCallbacks();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-cream">Callbacks</h1>
        <p className="mt-1 text-sm text-cream/35">Monitor call-back requests across the marketplace.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
        </div>
      ) : callbacks.length === 0 ? (
        <div className="rounded-2xl border border-cream/8 bg-onyx-900/30 p-10 text-center">
          <PhoneCall className="mx-auto h-10 w-10 text-cream/20" />
          <p className="mt-4 text-sm text-cream/35">No callback requests found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {callbacks.map((callback, index) => (
            <motion.div
              key={callback.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded-2xl border border-cream/8 bg-onyx-900/30 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-medium text-cream">{callback.name}</p>
                  <p className="mt-1 text-sm text-cream/40">{callback.phone}</p>
                  <p className="mt-2 text-xs text-cream/25">{callback.property.title}</p>
                  {callback.user?.email && <p className="mt-1 text-xs text-cream/25">{callback.user.email}</p>}
                </div>
                <div className="flex flex-col items-start gap-3 md:items-end">
                  <span className="rounded-full border border-cream/10 px-3 py-1 text-[10px] text-cream/55">
                    {callback.status}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-cream/25">
                    <Clock className="h-3 w-3" />
                    {new Date(callback.createdAt).toLocaleString("en-IN")}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(callback.id, "COMPLETED")} className="rounded-lg border border-emerald-500/20 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10">
                      Complete
                    </button>
                    <button onClick={() => updateStatus(callback.id, "CANCELLED")} className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10">
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
  );
}
