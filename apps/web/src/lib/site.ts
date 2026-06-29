export const SITE_NAME = "Onyx Propcare";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://onyxpropcare.com").replace(/\/$/, "");
export const SITE_DESCRIPTION =
  "Your trusted partner for land. Discover verified farmlands, residential plots, and agricultural land across India. Best investment on earth is earth itself.";
export const SITE_KEYWORDS = [
  "Onyx Prop Care",
  "farmland India",
  "residential plots India",
  "buy farmland India",
  "land marketplace India",
  "agricultural land for sale",
  "NRI land investment India",
  "buy land India",
  "verified land listings",
  "plots for sale India",
];

export function absoluteUrl(path = ""): string {
  if (!path) return SITE_URL;
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildTitle(title?: string): string {
  return title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Verified Farmland & Plot Marketplace in India`;
}

export function stripAndCollapseText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function truncateText(text: string, maxLength = 160): string {
  const normalized = stripAndCollapseText(text);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}
