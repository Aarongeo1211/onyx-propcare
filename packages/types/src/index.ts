// ─── Property Types ──────────────────────────────────────

export type PropertyType =
  | "FARMLAND"
  | "RESIDENTIAL_PLOT"
  | "AGRICULTURAL_LAND"
  | "ORCHARD"
  | "PLANTATION";

export type PropertyStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "SOLD"
  | "INACTIVE"
  | "REJECTED";

export type ListingType = "SALE" | "LEASE";

export type InquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "SITE_VISIT"
  | "NEGOTIATING"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export type UserRole = "BUYER" | "SELLER" | "AGENT" | "ADMIN" | "SUPER_ADMIN";

// ─── API Response Types ──────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Filter Types ────────────────────────────────────────

export interface PropertyFilters {
  type?: PropertyType;
  listingType?: ListingType;
  state?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  soilType?: string;
  waterSource?: string;
  hasClearTitle?: boolean;
  isFeatured?: boolean;
  search?: string;
  sortBy?: "price_asc" | "price_desc" | "newest" | "area_asc" | "area_desc";
  page?: number;
  limit?: number;
}

// ─── Dashboard Stats ─────────────────────────────────────

export interface DashboardStats {
  totalProperties: number;
  activeListings: number;
  totalInquiries: number;
  totalUsers: number;
  recentInquiries: number;
  propertiesByType: Record<PropertyType, number>;
  propertiesByState: Record<string, number>;
  monthlyInquiries: { month: string; count: number }[];
}

// ─── Indian States ───────────────────────────────────────

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

// ─── Plan & Subscription Types ──────────────────────────

export type PlanType =
  | "STARTER"
  | "PROFESSIONAL"
  | "ENTERPRISE"
  | "FREE"
  | "BASIC"
  | "FEATURED"
  | "PREMIUM";

export type PlanCategory = "ALL" | "FARMLAND" | "RESIDENTIAL_PLOT";

export type SubscriptionStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "PAYMENT_PENDING";

export interface Plan {
  id: string;
  code: string;
  name: string;
  type: PlanType;
  category: PlanCategory;
  sortOrder: number;
  price: number;
  maxProperties: number;
  maxImages: number;
  maxVideos: number;
  listingDuration: number;
  features: string[];
  hasSoilData: boolean;
  hasWaterData: boolean;
  hasLegalCheck: boolean;
  hasDroneMap: boolean;
  hasFeatured: boolean;
  featuredCount: number;
  hasVideo: boolean;
  hasVerifiedBadge: boolean;
  hasTopRank: boolean;
  hasHomepagePlacement: boolean;
  hasTopSectionPlacement: boolean;
  visibilityLabel: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan?: Plan;
  status: SubscriptionStatus;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  currency: string;
  amount: number;
  startDate?: string | null;
  endDate?: string | null;
  propertiesUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveSubscriptionPlan {
  id: string;
  planId: string;
  name: string;
  code: string;
  type: PlanType;
  category: PlanCategory;
  status: SubscriptionStatus;
  propertiesUsed: number;
  maxProperties: number;
  maxImages: number;
  maxVideos: number;
  endDate?: string | null;
}

export interface SubscriptionUsage {
  propertiesUsed: number;
  maxProperties: number;
  maxImages: number;
  maxVideos: number;
  listingDuration: number;
  planType: PlanType;
  planName: string;
  planCategory: PlanCategory;
  daysRemaining: number;
  activePlans: ActiveSubscriptionPlan[];
}

// ─── Soil Types ──────────────────────────────────────────

export const SOIL_TYPES = [
  "Black (Regur)",
  "Red",
  "Alluvial",
  "Laterite",
  "Desert (Arid)",
  "Mountain",
  "Peaty & Marshy",
  "Saline & Alkaline",
] as const;

export const WATER_SOURCES = [
  "Borewell",
  "Canal",
  "River",
  "Rain-fed",
  "Tank/Pond",
  "Well",
  "Drip Irrigation",
  "Sprinkler",
] as const;

export const AREA_UNITS = ["acres", "hectares", "sq.ft", "guntha", "bigha"] as const;

export const PRICE_RANGES = [
  { label: "Under ₹10 Lakh", min: 0, max: 1000000 },
  { label: "₹10-25 Lakh", min: 1000000, max: 2500000 },
  { label: "₹25-50 Lakh", min: 2500000, max: 5000000 },
  { label: "₹50 Lakh - 1 Cr", min: 5000000, max: 10000000 },
  { label: "₹1-5 Cr", min: 10000000, max: 50000000 },
  { label: "Above ₹5 Cr", min: 50000000, max: Infinity },
] as const;
