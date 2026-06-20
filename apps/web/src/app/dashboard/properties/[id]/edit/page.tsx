"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  MapPin,
  Ruler,
  FileText,
  ChevronRight,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Camera,
  Upload,
  X,
  Star,
  Video,
  FileArchive,
  Satellite,
} from "lucide-react";
import { INDIAN_STATES, AREA_UNITS } from "@onyx/types";
import { Badge } from "@onyx/ui";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "http://localhost:4000/api/v1";

const LocationPicker = dynamic(() => import("@/components/properties/location-picker"), { ssr: false });

const PROPERTY_TYPES = [
  { value: "FARMLAND", label: "Farmland" },
  { value: "RESIDENTIAL_PLOT", label: "Residential Plot" },
  { value: "AGRICULTURAL_LAND", label: "Agricultural Land" },
  { value: "ORCHARD", label: "Orchard" },
  { value: "PLANTATION", label: "Plantation" },
];

const FACING_OPTIONS = [
  "North", "South", "East", "West",
  "North-East", "North-West", "South-East", "South-West",
];

function toOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

interface UploadedAsset {
  url: string;
  publicId?: string;
  originalName?: string;
  size?: number;
}

export default function EditPropertyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });
  const [existingImages, setExistingImages] = useState<{ id: string; url: string; isPrimary: boolean; order: number }[]>([]);
  const [newImages, setNewImages] = useState<{ url: string; publicId: string }[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<Array<UploadedAsset & { title: string; thumbnailUrl?: string }>>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<UploadedAsset & { name: string; type: string }>>([]);
  const [droneMap, setDroneMap] = useState<{
    mapUrl: string;
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
  // Tracks whether any file was uploaded in this session but the form hasn't been saved yet
  const hasUnsavedUploads = useRef(false);
  const MAX_IMAGES = 10;

  // Derived: is any upload currently in flight?
  const isUploading = uploading || uploadingVideos || uploadingDocuments || !!uploadingReportField;

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
    approvalStatus: "",
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
    approvalStatus: "",
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
    approvalStatus: "",
  });

  useEffect(() => {
    if (session?.user?.accessToken && propertyId) {
      fetchProperty();
    }
  }, [session, propertyId]);

  // Warn browser-level exits (tab close, hard refresh, typed URL) when uploads are unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedUploads.current || newImages.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [newImages.length]);

  async function fetchProperty() {
    try {
      const res = await fetch(`${API_BASE}/properties/by-id/${propertyId}`, {
        headers: { Authorization: `Bearer ${session!.user.accessToken}` },
      });
      const data = await res.json();

      if (data.success && data.data) {
        const p = data.data;
        if (p.images && p.images.length > 0) {
          setExistingImages(
            p.images.map((img: { id: string; url: string; isPrimary: boolean; order: number }) => ({
              id: img.id,
              url: img.url,
              isPrimary: img.isPrimary,
              order: img.order,
            }))
          );
        }
        if (p.videos && p.videos.length > 0) {
          setUploadedVideos(
            p.videos.map((video: { url: string; publicId?: string | null; title?: string | null; thumbnailUrl?: string | null }) => ({
              url: video.url,
              publicId: video.publicId || undefined,
              title: video.title || "Listing video",
              thumbnailUrl: video.thumbnailUrl || undefined,
            }))
          );
        }
        if (p.documents && p.documents.length > 0) {
          setUploadedDocuments(
            p.documents.map((document: { url: string; publicId?: string | null; name: string; type: string }) => ({
              url: document.url,
              publicId: document.publicId || undefined,
              name: document.name,
              type: document.type,
            }))
          );
        }
        if (p.droneMap?.mapUrl) {
          setDroneMap({
            mapUrl: p.droneMap.mapUrl,
            thumbnailUrl: p.droneMap.thumbnailUrl || p.droneMap.mapUrl,
            resolution: p.droneMap.resolution || "",
            capturedAt: p.droneMap.capturedAt || "",
            notes: p.droneMap.notes || "",
          });
        }
        setCoordinates({
          latitude: typeof p.latitude === "number" ? p.latitude : null,
          longitude: typeof p.longitude === "number" ? p.longitude : null,
        });
        setForm({
          title: p.title || "",
          description: p.description || "",
          type: p.type || "FARMLAND",
          listingType: p.listingType || "SALE",
          price: p.price?.toString() || "",
          state: p.state || "",
          district: p.district || "",
          village: p.village || "",
          taluka: p.taluka || "",
          pincode: p.pincode || "",
          address: p.address || "",
          totalArea: p.totalArea?.toString() || "",
          areaUnit: p.areaUnit || "acres",
          facing: p.facing || "",
          roadAccess: p.roadAccess || false,
          roadWidth: p.roadWidth?.toString() || "",
          boundaryWall: p.boundaryWall || false,
          soilType: p.soilType || "",
          waterSource: p.waterSource || "",
          irrigation: p.irrigation || "",
          cropHistory: p.cropHistory || "",
          annualYield: p.annualYield || "",
          isNAOrder: p.isNAOrder || false,
          isTPScheme: p.isTPScheme || false,
          zonalType: p.zonalType || "",
          ownershipType: p.ownershipType || "",
          surveyNumber: p.surveyNumber || "",
          hasClearTitle: p.hasClearTitle || false,
          isDisputeFree: p.isDisputeFree || false,
          encumbrance: p.encumbrance || "",
        });
        setNearbyLocations(
          Array.isArray(p.nearbyLocations) && p.nearbyLocations.length > 0
            ? p.nearbyLocations.map((item: { name?: string; distanceKm?: number; category?: string }) => ({
                name: item.name || "",
                distanceKm: item.distanceKm != null ? String(item.distanceKm) : "",
                category: item.category || "",
              }))
            : [{ name: "", distanceKm: "", category: "" }]
        );
        if (p.soilData) {
          setSoilReport({
            soilType: p.soilData.soilType || "",
            ph: p.soilData.ph?.toString() || "",
            nitrogen: p.soilData.nitrogen?.toString() || "",
            phosphorus: p.soilData.phosphorus?.toString() || "",
            potassium: p.soilData.potassium?.toString() || "",
            organicCarbon: p.soilData.organicCarbon?.toString() || "",
            texture: p.soilData.texture || "",
            fertility: p.soilData.fertility || "",
            suitableCrops: p.soilData.suitableCrops || "",
            reportUrl: p.soilData.reportUrl || "",
            testedAt: p.soilData.testedAt || "",
            approvalStatus: p.soilData.approvalStatus || "",
          });
        }
        if (p.waterData) {
          setWaterReport({
            waterTableDepth: p.waterData.waterTableDepth?.toString() || "",
            waterQuality: p.waterData.waterQuality || "",
            tdsLevel: p.waterData.tdsLevel?.toString() || "",
            borewellCount: p.waterData.borewellCount?.toString() || "",
            borewellDepth: p.waterData.borewellDepth?.toString() || "",
            canalDistance: p.waterData.canalDistance?.toString() || "",
            riverDistance: p.waterData.riverDistance?.toString() || "",
            rainfallAvg: p.waterData.rainfallAvg?.toString() || "",
            reportUrl: p.waterData.reportUrl || "",
            testedAt: p.waterData.testedAt || "",
            approvalStatus: p.waterData.approvalStatus || "",
          });
        }
        if (p.legalCheck) {
          setLegalReport({
            titleStatus: p.legalCheck.titleStatus || "",
            encumbranceCheck: Boolean(p.legalCheck.encumbranceCheck),
            encumbranceResult: p.legalCheck.encumbranceResult || "",
            litigationCheck: Boolean(p.legalCheck.litigationCheck),
            litigationResult: p.legalCheck.litigationResult || "",
            naOrderVerified: Boolean(p.legalCheck.naOrderVerified),
            tpSchemeVerified: Boolean(p.legalCheck.tpSchemeVerified),
            revenueRecordOk: Boolean(p.legalCheck.revenueRecordOk),
            reportUrl: p.legalCheck.reportUrl || "",
            approvalStatus: p.legalCheck.approvalStatus || "",
          });
        }
      } else {
        setError("Property not found or you do not have permission to edit it.");
      }
    } catch {
      setError("Failed to load property data.");
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  function handleLocationResolved(location: {
    latitude: number;
    longitude: number;
    address: string;
    state: string;
    district: string;
    village: string;
    taluka: string;
    pincode: string;
  }) {
    setCoordinates({
      latitude: location.latitude,
      longitude: location.longitude,
    });
    setForm((prev) => ({
      ...prev,
      address: location.address || prev.address,
      state: location.state || prev.state,
      district: location.district || prev.district,
      village: location.village || prev.village,
      taluka: location.taluka || prev.taluka,
      pincode: location.pincode || prev.pincode,
    }));
  }

  const totalImages = existingImages.length + newImages.length;

  const handleImageUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const allowed = fileArray.filter(
      (f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 5 * 1024 * 1024
    );
    if (allowed.length === 0) return;

    const remaining = MAX_IMAGES - totalImages;
    if (remaining <= 0) {
      setError(`Image limit reached (${MAX_IMAGES}).`);
      return;
    }
    const toUpload = allowed.slice(0, remaining);

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
        setNewImages((prev) => [...prev, ...data.data]);
        hasUnsavedUploads.current = true;
      } else {
        setError(data.error || "Failed to upload images");
      }
    } catch {
      setError("Failed to upload images.");
    } finally {
      setUploading(false);
    }
  }, [totalImages, session]);

  /**
   * Upload files directly to the bucket via presigned PUT URLs.
   * Falls back to server-side upload if bucket storage is not active
   * (e.g. local dev using Cloudinary or local disk).
   */
  const uploadViaPresigned = useCallback(
    async (kind: "video" | "document", files: FileList | File[]): Promise<UploadedAsset[]> => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return [];

      return Promise.all(
        fileArray.map(async (file) => {
          // Step 1 — ask the API for a presigned PUT URL
          const presignRes = await fetch(`${API_BASE}/upload/presign/${kind}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session!.user.accessToken}`,
            },
            body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
          });

          const presignData = await presignRes.json();

          // Bucket storage not active — fall back to server-side upload
          if (!presignRes.ok && presignRes.status === 400 && presignData.error?.includes("bucket")) {
            const fieldName = kind === "video" ? "videos" : "documents";
            const endpoint = kind === "video" ? "videos" : "documents";
            const formData = new FormData();
            formData.append(fieldName, file);
            const fallbackRes = await fetch(`${API_BASE}/upload/${endpoint}`, {
              method: "POST",
              headers: { Authorization: `Bearer ${session!.user.accessToken}` },
              body: formData,
            });
            const fallbackData = await fallbackRes.json();
            if (!fallbackData.success) throw new Error(fallbackData.error || `Failed to upload ${kind}`);
            return fallbackData.data[0] as UploadedAsset;
          }

          if (!presignData.success) throw new Error(presignData.error || `Failed to get upload URL`);

          const { uploadUrl, fileUrl, objectKey, originalName, size } = presignData.data;

          // Step 2 — PUT the file bytes directly to the bucket (no API hop)
          const putRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!putRes.ok) {
            throw new Error(`Direct upload failed (${putRes.status} ${putRes.statusText})`);
          }

          return { url: fileUrl, publicId: objectKey, originalName, size } as UploadedAsset;
        })
      );
    },
    [session]
  );

  const handleVideoUpload = useCallback(async (files: FileList | File[]) => {
    setUploadingVideos(true);
    setError(null);
    try {
      const uploaded = await uploadViaPresigned("video", files);
      setUploadedVideos((prev) => [
        ...prev,
        ...uploaded.map((asset) => ({
          ...asset,
          title: asset.originalName?.replace(/\.[^.]+$/, "") || "Listing video",
        })),
      ]);
      hasUnsavedUploads.current = true;
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload videos");
    } finally {
      setUploadingVideos(false);
    }
  }, [uploadViaPresigned]);

  const handleDocumentUpload = useCallback(async (files: FileList | File[]) => {
    setUploadingDocuments(true);
    setError(null);
    try {
      const uploaded = await uploadViaPresigned("document", files);
      setUploadedDocuments((prev) => [
        ...prev,
        ...uploaded.map((asset) => ({
          ...asset,
          name: asset.originalName || "Document",
          type: "supporting_document",
        })),
      ]);
      hasUnsavedUploads.current = true;
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload documents");
    } finally {
      setUploadingDocuments(false);
    }
  }, [uploadViaPresigned]);

  const handleReportUpload = useCallback(async (
    reportKind: "soil" | "water" | "legal",
    files: FileList | File[]
  ) => {
    setUploadingReportField(reportKind);
    setError(null);
    try {
      const [uploaded] = await uploadViaPresigned("document", files);
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
  }, [uploadViaPresigned]);

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

  const removeExistingImage = async (imageId: string) => {
    const img = existingImages.find((i) => i.id === imageId);
    if (!img) return;
    const publicIdMatch = img.url.match(/onyx-propcare\/properties\/[^.]+/);
    if (publicIdMatch) {
      try {
        await fetch(`${API_BASE}/upload/images/${encodeURIComponent(publicIdMatch[0])}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session!.user.accessToken}` },
        });
      } catch {}
    }
    setExistingImages((prev) => prev.filter((i) => i.id !== imageId));
  };

  const removeNewImage = async (index: number) => {
    const img = newImages[index];
    try {
      await fetch(`${API_BASE}/upload/images/${encodeURIComponent(img.publicId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session!.user.accessToken}` },
      });
    } catch {}
    setNewImages((prev) => prev.filter((_, i) => i !== index));
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
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        type: form.type,
        listingType: form.listingType,
        price: parseFloat(form.price),
        state: form.state,
        district: form.district,
        address: form.address,
        latitude: coordinates.latitude ?? undefined,
        longitude: coordinates.longitude ?? undefined,
        totalArea: parseFloat(form.totalArea),
        areaUnit: form.areaUnit,
        roadAccess: form.roadAccess,
        boundaryWall: form.boundaryWall,
      };

      if (form.village) payload.village = form.village;
      if (form.taluka) payload.taluka = form.taluka;
      if (form.pincode) payload.pincode = form.pincode;
      if (form.facing) payload.facing = form.facing;
      if (form.roadWidth) payload.roadWidth = parseFloat(form.roadWidth);
      if (form.soilType) payload.soilType = form.soilType;
      if (form.waterSource) payload.waterSource = form.waterSource;
      if (form.irrigation) payload.irrigation = form.irrigation;
      if (form.cropHistory) payload.cropHistory = form.cropHistory;
      if (form.annualYield) payload.annualYield = form.annualYield;
      if (form.zonalType) payload.zonalType = form.zonalType;
      if (form.ownershipType) payload.ownershipType = form.ownershipType;
      if (form.surveyNumber) payload.surveyNumber = form.surveyNumber;
      if (form.encumbrance) payload.encumbrance = form.encumbrance;
      payload.isNAOrder = form.isNAOrder;
      payload.isTPScheme = form.isTPScheme;
      payload.hasClearTitle = form.hasClearTitle;
      payload.isDisputeFree = form.isDisputeFree;
      payload.nearbyLocations = nearbyLocations
        .filter((item) => item.name.trim() && item.distanceKm.trim())
        .map((item) => ({
          name: item.name.trim(),
          distanceKm: Number(item.distanceKm),
          category: item.category.trim() || undefined,
        }));
      payload.soilData = soilReport.soilType.trim()
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
        : null;
      payload.waterData =
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
          : null;
      payload.legalCheck = legalReport.titleStatus.trim()
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
        : null;
      payload.videos = uploadedVideos.map((video, index) => ({
        url: video.url,
        publicId: video.publicId,
        title: video.title || `Listing video ${index + 1}`,
        thumbnailUrl: video.thumbnailUrl,
        isPrimary: index === 0,
        order: index,
      }));
      payload.documents = uploadedDocuments.map((document) => ({
        name: document.name,
        url: document.url,
        publicId: document.publicId,
        type: document.type,
      }));
      payload.droneMap = droneMap?.mapUrl
        ? {
            mapUrl: droneMap.mapUrl,
            thumbnailUrl: droneMap.thumbnailUrl || droneMap.mapUrl,
            resolution: droneMap.resolution || undefined,
            capturedAt: droneMap.capturedAt || undefined,
            notes: droneMap.notes || undefined,
          }
        : null;

      const res = await fetch(`${API_BASE}/properties/${propertyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session!.user.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        hasUnsavedUploads.current = false;
        if (newImages.length > 0) {
          await fetch(`${API_BASE}/upload/property-images`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session!.user.accessToken}`,
            },
            body: JSON.stringify({
              propertyId,
              images: newImages.map((img, i) => ({
                url: img.url,
                publicId: img.publicId,
                isPrimary: existingImages.length === 0 && i === 0,
                order: existingImages.length + i,
              })),
            }),
          });
        }
        setSuccess(true);
        setTimeout(() => router.push("/dashboard/properties"), 1500);
      } else {
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

  const handleNavigateAway = useCallback(() => {
    if (hasUnsavedUploads.current || newImages.length > 0) {
      if (!window.confirm("You have uploaded files that haven't been saved yet. Leave without saving?")) return;
    }
    router.push("/dashboard/properties");
  }, [newImages.length, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm placeholder:text-cream/45 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all";
  const labelClass = "block text-sm font-body text-cream/60 mb-2";

  return (
    <>
      <DashboardHeader
        title="Edit Property"
        subtitle="Update your property listing details"
        user={session?.user ? { name: session.user.name, avatar: session.user.avatar } : undefined}
      />

      <div className="p-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back */}
          <button
            onClick={handleNavigateAway}
            className="flex items-center gap-2 text-sm font-body text-cream/65 hover:text-cream transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Properties
          </button>

          {/* Success */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6 text-sm font-body text-emerald-400"
            >
              Property updated successfully! Redirecting...
            </motion.div>
          )}

          {/* Error */}
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

          <form onSubmit={handleSubmit}>
            {/* Basic Details */}
            <div className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <FileText className="w-4 h-4 text-gold" />
                </div>
                <h2 className="font-display text-xl font-semibold text-cream">
                  Basic Details
                </h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Property Title *</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    minLength={5}
                    maxLength={200}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Description *</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    required
                    minLength={20}
                    rows={5}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Property Type *</label>
                    <select name="type" value={form.type} onChange={handleChange} className={`${inputClass} appearance-none`}>
                      {PROPERTY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Listing Type *</label>
                    <div className="flex gap-3">
                      {(["SALE", "LEASE", "RENT"] as const).map((lt) => (
                        <button
                          key={lt}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, listingType: lt }))}
                          className={`flex-1 py-3 text-sm font-body rounded-xl border transition-all duration-300 ${
                            form.listingType === lt
                              ? "bg-gold/10 border-gold/40 text-gold"
                              : "bg-onyx-800/50 border-cream/10 text-cream/65 hover:border-cream/20"
                          }`}
                        >
                          {lt === "SALE" ? "For Sale" : lt === "LEASE" ? "For Lease" : "For Rent"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Price (INR) *</label>
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
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-onyx-900/50 border border-cream/8 rounded-xl p-4 md:p-6 mb-6 overflow-visible">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <MapPin className="w-4 h-4 text-gold" />
                </div>
                <h2 className="font-display text-xl font-semibold text-cream">Location</h2>
              </div>

              <div className="space-y-5 overflow-visible">
                <LocationPicker
                  latitude={coordinates.latitude}
                  longitude={coordinates.longitude}
                  address={form.address}
                  state={form.state}
                  district={form.district}
                  village={form.village}
                  taluka={form.taluka}
                  pincode={form.pincode}
                  onLocationResolved={handleLocationResolved}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>State *</label>
                    <select name="state" value={form.state} onChange={handleChange} required className={`${inputClass} appearance-none`}>
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>District *</label>
                    <input name="district" value={form.district} onChange={handleChange} required className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Village</label>
                    <input name="village" value={form.village} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Taluka</label>
                    <input name="taluka" value={form.taluka} onChange={handleChange} className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>Pincode</label>
                    <input name="pincode" value={form.pincode} onChange={handleChange} maxLength={6} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Address *</label>
                    <input name="address" value={form.address} onChange={handleChange} required className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            {/* Land Details */}
            <div className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <Ruler className="w-4 h-4 text-gold" />
                </div>
                <h2 className="font-display text-xl font-semibold text-cream">Land Details</h2>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Total Area *</label>
                    <input name="totalArea" type="number" step="0.01" value={form.totalArea} onChange={handleChange} required min={0.01} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Area Unit *</label>
                    <select name="areaUnit" value={form.areaUnit} onChange={handleChange} className={`${inputClass} appearance-none`}>
                      {AREA_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Facing</label>
                  <select name="facing" value={form.facing} onChange={handleChange} className={`${inputClass} appearance-none`}>
                    <option value="">Select facing direction</option>
                    {FACING_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" name="roadAccess" checked={form.roadAccess} onChange={handleChange} className="sr-only peer" />
                      <div className="w-10 h-6 bg-onyx-800 border border-cream/10 rounded-full peer-checked:bg-gold/20 peer-checked:border-gold/40 transition-all" />
                      <div className="absolute top-1 left-1 w-4 h-4 bg-cream/30 rounded-full peer-checked:translate-x-4 peer-checked:bg-gold transition-all" />
                    </div>
                    <span className="text-sm font-body text-cream/60">Road Access</span>
                  </label>

                  {form.roadAccess && (
                    <div>
                      <label className={labelClass}>Road Width (feet)</label>
                      <input name="roadWidth" type="number" value={form.roadWidth} onChange={handleChange} className={inputClass} />
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" name="boundaryWall" checked={form.boundaryWall} onChange={handleChange} className="sr-only peer" />
                    <div className="w-10 h-6 bg-onyx-800 border border-cream/10 rounded-full peer-checked:bg-gold/20 peer-checked:border-gold/40 transition-all" />
                    <div className="absolute top-1 left-1 w-4 h-4 bg-cream/30 rounded-full peer-checked:translate-x-4 peer-checked:bg-gold transition-all" />
                  </div>
                  <span className="text-sm font-body text-cream/60">Boundary Wall</span>
                </label>
              </div>
            </div>

            <div className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <MapPin className="w-4 h-4 text-gold" />
                </div>
                <h2 className="font-display text-xl font-semibold text-cream">Nearby Locations</h2>
              </div>
              <div className="space-y-4">
                {nearbyLocations.map((location, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-[1.6fr_0.8fr_1fr_auto] gap-3">
                    <input value={location.name} onChange={(e) => updateNearbyLocation(index, "name", e.target.value)} placeholder="Location name" className={inputClass} />
                    <input type="number" step="0.1" min="0" value={location.distanceKm} onChange={(e) => updateNearbyLocation(index, "distanceKm", e.target.value)} placeholder="Distance (km)" className={inputClass} />
                    <input value={location.category} onChange={(e) => updateNearbyLocation(index, "category", e.target.value)} placeholder="Category" className={inputClass} />
                    <button type="button" onClick={() => removeNearbyLocation(index)} className="px-4 py-3 text-sm font-body text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10">Remove</button>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-cream/60">Maximum 7 nearby entries.</p>
                  <button type="button" onClick={addNearbyLocation} disabled={nearbyLocations.length >= 7} className="px-4 py-2 text-xs font-body text-gold border border-gold/20 rounded-lg disabled:opacity-40">Add Nearby</button>
                </div>
              </div>
            </div>

            <div className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <FileText className="w-4 h-4 text-gold" />
                </div>
                <h2 className="font-display text-xl font-semibold text-cream">Seller Data</h2>
              </div>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input name="soilType" value={form.soilType} onChange={handleChange} placeholder="Soil type" className={inputClass} />
                  <input name="waterSource" value={form.waterSource} onChange={handleChange} placeholder="Water source" className={inputClass} />
                  <input name="irrigation" value={form.irrigation} onChange={handleChange} placeholder="Irrigation" className={inputClass} />
                  <input name="annualYield" value={form.annualYield} onChange={handleChange} placeholder="Annual yield" className={inputClass} />
                  <input name="ownershipType" value={form.ownershipType} onChange={handleChange} placeholder="Ownership type" className={inputClass} />
                  <input name="surveyNumber" value={form.surveyNumber} onChange={handleChange} placeholder="Survey number" className={inputClass} />
                </div>
                <textarea name="cropHistory" value={form.cropHistory} onChange={handleChange} rows={3} placeholder="Crop history" className={`${inputClass} resize-none`} />
                <textarea name="encumbrance" value={form.encumbrance} onChange={handleChange} rows={3} placeholder="Encumbrance notes" className={`${inputClass} resize-none`} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="hasClearTitle" checked={form.hasClearTitle} onChange={handleChange} className="h-4 w-4 accent-[var(--color-gold,#c8a97e)]" /><span className="text-sm text-cream/60">Clear title available</span></label>
                  <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="isDisputeFree" checked={form.isDisputeFree} onChange={handleChange} className="h-4 w-4 accent-[var(--color-gold,#c8a97e)]" /><span className="text-sm text-cream/60">Dispute free</span></label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="isNAOrder" checked={form.isNAOrder} onChange={handleChange} className="h-4 w-4 accent-[var(--color-gold,#c8a97e)]" /><span className="text-sm text-cream/60">NA order</span></label>
                  <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="isTPScheme" checked={form.isTPScheme} onChange={handleChange} className="h-4 w-4 accent-[var(--color-gold,#c8a97e)]" /><span className="text-sm text-cream/60">TP scheme</span></label>
                  <input name="zonalType" value={form.zonalType} onChange={handleChange} placeholder="Zonal type" className={inputClass} />
                </div>
              </div>
            </div>

            <div className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold text-cream">Soil Report</h2>
                {soilReport.approvalStatus && <Badge variant="outline">{soilReport.approvalStatus}</Badge>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input value={soilReport.soilType} onChange={(e) => setSoilReport((prev) => ({ ...prev, soilType: e.target.value }))} placeholder="Report soil type" className={inputClass} />
                <input value={soilReport.texture} onChange={(e) => setSoilReport((prev) => ({ ...prev, texture: e.target.value }))} placeholder="Texture" className={inputClass} />
                <input type="number" step="0.1" value={soilReport.ph} onChange={(e) => setSoilReport((prev) => ({ ...prev, ph: e.target.value }))} placeholder="pH" className={inputClass} />
                <input value={soilReport.fertility} onChange={(e) => setSoilReport((prev) => ({ ...prev, fertility: e.target.value }))} placeholder="Fertility" className={inputClass} />
                <input type="number" step="0.1" value={soilReport.nitrogen} onChange={(e) => setSoilReport((prev) => ({ ...prev, nitrogen: e.target.value }))} placeholder="Nitrogen" className={inputClass} />
                <input type="number" step="0.1" value={soilReport.phosphorus} onChange={(e) => setSoilReport((prev) => ({ ...prev, phosphorus: e.target.value }))} placeholder="Phosphorus" className={inputClass} />
                <input type="number" step="0.1" value={soilReport.potassium} onChange={(e) => setSoilReport((prev) => ({ ...prev, potassium: e.target.value }))} placeholder="Potassium" className={inputClass} />
                <input type="number" step="0.01" value={soilReport.organicCarbon} onChange={(e) => setSoilReport((prev) => ({ ...prev, organicCarbon: e.target.value }))} placeholder="Organic carbon %" className={inputClass} />
                <input type="date" value={soilReport.testedAt ? soilReport.testedAt.slice(0, 10) : ""} onChange={(e) => setSoilReport((prev) => ({ ...prev, testedAt: e.target.value ? new Date(e.target.value).toISOString() : "" }))} className={inputClass} />
                <input value={soilReport.reportUrl} onChange={(e) => setSoilReport((prev) => ({ ...prev, reportUrl: e.target.value }))} placeholder="Report URL" className={inputClass} />
              </div>
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold hover:bg-gold/10">
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
              <textarea value={soilReport.suitableCrops} onChange={(e) => setSoilReport((prev) => ({ ...prev, suitableCrops: e.target.value }))} rows={3} placeholder="Suitable crops" className={`${inputClass} resize-none mt-5`} />
            </div>

            <div className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold text-cream">Water Report</h2>
                {waterReport.approvalStatus && <Badge variant="outline">{waterReport.approvalStatus}</Badge>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input type="number" step="0.1" value={waterReport.waterTableDepth} onChange={(e) => setWaterReport((prev) => ({ ...prev, waterTableDepth: e.target.value }))} placeholder="Water table depth (ft)" className={inputClass} />
                <input value={waterReport.waterQuality} onChange={(e) => setWaterReport((prev) => ({ ...prev, waterQuality: e.target.value }))} placeholder="Water quality" className={inputClass} />
                <input type="number" step="0.1" value={waterReport.tdsLevel} onChange={(e) => setWaterReport((prev) => ({ ...prev, tdsLevel: e.target.value }))} placeholder="TDS level" className={inputClass} />
                <input type="number" value={waterReport.borewellCount} onChange={(e) => setWaterReport((prev) => ({ ...prev, borewellCount: e.target.value }))} placeholder="Borewell count" className={inputClass} />
                <input type="number" step="0.1" value={waterReport.borewellDepth} onChange={(e) => setWaterReport((prev) => ({ ...prev, borewellDepth: e.target.value }))} placeholder="Borewell depth" className={inputClass} />
                <input type="number" step="0.1" value={waterReport.canalDistance} onChange={(e) => setWaterReport((prev) => ({ ...prev, canalDistance: e.target.value }))} placeholder="Canal distance (km)" className={inputClass} />
                <input type="number" step="0.1" value={waterReport.riverDistance} onChange={(e) => setWaterReport((prev) => ({ ...prev, riverDistance: e.target.value }))} placeholder="River distance (km)" className={inputClass} />
                <input type="number" step="0.1" value={waterReport.rainfallAvg} onChange={(e) => setWaterReport((prev) => ({ ...prev, rainfallAvg: e.target.value }))} placeholder="Average rainfall" className={inputClass} />
                <input type="date" value={waterReport.testedAt ? waterReport.testedAt.slice(0, 10) : ""} onChange={(e) => setWaterReport((prev) => ({ ...prev, testedAt: e.target.value ? new Date(e.target.value).toISOString() : "" }))} className={inputClass} />
                <input value={waterReport.reportUrl} onChange={(e) => setWaterReport((prev) => ({ ...prev, reportUrl: e.target.value }))} placeholder="Water report URL" className={inputClass} />
              </div>
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold hover:bg-gold/10">
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
            </div>

            <div className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold text-cream">Legal Check</h2>
                {legalReport.approvalStatus && <Badge variant="outline">{legalReport.approvalStatus}</Badge>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input value={legalReport.titleStatus} onChange={(e) => setLegalReport((prev) => ({ ...prev, titleStatus: e.target.value }))} placeholder="Title status" className={inputClass} />
                <input value={legalReport.reportUrl} onChange={(e) => setLegalReport((prev) => ({ ...prev, reportUrl: e.target.value }))} placeholder="Legal report URL" className={inputClass} />
                <input value={legalReport.encumbranceResult} onChange={(e) => setLegalReport((prev) => ({ ...prev, encumbranceResult: e.target.value }))} placeholder="Encumbrance result" className={inputClass} />
                <input value={legalReport.litigationResult} onChange={(e) => setLegalReport((prev) => ({ ...prev, litigationResult: e.target.value }))} placeholder="Litigation result" className={inputClass} />
              </div>
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold hover:bg-gold/10">
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
            </div>

            {/* Property Images */}
            <div className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gold/10 rounded-lg">
                    <Camera className="w-4 h-4 text-gold" />
                  </div>
                  <h2 className="font-display text-xl font-semibold text-cream">
                    Property Images
                  </h2>
                </div>
                <span className="text-xs font-body text-cream/65">
                  {totalImages} / {MAX_IMAGES} images
                </span>
              </div>

              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-body text-cream/65 mb-2">Current Images</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-cream/10">
                        <img src={img.url} alt="Property" className="w-full h-full object-cover" />
                        {img.isPrimary && (
                          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 bg-gold/90 rounded text-[10px] font-body font-medium text-onyx-950">
                            <Star className="w-2.5 h-2.5" />
                            Primary
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          className="absolute top-1.5 right-1.5 p-1 bg-onyx-950/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                        >
                          <X className="w-3.5 h-3.5 text-cream" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {newImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-body text-cream/65 mb-2">New Images</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {newImages.map((img, i) => (
                      <div key={img.publicId} className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-gold/20">
                        <img src={img.url} alt={`New upload ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewImage(i)}
                          className="absolute top-1.5 right-1.5 p-1 bg-onyx-950/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                        >
                          <X className="w-3.5 h-3.5 text-cream" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  dragOver
                    ? "border-gold/60 bg-gold/5"
                    : "border-cream/10 hover:border-cream/20 hover:bg-onyx-800/30"
                } ${totalImages >= MAX_IMAGES ? "opacity-50 pointer-events-none" : ""}`}
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
                    <Upload className="w-8 h-8 text-cream/45" />
                  )}
                  <div>
                    <p className="text-sm font-body text-cream/60">
                      {uploading ? "Uploading..." : "Drag & drop images or click to browse"}
                    </p>
                    <p className="text-xs font-body text-cream/60 mt-1">
                      JPEG, PNG, WebP up to 5MB each
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gold/10 rounded-lg">
                    <Video className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-cream">Listing Videos</h2>
                    <p className="text-xs text-cream/60 mt-1">Manage walkthrough videos for this listing.</p>
                  </div>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold hover:bg-gold/10">
                  {uploadingVideos ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload Video
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
              </div>
              {uploadedVideos.length > 0 ? (
                <div className="space-y-3">
                  {uploadedVideos.map((video, index) => (
                    <div key={`${video.publicId || video.url}-${index}`} className="rounded-xl border border-cream/8 bg-onyx-800/30 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <video src={video.url} controls className="h-28 w-full rounded-lg bg-black md:w-56" />
                        <div className="flex-1">
                          <label className="mb-2 block text-xs uppercase tracking-wide text-cream/65">Video Title</label>
                          <input
                            value={video.title}
                            onChange={(event) =>
                              setUploadedVideos((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, title: event.target.value } : item
                                )
                              )
                            }
                            className={inputClass}
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
              ) : (
                <p className="text-sm text-cream/60">No videos attached yet.</p>
              )}
            </div>

            <div className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gold/10 rounded-lg">
                    <FileArchive className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-cream">Property Documents</h2>
                    <p className="text-xs text-cream/60 mt-1">Keep the brochure, deeds, and plot documents synced.</p>
                  </div>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold hover:bg-gold/10">
                  {uploadingDocuments ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload Document
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
              </div>
              {uploadedDocuments.length > 0 ? (
                <div className="space-y-3">
                  {uploadedDocuments.map((document, index) => (
                    <div key={`${document.publicId || document.url}-${index}`} className="grid gap-3 rounded-xl border border-cream/8 bg-onyx-800/30 p-4 md:grid-cols-[1.3fr_1fr_auto]">
                      <input
                        value={document.name}
                        onChange={(event) =>
                          setUploadedDocuments((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, name: event.target.value } : item
                            )
                          )
                        }
                        className={inputClass}
                      />
                      <select
                        value={document.type}
                        onChange={(event) =>
                          setUploadedDocuments((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, type: event.target.value } : item
                            )
                          )
                        }
                        className={`${inputClass} appearance-none`}
                      >
                        <option value="supporting_document">Supporting Document</option>
                        <option value="title_deed">Title Deed</option>
                        <option value="7_12_extract">7/12 Extract</option>
                        <option value="mutation">Mutation</option>
                        <option value="site_map">Site Map</option>
                        <option value="approval">Approval</option>
                      </select>
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
              ) : (
                <p className="text-sm text-cream/60">No documents attached yet.</p>
              )}
            </div>

            <div className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gold/10 rounded-lg">
                    <Satellite className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-cream">Drone Map</h2>
                    <p className="text-xs text-cream/60 mt-1">Replace or refine the drone survey for this listing.</p>
                  </div>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold hover:bg-gold/10">
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
              </div>
              {droneMap?.mapUrl ? (
                <div className="space-y-4">
                  <img src={droneMap.mapUrl} alt="Drone map preview" className="h-56 w-full rounded-xl object-cover" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={droneMap.resolution}
                      onChange={(event) => setDroneMap((prev) => prev ? { ...prev, resolution: event.target.value } : prev)}
                      placeholder="Resolution e.g. 5cm/px"
                      className={inputClass}
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
                      className={inputClass}
                    />
                  </div>
                  <textarea
                    value={droneMap.notes}
                    onChange={(event) => setDroneMap((prev) => prev ? { ...prev, notes: event.target.value } : prev)}
                    rows={3}
                    placeholder="Drone notes"
                    className={`${inputClass} resize-none`}
                  />
                </div>
              ) : (
                <p className="text-sm text-cream/60">No drone map attached yet.</p>
              )}
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={handleNavigateAway}
                className="px-6 py-3 text-sm font-body text-cream/50 border border-cream/10 rounded-xl hover:text-cream hover:border-cream/20 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || isUploading}
                className="group relative px-8 py-3 bg-gradient-to-r from-gold to-gold-light text-onyx-950 font-body font-medium text-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-gold/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title={isUploading ? "Please wait for uploads to finish" : undefined}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading…
                  </>
                ) : submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Changes
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
}
