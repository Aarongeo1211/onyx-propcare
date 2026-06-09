export const SITE_NAME = "Onyx Propcare";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://onyxpropcare.com").replace(/\/$/, "");
export const SITE_DESCRIPTION =
  "Discover verified farmlands and residential plots across India with soil reports, water analysis, drone surveys, legal checks, and investor tools.";
export const SITE_KEYWORDS = [
  "Onyx Propcare",
  "farmland India",
  "residential plots India",
  "buy farmland India",
  "verified land marketplace",
  "agricultural land for sale",
  "NRI land investment India",
  "soil report farmland",
  "water analysis land",
  "legal verification property",
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
