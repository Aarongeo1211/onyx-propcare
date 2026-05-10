"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
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
} from "lucide-react";
import { INDIAN_STATES, AREA_UNITS } from "@onyx/types";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

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
  "North", "South", "East", "West",
  "North-East", "North-West", "South-East", "South-West",
];

export default function EditPropertyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingImages, setExistingImages] = useState<{ id: string; url: string; isPrimary: boolean; order: number }[]>([]);
  const [newImages, setNewImages] = useState<{ url: string; publicId: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 10;

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
    if (session?.user?.accessToken && propertyId) {
      fetchProperty();
    }
  }, [session, propertyId]);

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
        });
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
      } else {
        setError(data.error || "Failed to upload images");
      }
    } catch {
      setError("Failed to upload images.");
    } finally {
      setUploading(false);
    }
  }, [totalImages, session]);

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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-3 bg-onyx-800/50 border border-cream/10 rounded-xl text-cream font-body text-sm placeholder:text-cream/20 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all";
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
            onClick={() => router.push("/dashboard/properties")}
            className="flex items-center gap-2 text-sm font-body text-cream/40 hover:text-cream transition-colors mb-6"
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
                      {(["SALE", "LEASE"] as const).map((lt) => (
                        <button
                          key={lt}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, listingType: lt }))}
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
            <div className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <MapPin className="w-4 h-4 text-gold" />
                </div>
                <h2 className="font-display text-xl font-semibold text-cream">Location</h2>
              </div>

              <div className="space-y-5">
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
                <span className="text-xs font-body text-cream/40">
                  {totalImages} / {MAX_IMAGES} images
                </span>
              </div>

              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-body text-cream/40 mb-2">Current Images</p>
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
                  <p className="text-xs font-body text-cream/40 mb-2">New Images</p>
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
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard/properties")}
                className="px-6 py-3 text-sm font-body text-cream/50 border border-cream/10 rounded-xl hover:text-cream hover:border-cream/20 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="group relative px-8 py-3 bg-gradient-to-r from-gold to-gold-light text-onyx-950 font-body font-medium text-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-gold/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
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
