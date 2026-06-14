"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Calendar, CreditCard, ImageIcon, LayoutGrid, Sparkles, Video } from "lucide-react";
import type { SubscriptionUsage } from "@onyx/types";
import { Button } from "@onyx/ui";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { formatPrice } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "http://localhost:4000/api/v1";

function formatLimit(value: number, label: string) {
  if (value === -1) {
    return `Unlimited ${label}`;
  }

  return `${value} ${label}`;
}

export default function DashboardSubscriptionPage() {
  const { data: session } = useSession();
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const plansResponse = await fetch(`${API_BASE}/plans`);
        const plansPayload = await plansResponse.json();

        if (plansPayload.success) {
          setPaymentsEnabled(Boolean(plansPayload.meta?.paymentsEnabled));
        }

        if (session?.user?.accessToken) {
          const response = await fetch(`${API_BASE}/subscriptions/my/usage`, {
            headers: { Authorization: `Bearer ${session.user.accessToken}` },
          });
          const payload = await response.json();

          if (payload.success) {
            setUsage(payload.data ?? null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch subscription usage:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, [session]);

  const propertyUsagePercent = useMemo(() => {
    if (!usage || usage.maxProperties <= 0 || usage.maxProperties === -1) {
      return 0;
    }

    return Math.min(100, Math.round((usage.propertiesUsed / usage.maxProperties) * 100));
  }, [usage]);

  if (loading) {
    return (
      <>
        <DashboardHeader title="Subscription" subtitle="Manage your plan" />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        title="Subscription"
        subtitle="Track active listing packs, limits, and expiry windows"
        user={session?.user ? { name: session.user.name, avatar: session.user.avatar } : undefined}
      />

      <div className="p-8">
        {!usage ? (
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-cream/10 bg-onyx-900/55 p-10 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cream/10 bg-onyx-950/40">
              <CreditCard className="h-8 w-8 text-cream/55" />
            </div>
            <h3 className="mt-6 font-display text-2xl text-cream">No active listing plan</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-cream/50">
              Activate a pack to unlock category-aware listing limits, featured placement, and the media allowance tied to your seller inventory.
            </p>
            {!paymentsEnabled && (
              <div className="mx-auto mt-5 max-w-lg rounded-2xl border border-earth-green/20 bg-earth-green/10 px-4 py-3 text-left text-sm text-cream/65">
                <p className="font-medium text-earth-green">Free seller onboarding is available now.</p>
                <p className="mt-1">
                  Paid packs will unlock here automatically once Razorpay is configured in production.
                </p>
              </div>
            )}
            <Link href="/pricing" className="mt-8 inline-flex">
              <Button>
                <Sparkles className="h-4 w-4" />
                {paymentsEnabled ? "View Plans" : "Start With Free Plan"}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-[2rem] border border-gold/20 bg-gradient-to-br from-gold/10 via-transparent to-transparent p-8"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-gold">
                    <Sparkles className="h-3.5 w-3.5" />
                    Active packs
                  </span>
                  <h2 className="mt-4 font-display text-3xl text-cream">{usage.planName}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-cream/60">
                    {usage.activePlans.length} active pack{usage.activePlans.length > 1 ? "s" : ""} are powering your listings right now. Limits below are aggregated across all current packs.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-cream/10 bg-onyx-950/35 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-gold/75">Listings</p>
                    <p className="mt-2 text-lg text-cream">
                      {usage.maxProperties === -1
                        ? `${usage.propertiesUsed} used / unlimited`
                        : `${usage.propertiesUsed} / ${usage.maxProperties}`}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-cream/10 bg-onyx-950/35 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-gold/75">Images</p>
                    <p className="mt-2 text-lg text-cream">{formatLimit(usage.maxImages, "images")}</p>
                  </div>
                  <div className="rounded-2xl border border-cream/10 bg-onyx-950/35 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-gold/75">Days left</p>
                    <p className="mt-2 text-lg text-cream">{usage.daysRemaining}</p>
                  </div>
                </div>
              </div>

              {usage.maxProperties !== -1 && (
                <div className="mt-8">
                  <div className="mb-2 flex items-center justify-between text-sm text-cream/55">
                    <span>Property slot usage</span>
                    <span>{propertyUsagePercent}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-onyx-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${propertyUsagePercent}%` }}
                      transition={{ duration: 0.7 }}
                      className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
                    />
                  </div>
                </div>
              )}
            </motion.section>

            <section className="grid gap-5 lg:grid-cols-2">
              {usage.activePlans.map((plan, index) => (
                <motion.article
                  key={plan.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="rounded-[1.75rem] border border-cream/10 bg-onyx-900/55 p-6 backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-gold/75">{plan.category.replace(/_/g, " ")}</p>
                      <h3 className="mt-2 font-display text-2xl text-cream">{plan.name}</h3>
                      <p className="mt-2 text-sm text-cream/50">Pack code: {plan.code}</p>
                    </div>
                    <div className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold">
                      {plan.type}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-cream/10 bg-onyx-950/35 p-4">
                      <LayoutGrid className="h-4 w-4 text-gold" />
                      <p className="mt-2 text-sm text-cream/70">
                        {plan.maxProperties === -1
                          ? `${plan.propertiesUsed} used / unlimited`
                          : `${plan.propertiesUsed} of ${plan.maxProperties} slots used`}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-cream/10 bg-onyx-950/35 p-4">
                      <ImageIcon className="h-4 w-4 text-gold" />
                      <p className="mt-2 text-sm text-cream/70">{formatLimit(plan.maxImages, "images")}</p>
                    </div>
                    <div className="rounded-2xl border border-cream/10 bg-onyx-950/35 p-4">
                      <Video className="h-4 w-4 text-gold" />
                      <p className="mt-2 text-sm text-cream/70">{formatLimit(plan.maxVideos, "videos")}</p>
                    </div>
                    <div className="rounded-2xl border border-cream/10 bg-onyx-950/35 p-4">
                      <Calendar className="h-4 w-4 text-gold" />
                      <p className="mt-2 text-sm text-cream/70">
                        Expires{" "}
                        {plan.endDate
                          ? new Date(plan.endDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </section>

            <div className="flex justify-end">
              <Link href="/pricing">
                <Button variant="outline">
                  <Sparkles className="h-4 w-4" />
                  Add Another Pack
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
