"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Eye,
  MessageSquare,
  TrendingUp,
  Plus,
  Search,
  Sparkles,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Badge, Button } from "@onyx/ui";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useApiQuery } from "@/lib/hooks";

interface DashboardStats {
  totalProperties: number;
  activeListings: number;
  totalViews: number;
  totalInquiries: number;
  newInquiries: number;
  callbackCount?: number;
  favoritesCount?: number;
  viewedCount?: number;
  recentViews?: Array<{
    viewedAt: string;
    property: { id: string; title: string; slug: string; district: string; state: string };
  }>;
  subscription: {
    planName: string;
    planType: string;
    maxProperties: number;
    propertiesUsed: number;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    features: string[];
    price: number;
  } | null;
      recentInquiries: Array<{
    id: string;
    message: string;
    status: string;
    createdAt: string;
    property: { title: string; slug: string };
    user: { name: string; email: string };
  }>;
}

interface StatCard {
  label: string;
  value: number | string;
  icon: typeof Building2;
  color: string;
  badge?: string;
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "NEW":
      return "default" as const;
    case "CONTACTED":
      return "residential" as const;
    case "SITE_VISIT":
      return "farmland" as const;
    case "NEGOTIATING":
      return "warning" as const;
    case "CLOSED_WON":
      return "success" as const;
    case "CLOSED_LOST":
      return "danger" as const;
    default:
      return "outline" as const;
  }
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const { data: statsRes, isLoading: loading } = useApiQuery<{ success: boolean; data: DashboardStats }>(
    ["dashboard", "stats"],
    "/users/me/stats"
  );
  const stats = statsRes?.data || null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  const isSeller = session?.user?.role === "SELLER" || session?.user?.role === "AGENT";

  const statCards: StatCard[] = isSeller
    ? [
        {
          label: "Total Properties",
          value: stats?.totalProperties ?? 0,
          icon: Building2,
          color: "text-gold",
        },
        {
          label: "Active Listings",
          value: stats?.activeListings ?? 0,
          icon: TrendingUp,
          color: "text-emerald-400",
        },
        {
          label: "Total Views",
          value: stats?.totalViews ?? 0,
          icon: Eye,
          color: "text-sky-400",
        },
        {
          label: "Total Inquiries",
          value: stats?.totalInquiries ?? 0,
          icon: MessageSquare,
          color: "text-amber-400",
          badge: stats?.newInquiries ? `${stats.newInquiries} new` : undefined,
        },
      ]
    : [
        {
          label: "Properties Viewed",
          value: stats?.viewedCount ?? 0,
          icon: Eye,
          color: "text-sky-400",
        },
        {
          label: "Inquiries Sent",
          value: stats?.totalInquiries ?? 0,
          icon: MessageSquare,
          color: "text-gold",
        },
        {
          label: "Favorites",
          value: stats?.favoritesCount ?? 0,
          icon: Building2,
          color: "text-amber-400",
        },
        {
          label: "Callbacks",
          value: stats?.callbackCount ?? 0,
          icon: TrendingUp,
          color: "text-emerald-400",
        },
      ];

  return (
    <>
      <DashboardHeader
        title="Dashboard"
        subtitle={`Welcome back, ${session?.user?.name?.split(" ")[0] || "User"}`}
        user={session?.user ? { name: session.user.name, avatar: session.user.avatar } : undefined}
      />

      <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-5 hover:border-cream/15 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-lg bg-onyx-800/50 ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  {card.badge && (
                    <Badge variant="default" className="text-[10px]">
                      {card.badge}
                    </Badge>
                  )}
                </div>
                <p className="font-display text-3xl font-semibold text-gold mb-1">
                  {card.value}
                </p>
                <p className="text-sm font-body text-cream/40">{card.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Subscription Usage + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Subscription Usage */}
            {isSeller && stats?.subscription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2 bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-gold/10 rounded-lg">
                    <Sparkles className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-cream">
                      {stats.subscription.planName} Plan
                    </h3>
                    <p className="text-xs font-body text-cream/30">
                      Active subscription
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Properties Usage */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-body text-cream/50">
                        Properties Used
                      </span>
                      <span className="text-sm font-body text-cream/70">
                        {stats.subscription.maxProperties === -1
                          ? `${stats.subscription.propertiesUsed} (Unlimited)`
                          : `${stats.subscription.propertiesUsed} / ${stats.subscription.maxProperties}`}
                      </span>
                    </div>
                    {stats.subscription.maxProperties !== -1 && (
                      <div className="w-full h-2 bg-onyx-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              (stats.subscription.propertiesUsed /
                                stats.subscription.maxProperties) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Days Remaining */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-body text-cream/50">
                        Days Remaining
                      </span>
                      <span className="text-sm font-body text-cream/70">
                        {stats.subscription.daysRemaining} days
                      </span>
                    </div>
                    <div className="w-full h-2 bg-onyx-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (stats.subscription.daysRemaining / 365) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className={`bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 ${
                !isSeller || !stats?.subscription ? "lg:col-span-3" : ""
              }`}
            >
              <h3 className="font-display text-lg font-semibold text-cream mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                {isSeller && (
                  <Link
                    href="/properties/new"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gold/10 border border-gold/20 text-gold text-sm font-body hover:bg-gold/15 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    List New Property
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Link>
                )}
                <Link
                  href="/properties"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cream/5 border border-cream/8 text-cream/60 text-sm font-body hover:bg-cream/8 hover:text-cream transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Browse Properties
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Recent Inquiries */}
          {isSeller && stats?.recentInquiries && stats.recentInquiries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-lg font-semibold text-cream">
                  Recent Inquiries
                </h3>
                <Link
                  href="/dashboard/inquiries"
                  className="text-sm font-body text-gold hover:text-gold-light transition-colors flex items-center gap-1"
                >
                  View all
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {stats.recentInquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className={`flex items-center gap-4 p-4 rounded-xl bg-onyx-800/30 border transition-colors hover:bg-onyx-800/50 ${
                      inquiry.status === "NEW"
                        ? "border-l-2 border-l-gold border-cream/5"
                        : "border-cream/5"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-cream/5 flex items-center justify-center text-cream/50 font-display text-sm font-semibold shrink-0">
                      {inquiry.user.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body text-cream truncate">
                        {inquiry.user.name}
                      </p>
                      <p className="text-xs font-body text-cream/30 truncate">
                        {inquiry.property.title}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(inquiry.status)} className="text-[10px] shrink-0">
                      {inquiry.status.replace("_", " ")}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-cream/25 shrink-0">
                      <Clock className="w-3 h-3" />
                      {timeAgo(inquiry.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {!isSeller && stats?.recentViews && stats.recentViews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-lg font-semibold text-cream">Recently Viewed</h3>
                <Link
                  href="/properties"
                  className="text-sm font-body text-gold hover:text-gold-light transition-colors flex items-center gap-1"
                >
                  Browse more
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {stats.recentViews.map((view) => (
                  <Link
                    key={`${view.property.id}-${view.viewedAt}`}
                    href={`/properties/${view.property.slug}`}
                    className="block rounded-xl border border-cream/5 bg-onyx-800/30 p-4 transition-colors hover:bg-onyx-800/50"
                  >
                    <p className="text-sm font-body text-cream">{view.property.title}</p>
                    <p className="mt-1 text-xs text-cream/30">
                      {view.property.district}, {view.property.state}
                    </p>
                    <p className="mt-2 text-xs text-cream/25">{timeAgo(view.viewedAt)}</p>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  );
}
