// ─── Price Formatting (Indian Number System) ────────────

export function formatPrice(price: number): string {
  if (price >= 10000000) {
    const crores = price / 10000000;
    return `₹${crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(2).replace(/\.?0+$/, "")} Cr`;
  }
  if (price >= 100000) {
    const lakhs = price / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(2).replace(/\.?0+$/, "")} Lakh`;
  }
  if (price >= 1000) {
    return `₹${(price / 1000).toFixed(0)}K`;
  }
  return `₹${price.toLocaleString("en-IN")}`;
}

export function formatPriceFull(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

// ─── Area Formatting ─────────────────────────────────────

export function formatArea(area: number, unit: string): string {
  const formatted = area % 1 === 0 ? area.toString() : area.toFixed(2);
  return `${formatted} ${unit}`;
}

// ─── Property Type Helpers ───────────────────────────────

export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    FARMLAND: "Farmland",
    RESIDENTIAL_PLOT: "Residential Plot",
    AGRICULTURAL_LAND: "Agricultural Land",
    ORCHARD: "Orchard",
    PLANTATION: "Plantation",
  };
  return labels[type] || type;
}

export function getPropertyTypeBadgeVariant(
  type: string
): "farmland" | "residential" | "warning" | "default" {
  const variants: Record<string, "farmland" | "residential" | "warning" | "default"> = {
    FARMLAND: "farmland",
    AGRICULTURAL_LAND: "farmland",
    RESIDENTIAL_PLOT: "residential",
    ORCHARD: "warning",
    PLANTATION: "warning",
  };
  return variants[type] || "default";
}

// ─── API Client ──────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "http://localhost:4000/api/v1";

export class ApiError extends Error {
  code?: string;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, headers, ...restOptions } = options || {};
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...restOptions,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(body.error || "Request failed", res.status, body.code);
  }
  return res.json();
}

// ─── Slug Generator ──────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Debounce ────────────────────────────────────────────

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
