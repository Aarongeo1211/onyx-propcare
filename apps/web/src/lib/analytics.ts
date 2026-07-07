export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
export const GOOGLE_ADS_LEAD_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL;
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export type LeadType = "inquiry" | "callback" | "contact";

/** Fire a lead conversion event to every ad/analytics platform that's configured. */
export function trackLead(type: LeadType, propertyId?: string) {
  if (typeof window === "undefined") return;

  if (GA_MEASUREMENT_ID && window.gtag) {
    window.gtag("event", "generate_lead", {
      lead_type: type,
      property_id: propertyId,
    });
  }

  if (GOOGLE_ADS_ID && GOOGLE_ADS_LEAD_LABEL && window.gtag) {
    window.gtag("event", "conversion", {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LEAD_LABEL}`,
    });
  }

  if (META_PIXEL_ID && window.fbq) {
    window.fbq("track", "Lead", {
      content_category: type,
      content_ids: propertyId ? [propertyId] : undefined,
    });
  }
}
