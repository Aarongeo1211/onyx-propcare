import { Router } from "express";
import { prisma } from "@onyx/db";
import { z } from "zod";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { getQueryNumber, getSingleQueryParam } from "../utils/request";
import {
  findCategoryCompatibleSubscription,
  findEligibleSubscription,
  getPlanCategoryForPropertyType,
} from "../utils/plans";
import { logger } from "../lib/logger";
import { cache } from "../lib/redis";

export const propertyRoutes = Router();

// Generate cache key from query filters (for common search patterns)
// Only caches simple category-browse queries — skips when additional filters are active
function generatePropertyCacheKey(opts: {
  type?: string;
  state?: string;
  listingType?: string;
  sortBy?: string;
  page?: number;
  search?: string;
  district?: string;
  minPrice?: string;
  maxPrice?: string;
  minArea?: string;
  maxArea?: string;
}): string | null {
  const { type, state, listingType, sortBy, page, search, district, minPrice, maxPrice, minArea, maxArea } = opts;

  if (!type && !state && !listingType) return null;
  if (search || district || minPrice || maxPrice || minArea || maxArea) return null;

  const parts = ["properties"];
  if (type) parts.push(`type:${type}`);
  if (state) parts.push(`state:${state}`);
  if (listingType) parts.push(`listing:${listingType}`);
  if (sortBy && sortBy !== "newest") parts.push(`sort:${sortBy}`);
  parts.push(`page:${page || 1}`);

  return parts.join(":");
}

const nearbyLocationSchema = z.object({
  name: z.string().min(2).max(80),
  distanceKm: z.number().min(0).max(500),
  category: z.string().min(2).max(40).optional(),
});

const soilDataInputSchema = z.object({
  soilType: z.string().min(2).max(80),
  ph: z.number().min(0).max(14).optional(),
  nitrogen: z.number().min(0).max(1000).optional(),
  phosphorus: z.number().min(0).max(500).optional(),
  potassium: z.number().min(0).max(1000).optional(),
  organicCarbon: z.number().min(0).max(100).optional(),
  texture: z.string().max(80).optional(),
  fertility: z.string().max(40).optional(),
  suitableCrops: z.string().max(500).optional(),
  reportUrl: z.string().url().optional(),
  testedAt: z.string().datetime().optional(),
});

const waterDataInputSchema = z.object({
  waterTableDepth: z.number().min(0).max(5000).optional(),
  waterQuality: z.string().max(40).optional(),
  tdsLevel: z.number().min(0).max(100000).optional(),
  borewellCount: z.number().int().min(0).max(100).optional(),
  borewellDepth: z.number().min(0).max(5000).optional(),
  canalDistance: z.number().min(0).max(500).optional(),
  riverDistance: z.number().min(0).max(500).optional(),
  rainfallAvg: z.number().min(0).max(20000).optional(),
  reportUrl: z.string().url().optional(),
  testedAt: z.string().datetime().optional(),
});

const legalCheckInputSchema = z.object({
  titleStatus: z.string().min(2).max(40),
  encumbranceCheck: z.boolean().optional(),
  encumbranceResult: z.string().max(120).optional(),
  litigationCheck: z.boolean().optional(),
  litigationResult: z.string().max(120).optional(),
  naOrderVerified: z.boolean().optional(),
  tpSchemeVerified: z.boolean().optional(),
  revenueRecordOk: z.boolean().optional(),
  reportUrl: z.string().url().optional(),
});

const propertyVideoInputSchema = z.object({
  url: z.string().url(),
  title: z.string().max(120).optional(),
  publicId: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  durationSeconds: z.number().min(0).max(60 * 60 * 3).optional(),
  isPrimary: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

const propertyDocumentInputSchema = z.object({
  name: z.string().min(2).max(140),
  url: z.string().url(),
  publicId: z.string().optional(),
  type: z.string().min(2).max(80),
});

const droneMapInputSchema = z.object({
  mapUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  resolution: z.string().max(40).optional(),
  capturedAt: z.string().datetime().optional(),
  fileSize: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

function hasMeaningfulData<T extends Record<string, unknown>>(value?: T | null, requiredKeys: (keyof T)[] = []) {
  if (!value) return false;
  const hasRequired = requiredKeys.length === 0 || requiredKeys.some((key) => {
    const current = value[key];
    return current !== undefined && current !== null && current !== "";
  });

  if (!hasRequired) return false;

  return Object.values(value).some((current) => current !== undefined && current !== null && current !== "");
}

function buildApprovalReset() {
  return {
    approvalStatus: "PENDING" as const,
    approvedBy: null,
    approvedAt: null,
    reviewNotes: null,
  };
}

function getFeatureValidationError(plan: {
  hasSoilData: boolean;
  hasWaterData: boolean;
  hasLegalCheck: boolean;
  hasDroneMap: boolean;
  maxVideos: number;
}) {
  return {
    ensureCapabilities({
      soilData,
      waterData,
      legalCheck,
      droneMap,
      videos,
    }: {
      soilData?: unknown;
      waterData?: unknown;
      legalCheck?: unknown;
      droneMap?: unknown;
      videos?: unknown[];
    }) {
      void plan;
      void soilData;
      void waterData;
      void legalCheck;
      void droneMap;
      void videos;
      return null;
    },
  };
}

function sanitizePublicProperty<T>(property: T, isAuthenticated: boolean): T {
  if (!isAuthenticated) {
    const p = property as unknown as { owner?: Record<string, unknown> | null };
    if (p.owner && "phone" in p.owner) {
      const { phone: _phone, ...ownerWithoutPhone } = p.owner;
      void _phone;
      return { ...property, owner: ownerWithoutPhone } as T;
    }
  }
  return property;
}

// GET /api/v1/properties - List properties with filters
propertyRoutes.get("/", optionalAuth, async (req, res) => {
  try {
    const type = getSingleQueryParam(req.query.type);
    const listingType = getSingleQueryParam(req.query.listingType);
    const state = getSingleQueryParam(req.query.state);
    const district = getSingleQueryParam(req.query.district);
    const minPrice = getSingleQueryParam(req.query.minPrice);
    const maxPrice = getSingleQueryParam(req.query.maxPrice);
    const minArea = getSingleQueryParam(req.query.minArea);
    const maxArea = getSingleQueryParam(req.query.maxArea);
    const search = getSingleQueryParam(req.query.search);
    const status = getSingleQueryParam(req.query.status) || "ACTIVE";
    // Support both 'sort' and 'sortBy' for compatibility
    const sortBy = getSingleQueryParam(req.query.sortBy) || getSingleQueryParam(req.query.sort) || "newest";
    const page = getQueryNumber(req.query.page, 1);
    const limit = getQueryNumber(req.query.limit, 12);

    // Validate status to prevent injection
    const validStatuses = ["ACTIVE", "DRAFT", "SOLD", "ARCHIVED"];
    const statusValue = validStatuses.includes(status as string) ? status : "ACTIVE";

    const where: Record<string, unknown> = { status: statusValue };

    // type/listingType feed straight into a Prisma enum column -- an
    // unrecognized value (e.g. a caller sending lowercase "agricultural_land"
    // instead of "AGRICULTURAL_LAND") throws PrismaClientValidationError,
    // which was surfacing as an uncaught 500. Normalize casing so a
    // differently-cased-but-valid value still works, and silently drop the
    // filter (rather than 500 or 400) if it still doesn't match anything --
    // same permissive fallback already used for `status` above.
    const validTypes = ["FARMLAND", "RESIDENTIAL_PLOT", "AGRICULTURAL_LAND", "ORCHARD", "PLANTATION"];
    const validListingTypes = ["SALE", "LEASE", "RENT"];
    const normalizedType = type?.trim().toUpperCase();
    const normalizedListingType = listingType?.trim().toUpperCase();

    if (normalizedType && validTypes.includes(normalizedType)) where.type = normalizedType;
    if (normalizedListingType && validListingTypes.includes(normalizedListingType)) where.listingType = normalizedListingType;
    // state/district also accept a comma-separated list of exact values —
    // used by location landing pages to match every casing/whitespace
    // variant of a place name that /properties/locations grouped into one
    // canonical entry (e.g. "Bangalore", "Bangalore ", "BANGALORE URBAN").
    // A single value keeps the original exact-match behavior unchanged.
    if (state) {
      const values = state.split(",").map((v) => v.trim()).filter(Boolean);
      where.state = values.length > 1 ? { in: values } : state;
    }
    if (district) {
      const values = district.split(",").map((v) => v.trim()).filter(Boolean);
      where.district = values.length > 1 ? { in: values } : district;
    }
    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice ? { gte: Number(minPrice) } : {}),
        ...(maxPrice ? { lte: Number(maxPrice) } : {}),
      };
    }
    if (minArea || maxArea) {
      where.totalArea = {
        ...(minArea ? { gte: Number(minArea) } : {}),
        ...(maxArea ? { lte: Number(maxArea) } : {}),
      };
    }
    if (search) {
      const tsQuery = search
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => `${w}:*`)
        .join(" & ");

      let ftsApplied = false;
      if (tsQuery) {
        try {
          const matchingIds: { id: string }[] = await prisma.$queryRawUnsafe(
            `SELECT id FROM properties WHERE search_vector @@ to_tsquery('english', $1) LIMIT 200`,
            tsQuery
          );
          if (matchingIds.length > 0) {
            where.id = { in: matchingIds.map((r) => r.id) };
            ftsApplied = true;
          }
        } catch {
          // search_vector column not yet created — fall through to text fallback below
        }
      }

      if (!ftsApplied) {
        where.OR = [
          { title: { contains: search as string, mode: "insensitive" } },
          { district: { contains: search as string, mode: "insensitive" } },
          { state: { contains: search as string, mode: "insensitive" } },
          { village: { contains: search as string, mode: "insensitive" } },
          { taluka: { contains: search as string, mode: "insensitive" } },
          { address: { contains: search as string, mode: "insensitive" } },
        ];
      }
    }

    const orderBy: Record<string, string> = {
      newest: "createdAt",
      price_asc: "price",
      price_desc: "price",
      area_asc: "totalArea",
      area_desc: "totalArea",
    };

    const pageNum = Math.max(1, page);
    const limitNum = Math.min(50, Math.max(1, limit));

    // Try cache first (5 min TTL) — skip cache when search/price/area/district filters are active
    const cacheKey = generatePropertyCacheKey({ type, state, listingType, sortBy, page: pageNum, search, district, minPrice, maxPrice, minArea, maxArea });
    if (cacheKey && !req.user) {
      const cached = await cache.get<{ properties: unknown[]; total: number }>(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: cached.properties,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: cached.total,
            totalPages: Math.ceil(cached.total / limitNum),
          },
        });
      }
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          videos: { select: { url: true }, take: 1 },
          owner: { select: { id: true, name: true, avatar: true, phone: true } },
          soilData: { select: { soilType: true, fertility: true, approvalStatus: true } },
          waterData: { select: { waterQuality: true, waterTableDepth: true, approvalStatus: true } },
          legalCheck: { select: { titleStatus: true, approvalStatus: true } },
        },
        orderBy:
          sortBy === "newest"
            ? [{ isFeatured: "desc" }, { featuredAt: "desc" }, { createdAt: "desc" }]
            : {
                [orderBy[sortBy as string] || "createdAt"]:
                  sortBy === "price_desc" || sortBy === "area_desc" ? "desc" : sortBy === "price_asc" || sortBy === "area_asc" ? "asc" : "desc",
              },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.property.count({ where }),
    ]);

    const sanitizedProperties = properties.map((property) => sanitizePublicProperty(property, Boolean(req.user)));

    // Cache the results (5 min TTL) for future requests
    if (cacheKey && !req.user) {
      await cache.set(cacheKey, { properties: sanitizedProperties, total }, 300);
    }

    res.json({
      success: true,
      data: sanitizedProperties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching properties");
    res.status(500).json({ success: false, error: "Failed to fetch properties" });
  }
});

// GET /api/v1/properties/featured
propertyRoutes.get("/featured", async (_req, res) => {
  try {
    const CACHE_KEY = "properties:featured";
    const cached = await cache.get(CACHE_KEY);
    if (cached) return res.json({ success: true, data: cached });

    const properties = await prisma.property.findMany({
      where: { isFeatured: true, status: "ACTIVE" },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        owner: { select: { id: true, name: true } },
      },
      take: 16,
      orderBy: { featuredAt: "desc" },
    });

    await cache.set(CACHE_KEY, properties, 300);
    res.json({ success: true, data: properties });
  } catch (error) {
    logger.error({ err: error }, "Error fetching featured");
    res.status(500).json({ success: false, error: "Failed to fetch featured properties" });
  }
});

function slugifyLocation(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeLocationKey(value: string) {
  return value.trim().toLowerCase();
}

// District names are free text entered per-listing, so the same place shows
// up under several casings/whitespace variants ("Bangalore" / "bangalore" /
// "Bangalore " / "BANGALORE URBAN"). Group by a normalized key and use
// whichever exact casing occurred most often as the display name, instead of
// treating every variant as its own district.
class NamedCounter {
  total = 0;
  private variants = new Map<string, number>();

  add(name: string, count: number) {
    this.total += count;
    this.variants.set(name, (this.variants.get(name) || 0) + count);
  }

  canonicalName() {
    // Prefer a properly-formatted variant (Title Case, no stray whitespace)
    // over a merely-more-frequent one -- plain frequency will happily pick
    // an ALL-CAPS/lowercase/trailing-space value as "canonical" when it
    // outnumbers a cleaner-looking one, which is a real quality regression
    // for anything derived from this (location landing pages, sitemap).
    let best = "";
    let bestScore = -Infinity;
    for (const [name, count] of this.variants) {
      const trimmed = name.trim();
      const hasStrayWhitespace = trimmed !== name;
      const isTitleCased = trimmed
        .split(/\s+/)
        .every((word) => /^[A-Z][a-z]*$/.test(word) || /^[A-Z]$/.test(word));
      const score = (isTitleCased ? 1_000_000 : 0) - (hasStrayWhitespace ? 500_000 : 0) + count;
      if (score > bestScore) {
        best = trimmed;
        bestScore = score;
      }
    }
    return best;
  }

  // Every raw casing/whitespace variant that was merged into this entry —
  // needed to query properties by exact match without missing rows that
  // don't equal the canonical name character-for-character.
  allValues() {
    return Array.from(this.variants.keys());
  }
}

// Districts with only a handful of listings are disproportionately likely to
// be one-off typos of a more common district rather than a real distinct
// place worth its own landing page.
const MIN_DISTRICT_LISTINGS = 2;

// GET /api/v1/properties/locations — state/district hierarchy with active
// listing counts, for location landing pages (/land-for-sale/[state]/[district])
// and their sitemap entries. Only states/districts with at least
// MIN_DISTRICT_LISTINGS active listings are returned, so no thin/near-empty
// pages get generated from typo'd or one-off district values.
propertyRoutes.get("/locations", async (_req, res) => {
  try {
    const CACHE_KEY = "properties:locations";
    const cached = await cache.get(CACHE_KEY);
    if (cached) return res.json({ success: true, data: cached });

    const rows = await prisma.property.groupBy({
      by: ["state", "district"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    });

    const stateMap = new Map<string, { state: NamedCounter; count: number; districts: Map<string, NamedCounter> }>();
    for (const row of rows) {
      const stateKey = normalizeLocationKey(row.state);
      if (!stateMap.has(stateKey)) {
        stateMap.set(stateKey, { state: new NamedCounter(), count: 0, districts: new Map() });
      }
      const entry = stateMap.get(stateKey)!;
      entry.state.add(row.state, row._count._all);
      entry.count += row._count._all;

      const districtKey = normalizeLocationKey(row.district);
      if (!entry.districts.has(districtKey)) {
        entry.districts.set(districtKey, new NamedCounter());
      }
      entry.districts.get(districtKey)!.add(row.district, row._count._all);
    }

    const data = Array.from(stateMap.values())
      .map((s) => {
        const stateName = s.state.canonicalName();
        return {
          state: stateName,
          slug: slugifyLocation(stateName),
          values: s.state.allValues(),
          count: s.count,
          districts: Array.from(s.districts.values())
            .filter((d) => d.total >= MIN_DISTRICT_LISTINGS)
            .map((d) => {
              const districtName = d.canonicalName();
              return { district: districtName, slug: slugifyLocation(districtName), values: d.allValues(), count: d.total };
            })
            .sort((a, b) => b.count - a.count),
        };
      })
      .filter((s) => s.districts.length > 0)
      .sort((a, b) => b.count - a.count);

    await cache.set(CACHE_KEY, data, 3600);
    res.json({ success: true, data });
  } catch (error) {
    logger.error({ err: error }, "Error fetching location hierarchy");
    res.status(500).json({ success: false, error: "Failed to fetch locations" });
  }
});

// GET /api/v1/properties/type-counts — active listing count per PropertyType.
// Used to hide category filters (e.g. Orchard, Plantation) on the homepage
// and search filters until at least one active listing actually exists in
// that category, instead of offering a filter that always dead-ends.
propertyRoutes.get("/type-counts", async (_req, res) => {
  try {
    const CACHE_KEY = "properties:type-counts";
    const cached = await cache.get(CACHE_KEY);
    if (cached) return res.json({ success: true, data: cached });

    const rows = await prisma.property.groupBy({
      by: ["type"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    });

    const data = rows
      .map((row) => ({ type: row.type, count: row._count._all }))
      .sort((a, b) => b.count - a.count);

    await cache.set(CACHE_KEY, data, 3600);
    res.json({ success: true, data });
  } catch (error) {
    logger.error({ err: error }, "Error fetching property type counts");
    res.status(500).json({ success: false, error: "Failed to fetch type counts" });
  }
});

// GET /api/v1/properties/compare?ids=id1,id2,id3
propertyRoutes.get("/compare", async (req, res) => {
  try {
    const idsParam = getSingleQueryParam(req.query.ids);
    if (!idsParam) {
      return res.status(400).json({ success: false, error: "Missing ids query parameter" });
    }

    const ids = idsParam.split(",").map((id) => id.trim()).filter(Boolean);
    if (ids.length === 0) {
      return res.status(400).json({ success: false, error: "No valid IDs provided" });
    }
    if (ids.length > 3) {
      return res.status(400).json({ success: false, error: "Maximum 3 properties can be compared" });
    }

    const properties = await prisma.property.findMany({
      where: {
        id: { in: ids },
        status: "ACTIVE",
      },
      include: {
        images: { orderBy: { order: "asc" } },
        videos: { orderBy: { order: "asc" } },
        soilData: true,
        waterData: true,
        legalCheck: true,
        droneMap: true,
        owner: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.json({ success: true, data: properties.map((property) => sanitizePublicProperty(property, Boolean(req.user))) });
  } catch (error) {
    logger.error({ err: error }, "Error fetching comparison properties");
    res.status(500).json({ success: false, error: "Failed to fetch comparison properties" });
  }
});

// POST /api/v1/properties
const createPropertySchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20),
  type: z.enum(["FARMLAND", "RESIDENTIAL_PLOT", "AGRICULTURAL_LAND", "ORCHARD", "PLANTATION"]),
  listingType: z.enum(["SALE", "LEASE", "RENT"]).default("SALE"),
  price: z.number().positive(),
  address: z.string(),
  village: z.string().optional(),
  taluka: z.string().optional(),
  district: z.string(),
  state: z.string(),
  pincode: z.string().optional(),
  totalArea: z.number().positive(),
  areaUnit: z.string().default("acres"),
  facing: z.string().optional(),
  roadAccess: z.boolean().optional(),
  roadWidth: z.number().optional(),
  boundaryWall: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  soilType: z.string().max(80).optional(),
  waterSource: z.string().max(80).optional(),
  irrigation: z.string().max(120).optional(),
  cropHistory: z.string().max(1000).optional(),
  annualYield: z.string().max(120).optional(),
  isNAOrder: z.boolean().optional(),
  isTPScheme: z.boolean().optional(),
  zonalType: z.string().max(80).optional(),
  ownershipType: z.string().max(80).optional(),
  surveyNumber: z.string().max(80).optional(),
  hasClearTitle: z.boolean().optional(),
  isDisputeFree: z.boolean().optional(),
  encumbrance: z.string().max(1000).optional(),
  nearbyLocations: z.array(nearbyLocationSchema).max(7).optional(),
  soilData: soilDataInputSchema.optional(),
  waterData: waterDataInputSchema.optional(),
  legalCheck: legalCheckInputSchema.optional(),
  videos: z.array(propertyVideoInputSchema).max(5).optional(),
  documents: z.array(propertyDocumentInputSchema).max(20).optional(),
  droneMap: droneMapInputSchema.optional(),
});

// GET /api/v1/properties/by-id/:id — Get property by ID (for editing)
propertyRoutes.get("/by-id/:id", requireAuth, async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: String(req.params.id) },
      include: {
        images: { orderBy: { order: "asc" } },
        videos: { orderBy: { order: "asc" } },
        documents: true,
        owner: { select: { id: true, name: true, avatar: true, phone: true } },
        soilData: true,
        waterData: true,
        legalCheck: true,
        droneMap: true,
      },
    });

    if (!property) {
      return res.status(404).json({ success: false, error: "Property not found" });
    }

    // Only allow owner or admin to view by ID
    if (property.ownerId !== req.user!.id && !["ADMIN", "SUPER_ADMIN"].includes(req.user!.role)) {
      return res.status(403).json({ success: false, error: "Not authorized to view this property" });
    }

    res.json({ success: true, data: property });
  } catch (error) {
    logger.error({ err: error }, "Error fetching property by ID");
    res.status(500).json({ success: false, error: "Failed to fetch property" });
  }
});

// GET /api/v1/properties/:slug
function propertyDetailCacheKey(slug: string) {
  return `property:slug:${slug}`;
}

propertyRoutes.get("/:slug", optionalAuth, async (req, res) => {
  try {
    const slug = String(req.params.slug);
    const cacheKey = propertyDetailCacheKey(slug);

    // Cache the raw row (pre-sanitization) — owner phone is stripped per-request below,
    // so one cache entry correctly serves both authenticated and anonymous viewers.
    let property = await cache.get<Record<string, unknown>>(cacheKey);

    if (!property) {
      property = await prisma.property.findUnique({
        where: { slug },
        include: {
          images: { orderBy: { order: "asc" } },
          videos: { orderBy: { order: "asc" } },
          documents: true,
          owner: { select: { id: true, name: true, avatar: true, phone: true } },
          soilData: true,
          waterData: true,
          legalCheck: true,
          droneMap: true,
          reviews: {
            include: { user: { select: { name: true, avatar: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (property) await cache.set(cacheKey, property, 60);
    }

    if (!property) {
      return res.status(404).json({ success: false, error: "Property not found" });
    }

    // Respond immediately — track view count asynchronously so it never slows the page load
    res.json({ success: true, data: sanitizePublicProperty(property, Boolean(req.user)) });

    const propertyId = String(property.id);
    const userId = req.user?.id;
    Promise.all([
      prisma.property.update({
        where: { id: propertyId },
        data: { viewCount: { increment: 1 } },
      }),
      userId
        ? prisma.propertyView.upsert({
            where: { propertyId_userId: { propertyId, userId } },
            update: { viewedAt: new Date() },
            create: { propertyId, userId },
          })
        : Promise.resolve(),
    ]).catch((err) => logger.error({ err }, "Failed to record property view"));
  } catch (error) {
    logger.error({ err: error }, "Error fetching property");
    res.status(500).json({ success: false, error: "Failed to fetch property" });
  }
});

propertyRoutes.post("/", requireAuth, async (req, res) => {
  try {
    const data = createPropertySchema.parse(req.body);
    const eligibleSubscription = await findEligibleSubscription(req.user!.id, data.type);

    if (!eligibleSubscription) {
      return res.status(403).json({
        success: false,
        error: `No active listing plan is available for ${getPlanCategoryForPropertyType(data.type).replace(/_/g, " ").toLowerCase()} properties.`,
        code: "NO_ACTIVE_PLAN",
      });
    }

    const capabilityError = getFeatureValidationError(eligibleSubscription.plan).ensureCapabilities({
      soilData: data.soilData,
      waterData: data.waterData,
      legalCheck: data.legalCheck,
      droneMap: data.droneMap,
      videos: data.videos,
    });

    if (capabilityError) {
      return res.status(403).json({ success: false, error: capabilityError });
    }

    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      + "-" + Date.now().toString(36);

    const {
      soilData,
      waterData,
      legalCheck,
      videos,
      documents,
      droneMap,
      nearbyLocations,
      ...propertyData
    } = data;

    const property = await prisma.property.create({
      data: {
        ...propertyData,
        slug,
        ownerId: req.user!.id,
        nearbyLocations: nearbyLocations ?? [],
        status: "PENDING_REVIEW",
        isFeatured:
          eligibleSubscription.plan.hasFeatured ||
          eligibleSubscription.plan.hasHomepagePlacement ||
          eligibleSubscription.plan.hasTopSectionPlacement,
        featuredAt:
          eligibleSubscription.plan.hasFeatured ||
          eligibleSubscription.plan.hasHomepagePlacement ||
          eligibleSubscription.plan.hasTopSectionPlacement
            ? new Date()
            : null,
        videos: videos?.length
          ? {
              create: videos.map((video, index) => ({
                ...video,
                title: video.title ?? null,
                publicId: video.publicId ?? null,
                thumbnailUrl: video.thumbnailUrl ?? null,
                durationSeconds: video.durationSeconds ?? null,
                isPrimary: video.isPrimary ?? index === 0,
                order: video.order ?? index,
              })),
            }
          : undefined,
        documents: documents?.length
          ? {
              create: documents.map((document) => ({
                ...document,
                publicId: document.publicId ?? null,
              })),
            }
          : undefined,
        droneMap: droneMap
          ? {
              create: {
                mapUrl: droneMap.mapUrl,
                thumbnailUrl: droneMap.thumbnailUrl ?? null,
                resolution: droneMap.resolution ?? null,
                capturedAt: droneMap.capturedAt ? new Date(droneMap.capturedAt) : null,
                fileSize: droneMap.fileSize ?? null,
                notes: droneMap.notes ?? null,
              },
            }
          : undefined,
        soilData: hasMeaningfulData(soilData, ["soilType"])
          ? {
              create: {
                ...soilData!,
                testedAt: soilData!.testedAt ? new Date(soilData!.testedAt) : null,
                ...buildApprovalReset(),
              },
            }
          : undefined,
        waterData: hasMeaningfulData(waterData)
          ? {
              create: {
                ...waterData!,
                testedAt: waterData!.testedAt ? new Date(waterData!.testedAt) : null,
                ...buildApprovalReset(),
              },
            }
          : undefined,
        legalCheck: hasMeaningfulData(legalCheck, ["titleStatus"])
          ? {
              create: {
                ...legalCheck!,
                approvalStatus: "PENDING",
                verifiedBy: null,
                verifiedAt: null,
                reviewNotes: null,
              },
            }
          : undefined,
      },
      include: {
        videos: true,
        documents: true,
        droneMap: true,
        soilData: true,
        waterData: true,
        legalCheck: true,
      },
    });

    // Increment propertiesUsed on the subscription
    await prisma.subscription.update({
      where: { id: eligibleSubscription.id },
      data: { propertiesUsed: { increment: 1 } },
    });

    // Invalidate relevant caches
    if (property.isFeatured) await cache.del("properties:featured");
    // Invalidate search cache for this property's type and state
    await cache.invalidatePrefix(`properties:type:${property.type}:state:${property.state}`);
    // Invalidate broader caches
    await cache.invalidatePrefix(`properties:type:${property.type}`);

    res.status(201).json({ success: true, data: property });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error({ err: error }, "Error creating property");
    res.status(500).json({ success: false, error: "Failed to create property" });
  }
});

// PATCH /api/v1/properties/:id — Update a property (owner only)
const updatePropertySchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(20).optional(),
  type: z.enum(["FARMLAND", "RESIDENTIAL_PLOT", "AGRICULTURAL_LAND", "ORCHARD", "PLANTATION"]).optional(),
  listingType: z.enum(["SALE", "LEASE", "RENT"]).optional(),
  price: z.number().positive().optional(),
  address: z.string().optional(),
  village: z.string().optional(),
  taluka: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  totalArea: z.number().positive().optional(),
  areaUnit: z.string().optional(),
  facing: z.string().optional(),
  roadAccess: z.boolean().optional(),
  roadWidth: z.number().optional(),
  boundaryWall: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isNegotiable: z.boolean().optional(),
  soilType: z.string().max(80).optional(),
  waterSource: z.string().max(80).optional(),
  irrigation: z.string().max(120).optional(),
  cropHistory: z.string().max(1000).optional(),
  annualYield: z.string().max(120).optional(),
  isNAOrder: z.boolean().optional(),
  isTPScheme: z.boolean().optional(),
  zonalType: z.string().max(80).optional(),
  ownershipType: z.string().max(80).optional(),
  surveyNumber: z.string().max(80).optional(),
  hasClearTitle: z.boolean().optional(),
  isDisputeFree: z.boolean().optional(),
  encumbrance: z.string().max(1000).optional(),
  nearbyLocations: z.array(nearbyLocationSchema).max(7).optional(),
  soilData: soilDataInputSchema.nullable().optional(),
  waterData: waterDataInputSchema.nullable().optional(),
  legalCheck: legalCheckInputSchema.nullable().optional(),
  videos: z.array(propertyVideoInputSchema).max(5).optional(),
  documents: z.array(propertyDocumentInputSchema).max(20).optional(),
  droneMap: droneMapInputSchema.nullable().optional(),
});

propertyRoutes.patch("/:id", requireAuth, async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!property) {
      return res.status(404).json({ success: false, error: "Property not found" });
    }

    if (property.ownerId !== req.user!.id) {
      return res.status(403).json({ success: false, error: "Not authorized to edit this property" });
    }

    const data = updatePropertySchema.parse(req.body);
    const {
      soilData,
      waterData,
      legalCheck,
      videos,
      documents,
      droneMap,
      ...baseData
    } = data;
    const nextType = data.type ?? property.type;
    const hasMeaningfulUpdate =
      Object.keys(baseData).length > 0 ||
      soilData !== undefined ||
      waterData !== undefined ||
      legalCheck !== undefined ||
      videos !== undefined ||
      documents !== undefined ||
      droneMap !== undefined;

    const isReactivationOnly = !hasMeaningfulUpdate && property.status !== "ACTIVE";

    const eligibleSubscription = isReactivationOnly
      ? await findCategoryCompatibleSubscription(req.user!.id, nextType)
      : await findEligibleSubscription(req.user!.id, nextType);
    if (!eligibleSubscription) {
      return res.status(403).json({
        success: false,
        error: `No active listing plan is available for ${getPlanCategoryForPropertyType(nextType).replace(/_/g, " ").toLowerCase()} properties.`,
        code: "NO_ACTIVE_PLAN",
      });
    }

    const capabilityError = getFeatureValidationError(eligibleSubscription.plan).ensureCapabilities({
      soilData: soilData ?? undefined,
      waterData: waterData ?? undefined,
      legalCheck: legalCheck ?? undefined,
      droneMap: droneMap ?? undefined,
      videos,
    });

    if (capabilityError) {
      return res.status(403).json({ success: false, error: capabilityError });
    }

    const updateData = !hasMeaningfulUpdate && property.status !== "ACTIVE"
      ? { status: "PENDING_REVIEW" as const }
      : baseData;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.property.update({
        where: { id: String(req.params.id) },
        data: {
          ...updateData,
          ...(hasMeaningfulUpdate ? { status: property.status === "ACTIVE" ? "PENDING_REVIEW" : property.status } : {}),
        },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          videos: true,
          documents: true,
          droneMap: true,
          soilData: true,
          waterData: true,
          legalCheck: true,
        },
      });

      if (videos !== undefined) {
        await tx.propertyVideo.deleteMany({ where: { propertyId: property.id } });
        if (videos.length > 0) {
          await tx.propertyVideo.createMany({
            data: videos.map((video, index) => ({
              propertyId: property.id,
              url: video.url,
              title: video.title ?? null,
              publicId: video.publicId ?? null,
              thumbnailUrl: video.thumbnailUrl ?? null,
              durationSeconds: video.durationSeconds ?? null,
              isPrimary: video.isPrimary ?? index === 0,
              order: video.order ?? index,
            })),
          });
        }
      }

      if (documents !== undefined) {
        await tx.propertyDocument.deleteMany({ where: { propertyId: property.id } });
        if (documents.length > 0) {
          await tx.propertyDocument.createMany({
            data: documents.map((document) => ({
              propertyId: property.id,
              name: document.name,
              url: document.url,
              publicId: document.publicId ?? null,
              type: document.type,
            })),
          });
        }
      }

      if (droneMap !== undefined) {
        if (droneMap === null) {
          await tx.droneMap.deleteMany({ where: { propertyId: property.id } });
        } else {
          await tx.droneMap.upsert({
            where: { propertyId: property.id },
            update: {
              mapUrl: droneMap.mapUrl,
              thumbnailUrl: droneMap.thumbnailUrl ?? null,
              resolution: droneMap.resolution ?? null,
              capturedAt: droneMap.capturedAt ? new Date(droneMap.capturedAt) : null,
              fileSize: droneMap.fileSize ?? null,
              notes: droneMap.notes ?? null,
            },
            create: {
              propertyId: property.id,
              mapUrl: droneMap.mapUrl,
              thumbnailUrl: droneMap.thumbnailUrl ?? null,
              resolution: droneMap.resolution ?? null,
              capturedAt: droneMap.capturedAt ? new Date(droneMap.capturedAt) : null,
              fileSize: droneMap.fileSize ?? null,
              notes: droneMap.notes ?? null,
            },
          });
        }
      }

      if (soilData !== undefined) {
        if (soilData === null || !hasMeaningfulData(soilData, ["soilType"])) {
          await tx.soilData.deleteMany({ where: { propertyId: property.id } });
        } else {
          await tx.soilData.upsert({
            where: { propertyId: property.id },
            update: {
              ...soilData,
              testedAt: soilData.testedAt ? new Date(soilData.testedAt) : null,
              ...buildApprovalReset(),
            },
            create: {
              propertyId: property.id,
              ...soilData,
              testedAt: soilData.testedAt ? new Date(soilData.testedAt) : null,
              ...buildApprovalReset(),
            },
          });
        }
      }

      if (waterData !== undefined) {
        if (waterData === null || !hasMeaningfulData(waterData)) {
          await tx.waterData.deleteMany({ where: { propertyId: property.id } });
        } else {
          await tx.waterData.upsert({
            where: { propertyId: property.id },
            update: {
              ...waterData,
              testedAt: waterData.testedAt ? new Date(waterData.testedAt) : null,
              ...buildApprovalReset(),
            },
            create: {
              propertyId: property.id,
              ...waterData,
              testedAt: waterData.testedAt ? new Date(waterData.testedAt) : null,
              ...buildApprovalReset(),
            },
          });
        }
      }

      if (legalCheck !== undefined) {
        if (legalCheck === null || !hasMeaningfulData(legalCheck, ["titleStatus"])) {
          await tx.legalCheck.deleteMany({ where: { propertyId: property.id } });
        } else {
          await tx.legalCheck.upsert({
            where: { propertyId: property.id },
            update: {
              ...legalCheck,
              approvalStatus: "PENDING",
              verifiedBy: null,
              verifiedAt: null,
              reviewNotes: null,
            },
            create: {
              propertyId: property.id,
              ...legalCheck,
              approvalStatus: "PENDING",
              verifiedBy: null,
              verifiedAt: null,
              reviewNotes: null,
            },
          });
        }
      }

      return tx.property.findUnique({
        where: { id: property.id },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          videos: true,
          documents: true,
          droneMap: true,
          soilData: true,
          waterData: true,
          legalCheck: true,
        },
      });
    });

    // Invalidate relevant caches after update
    if (updated) {
      if (updated.isFeatured) await cache.del("properties:featured");
      await cache.invalidatePrefix(`properties:type:${updated.type}:state:${updated.state}`);
      await cache.invalidatePrefix(`properties:type:${updated.type}`);
      await cache.del(propertyDetailCacheKey(property.slug));
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error({ err: error }, "Error updating property");
    res.status(500).json({ success: false, error: "Failed to update property" });
  }
});

// DELETE /api/v1/properties/:id — Soft delete a property (set status to INACTIVE)
propertyRoutes.delete("/:id", requireAuth, async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!property) {
      return res.status(404).json({ success: false, error: "Property not found" });
    }

    if (property.ownerId !== req.user!.id) {
      return res.status(403).json({ success: false, error: "Not authorized to delete this property" });
    }

    await prisma.property.update({
      where: { id: String(req.params.id) },
      data: { status: "INACTIVE" },
    });

    // Invalidate relevant caches after deletion
    if (property.isFeatured) await cache.del("properties:featured");
    await cache.invalidatePrefix(`properties:type:${property.type}:state:${property.state}`);
    await cache.invalidatePrefix(`properties:type:${property.type}`);
    await cache.del(propertyDetailCacheKey(property.slug));

    res.json({ success: true, message: "Property deactivated" });
  } catch (error) {
    logger.error({ err: error }, "Error deleting property");
    res.status(500).json({ success: false, error: "Failed to delete property" });
  }
});
