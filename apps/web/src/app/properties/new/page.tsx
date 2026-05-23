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
  Video,
  FileArchive,
  Satellite,
  UserPlus,
} from "lucide-react";
import type { SubscriptionUsage } from "@onyx/types";
import { INDIAN_STATES, AREA_UNITS } from "@onyx/types";
import { becomeSeller, hasSellerAccess } from "@/lib/seller";
import { ApiError } from "@/lib/utils";

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

function toOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

interface UploadedAsset {
  url: string;
  publicId: string;
  originalName?: string;
  size?: number;
}

export default function NewPropertyPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [upgradingSeller, setUpgradingSeller] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationResent, setVerificationResent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<{ url: string; publicId: string; preview?: string }[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<Array<UploadedAsset & { title: string; thumbnailUrl?: string }>>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<UploadedAsset & { name: string; type: string }>>([]);
  const [droneMap, setDroneMap] = useState<{
    mapUrl: string;
    publicId?: string;
    thumbnailUrl?: string;
    resolution: string;
    capturedAt: string;
    notes: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [uploadingReportField, setUploadingReportField] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "FARMLAND",
    listingType: "SALE" as "SALE" | "LEASE" | "RENT",
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
    soilType: "",
    waterSource: "",
    irrigation: "",
    cropHistory: "",
    annualYield: "",
    isNAOrder: false,
    isTPScheme: false,
    zonalType: "",
    ownershipType: "",
    surveyNumber: "",
    hasClearTitle: false,
    isDisputeFree: false,
    encumbrance: "",
  });
  const [nearbyLocations, setNearbyLocations] = useState([{ name: "", distanceKm: "", category: "" }]);
  const [soilReport, setSoilReport] = useState({
    soilType: "",
    ph: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    organicCarbon: "",
    texture: "",
    fertility: "",
    suitableCrops: "",
    reportUrl: "",
    testedAt: "",
  });
  const [waterReport, setWaterReport] = useState({
    waterTableDepth: "",
    waterQuality: "",
    tdsLevel: "",
    borewellCount: "",
    borewellDepth: "",
    canalDistance: "",
    riverDistance: "",
    rainfallAvg: "",
    reportUrl: "",
    testedAt: "",
  });
  const [legalReport, setLegalReport] = useState({
    titleStatus: "",
    encumbranceCheck: false,
    encumbranceResult: "",
    litigationCheck: false,
    litigationResult: "",
    naOrderVerified: false,
    tpSchemeVerified: false,
    revenueRecordOk: false,
    reportUrl: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.accessToken) {
      if (!hasSellerAccess(session.user.role)) {
        setLoadingUsage(false);
        return;
      }

      fetchUsage(session.user.accessToken);
    }
  }, [router, session, status]);

  async function fetchUsage(accessToken: string) {
    try {
      const res = await fetch(`${API_BASE}/subscriptions/my/usage`, {
        headers: { Authorization: `Bearer ${accessToken}` },
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

  async function handleBecomeSeller() {
    if (!session?.user?.accessToken) {
      router.push("/login");
      return;
    }

    setUpgradingSeller(true);
    setError(null);

    try {
      const data = await becomeSeller(session.user.accessToken);

      await update({
        role: data.data.user.role,
        accessToken: data.data.token,
        avatar: data.data.user.avatar,
        name: data.data.user.name,
      });

      await fetchUsage(data.data.token);
    } catch (upgradeError) {
      if (upgradeError instanceof ApiError && upgradeError.code === "EMAIL_NOT_VERIFIED") {
        setEmailNotVerified(true);
      } else {
        setError(upgradeError instanceof Error ? upgradeError.message : "Failed to upgrade account");
      }
    } finally {
      setUpgradingSeller(false);
    }
  }

  async function handleResendVerification() {
    if (!session?.user?.accessToken || resendingVerification || verificationResent) return;
    setResendingVerification(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      await fetch(`${API_URL}/api/v1/auth/send-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      });
      setVerificationResent(true);
    } catch {
      // silent — user can try again
    } finally {
      setResendingVerification(false);
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

  const uploadFiles = useCallback(
    async (endpoint: "videos" | "documents", fieldName: "videos" | "documents", files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return [];

      const formData = new FormData();
      fileArray.forEach((file) => formData.append(fieldName, file));

      const response = await fetch(`${API_BASE}/upload/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session!.user.accessToken}` },
        body: formData,
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || `Failed to upload ${endpoint}`);
      }

      return data.data as UploadedAsset[];
    },
    [session]
  );

  const handleVideoUpload = useCallback(async (files: FileList | File[]) => {
    setUploadingVideos(true);
    setError(null);

    try {
      const uploaded = await uploadFiles("videos", "videos", files);
      setUploadedVideos((prev) => [
        ...prev,
        ...uploaded.map((asset) => ({
          ...asset,
          title: asset.originalName?.replace(/\.[^.]+$/, "") || "Listing video",
        })),
      ]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload videos");
    } finally {
      setUploadingVideos(false);
    }
  }, [uploadFiles]);

  const handleDocumentUpload = useCallback(async (files: FileList | File[]) => {
    setUploadingDocuments(true);
    setError(null);

    try {
      const uploaded = await uploadFiles("documents", "documents", files);
      setUploadedDocuments((prev) => [
        ...prev,
        ...uploaded.map((asset) => ({
          ...asset,
          name: asset.originalName || "Document",
          type: "supporting_document",
        })),
      ]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload documents");
    } finally {
      setUploadingDocuments(false);
    }
  }, [uploadFiles]);

  const handleReportUpload = useCallback(async (
    reportKind: "soil" | "water" | "legal",
    files: FileList | File[]
  ) => {
    setUploadingReportField(reportKind);
    setError(null);

    try {
      const [uploaded] = await uploadFiles("documents", "documents", files);
      if (!uploaded?.url) {
        throw new Error("No file was uploaded");
      }

      if (reportKind === "soil") {
        setSoilReport((prev) => ({ ...prev, reportUrl: uploaded.url }));
      } else if (reportKind === "water") {
        setWaterReport((prev) => ({ ...prev, reportUrl: uploaded.url }));
      } else {
        setLegalReport((prev) => ({ ...prev, reportUrl: uploaded.url }));
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload report");
    } finally {
      setUploadingReportField(null);
    }
  }, [uploadFiles]);

  const handleDroneMapUpload = useCallback(async (files: FileList | File[]) => {
    setUploadingDocuments(true);
    setError(null);

    try {
      const formData = new FormData();
      Array.from(files).slice(0, 1).forEach((file) => formData.append("images", file));
      const response = await fetch(`${API_BASE}/upload/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session!.user.accessToken}` },
        body: formData,
      });
      const data = await response.json();
      if (!data.success || !data.data?.[0]?.url) {
        throw new Error(data.error || "Failed to upload drone map");
      }

      setDroneMap((prev) => ({
        mapUrl: data.data[0].url,
        publicId: data.data[0].publicId,
        thumbnailUrl: data.data[0].url,
        resolution: prev?.resolution || "",
        capturedAt: prev?.capturedAt || "",
        notes: prev?.notes || "",
      }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload drone map");
    } finally {
      setUploadingDocuments(false);
    }
  }, [session]);

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

  const updateNearbyLocation = (index: number, field: "name" | "distanceKm" | "category", value: string) => {
    setNearbyLocations((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addNearbyLocation = () => {
    setNearbyLocations((prev) =>
      prev.length >= 7 ? prev : [...prev, { name: "", distanceKm: "", category: "" }]
    );
  };

  const removeNearbyLocation = (index: number) => {
    setNearbyLocations((prev) => (prev.length === 1 ? [{ name: "", distanceKm: "", category: "" }] : prev.filter((_, i) => i !== index)));
  };

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
        soilType: form.soilType || undefined,
        waterSource: form.waterSource || undefined,
        irrigation: form.irrigation || undefined,
        cropHistory: form.cropHistory || undefined,
        annualYield: form.annualYield || undefined,
        isNAOrder: form.isNAOrder,
        isTPScheme: form.isTPScheme,
        zonalType: form.zonalType || undefined,
        ownershipType: form.ownershipType || undefined,
        surveyNumber: form.surveyNumber || undefined,
        hasClearTitle: form.hasClearTitle,
        isDisputeFree: form.isDisputeFree,
        encumbrance: form.encumbrance || undefined,
        nearbyLocations: nearbyLocations
          .filter((item) => item.name.trim() && item.distanceKm.trim())
          .map((item) => ({
            name: item.name.trim(),
            distanceKm: Number(item.distanceKm),
            category: item.category.trim() || undefined,
          })),
        soilData: soilReport.soilType.trim()
          ? {
              soilType: soilReport.soilType.trim(),
              ph: toOptionalNumber(soilReport.ph),
              nitrogen: toOptionalNumber(soilReport.nitrogen),
              phosphorus: toOptionalNumber(soilReport.phosphorus),
              potassium: toOptionalNumber(soilReport.potassium),
              organicCarbon: toOptionalNumber(soilReport.organicCarbon),
              texture: soilReport.texture.trim() || undefined,
              fertility: soilReport.fertility.trim() || undefined,
              suitableCrops: soilReport.suitableCrops.trim() || undefined,
              reportUrl: soilReport.reportUrl.trim() || undefined,
              testedAt: soilReport.testedAt || undefined,
            }
          : undefined,
        waterData:
          waterReport.waterTableDepth ||
          waterReport.waterQuality ||
          waterReport.tdsLevel ||
          waterReport.borewellCount ||
          waterReport.borewellDepth ||
          waterReport.canalDistance ||
          waterReport.riverDistance ||
          waterReport.rainfallAvg ||
          waterReport.reportUrl ||
          waterReport.testedAt
            ? {
                waterTableDepth: toOptionalNumber(waterReport.waterTableDepth),
                waterQuality: waterReport.waterQuality.trim() || undefined,
                tdsLevel: toOptionalNumber(waterReport.tdsLevel),
                borewellCount: toOptionalNumber(waterReport.borewellCount),
                borewellDepth: toOptionalNumber(waterReport.borewellDepth),
                canalDistance: toOptionalNumber(waterReport.canalDistance),
                riverDistance: toOptionalNumber(waterReport.riverDistance),
                rainfallAvg: toOptionalNumber(waterReport.rainfallAvg),
                reportUrl: waterReport.reportUrl.trim() || undefined,
                testedAt: waterReport.testedAt || undefined,
              }
            : undefined,
        legalCheck: legalReport.titleStatus.trim()
          ? {
              titleStatus: legalReport.titleStatus.trim(),
              encumbranceCheck: legalReport.encumbranceCheck,
              encumbranceResult: legalReport.encumbranceResult.trim() || undefined,
              litigationCheck: legalReport.litigationCheck,
              litigationResult: legalReport.litigationResult.trim() || undefined,
              naOrderVerified: legalReport.naOrderVerified,
              tpSchemeVerified: legalReport.tpSchemeVerified,
              revenueRecordOk: legalReport.revenueRecordOk,
              reportUrl: legalReport.reportUrl.trim() || undefined,
            }
          : undefined,
        videos: uploadedVideos.map((video, index) => ({
          url: video.url,
          publicId: video.publicId,
          title: video.title || `Listing video ${index + 1}`,
          thumbnailUrl: video.thumbnailUrl,
          isPrimary: index === 0,
          order: index,
        })),
        documents: uploadedDocuments.map((document) => ({
          name: document.name,
          url: document.url,
          publicId: document.publicId,
          type: document.type,
        })),
        droneMap: droneMap?.mapUrl
          ? {
              mapUrl: droneMap.mapUrl,
              thumbnailUrl: droneMap.thumbnailUrl || droneMap.mapUrl,
              resolution: droneMap.resolution || undefined,
              capturedAt: droneMap.capturedAt || undefined,
              notes: droneMap.notes || undefined,
            }
          : undefined,
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

  if (!hasSellerAccess(session?.user?.role)) {
    return (
      <div className="min-h-screen bg-onyx-950">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-gold/15 bg-onyx-900/60 p-8 md:p-10 shadow-2xl shadow-black/30"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-gold/70">
              Seller Onboarding
            </div>
            <h1 className="mt-6 font-display text-3xl md:text-4xl font-semibold text-cream">
              Turn Your Buyer Account Into a Seller Account
            </h1>
            <p className="mt-4 max-w-2xl text-sm md:text-base font-body leading-relaxed text-cream/45">
              You can use the same account to browse and list properties. Upgrade once, and we will
              take you straight into the listing workflow and seller plans.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                "Keep the same Google or email account",
                "Unlock seller dashboard and listing plans",
                "Start publishing properties without re-registering",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-cream/8 bg-onyx-950/60 p-4 text-sm text-cream/55">
                  {item}
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {emailNotVerified && (
              <div className="mt-6 rounded-2xl border border-gold/20 bg-gold/5 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gold">Email verification required</p>
                    <p className="mt-1 text-sm text-cream/50">
                      Please verify your email address before becoming a seller. Check your inbox for a verification link.
                    </p>
                    {verificationResent ? (
                      <p className="mt-3 text-sm text-green-400">✓ Verification email resent — check your inbox.</p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendingVerification}
                        className="mt-3 text-sm text-gold underline underline-offset-2 hover:text-gold/80 disabled:opacity-60"
                      >
                        {resendingVerification ? "Sending…" : "Resend verification email"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {!emailNotVerified && (
                <button
                  type="button"
                  onClick={handleBecomeSeller}
                  disabled={upgradingSeller}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-gold px-6 py-3 text-sm font-medium text-onyx-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {upgradingSeller ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Upgrading Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Become a Seller
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-xl border border-cream/10 px-6 py-3 text-sm text-cream/60 hover:border-gold/30 hover:text-gold"
              >
                Continue Browsing
              </button>
            </div>
          </motion.div>
        </div>
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
                label: "Videos, reports, and drone uploads enabled",
                available: true,
                icon: Video,
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
                    {(["SALE", "LEASE", "RENT"] as const).map((lt) => (
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
                        {lt === "SALE" ? "For Sale" : lt === "LEASE" ? "For Lease" : "For Rent"}
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.43 }}
            className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gold/10 rounded-lg">
                <MapPin className="w-4 h-4 text-gold" />
              </div>
              <h2 className="font-display text-xl font-semibold text-cream">
                Nearby Locations
              </h2>
            </div>

            <div className="space-y-4">
              {nearbyLocations.map((location, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[1.6fr_0.8fr_1fr_auto] gap-3">
                  <input
                    value={location.name}
                    onChange={(e) => updateNearbyLocation(index, "name", e.target.value)}
                    placeholder="Location name"
                    className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={location.distanceKm}
                    onChange={(e) => updateNearbyLocation(index, "distanceKm", e.target.value)}
                    placeholder="Distance (km)"
                    className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40"
                  />
                  <input
                    value={location.category}
                    onChange={(e) => updateNearbyLocation(index, "category", e.target.value)}
                    placeholder="Type e.g. School"
                    className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40"
                  />
                  <button
                    type="button"
                    onClick={() => removeNearbyLocation(index)}
                    className="px-4 py-3 text-sm font-body text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div className="flex items-center justify-between">
                <p className="text-xs text-cream/35">Add up to 7 nearby landmarks, schools, roads, or hubs.</p>
                <button
                  type="button"
                  onClick={addNearbyLocation}
                  disabled={nearbyLocations.length >= 7}
                  className="px-4 py-2 text-xs font-body text-gold border border-gold/20 rounded-lg disabled:opacity-40"
                >
                  Add Nearby Location
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44 }}
            className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gold/10 rounded-lg">
                <Layers className="w-4 h-4 text-gold" />
              </div>
              <h2 className="font-display text-xl font-semibold text-cream">
                Seller Data
              </h2>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-body text-cream/60 mb-2">Soil Type</label>
                  <input name="soilType" value={form.soilType} onChange={handleChange} placeholder="e.g., Black cotton soil" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
                </div>
                <div>
                  <label className="block text-sm font-body text-cream/60 mb-2">Water Source</label>
                  <input name="waterSource" value={form.waterSource} onChange={handleChange} placeholder="e.g., Borewell, canal" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-body text-cream/60 mb-2">Irrigation</label>
                  <input name="irrigation" value={form.irrigation} onChange={handleChange} placeholder="e.g., Drip irrigation" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
                </div>
                <div>
                  <label className="block text-sm font-body text-cream/60 mb-2">Annual Yield</label>
                  <input name="annualYield" value={form.annualYield} onChange={handleChange} placeholder="e.g., 120 quintals soybean" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-body text-cream/60 mb-2">Crop History</label>
                <textarea name="cropHistory" value={form.cropHistory} onChange={handleChange} rows={3} placeholder="Past crops, seasons, rotations..." className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40 resize-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-body text-cream/60 mb-2">Ownership Type</label>
                  <input name="ownershipType" value={form.ownershipType} onChange={handleChange} placeholder="e.g., Freehold" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
                </div>
                <div>
                  <label className="block text-sm font-body text-cream/60 mb-2">Survey Number</label>
                  <input name="surveyNumber" value={form.surveyNumber} onChange={handleChange} placeholder="Survey / plot reference" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="hasClearTitle" checked={form.hasClearTitle} onChange={handleChange} className="h-4 w-4 accent-[var(--color-gold,#c8a97e)]" />
                  <span className="text-sm font-body text-cream/60">Clear title available</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="isDisputeFree" checked={form.isDisputeFree} onChange={handleChange} className="h-4 w-4 accent-[var(--color-gold,#c8a97e)]" />
                  <span className="text-sm font-body text-cream/60">Dispute free</span>
                </label>
              </div>

              {selectedPlanCategory === "RESIDENTIAL_PLOT" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="isNAOrder" checked={form.isNAOrder} onChange={handleChange} className="h-4 w-4 accent-[var(--color-gold,#c8a97e)]" />
                    <span className="text-sm font-body text-cream/60">NA Order</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="isTPScheme" checked={form.isTPScheme} onChange={handleChange} className="h-4 w-4 accent-[var(--color-gold,#c8a97e)]" />
                    <span className="text-sm font-body text-cream/60">TP Scheme</span>
                  </label>
                  <input name="zonalType" value={form.zonalType} onChange={handleChange} placeholder="Zonal type" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
                </div>
              )}

              <div>
                <label className="block text-sm font-body text-cream/60 mb-2">Encumbrance Notes</label>
                <textarea name="encumbrance" value={form.encumbrance} onChange={handleChange} rows={3} placeholder="Loan, lien, or legal remarks if any" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40 resize-none" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46 }}
            className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-6"
          >
            <h2 className="font-display text-xl font-semibold text-cream mb-6">Soil Report Submission</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input value={soilReport.soilType} onChange={(e) => setSoilReport((prev) => ({ ...prev, soilType: e.target.value }))} placeholder="Report soil type" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input value={soilReport.texture} onChange={(e) => setSoilReport((prev) => ({ ...prev, texture: e.target.value }))} placeholder="Texture" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input type="number" step="0.1" value={soilReport.ph} onChange={(e) => setSoilReport((prev) => ({ ...prev, ph: e.target.value }))} placeholder="pH" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input value={soilReport.fertility} onChange={(e) => setSoilReport((prev) => ({ ...prev, fertility: e.target.value }))} placeholder="Fertility" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input type="number" step="0.1" value={soilReport.nitrogen} onChange={(e) => setSoilReport((prev) => ({ ...prev, nitrogen: e.target.value }))} placeholder="Nitrogen" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input type="number" step="0.1" value={soilReport.phosphorus} onChange={(e) => setSoilReport((prev) => ({ ...prev, phosphorus: e.target.value }))} placeholder="Phosphorus" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input type="number" step="0.1" value={soilReport.potassium} onChange={(e) => setSoilReport((prev) => ({ ...prev, potassium: e.target.value }))} placeholder="Potassium" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input type="number" step="0.01" value={soilReport.organicCarbon} onChange={(e) => setSoilReport((prev) => ({ ...prev, organicCarbon: e.target.value }))} placeholder="Organic carbon %" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input type="date" value={soilReport.testedAt} onChange={(e) => setSoilReport((prev) => ({ ...prev, testedAt: e.target.value ? new Date(e.target.value).toISOString() : "" }))} className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm focus:outline-none focus:border-gold/40" />
              <input value={soilReport.reportUrl} onChange={(e) => setSoilReport((prev) => ({ ...prev, reportUrl: e.target.value }))} placeholder="Report URL" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
            </div>
            <label className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold cursor-pointer hover:bg-gold/10">
              {uploadingReportField === "soil" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload Soil Report
              <input
                type="file"
                accept=".pdf,.doc,.docx,image/jpeg,image/png"
                onChange={(event) => {
                  if (event.target.files) handleReportUpload("soil", event.target.files);
                  event.target.value = "";
                }}
                className="hidden"
              />
            </label>
            <textarea value={soilReport.suitableCrops} onChange={(e) => setSoilReport((prev) => ({ ...prev, suitableCrops: e.target.value }))} rows={3} placeholder="Suitable crops (comma separated)" className="w-full mt-5 px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40 resize-none" />
            <p className="mt-3 text-xs text-cream/35">Submitted soil reports will remain pending until admin approval.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.47 }}
            className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-6"
          >
            <h2 className="font-display text-xl font-semibold text-cream mb-6">Water Report Submission</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input type="number" step="0.1" value={waterReport.waterTableDepth} onChange={(e) => setWaterReport((prev) => ({ ...prev, waterTableDepth: e.target.value }))} placeholder="Water table depth (ft)" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input value={waterReport.waterQuality} onChange={(e) => setWaterReport((prev) => ({ ...prev, waterQuality: e.target.value }))} placeholder="Water quality" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input type="number" step="0.1" value={waterReport.tdsLevel} onChange={(e) => setWaterReport((prev) => ({ ...prev, tdsLevel: e.target.value }))} placeholder="TDS level" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input type="number" value={waterReport.borewellCount} onChange={(e) => setWaterReport((prev) => ({ ...prev, borewellCount: e.target.value }))} placeholder="Borewell count" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input type="number" step="0.1" value={waterReport.borewellDepth} onChange={(e) => setWaterReport((prev) => ({ ...prev, borewellDepth: e.target.value }))} placeholder="Borewell depth" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input type="number" step="0.1" value={waterReport.canalDistance} onChange={(e) => setWaterReport((prev) => ({ ...prev, canalDistance: e.target.value }))} placeholder="Canal distance (km)" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input type="number" step="0.1" value={waterReport.riverDistance} onChange={(e) => setWaterReport((prev) => ({ ...prev, riverDistance: e.target.value }))} placeholder="River distance (km)" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input type="number" step="0.1" value={waterReport.rainfallAvg} onChange={(e) => setWaterReport((prev) => ({ ...prev, rainfallAvg: e.target.value }))} placeholder="Average rainfall (mm/year)" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input type="date" value={waterReport.testedAt} onChange={(e) => setWaterReport((prev) => ({ ...prev, testedAt: e.target.value ? new Date(e.target.value).toISOString() : "" }))} className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm focus:outline-none focus:border-gold/40" />
              <input value={waterReport.reportUrl} onChange={(e) => setWaterReport((prev) => ({ ...prev, reportUrl: e.target.value }))} placeholder="Water report URL" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
            </div>
            <label className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold cursor-pointer hover:bg-gold/10">
              {uploadingReportField === "water" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload Water Report
              <input
                type="file"
                accept=".pdf,.doc,.docx,image/jpeg,image/png"
                onChange={(event) => {
                  if (event.target.files) handleReportUpload("water", event.target.files);
                  event.target.value = "";
                }}
                className="hidden"
              />
            </label>
            <p className="mt-3 text-xs text-cream/35">Water reports stay attached to the listing while admin approval metadata remains available for review.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-8"
          >
            <h2 className="font-display text-xl font-semibold text-cream mb-6">Legal Check Submission</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input value={legalReport.titleStatus} onChange={(e) => setLegalReport((prev) => ({ ...prev, titleStatus: e.target.value }))} placeholder="Title status e.g. clear" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input value={legalReport.reportUrl} onChange={(e) => setLegalReport((prev) => ({ ...prev, reportUrl: e.target.value }))} placeholder="Legal report URL" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input value={legalReport.encumbranceResult} onChange={(e) => setLegalReport((prev) => ({ ...prev, encumbranceResult: e.target.value }))} placeholder="Encumbrance result" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
              <input value={legalReport.litigationResult} onChange={(e) => setLegalReport((prev) => ({ ...prev, litigationResult: e.target.value }))} placeholder="Litigation result" className="w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40" />
            </div>
            <label className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold cursor-pointer hover:bg-gold/10">
              {uploadingReportField === "legal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload Legal Report
              <input
                type="file"
                accept=".pdf,.doc,.docx,image/jpeg,image/png"
                onChange={(event) => {
                  if (event.target.files) handleReportUpload("legal", event.target.files);
                  event.target.value = "";
                }}
                className="hidden"
              />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={legalReport.encumbranceCheck} onChange={(e) => setLegalReport((prev) => ({ ...prev, encumbranceCheck: e.target.checked }))} className="h-4 w-4 accent-[var(--color-gold,#c8a97e)]" /><span className="text-sm text-cream/60">Encumbrance checked</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={legalReport.litigationCheck} onChange={(e) => setLegalReport((prev) => ({ ...prev, litigationCheck: e.target.checked }))} className="h-4 w-4 accent-[var(--color-gold,#c8a97e)]" /><span className="text-sm text-cream/60">Litigation checked</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={legalReport.naOrderVerified} onChange={(e) => setLegalReport((prev) => ({ ...prev, naOrderVerified: e.target.checked }))} className="h-4 w-4 accent-[var(--color-gold,#c8a97e)]" /><span className="text-sm text-cream/60">NA order verified</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={legalReport.tpSchemeVerified} onChange={(e) => setLegalReport((prev) => ({ ...prev, tpSchemeVerified: e.target.checked }))} className="h-4 w-4 accent-[var(--color-gold,#c8a97e)]" /><span className="text-sm text-cream/60">TP scheme verified</span></label>
              <label className="flex items-center gap-3 cursor-pointer md:col-span-2"><input type="checkbox" checked={legalReport.revenueRecordOk} onChange={(e) => setLegalReport((prev) => ({ ...prev, revenueRecordOk: e.target.checked }))} className="h-4 w-4 accent-[var(--color-gold,#c8a97e)]" /><span className="text-sm text-cream/60">Revenue records matched</span></label>
            </div>
            <p className="mt-3 text-xs text-cream/35">Legal checks become visible as verified only after admin approval.</p>
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46 }}
            className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <Video className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-cream">Listing Videos</h2>
                  <p className="text-xs text-cream/35 mt-1">Upload walkthrough videos for this listing.</p>
                </div>
              </div>
              <span className="text-xs font-body text-cream/40">
                {uploadedVideos.length} / 5 videos
              </span>
            </div>

            <div className="rounded-xl border border-dashed border-cream/10 bg-onyx-800/20 p-5">
              <label className="inline-flex items-center gap-2 rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold cursor-pointer hover:bg-gold/10">
                {uploadingVideos ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload Videos
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  multiple
                  onChange={(event) => {
                    if (event.target.files) handleVideoUpload(event.target.files);
                    event.target.value = "";
                  }}
                  className="hidden"
                />
              </label>
              <p className="mt-2 text-xs text-cream/35">MP4, WebM, or MOV up to 100MB each.</p>
            </div>

            {uploadedVideos.length > 0 && (
              <div className="mt-4 space-y-3">
                {uploadedVideos.map((video, index) => (
                  <div key={video.publicId} className="rounded-xl border border-cream/8 bg-onyx-800/30 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      <video src={video.url} controls className="h-28 w-full rounded-lg bg-black md:w-56" />
                      <div className="flex-1">
                        <label className="mb-2 block text-xs uppercase tracking-wide text-cream/40">Video Title</label>
                        <input
                          value={video.title}
                          onChange={(event) =>
                            setUploadedVideos((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, title: event.target.value } : item
                              )
                            )
                          }
                          className="w-full rounded-xl border border-cream/10 bg-onyx-900/40 px-4 py-3 text-sm text-cream focus:border-gold/40 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedVideos((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                        className="self-start rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.47 }}
            className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gold/10 rounded-lg">
                <FileArchive className="w-4 h-4 text-gold" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-cream">Property Documents</h2>
                <p className="text-xs text-cream/35 mt-1">Upload brochure, title proof, maps, extracts, or approvals.</p>
              </div>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold hover:bg-gold/10">
              {uploadingDocuments ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload Documents
              <input
                type="file"
                accept=".pdf,.doc,.docx,image/jpeg,image/png"
                multiple
                onChange={(event) => {
                  if (event.target.files) handleDocumentUpload(event.target.files);
                  event.target.value = "";
                }}
                className="hidden"
              />
            </label>

            {uploadedDocuments.length > 0 && (
              <div className="mt-4 space-y-3">
                {uploadedDocuments.map((document, index) => (
                  <div key={document.publicId} className="grid gap-3 rounded-xl border border-cream/8 bg-onyx-800/30 p-4 md:grid-cols-[1.3fr_1fr_auto]">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-wide text-cream/40">Document Name</label>
                      <input
                        value={document.name}
                        onChange={(event) =>
                          setUploadedDocuments((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, name: event.target.value } : item
                            )
                          )
                        }
                        className="w-full rounded-xl border border-cream/10 bg-onyx-900/40 px-4 py-3 text-sm text-cream focus:border-gold/40 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-wide text-cream/40">Type</label>
                      <select
                        value={document.type}
                        onChange={(event) =>
                          setUploadedDocuments((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, type: event.target.value } : item
                            )
                          )
                        }
                        className="w-full rounded-xl border border-cream/10 bg-onyx-900/40 px-4 py-3 text-sm text-cream focus:border-gold/40 focus:outline-none"
                      >
                        <option value="supporting_document">Supporting Document</option>
                        <option value="title_deed">Title Deed</option>
                        <option value="7_12_extract">7/12 Extract</option>
                        <option value="mutation">Mutation</option>
                        <option value="site_map">Site Map</option>
                        <option value="approval">Approval</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedDocuments((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                      className="self-end rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gold/10 rounded-lg">
                <Satellite className="w-4 h-4 text-gold" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-cream">Drone Map</h2>
                <p className="text-xs text-cream/35 mt-1">Add an orthographic survey or plotted drone view for this listing.</p>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold cursor-pointer hover:bg-gold/10">
              {uploadingDocuments ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload Drone Map
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  if (event.target.files) handleDroneMapUpload(event.target.files);
                  event.target.value = "";
                }}
                className="hidden"
              />
            </label>

            {droneMap?.mapUrl && (
              <div className="mt-4 space-y-4">
                <img src={droneMap.mapUrl} alt="Drone map preview" className="h-56 w-full rounded-xl object-cover" />
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={droneMap.resolution}
                    onChange={(event) => setDroneMap((prev) => prev ? { ...prev, resolution: event.target.value } : prev)}
                    placeholder="Resolution e.g. 5cm/px"
                    className="w-full rounded-xl border border-cream/10 bg-onyx-900/40 px-4 py-3 text-sm text-cream focus:border-gold/40 focus:outline-none"
                  />
                  <input
                    type="date"
                    value={droneMap.capturedAt ? droneMap.capturedAt.slice(0, 10) : ""}
                    onChange={(event) =>
                      setDroneMap((prev) =>
                        prev
                          ? {
                              ...prev,
                              capturedAt: event.target.value ? new Date(event.target.value).toISOString() : "",
                            }
                          : prev
                      )
                    }
                    className="w-full rounded-xl border border-cream/10 bg-onyx-900/40 px-4 py-3 text-sm text-cream focus:border-gold/40 focus:outline-none"
                  />
                </div>
                <textarea
                  value={droneMap.notes}
                  onChange={(event) => setDroneMap((prev) => prev ? { ...prev, notes: event.target.value } : prev)}
                  rows={3}
                  placeholder="Drone capture notes, survey boundary context, or quality remarks"
                  className="w-full rounded-xl border border-cream/10 bg-onyx-900/40 px-4 py-3 text-sm text-cream focus:border-gold/40 focus:outline-none"
                />
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
