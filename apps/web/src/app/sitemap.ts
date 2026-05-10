import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://onyxpropcare.com", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: "https://onyxpropcare.com/properties", lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: "https://onyxpropcare.com/pricing", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: "https://onyxpropcare.com/calculator", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "https://onyxpropcare.com/about", lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: "https://onyxpropcare.com/contact", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];
}
