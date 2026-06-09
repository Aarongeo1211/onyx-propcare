import type { MetadataRoute } from "next";
import { getProperties } from "@/lib/public-api";
import { absoluteUrl } from "@/lib/site";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1, lastModified: new Date() },
  { url: absoluteUrl("/properties"), changeFrequency: "daily", priority: 0.9, lastModified: new Date() },
  { url: absoluteUrl("/pricing"), changeFrequency: "weekly", priority: 0.7, lastModified: new Date() },
  { url: absoluteUrl("/calculator"), changeFrequency: "weekly", priority: 0.7, lastModified: new Date() },
  { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.6, lastModified: new Date() },
  { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.6, lastModified: new Date() },
  { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3, lastModified: new Date() },
  { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.3, lastModified: new Date() },
  { url: absoluteUrl("/insights/soil"), changeFrequency: "monthly", priority: 0.7, lastModified: new Date() },
  { url: absoluteUrl("/insights/water"), changeFrequency: "monthly", priority: 0.7, lastModified: new Date() },
  { url: absoluteUrl("/insights/legal"), changeFrequency: "monthly", priority: 0.7, lastModified: new Date() },
  { url: absoluteUrl("/insights/drone"), changeFrequency: "monthly", priority: 0.7, lastModified: new Date() },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const propertyEntries: MetadataRoute.Sitemap = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await getProperties({ page, limit: 50 }, 300).catch(() => null);
    if (!response) break;

    totalPages = response.pagination.totalPages || 1;
    response.data.forEach((property) => {
      propertyEntries.push({
        url: absoluteUrl(`/properties/${property.slug}`),
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      });
    });

    page += 1;
  }

  return [...STATIC_ROUTES, ...propertyEntries];
}
