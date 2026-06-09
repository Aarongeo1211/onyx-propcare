import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropertyDetailPageClient } from "@/components/properties/property-detail-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import { getProperties, getPropertyBySlug } from "@/lib/public-api";
import { absoluteUrl, truncateText } from "@/lib/site";
import { formatArea, formatPrice, getPropertyTypeLabel } from "@/lib/utils";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

async function loadProperty(slug: string) {
  try {
    return await getPropertyBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const propertyResponse = await loadProperty(slug);

  if (!propertyResponse?.data) {
    return {
      title: "Property Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const property = propertyResponse.data;
  const title = `${property.title} in ${property.district}, ${property.state}`;
  const description = truncateText(
    `${property.title} in ${property.district}, ${property.state}. ${formatArea(property.totalArea, property.areaUnit)} listed at ${formatPrice(property.price)} with verified property data, legal checks, and Onyx Propcare insights.`,
    160
  );
  const image = property.images[0]?.url || absoluteUrl("/brand/onyx-propcare-email.png");

  return {
    title,
    description,
    alternates: {
      canonical: `/properties/${property.slug}`,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/properties/${property.slug}`),
      type: "article",
      images: [
        {
          url: image,
          alt: property.images[0]?.alt || property.title,
        },
      ],
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
      images: [image],
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const propertyResponse = await loadProperty(slug);

  if (!propertyResponse?.data) {
    notFound();
  }

  const property = propertyResponse.data;
  const similarResponse = await getProperties(
    {
      type: property.type,
      state: property.state,
      limit: 4,
    },
    300
  ).catch(() => ({ data: [], pagination: { page: 1, limit: 4, total: 0, totalPages: 0 }, success: true }));
  const similarProperties = (similarResponse.data || []).filter((item) => item.slug !== property.slug).slice(0, 3);
  const propertyType = getPropertyTypeLabel(property.type);
  const pageUrl = absoluteUrl(`/properties/${property.slug}`);
  const propertySchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: property.title,
    description: truncateText(property.description, 400),
    category: propertyType,
    image: property.images.map((image) => image.url),
    brand: {
      "@type": "Brand",
      name: "Onyx Propcare",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: property.price,
      availability: "https://schema.org/InStock",
      url: pageUrl,
      itemCondition: "https://schema.org/UsedCondition",
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "State",
        value: property.state,
      },
      {
        "@type": "PropertyValue",
        name: "District",
        value: property.district,
      },
      {
        "@type": "PropertyValue",
        name: "Area",
        value: formatArea(property.totalArea, property.areaUnit),
      },
    ],
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Properties",
        item: absoluteUrl("/properties"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: property.title,
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[propertySchema, breadcrumbSchema]} />
      <PropertyDetailPageClient
        slug={slug}
        initialProperty={property}
        initialSimilar={similarProperties}
      />
    </>
  );
}
