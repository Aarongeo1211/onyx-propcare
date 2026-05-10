import { Router } from "express";
import { prisma } from "@onyx/db";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { getQueryNumber, getSingleQueryParam } from "../utils/request";
import { findEligibleSubscription, getPlanCategoryForPropertyType } from "../utils/plans";
import { logger } from "../lib/logger";
import { cache } from "../lib/redis";

export const propertyRoutes = Router();

// GET /api/v1/properties - List properties with filters
propertyRoutes.get("/", async (req, res) => {
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
    const sortBy = getSingleQueryParam(req.query.sortBy) || "newest";
    const page = getQueryNumber(req.query.page, 1);
    const limit = getQueryNumber(req.query.limit, 12);

    const where: Record<string, unknown> = { status: "ACTIVE" };

    if (type) where.type = type;
    if (listingType) where.listingType = listingType;
    if (state) where.state = state;
    if (district) where.district = district;
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

      if (tsQuery) {
        const matchingIds: { id: string }[] = await prisma.$queryRawUnsafe(
          `SELECT id FROM properties WHERE search_vector @@ to_tsquery('english', $1) LIMIT 200`,
          tsQuery
        );
        if (matchingIds.length > 0) {
          where.id = { in: matchingIds.map((r) => r.id) };
        } else {
          where.OR = [
            { title: { contains: search as string, mode: "insensitive" } },
            { district: { contains: search as string, mode: "insensitive" } },
            { state: { contains: search as string, mode: "insensitive" } },
          ];
        }
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

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          owner: { select: { id: true, name: true, avatar: true } },
          soilData: { select: { soilType: true, fertility: true } },
          waterData: { select: { waterQuality: true, waterTableDepth: true } },
          legalCheck: { select: { titleStatus: true } },
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

    res.json({
      success: true,
      data: properties,
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
      take: 6,
      orderBy: { featuredAt: "desc" },
    });

    await cache.set(CACHE_KEY, properties, 300);
    res.json({ success: true, data: properties });
  } catch (error) {
    logger.error({ err: error }, "Error fetching featured");
    res.status(500).json({ success: false, error: "Failed to fetch featured properties" });
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
        soilData: true,
        waterData: true,
        legalCheck: true,
        droneMap: true,
        owner: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.json({ success: true, data: properties });
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
  listingType: z.enum(["SALE", "LEASE"]).default("SALE"),
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
});

// GET /api/v1/properties/by-id/:id — Get property by ID (for editing)
propertyRoutes.get("/by-id/:id", requireAuth, async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: String(req.params.id) },
      include: {
        images: { orderBy: { order: "asc" } },
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
propertyRoutes.get("/:slug", async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { slug: String(req.params.slug) },
      include: {
        images: { orderBy: { order: "asc" } },
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

    if (!property) {
      return res.status(404).json({ success: false, error: "Property not found" });
    }

    await prisma.property.update({
      where: { id: property.id },
      data: { viewCount: { increment: 1 } },
    });

    res.json({ success: true, data: property });
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

    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      + "-" + Date.now().toString(36);

    const property = await prisma.property.create({
      data: {
        ...data,
        slug,
        ownerId: req.user!.id,
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
      },
    });

    // Increment propertiesUsed on the subscription
    await prisma.subscription.update({
      where: { id: eligibleSubscription.id },
      data: { propertiesUsed: { increment: 1 } },
    });

    if (property.isFeatured) await cache.del("properties:featured");
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
  listingType: z.enum(["SALE", "LEASE"]).optional(),
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

    const updated = await prisma.property.update({
      where: { id: String(req.params.id) },
      data,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
      },
    });

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

    res.json({ success: true, message: "Property deactivated" });
  } catch (error) {
    logger.error({ err: error }, "Error deleting property");
    res.status(500).json({ success: false, error: "Failed to delete property" });
  }
});
