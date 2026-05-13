"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Crown,
  ImageIcon,
  Layers,
  LayoutGrid,
  MapPinned,
  Sparkles,
  Star,
  Video,
} from "lucide-react";
import type { Plan, PlanCategory, SubscriptionUsage } from "@onyx/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "http://localhost:4000/api/v1";

const SELLER_ROLES = new Set(["SELLER", "AGENT", "ADMIN", "SUPER_ADMIN"]);
const CATEGORY_LABELS: Record<Exclude<PlanCategory, "ALL">, string> = {
  FARMLAND: "Farmland",
  RESIDENTIAL_PLOT: "Residential Plots",
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void | Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color?: string;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

function getPlanAccent(type: Plan["type"]) {
  if (type === "PREMIUM") {
    return "border-gold/40 bg-gold/10";
  }
  if (type === "FEATURED") {
    return "border-earth-terracotta/30 bg-earth-terracotta/10";
  }
  if (type === "FREE") {
    return "border-earth-green/30 bg-earth-green/10";
  }
  return "border-cream/10 bg-onyx-900/60";
}

function getVisibilityLabel(plan: Plan) {
  if (plan.hasHomepagePlacement) {
    return "Homepage priority";
  }
  if (plan.hasTopSectionPlacement) {
    return "Top section";
  }
  if (plan.hasTopRank) {
    return "Top ranked";
  }
  return `${plan.visibilityLabel[0].toUpperCase()}${plan.visibilityLabel.slice(1)} visibility`;
}

function getPlanHighlights(plan: Plan) {
  return [
    {
      icon: Layers,
      label:
        plan.maxProperties === -1
          ? "Unlimited listings"
          : `${plan.maxProperties} listing${plan.maxProperties > 1 ? "s" : ""}`,
    },
    {
      icon: ImageIcon,
      label:
        plan.maxImages === -1
          ? "Unlimited images"
          : `${plan.maxImages} image${plan.maxImages === 1 ? "" : "s"}`,
    },
    {
      icon: Video,
      label:
        plan.maxVideos > 0
          ? `${plan.maxVideos} video${plan.maxVideos === 1 ? "" : "s"}`
          : plan.hasVideo
          ? "Video enabled"
          : "No video",
    },
    {
      icon: MapPinned,
      label: `${plan.listingDuration} day listing`,
    },
  ];
}

async function loadRazorpayScript() {
  if (window.Razorpay) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Exclude<PlanCategory, "ALL">>("FARMLAND");

  useEffect(() => {
    async function fetchData() {
      try {
        const plansResponse = await fetch(`${API_BASE}/plans`);
        const plansPayload = await plansResponse.json();

        if (plansPayload.success) {
          setPlans(plansPayload.data);
          setPaymentsEnabled(Boolean(plansPayload.meta?.paymentsEnabled));
        }

        if (session?.user?.accessToken && SELLER_ROLES.has(session.user.role)) {
          const usageResponse = await fetch(`${API_BASE}/subscriptions/my/usage`, {
            headers: { Authorization: `Bearer ${session.user.accessToken}` },
          });
          const usagePayload = await usageResponse.json();

          if (usagePayload.success) {
            setUsage(usagePayload.data ?? null);
          }
        }
      } catch (error) {
        console.error("Failed to load pricing data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (status !== "loading") {
      fetchData();
    }
  }, [session, status]);

  const freePlan = useMemo(
    () => plans.find((plan) => plan.type === "FREE" && plan.category === "ALL") ?? null,
    [plans]
  );

  const categorizedPlans = useMemo(() => {
    return plans
      .filter((plan) => plan.category === selectedCategory)
      .sort((left, right) => left.sortOrder - right.sortOrder || left.price - right.price);
  }, [plans, selectedCategory]);

  const activePlanCodes = useMemo(
    () => new Set((usage?.activePlans ?? []).map((plan) => plan.code)),
    [usage]
  );

  const canPurchase = Boolean(session?.user && SELLER_ROLES.has(session.user.role));

  async function handleSubscribe(plan: Plan) {
    if (!session?.user) {
      router.push("/register");
      return;
    }

    if (!SELLER_ROLES.has(session.user.role)) {
      window.alert("Please use a seller account to activate listing plans.");
      return;
    }

    if (plan.price > 0 && !paymentsEnabled) {
      window.alert("Paid plans are not live yet. Please start with the free pack for now.");
      return;
    }

    setSubscribing(plan.id);

    try {
      const response = await fetch(`${API_BASE}/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
        },
        body: JSON.stringify({ planId: plan.id }),
      });

      const payload = await response.json();

      if (!payload.success) {
        throw new Error(payload.error || "Unable to activate this plan.");
      }

      const payment = payload.payment ?? { mode: "free" };
      const subscription = payload.data;

      if (payment.mode === "free" || payment.mode === "mock") {
        router.push(`/pricing/success?plan=${subscription.plan.code}`);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay || !payment.keyId) {
        throw new Error("Unable to load Razorpay checkout. Please try again.");
      }

      const checkout = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        order_id: payment.orderId,
        name: "Onyx Propcare",
        description: `${plan.name} listing plan`,
        prefill: {
          name: session.user.name,
          email: session.user.email,
        },
        theme: {
          color: "#C9A84C",
        },
        modal: {
          ondismiss: () => setSubscribing(null),
        },
        handler: async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
          const verifyResponse = await fetch(`${API_BASE}/subscriptions/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.user.accessToken}`,
            },
            body: JSON.stringify({
              subscriptionId: subscription.id,
              razorpayOrderId: razorpay_order_id,
              razorpayPaymentId: razorpay_payment_id,
              razorpaySignature: razorpay_signature,
            }),
          });

          const verifyPayload = await verifyResponse.json();
          if (!verifyPayload.success) {
            throw new Error(verifyPayload.error || "Payment verification failed.");
          }

          setSubscribing(null);
          router.push(`/pricing/success?plan=${verifyPayload.data.plan.code}`);
        },
      });

      checkout.open();
    } catch (error) {
      console.error("Subscription failed:", error);
      window.alert(error instanceof Error ? error.message : "Subscription failed. Please try again.");
      setSubscribing(null);
    }
  }

  return (
    <div className="min-h-screen bg-onyx-950">
      <section className="relative overflow-hidden px-6 pt-20 pb-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-gold/10 blur-[130px]" />
          <div className="absolute inset-x-0 top-24 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-4 py-1.5 text-xs font-body uppercase tracking-[0.28em] text-gold">
            <Sparkles className="h-3.5 w-3.5" />
            Listing Plans
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-4xl font-semibold text-cream md:text-5xl lg:text-6xl">
            Seller plans shaped for real listing inventory, not placeholder tiers
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-cream/55 md:text-lg">
            Pick the category pack that matches your inventory, publish with the right media limits,
            and stay ready for Railway deployment with live Razorpay checkout when keys are present.
          </p>
          {!paymentsEnabled && (
            <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-earth-green/25 bg-earth-green/10 px-5 py-4 text-left text-sm text-cream/75">
              <p className="font-medium text-earth-green">Seller onboarding is live with the free plan.</p>
              <p className="mt-1 text-cream/60">
                Paid plans are temporarily locked until Razorpay is configured in production. Sellers can still activate the free pack and start listing immediately.
              </p>
            </div>
          )}

          <div className="mx-auto mt-10 grid max-w-4xl gap-4 rounded-[2rem] border border-cream/10 bg-onyx-900/60 p-4 backdrop-blur-xl md:grid-cols-[1.2fr_2fr]">
            <div className="rounded-[1.5rem] border border-earth-green/20 bg-earth-green/10 p-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-earth-green/25 bg-earth-green/10 px-3 py-1 text-xs font-body uppercase tracking-[0.24em] text-earth-green">
                Free start
              </div>
              <h2 className="mt-4 font-display text-3xl text-cream">
                {freePlan?.name ?? "Free listing pack"}
              </h2>
              <p className="mt-3 text-sm text-cream/55">
                A lightweight entry pack for trying the workflow, validating seller access, and publishing one basic listing.
              </p>

              <div className="mt-6 flex items-end gap-2">
                <span className="font-display text-5xl text-cream">₹0</span>
                <span className="pb-2 text-sm text-cream/35">for 30 days</span>
              </div>

              <div className="mt-6 space-y-3">
                {(freePlan?.features ?? ["Basic listing", "Low visibility", "1 listing slot"]).map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm text-cream/70">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-earth-green" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {freePlan && (
                <button
                  onClick={() => handleSubscribe(freePlan)}
                  disabled={subscribing === freePlan.id || activePlanCodes.has(freePlan.code)}
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-earth-green/25 bg-earth-green/15 px-5 py-3 text-sm font-medium text-cream transition hover:border-earth-green/45 hover:bg-earth-green/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {activePlanCodes.has(freePlan.code)
                    ? "Free Pack Active"
                    : subscribing === freePlan.id
                    ? "Activating..."
                    : canPurchase
                    ? "Activate Free Pack"
                    : session?.user
                    ? "Seller Account Required"
                    : "Sign In to Activate"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-gold/20 bg-gradient-to-br from-gold/10 via-gold/5 to-transparent p-6 text-left">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-gold/80">What these packs control</p>
                  <h2 className="mt-2 font-display text-3xl text-cream">Plan-aware listing limits</h2>
                </div>
                {usage && (
                  <div className="rounded-2xl border border-gold/20 bg-onyx-950/30 px-4 py-3 text-left">
                    <p className="text-xs uppercase tracking-[0.2em] text-gold/80">Current usage</p>
                    <p className="mt-1 text-sm text-cream/70">
                      {usage.propertiesUsed} used
                      {usage.maxProperties === -1 ? " across unlimited slots" : ` out of ${usage.maxProperties} total slots`}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[ 
                  "Category-specific plan enforcement for farmland and residential plots",
                  "Image and video caps aligned with the purchased pack",
                  "Featured, top section, and homepage boosts driven by plan flags",
                  paymentsEnabled
                    ? "Paid checkout is live with Razorpay for production seller onboarding"
                    : "Paid plans stay locked until Razorpay is configured, while the free pack remains available",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-cream/10 bg-onyx-950/35 p-4 text-sm text-cream/65">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold/75">Paid plans</p>
            <h2 className="mt-2 font-display text-3xl text-cream md:text-4xl">Choose your inventory category</h2>
          </div>
          <div className="inline-flex rounded-2xl border border-cream/10 bg-onyx-900/60 p-1">
            {(Object.entries(CATEGORY_LABELS) as [Exclude<PlanCategory, "ALL">, string][]).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setSelectedCategory(value)}
                className={`rounded-[1rem] px-4 py-2.5 text-sm font-medium transition ${
                  selectedCategory === value
                    ? "bg-gold text-onyx-950 shadow-[0_10px_30px_rgba(201,168,76,0.25)]"
                    : "text-cream/60 hover:text-cream"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {categorizedPlans.map((plan, index) => {
              const isCurrent = activePlanCodes.has(plan.code);
              const isPremium = plan.type === "PREMIUM";
              const planHighlights = getPlanHighlights(plan);
              const isPaidUnavailable = plan.price > 0 && !paymentsEnabled;

              return (
                <motion.article
                  key={plan.id}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] ${getPlanAccent(plan.type)}`}
                >
                  {isPremium && (
                    <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-gold/95 via-gold to-gold/95 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.24em] text-onyx-950">
                      Premium visibility
                    </div>
                  )}

                  <div className={isPremium ? "pt-10" : ""}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-cream/10 bg-onyx-950/35 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cream/70">
                          {plan.type === "FEATURED" ? <Star className="h-3.5 w-3.5 text-earth-terracotta" /> : null}
                          {plan.type === "PREMIUM" ? <Crown className="h-3.5 w-3.5 text-gold" /> : null}
                          {plan.type === "BASIC" ? <LayoutGrid className="h-3.5 w-3.5 text-cream/55" /> : null}
                          {plan.name}
                        </div>
                        <h3 className="mt-4 font-display text-3xl text-cream">{plan.name}</h3>
                        <p className="mt-2 text-sm text-cream/55">{getVisibilityLabel(plan)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-4xl text-gold">₹{plan.price.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-cream/35">for {plan.listingDuration} days</p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {planHighlights.map((item) => (
                        <div key={item.label} className="rounded-2xl border border-cream/10 bg-onyx-950/30 p-3">
                          <item.icon className="h-4 w-4 text-gold" />
                          <p className="mt-2 text-sm text-cream/75">{item.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 space-y-3">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3 text-sm text-cream/70">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {plan.hasVerifiedBadge && (
                        <div className="flex items-start gap-3 text-sm text-cream/70">
                          <BadgeCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                          <span>Verified badge on listing cards</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={subscribing === plan.id || isCurrent || isPaidUnavailable}
                      className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition ${
                        isPremium
                          ? "bg-gradient-to-r from-gold to-gold-light text-onyx-950 hover:shadow-[0_16px_40px_rgba(201,168,76,0.35)]"
                          : "border border-cream/10 bg-onyx-950/40 text-cream hover:border-gold/35 hover:text-gold"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {isCurrent
                        ? "Already Active"
                        : subscribing === plan.id
                        ? "Processing..."
                        : isPaidUnavailable
                        ? "Coming Soon"
                        : canPurchase
                        ? plan.price === 0
                          ? "Activate Plan"
                          : "Continue to Payment"
                        : session?.user
                        ? "Seller Account Required"
                        : "Sign In to Continue"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    {isPaidUnavailable && (
                      <p className="mt-3 text-xs text-cream/45">
                        Paid checkout will unlock after Razorpay is connected. Free onboarding is available now.
                      </p>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
