"use client";

import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Users,
  MessageSquare,
  Eye,
  MapPinned,
  Sprout,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface DashboardStats {
  totalProperties: number;
  activeListings: number;
  totalInquiries: number;
  totalUsers: number;
  activeUsers: number;
  newInquiries: number;
  totalViews: number;
  propertiesByType: Record<string, number>;
  propertiesByState: Record<string, number>;
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-IN");
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    const token = (session.user as any).accessToken;

    fetch(`${API_URL}/api/v1/admin/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.data) {
          setStats(data.data);
        }
      })
      .catch((error) => console.error("Dashboard fetch error:", error))
      .finally(() => setLoading(false));
  }, [session]);

  const topStates = useMemo(
    () => Object.entries(stats?.propertiesByState || {}).slice(0, 5),
    [stats]
  );
  const propertyTypes = useMemo(
    () => Object.entries(stats?.propertiesByType || {}),
    [stats]
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-cream">Dashboard</h1>
          <p className="text-sm text-cream/30 mt-1 font-body">Loading the live operations snapshot...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 rounded-2xl border border-cream/5 bg-onyx-900/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Properties",
      value: formatNumber(stats?.totalProperties ?? 0),
      helper: `${formatNumber(stats?.activeListings ?? 0)} active listings`,
      icon: Building2,
      color: "text-gold",
    },
    {
      title: "Registered Users",
      value: formatNumber(stats?.totalUsers ?? 0),
      helper: `${formatNumber(stats?.activeUsers ?? 0)} active accounts`,
      icon: Users,
      color: "text-sky-400",
    },
    {
      title: "Inquiries",
      value: formatNumber(stats?.totalInquiries ?? 0),
      helper: `${formatNumber(stats?.newInquiries ?? 0)} in the last 7 days`,
      icon: MessageSquare,
      color: "text-emerald-400",
    },
    {
      title: "Marketplace Views",
      value: formatNumber(stats?.totalViews ?? 0),
      helper: "Combined listing visibility",
      icon: Eye,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-cream">Dashboard</h1>
        <p className="text-sm text-cream/35 mt-1 font-body">
          Live operational health across listings, users, inquiries, and inventory spread.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="rounded-2xl border border-cream/8 bg-onyx-900/40 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-onyx-800/60 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="font-display text-3xl font-semibold text-cream">{stat.value}</p>
            <p className="text-sm text-cream/70 mt-1">{stat.title}</p>
            <p className="text-xs text-cream/30 mt-2">{stat.helper}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-cream/8 bg-onyx-900/35 p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-onyx-800/60 text-gold">
              <MapPinned className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl text-cream">Top Listing States</h2>
              <p className="text-sm text-cream/35">Where inventory is currently concentrated</p>
            </div>
          </div>

          <div className="space-y-4">
            {topStates.length > 0 ? (
              topStates.map(([state, count]) => {
                const pct = stats?.totalProperties ? Math.round((count / stats.totalProperties) * 100) : 0;
                return (
                  <div key={state} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-cream/70">{state}</span>
                      <span className="text-gold">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-onyx-800/70 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-gold" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-cream/30">No geographic distribution is available yet.</p>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-cream/8 bg-onyx-900/35 p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-onyx-800/60 text-emerald-400">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl text-cream">Property Mix</h2>
              <p className="text-sm text-cream/35">Active marketplace composition by asset type</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {propertyTypes.length > 0 ? (
              propertyTypes.map(([type, count]) => (
                <div key={type} className="rounded-2xl border border-cream/8 bg-onyx-800/35 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-cream/35">
                    {type.replace(/_/g, " ")}
                  </p>
                  <p className="font-display text-3xl text-gold mt-3">{count}</p>
                  <p className="text-xs text-cream/30 mt-1">Listings in this category</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-cream/30">No property segmentation is available yet.</p>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
