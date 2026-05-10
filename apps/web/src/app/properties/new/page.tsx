"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Home,
  Ruler,
  DollarSign,
  FileText,
  ChevronRight,
  AlertCircle,
  Loader2,
  Sparkles,
  Lock,
  Layers,
  Camera,
  Upload,
  X,
  Star,
} from "lucide-react";
import type { SubscriptionUsage } from "@onyx/types";
import { INDIAN_STATES, AREA_UNITS } from "@onyx/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "http://localhost:4000/api/v1";

const PROPERTY_TYPES = [
  { value: "FARMLAND", label: "Farmland" },
  { value: "RESIDENTIAL_PLOT", label: "Residential Plot" },
  { value: "AGRICULTURAL_LAND", label: "Agricultural Land" },
  { value: "ORCHARD", label: "Orchard" },
  { value: "PLANTATION", label: "Plantation" },
];

const FACING_OPTIONS = [
  "North",
  "South",
  "East",
  "West",
  "North-East",
  "North-West",
  "South-East",
  "South-West",
];

function getPlanCategoryForPropertyType(type: string) {
  if (type === "RESIDENTIAL_PLOT") {
    return "RESIDENTIAL_PLOT";
  }

  return "FARMLAND";
}

export default function NewPropertyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<{ url: string; publicId: string; preview?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "FARMLAND",
    listingType: "SALE" as "SALE" | "LEASE",
    price: "",
    state: "",
    district: "",
    village: "",
    taluka: "",
    pincode: "",
    address: "",
    totalArea: "",
    areaUnit: "acres",
    facing: "",
    roadAccess: false,
    roadWidth: "",
    boundaryWall: false,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.accessToken) {
      fetchUsage();
    }
  }, [status, session]);

  async function fetchUsage() {
    try {
      const res = await fetch(`${API_BASE}/subscriptions/my/usage`, {
        headers: { Authorization: `Bearer ${session!.user.accessToken}` },
      });
      const data = await res.json();

      if (data.success && data.data) {
        setUsage(data.data);
      } else {
        // No active subscription, redirect to pricing
        router.push("/pricing");
      }
    } catch {
      router.push("/pricing");
    } finally {
      setLoadingUsage(false);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const selectedPlanCategory = useMemo(
    () => getPlanCategoryForPropertyType(form.type),
    [form.type]
  );

  const eligiblePlans = useMemo(
    () =>
      usage?.activePlans.filter(
        (plan) => plan.category === "ALL" || plan.category === selectedPlanCategory
      ) ?? [],
    [selectedPlanCategory, usage]
  );

  const selectedPlan = useMemo(
    () =>
      eligiblePlans.find(
        (plan) => plan.maxProperties === -1 || plan.propertiesUsed < plan.maxProperties
      ) ?? null,
    [eligiblePlans]
  );

  const maxImages = selectedPlan?.maxImages ?? 0;
  const hasUnlimitedImages = maxImages === -1;

  const handleImageUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const allowed = fileArray.filter(
      (f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 5 * 1024 * 1024
    );
    if (allowed.length === 0) return;

    const remaining = hasUnlimitedImages ? allowed.length : maxImages - uploadedImages.length;
    if (!hasUnlimitedImages && remaining <= 0) {
      setError(`Image limit reached (${maxImages}). Upgrade your plan for more.`);
      return;
    }
    const toUpload = hasUnlimitedImages ? allowed : allowed.slice(0, remaining);

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      toUpload.forEach((f) => formData.append("images", f));

      const res = await fetch(`${API_BASE}/upload/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session!.user.accessToken}` },
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setUploadedImages((prev) => [...prev, ...data.data]);
      } else {
        setError(data.error || "Failed to upload images");
      }
    } catch {
      setError("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [uploadedImages.length, maxImages, session]);

  const removeImage = async (index: number) => {
    const img = uploadedImages[index];
    try {
      await fetch(`${API_BASE}/upload/images/${encodeURIComponent(img.publicId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session!.user.accessToken}` },
      });
    } catch {}
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files);
    }
  }, [handleImageUpload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        listingType: form.listingType,
        price: parseFloat(form.price),
        state: form.state,
        district: form.district,
        village: form.village || undefined,
        taluka: form.taluka || undefined,
        pincode: form.pincode || undefined,
        address: form.address,
        totalArea: parseFloat(form.totalArea),
        areaUnit: form.areaUnit,
        facing: form.facing || undefined,
        roadAccess: form.roadAccess,
        roadWidth: form.roadWidth ? parseFloat(form.roadWidth) : undefined,
        boundaryWall: form.boundaryWall,
      };

      const res = await fetch(`${API_BASE}/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session!.user.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        if (uploadedImages.length > 0) {
          await fetch(`${API_BASE}/upload/property-images`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session!.user.accessToken}`,
            },
            body: JSON.stringify({
              propertyId: data.data.id,
              images: uploadedImages.map((img, i) => ({
                url: img.url,
                publicId: img.publicId,
                isPrimary: i === 0,
                order: i,
              })),
            }),
          });
        }
        router.push("/dashboard/properties");
      } else {
        if (data.code === "NO_ACTIVE_PLAN") {
          router.push("/pricing");
          return;
        }
        setError(
          typeof data.error === "string"
            ? data.error
            : "Validation failed. Please check your inputs."
        );
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loadingUsage) {
    return (
      <div className="min-h-screen bg-onyx-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!usage) {
    return null; // Will redirect
  }

  const usagePercent =
    !selectedPlan || selectedPlan.maxProperties === -1
      ? 0
      : Math.round((selectedPlan.propertiesUsed / selectedPlan.maxProperties) * 100);
  const isAtLimit =
    !selectedPlan ||
    (selectedPlan.maxProperties !== -1 &&
      selectedPlan.propertiesUsed >= selectedPlan.maxProperties);

  return (
    <div className="min-h-screen bg-onyx-950">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gold/3 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-12 pb-24 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-2">
            List a New Property
          </h1>
          <p className="text-cream/40 font-body">
            Fill in the details below to create your property listing
          </p>
        </motion.div>

        {/* Plan Usage Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gold/10 rounded-lg">
                <Sparkles className="w-4 h-4 text-gold" />
              </div>
              <div>
                <span className="font-body font-medium text-cream text-sm">
                  {selectedPlan?.name ?? "No matching plan"}
                </span>
                <span className="text-cream/30 text-xs ml-2">
                  {usage.daysRemaining} days remaining
                </span>
              </div>
            </div>
            <span className="text-sm font-body text-cream/60">
              {!selectedPlan
                ? "No compatible listing pack"
                : selectedPlan.maxProperties === -1
                ? `${selectedPlan.propertiesUsed} properties used (Unlimited)`
                : `${selectedPlan.propertiesUsed} / ${selectedPlan.maxProperties} properties used`}
            </span>
          </div>

          {selectedPlan && selectedPlan.maxProperties !== -1 && (
            <div className="w-full h-2 bg-onyx-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${usagePercent}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className={`h-full rounded-full ${
                  usagePercent >= 80
                    ? "bg-red-500"
                    : usagePercent >= 50
                    ? "bg-yellow-500"
                    : "bg-gold"
                }`}
              />
            </div>
          )}

          {/* Data features available */}
          <div className="flex flex-wrap gap-3 mt-4">
            {[
              {
                label: selectedPlanCategory === "RESIDENTIAL_PLOT" ? "Residential pack" : "Farmland pack",
                available: Boolean(selectedPlan),
                icon: Layers,
              },
              {
                label: hasUnlimitedImages ? "Unlimited images" : `${maxImages} image limit`,
                available: Boolean(selectedPlan),
                icon: Camera,
              },
              {
                label:
                  selectedPlan?.maxVideos && selectedPlan.maxVideos > 0
                    ? `${selectedPlan.maxVideos} video limit`
                    : "No video uploads",
                available: Boolean(selectedPlan?.maxVideos && selectedPlan.maxVideos > 0),
                icon: Camera,
              },
              {
                label: `${eligiblePlans.length} eligible pack${eligiblePlans.length === 1 ? "" : "s"}`,
                available: eligiblePlans.length > 0,
                icon: Sparkles,
              },
            ].map((feat) => (
              <div
                key={feat.label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body ${
                  feat.available
                    ? "bg-gold/10 text-gold border border-gold/20"
                    : "bg-onyx-800/50 text-cream/25 border border-cream/5"
                }`}
              >
                {feat.available ? (
                  <feat.icon className="w-3 h-3" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
                {feat.label}
                {!feat.available && (
                  <span className="text-[10px] text-cream/20 ml-1">
                    Upgrade
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* At Limit Warning */}
        {isAtLimit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-body text-red-400 font-medium">
                Property limit reached
              </p>
              <p className="text-xs text-red-400/60 mt-1">
                {selectedPlan
                  ? `You have used all ${selectedPlan.maxProperties} property slots in your ${selectedPlan.name} plan. `
                  : `Your active plans do not support ${selectedPlanCategory === "RESIDENTIAL_PLOT" ? "residential plots" : "farmland-style listings"}. `}
                <a href="/pricing" className="text-gold underline">
                  Choose a compatible plan
                </a>{" "}
                to continue listing.
              </p>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Error display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-body text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Section: Basic Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gold/10 rounded-lg">
                <FileText className="w-4 h-4 text-gold" />
              </div>
              <h2 className="font-display text-xl font-semibold text-cream">
                Basic Details
              </h2>
            </div>

            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-body text-cream/60 mb-2">
                  Property Title *
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  minLength={5}
                  maxLength={200}
                  placeholder="e.g., Premium Black Soil Farmland near Nashik"
                  className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-body text-cream/60 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  minLength={20}
                  rows={5}
                  placeholder="Describe your property in detail..."
                  className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all resize-none"
                />
              </div>

              {/* Type + Listing Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-body text-cream/60 mb-2">
                    Property Type *
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all appearance-none"
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-body text-cream/60 mb-2">
                    Listing Type *
                  </label>
                  <div className="flex gap-3">
                    {(["SALE", "LEASE"] as const).map((lt) => (
                      <button
                        key={lt}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, listingType: lt }))
                        }
                        className={`flex-1 py-3 text-sm font-body rounded-xl border transition-all duration-300 ${
                          form.listingType === lt
                            ? "bg-gold/10 border-gold/40 text-gold"
                            : "bg-onyx-800/50 border-cream/10 text-cream/40 hover:border-cream/20"
                        }`}
                      >
                        {lt === "SALE" ? "For Sale" : "For Lease"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-body text-cream/60 mb-2">
                  Price (INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-body text-sm">
                    ₹
                  </span>
                  <input
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                    required
                    min={1}
                    placeholder="Enter price"
                    className="w-full pl-8 pr-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section: Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gold/10 rounded-lg">
                <MapPin className="w-4 h-4 text-gold" />
              </div>
              <h2 className="font-display text-xl font-semibold text-cream">
                Location
              </h2>
            </div>

            <div className="space-y-5">
              {/* State + District */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-body text-cream/60 mb-2">
                    State *
                  </label>
                  <select
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all appearance-none"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-body text-cream/60 mb-2">
                    District *
                  </label>
                  <input
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    required
                    placeholder="Enter district"
                    className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                  />
                </div>
              </div>

              {/* Village + Taluka */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-body text-cream/60 mb-2">
                    Village
                  </label>
                  <input
                    name="village"
                    value={form.village}
                    onChange={handleChange}
                    placeholder="Enter village"
                    className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-body text-cream/60 mb-2">
                    Taluka
                  </label>
                  <input
                    name="taluka"
                    value={form.taluka}
                    onChange={handleChange}
                    placeholder="Enter taluka"
                    className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                  />
                </div>
              </div>

              {/* Pincode + Address */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-body text-cream/60 mb-2">
                    Pincode
                  </label>
                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    placeholder="e.g., 422202"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-body text-cream/60 mb-2">
                    Address *
                  </label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    placeholder="Full address / Survey No."
                    className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section: Land Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gold/10 rounded-lg">
                <Ruler className="w-4 h-4 text-gold" />
              </div>
              <h2 className="font-display text-xl font-semibold text-cream">
                Land Details
              </h2>
            </div>

            <div className="space-y-5">
              {/* Area + Unit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-body text-cream/60 mb-2">
                    Total Area *
                  </label>
                  <input
                    name="totalArea"
                    type="number"
                    step="0.01"
                    value={form.totalArea}
                    onChange={handleChange}
                    required
                    min={0.01}
                    placeholder="Enter total area"
                    className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-body text-cream/60 mb-2">
                    Area Unit *
                  </label>
                  <select
                    name="areaUnit"
                    value={form.areaUnit}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all appearance-none"
                  >
                    {AREA_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Facing */}
              <div>
                <label className="block text-sm font-body text-cream/60 mb-2">
                  Facing
                </label>
                <select
                  name="facing"
                  value={form.facing}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all appearance-none"
                >
                  <option value="">Select facing direction</option>
                  {FACING_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Road Access + Road Width */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="roadAccess"
                        checked={form.roadAccess}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-onyx-800 border border-cream/10 rounded-full peer-checked:bg-gold/20 peer-checked:border-gold/40 transition-all" />
                      <div className="absolute top-1 left-1 w-4 h-4 bg-cream/30 rounded-full peer-checked:translate-x-4 peer-checked:bg-gold transition-all" />
                    </div>
                    <span className="text-sm font-body text-cream/60">
                      Road Access
                    </span>
                  </label>
                </div>

                {form.roadAccess && (
                  <div>
                    <label className="block text-sm font-body text-cream/60 mb-2">
                      Road Width (feet)
                    </label>
                    <input
                      name="roadWidth"
                      type="number"
                      value={form.roadWidth}
                      onChange={handleChange}
                      placeholder="e.g., 30"
                      className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Boundary Wall */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="boundaryWall"
                      checked={form.boundaryWall}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-onyx-800 border border-cream/10 rounded-full peer-checked:bg-gold/20 peer-checked:border-gold/40 transition-all" />
                    <div className="absolute top-1 left-1 w-4 h-4 bg-cream/30 rounded-full peer-checked:translate-x-4 peer-checked:bg-gold transition-all" />
                  </div>
                  <span className="text-sm font-body text-cream/60">
                    Boundary Wall
                  </span>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Section: Property Images */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <Camera className="w-4 h-4 text-gold" />
                </div>
                <h2 className="font-display text-xl font-semibold text-cream">
                  Property Images
                </h2>
              </div>
              <span className="text-xs font-body text-cream/40">
                {uploadedImages.length} / {hasUnlimitedImages ? "Unlimited" : maxImages} images
              </span>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                dragOver
                  ? "border-gold/60 bg-gold/5"
                  : "border-cream/10 hover:border-cream/20 hover:bg-onyx-800/30"
              } ${!hasUnlimitedImages && uploadedImages.length >= maxImages ? "opacity-50 pointer-events-none" : ""}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => {
                  if (e.target.files) handleImageUpload(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-gold animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-cream/20" />
                )}
                <div>
                  <p className="text-sm font-body text-cream/60">
                    {uploading ? "Uploading..." : "Drag & drop images or click to browse"}
                  </p>
                  <p className="text-xs font-body text-cream/30 mt-1">
                    JPEG, PNG, WebP up to 5MB each
                  </p>
                </div>
              </div>
            </div>

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                {uploadedImages.map((img, i) => (
                  <div key={img.publicId} className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-cream/10">
                    <img
                      src={img.url}
                      alt={`Upload ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {i === 0 && (
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 bg-gold/90 rounded text-[10px] font-body font-medium text-onyx-950">
                        <Star className="w-2.5 h-2.5" />
                        Primary
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                      className="absolute top-1.5 right-1.5 p-1 bg-onyx-950/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                    >
                      <X className="w-3.5 h-3.5 text-cream" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-end gap-4"
          >
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-sm font-body text-cream/50 border border-cream/10 rounded-xl hover:text-cream hover:border-cream/20 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isAtLimit}
              className="group relative px-8 py-3 bg-gradient-to-r from-gold to-gold-light text-onyx-950 font-body font-medium text-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-gold/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Listing
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
