import { Router } from "express";
import { z } from "zod";
import { prisma } from "@onyx/db";
import { requireAuth, requireRole, blockUserToken, unblockUserToken } from "../middleware/auth";
import { getQueryNumber, getSingleQueryParam } from "../utils/request";
import { logger } from "../lib/logger";
import { logAudit } from "../middleware/audit";
import { getStorageSettingsSummary, deleteFile } from "../lib/storage";
import { cache } from "../lib/redis";
import { runBlogGenerator } from "../services/blog-generator";

const ADMIN_STATS_CACHE_KEY = "admin:stats";
const ADMIN_STATS_TTL = 60;
const UNLIMITED_PLAN_CODE = "UNLIMITED_INTERNAL";

export const adminRoutes = Router();

const reviewDataSchema = z.object({
  section: z.enum(["soil", "water", "legal"]),
  approvalStatus: z.enum(["APPROVED", "REJECTED", "PENDING"]),
  reviewNotes: z.string().max(1000).optional().or(z.literal("")),
});

const updateRefundSchema = z.object({
  status: z.enum(["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "PROCESSED"]),
  adminNotes: z.string().max(2000).optional().or(z.literal("")),
});

const updatePlatformSettingSchema = z.object({
  label: z.string().min(2).max(120).optional(),
  category: z.string().min(2).max(80).optional(),
  description: z.string().max(2000).optional().or(z.literal("")),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.record(z.string(), z.any())]),
});

const defaultPlatformSettings = [
  {
    key: "support_contact",
    label: "Support Contact",
    category: "Support",
    description: "Primary support channels shown to users and admins.",
    value: { email: "support@onyxpropcare.com", phone: "+91 98765 43210", hours: "Mon-Fri 10:00-18:00 IST" },
  },
  {
    key: "billing_contact",
    label: "Billing & Refund Contact",
    category: "Billing",
    description: "Contact information used for refunds and subscription billing help.",
    value: { email: "refunds@onyxpropcare.com", escalationEmail: "billing@onyxpropcare.com" },
  },
  {
    key: "media_storage_mode",
    label: "Media Storage Mode",
    category: "Infrastructure",
    description: "Current storage mode for listing media uploads.",
    value: getStorageSettingsSummary(),
  },
  {
    key: "payment_mode",
    label: "Payment Mode",
    category: "Billing",
    description: "Current payment provider mode used by subscription activation.",
    value: { gateway: "razorpay", live: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) },
  },
];

async function ensurePlatformSettings() {
  const existingCount = await prisma.platformSetting.count();
  if (existingCount > 0) {
    return;
  }

  await prisma.platformSetting.createMany({ data: defaultPlatformSettings });
}

adminRoutes.get(
  "/stats",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (_req, res) => {
    try {
      const cached = await cache.get(ADMIN_STATS_CACHE_KEY);
      if (cached) return res.json({ success: true, data: cached });

      const [
        totalProperties, activeListings, totalInquiries,
        totalUsers, activeUsers, recentInquiries,
        totalViews, propertiesByType, propertiesByState, pendingCallbacks, pendingRefunds,
      ] = await Promise.all([
        prisma.property.count(),
        prisma.property.count({ where: { status: "ACTIVE" } }),
        prisma.inquiry.count(),
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.inquiry.count({
          where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        }),
        prisma.property.aggregate({ _sum: { viewCount: true } }),
        prisma.property.groupBy({ by: ["type"], _count: { _all: true } }),
        prisma.property.groupBy({
          by: ["state"],
          _count: { _all: true },
          orderBy: { _count: { state: "desc" } },
          take: 10,
        }),
        prisma.callbackRequest.count({ where: { status: "PENDING" } }),
        prisma.refundRequest.count({ where: { status: { in: ["PENDING", "UNDER_REVIEW"] } } }),
      ]);

      const data = {
        totalProperties, activeListings, totalInquiries, totalUsers, activeUsers,
        newInquiries: recentInquiries,
        recentInquiries,
        totalViews: totalViews._sum.viewCount ?? 0,
        pendingCallbacks,
        pendingRefunds,
        propertiesByType: Object.fromEntries(propertiesByType.map((p: { type: string; _count: { _all: number } }) => [p.type, p._count._all])),
        propertiesByState: Object.fromEntries(propertiesByState.map((p: { state: string; _count: { _all: number } }) => [p.state, p._count._all])),
      };

      await cache.set(ADMIN_STATS_CACHE_KEY, data, ADMIN_STATS_TTL);
      res.json({ success: true, data });
    } catch (err) {
      logger.error({ err }, "Error fetching admin stats");
      res.status(500).json({ success: false, error: "Failed to fetch stats" });
    }
  }
);

adminRoutes.get(
  "/properties",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const status = getSingleQueryParam(req.query.status);
      const featured = getSingleQueryParam(req.query.featured);
      const page = getQueryNumber(req.query.page, 1);
      const limit = getQueryNumber(req.query.limit, 20);
      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (featured === "true") where.isFeatured = true;

      const pageNum = Math.max(1, page);
      const limitNum = Math.min(100, Math.max(1, limit));

      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where,
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            videos: { take: 1, orderBy: { order: "asc" } },
            documents: { take: 3, orderBy: { name: "asc" } },
            droneMap: { select: { mapUrl: true, thumbnailUrl: true, capturedAt: true } },
            owner: { select: { id: true, name: true, email: true, phone: true } },
            soilData: { select: { approvalStatus: true, reviewNotes: true, testedAt: true } },
            waterData: { select: { approvalStatus: true, reviewNotes: true, testedAt: true } },
            legalCheck: { select: { approvalStatus: true, reviewNotes: true, verifiedAt: true, verifiedBy: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.property.count({ where }),
      ]);

      res.json({
        success: true,
        data: properties,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      });
    } catch (err) {
      logger.error({ err }, "Error fetching admin properties");
      res.status(500).json({ success: false, error: "Failed to fetch properties" });
    }
  }
);

// GET /admin/properties/:id — full property detail for admin review modal
adminRoutes.get(
  "/properties/:id",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const property = await prisma.property.findUnique({
        where: { id: String(req.params.id) },
        include: {
          images: { orderBy: { order: "asc" } },
          videos: { orderBy: { order: "asc" } },
          documents: { orderBy: { name: "asc" } },
          droneMap: true,
          owner: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
          soilData: true,
          waterData: true,
          legalCheck: true,
        },
      });

      if (!property) {
        return res.status(404).json({ success: false, error: "Property not found" });
      }

      res.json({ success: true, data: property });
    } catch (err) {
      logger.error({ err }, "Error fetching admin property detail");
      res.status(500).json({ success: false, error: "Failed to fetch property" });
    }
  }
);

adminRoutes.get(
  "/refund-requests",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const status = getSingleQueryParam(req.query.status);
      const page = getQueryNumber(req.query.page, 1);
      const limit = getQueryNumber(req.query.limit, 20);
      const where: Record<string, unknown> = {};
      if (status) where.status = status;

      const pageNum = Math.max(1, page);
      const limitNum = Math.min(100, Math.max(1, limit));

      const [requests, total] = await Promise.all([
        prisma.refundRequest.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true } },
            subscription: { include: { plan: { select: { name: true, price: true, category: true } } } },
          },
          orderBy: { createdAt: "desc" },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.refundRequest.count({ where }),
      ]);

      res.json({
        success: true,
        data: requests,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      });
    } catch (err) {
      logger.error({ err }, "Error fetching refund requests");
      res.status(500).json({ success: false, error: "Failed to fetch refund requests" });
    }
  }
);

adminRoutes.patch(
  "/refund-requests/:id",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const data = updateRefundSchema.parse(req.body);
      const updated = await prisma.refundRequest.update({
        where: { id: String(req.params.id) },
        data: {
          status: data.status,
          adminNotes: data.adminNotes || null,
          resolvedAt: data.status === "APPROVED" || data.status === "REJECTED" || data.status === "PROCESSED" ? new Date() : null,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          subscription: { include: { plan: { select: { name: true, price: true, category: true } } } },
        },
      });

      await logAudit(req, { action: "UPDATE_REFUND_REQUEST", entity: "refund_request", entityId: updated.id, details: data as Record<string, unknown> });
      res.json({ success: true, data: updated });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: err.errors });
      }
      logger.error({ err }, "Error updating refund request");
      res.status(500).json({ success: false, error: "Failed to update refund request" });
    }
  }
);

adminRoutes.get(
  "/settings",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (_req, res) => {
    try {
      await ensurePlatformSettings();
      const settings = await prisma.platformSetting.findMany({
        orderBy: [{ category: "asc" }, { label: "asc" }],
      });
      const storageSummary = getStorageSettingsSummary();
      const data = settings.some((setting) => setting.key === "media_storage_mode")
        ? settings.map((setting) =>
            setting.key === "media_storage_mode"
              ? { ...setting, value: storageSummary }
              : setting
          )
        : [
            ...settings,
            {
              id: "runtime-media-storage-mode",
              key: "media_storage_mode",
              label: "Media Storage Mode",
              category: "Infrastructure",
              description: "Current storage mode for listing media uploads.",
              value: storageSummary,
              updatedBy: null,
              updatedAt: new Date(),
              createdAt: new Date(),
            },
          ];
      res.json({ success: true, data });
    } catch (err) {
      logger.error({ err }, "Error fetching platform settings");
      res.status(500).json({ success: false, error: "Failed to fetch settings" });
    }
  }
);

adminRoutes.put(
  "/settings/:key",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const data = updatePlatformSettingSchema.parse(req.body);
      const key = String(req.params.key);
      const updated = await prisma.platformSetting.upsert({
        where: { key },
        update: {
          label: data.label,
          category: data.category,
          description: data.description || null,
          value: data.value,
          updatedBy: req.user?.email || req.user?.id,
        },
        create: {
          key,
          label: data.label ?? key,
          category: data.category ?? "General",
          description: data.description || null,
          value: data.value,
          updatedBy: req.user?.email || req.user?.id,
        },
      });
      await logAudit(req, { action: "UPDATE_PLATFORM_SETTING", entity: "platform_setting", entityId: updated.id, details: { key, value: data.value } });
      res.json({ success: true, data: updated });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: err.errors });
      }
      logger.error({ err }, "Error updating platform setting");
      res.status(500).json({ success: false, error: "Failed to update setting" });
    }
  }
);

adminRoutes.patch(
  "/properties/:id/review-data",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const { section, approvalStatus, reviewNotes } = reviewDataSchema.parse(req.body);
      const propertyId = String(req.params.id);
      const reviewerName = req.user?.name || req.user?.email || "Admin";

      const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { slug: true } });
      if (!property) {
        return res.status(404).json({ success: false, error: "Property not found" });
      }
      const invalidateDetailCache = () => cache.del(`property:slug:${property.slug}`);

      if (section === "soil") {
        const existing = await prisma.soilData.findUnique({ where: { propertyId } });
        if (!existing) {
          return res.status(404).json({ success: false, error: "Soil report not found" });
        }

        const updated = await prisma.soilData.update({
          where: { propertyId },
          data: {
            approvalStatus,
            reviewNotes: reviewNotes || null,
            approvedBy: approvalStatus === "APPROVED" ? reviewerName : null,
            approvedAt: approvalStatus === "APPROVED" ? new Date() : null,
          },
        });
        await logAudit(req, { action: "REVIEW_SOIL_DATA", entity: "property", entityId: propertyId, details: { approvalStatus, reviewNotes } });
        await invalidateDetailCache();
        return res.json({ success: true, data: updated });
      }

      if (section === "water") {
        const existing = await prisma.waterData.findUnique({ where: { propertyId } });
        if (!existing) {
          return res.status(404).json({ success: false, error: "Water report not found" });
        }

        const updated = await prisma.waterData.update({
          where: { propertyId },
          data: {
            approvalStatus,
            reviewNotes: reviewNotes || null,
            approvedBy: approvalStatus === "APPROVED" ? reviewerName : null,
            approvedAt: approvalStatus === "APPROVED" ? new Date() : null,
          },
        });
        await logAudit(req, { action: "REVIEW_WATER_DATA", entity: "property", entityId: propertyId, details: { approvalStatus, reviewNotes } });
        await invalidateDetailCache();
        return res.json({ success: true, data: updated });
      }

      const existing = await prisma.legalCheck.findUnique({ where: { propertyId } });
      if (!existing) {
        return res.status(404).json({ success: false, error: "Legal check not found" });
      }

      const updated = await prisma.legalCheck.update({
        where: { propertyId },
        data: {
          approvalStatus,
          reviewNotes: reviewNotes || null,
          verifiedBy: approvalStatus === "APPROVED" ? reviewerName : null,
          verifiedAt: approvalStatus === "APPROVED" ? new Date() : null,
        },
      });
      await logAudit(req, { action: "REVIEW_LEGAL_DATA", entity: "property", entityId: propertyId, details: { approvalStatus, reviewNotes } });
      await invalidateDetailCache();
      res.json({ success: true, data: updated });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: err.errors });
      }
      logger.error({ err }, "Error reviewing property data");
      res.status(500).json({ success: false, error: "Failed to review property data" });
    }
  }
);

adminRoutes.patch(
  "/properties/:id/status",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const { status } = z.object({
        status: z.enum(["ACTIVE", "PENDING_REVIEW", "REJECTED", "INACTIVE", "DRAFT", "SOLD"]),
      }).parse(req.body);
      const property = await prisma.property.update({
        where: { id: String(req.params.id) },
        data: { status, ...(status === "ACTIVE" ? { featuredAt: new Date() } : {}) },
        select: { id: true, status: true, isFeatured: true },
      });
      await logAudit(req, { action: "UPDATE_STATUS", entity: "property", entityId: property.id, details: { status } });
      // If the property was featured, bust the cache — it may no longer satisfy
      // WHERE isFeatured=true AND status='ACTIVE' after this change
      if (property.isFeatured || status === "ACTIVE") cache.del("properties:featured");
      cache.del(ADMIN_STATS_CACHE_KEY);
      res.json({ success: true, data: property });
    } catch (err) {
      logger.error({ err }, "Error updating property status");
      res.status(500).json({ success: false, error: "Failed to update status" });
    }
  }
);

adminRoutes.patch(
  "/properties/:id/featured",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const { featured } = z.object({ featured: z.boolean() }).parse(req.body);
      const property = await prisma.property.update({
        where: { id: String(req.params.id) },
        data: {
          isFeatured: featured,
          featuredAt: featured ? new Date() : null,
        },
        select: { id: true, slug: true, title: true, isFeatured: true, featuredAt: true },
      });
      await logAudit(req, {
        action: featured ? "FEATURE_PROPERTY" : "UNFEATURE_PROPERTY",
        entity: "property",
        entityId: property.id,
        details: { isFeatured: featured },
      });
      // Bust the featured properties cache so the homepage reflects the change immediately
      await cache.del("properties:featured");
      await cache.del(`property:slug:${property.slug}`);
      res.json({ success: true, data: property });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: err.errors });
      }
      logger.error({ err }, "Error toggling featured status");
      res.status(500).json({ success: false, error: "Failed to update featured status" });
    }
  }
);

adminRoutes.delete(
  "/properties/:id",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const property = await prisma.property.update({
        where: { id: String(String(req.params.id)) },
        data: { status: "INACTIVE", isFeatured: false, featuredAt: null },
      });
      await logAudit(req, { action: "ARCHIVE", entity: "property", entityId: property.id });
      // Always bust featured cache on archive — property is guaranteed off the list
      cache.del("properties:featured");
      cache.del(ADMIN_STATS_CACHE_KEY);
      cache.del(`property:slug:${property.slug}`);
      res.json({ success: true, data: property, message: "Property archived successfully" });
    } catch (err) {
      logger.error({ err }, "Error archiving property");
      res.status(500).json({ success: false, error: "Failed to archive property" });
    }
  }
);

// Hard-delete a property and all its associated media files from storage
adminRoutes.delete(
  "/properties/:id/permanent",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const propertyId = String(req.params.id);

      // Fetch all media before deleting DB records
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          images: { select: { id: true, url: true } },
          videos: { select: { id: true, publicId: true } },
          documents: { select: { id: true, publicId: true } },
        },
      });

      if (!property) {
        return res.status(404).json({ success: false, error: "Property not found" });
      }

      // Images have no publicId — extract the S3 object key from the asset proxy URL
      // (.../api/v1/upload/files/<encoded key>). Using the raw pathname here previously
      // kept the "/api/v1/upload/files/" prefix and left it percent-encoded, so every
      // hard-delete silently failed to remove the image from the bucket.
      const imageKeys = property.images
        .map((f: { id: string; url: string }) => {
          try {
            const match = new URL(f.url).pathname.match(/\/upload\/files\/(.+)$/);
            return match ? decodeURIComponent(match[1]) : null;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as string[];

      // Delete all media files from storage (best-effort — don't block on failures)
      const mediaToDelete = [
        ...imageKeys,
        ...property.videos.map((f: { id: string; publicId: string | null }) => f.publicId).filter(Boolean),
        ...property.documents.map((f: { id: string; publicId: string | null }) => f.publicId).filter(Boolean),
      ] as string[];

      await Promise.allSettled(mediaToDelete.map((pid) => deleteFile(pid)));

      // Hard-delete the DB record (cascades to images, videos, documents, soilData, etc.)
      await prisma.property.delete({ where: { id: propertyId } });

      await logAudit(req, { action: "HARD_DELETE_PROPERTY", entity: "property", entityId: propertyId, details: { title: property.title } });
      await cache.del("properties:featured");
      await cache.invalidatePrefix(`properties:type:${property.type}`);
      cache.del(ADMIN_STATS_CACHE_KEY);
      cache.del(`property:slug:${property.slug}`);

      res.json({ success: true, message: "Property permanently deleted" });
    } catch (err) {
      logger.error({ err }, "Error permanently deleting property");
      res.status(500).json({ success: false, error: "Failed to permanently delete property" });
    }
  }
);

adminRoutes.get(
  "/users",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const page = getQueryNumber(req.query.page, 1);
      const limit = getQueryNumber(req.query.limit, 20);
      const search = getSingleQueryParam(req.query.search);
      const role = getSingleQueryParam(req.query.role);
      const isActiveParam = getSingleQueryParam(req.query.isActive);

      const pageNum = Math.max(1, page);
      const limitNum = Math.min(100, Math.max(1, limit));

      const where: Record<string, unknown> = {};
      if (role) where.role = role;
      if (isActiveParam === "true") where.isActive = true;
      if (isActiveParam === "false") where.isActive = false;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true, name: true, email: true, phone: true, role: true,
            isActive: true, createdAt: true,
            _count: { select: { properties: true, inquiries: true } },
            subscriptions: {
              where: { status: "ACTIVE", plan: { code: UNLIMITED_PLAN_CODE } },
              select: { id: true },
              take: 1,
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.user.count({ where }),
      ]);

      const usersWithGrantFlag = users.map(({ subscriptions, ...user }) => ({
        ...user,
        hasUnlimitedGrant: subscriptions.length > 0,
      }));

      res.json({
        success: true,
        data: usersWithGrantFlag,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      });
    } catch (err) {
      logger.error({ err }, "Error fetching users");
      res.status(500).json({ success: false, error: "Failed to fetch users" });
    }
  }
);

adminRoutes.get(
  "/users/:id",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: String(req.params.id) },
        select: {
          id: true, name: true, email: true, phone: true, role: true,
          isActive: true, emailVerified: true, avatar: true, createdAt: true,
          _count: { select: { properties: true, inquiries: true, subscriptions: true } },
        },
      });
      if (!user) return res.status(404).json({ success: false, error: "User not found" });
      res.json({ success: true, data: user });
    } catch (err) {
      logger.error({ err }, "Error fetching user");
      res.status(500).json({ success: false, error: "Failed to fetch user" });
    }
  }
);

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(7).max(20).nullable().optional(),
  role: z.enum(["BUYER", "SELLER", "AGENT", "ADMIN", "SUPER_ADMIN"]).optional(),
  isActive: z.boolean().optional(),
});

adminRoutes.patch(
  "/users/:id",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const data = updateUserSchema.parse(req.body);
      const targetId = String(req.params.id);

      // Only SUPER_ADMIN may grant ADMIN/SUPER_ADMIN roles
      if (data.role && (data.role === "ADMIN" || data.role === "SUPER_ADMIN")) {
        if (req.user!.role !== "SUPER_ADMIN") {
          return res.status(403).json({
            success: false,
            error: "Only SUPER_ADMIN may assign admin roles",
          });
        }
      }

      // Block self-deactivation / self-demotion
      if (targetId === req.user!.id) {
        if (data.isActive === false) {
          return res.status(400).json({ success: false, error: "Cannot deactivate yourself" });
        }
        if (data.role && data.role !== req.user!.role) {
          return res.status(400).json({ success: false, error: "Cannot change your own role" });
        }
      }

      const target = await prisma.user.findUnique({ where: { id: targetId } });
      if (!target) return res.status(404).json({ success: false, error: "User not found" });

      // Prevent ADMIN from modifying SUPER_ADMIN
      if (target.role === "SUPER_ADMIN" && req.user!.role !== "SUPER_ADMIN") {
        return res.status(403).json({ success: false, error: "Cannot modify SUPER_ADMIN" });
      }

      // Phone uniqueness
      if (data.phone) {
        const existingPhone = await prisma.user.findFirst({
          where: { phone: data.phone, NOT: { id: targetId } },
          select: { id: true },
        });
        if (existingPhone) {
          return res.status(409).json({ success: false, error: "Phone number already in use" });
        }
      }

      const updated = await prisma.user.update({
        where: { id: targetId },
        data,
        select: {
          id: true, name: true, email: true, phone: true, role: true,
          isActive: true, createdAt: true,
        },
      });

      await logAudit(req, { action: "UPDATE_USER", entity: "user", entityId: targetId, details: data as Record<string, unknown> });
      if (data.isActive === false) {
        blockUserToken(targetId).catch(() => {}); // invalidate existing JWT immediately
        cache.del(ADMIN_STATS_CACHE_KEY);
      } else if (data.isActive === true) {
        unblockUserToken(targetId).catch(() => {}); // lift the blocklist entry on re-activation
        cache.del(ADMIN_STATS_CACHE_KEY);
      }
      res.json({ success: true, data: updated });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: err.errors });
      }
      logger.error({ err }, "Error updating user");
      res.status(500).json({ success: false, error: "Failed to update user" });
    }
  }
);

// Lazily creates the special unlimited-listings plan the first time it's
// needed, rather than requiring a separate seed/migration step. isActive:
// false keeps it out of the public /plans listing (GET /plans filters on
// isActive), so it only ever shows up via an admin-granted subscription.
async function getOrCreateUnlimitedPlan() {
  const existing = await prisma.plan.findUnique({ where: { code: UNLIMITED_PLAN_CODE } });
  if (existing) return existing;

  return prisma.plan.create({
    data: {
      code: UNLIMITED_PLAN_CODE,
      name: "Unlimited (Admin Grant)",
      type: "ENTERPRISE",
      category: "ALL",
      price: 0,
      maxProperties: -1,
      maxImages: 50,
      maxVideos: 10,
      listingDuration: 3650,
      features: ["Unlimited listings", "Granted by admin"],
      hasSoilData: true,
      hasWaterData: true,
      hasLegalCheck: true,
      hasDroneMap: true,
      hasFeatured: true,
      hasVideo: true,
      hasVerifiedBadge: true,
      isActive: false,
    },
  });
}

// POST /api/v1/admin/users/:id/unlimited-plan — grant a seller unlimited
// listings, bypassing the normal plan-limit enforcement in
// utils/plans.ts#findEligibleSubscription (maxProperties: -1 is already
// treated as unlimited there). Idempotent: re-granting just refreshes the
// expiry instead of creating a duplicate active subscription.
adminRoutes.post(
  "/users/:id/unlimited-plan",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const targetId = String(req.params.id);
      const target = await prisma.user.findUnique({ where: { id: targetId } });
      if (!target) return res.status(404).json({ success: false, error: "User not found" });

      const plan = await getOrCreateUnlimitedPlan();
      const existingGrant = await prisma.subscription.findFirst({
        where: { userId: targetId, planId: plan.id, status: "ACTIVE" },
      });

      const tenYearsOut = new Date();
      tenYearsOut.setFullYear(tenYearsOut.getFullYear() + 10);

      const subscription = existingGrant
        ? await prisma.subscription.update({
            where: { id: existingGrant.id },
            data: { endDate: tenYearsOut },
          })
        : await prisma.subscription.create({
            data: {
              userId: targetId,
              planId: plan.id,
              status: "ACTIVE",
              amount: 0,
              startDate: new Date(),
              endDate: tenYearsOut,
            },
          });

      await logAudit(req, {
        action: "GRANT_UNLIMITED_PLAN",
        entity: "user",
        entityId: targetId,
        details: { subscriptionId: subscription.id },
      });

      res.json({ success: true, data: { subscriptionId: subscription.id, endDate: subscription.endDate } });
    } catch (err) {
      logger.error({ err }, "Error granting unlimited plan");
      res.status(500).json({ success: false, error: "Failed to grant unlimited plan" });
    }
  }
);

// DELETE /api/v1/admin/users/:id/unlimited-plan — revoke a previously
// granted unlimited-listings exception.
adminRoutes.delete(
  "/users/:id/unlimited-plan",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const targetId = String(req.params.id);
      const plan = await prisma.plan.findUnique({ where: { code: UNLIMITED_PLAN_CODE } });
      if (!plan) return res.json({ success: true, data: { revoked: false } });

      const result = await prisma.subscription.updateMany({
        where: { userId: targetId, planId: plan.id, status: "ACTIVE" },
        data: { status: "CANCELLED", endDate: new Date() },
      });

      await logAudit(req, {
        action: "REVOKE_UNLIMITED_PLAN",
        entity: "user",
        entityId: targetId,
        details: { revokedCount: result.count },
      });

      res.json({ success: true, data: { revoked: result.count > 0 } });
    } catch (err) {
      logger.error({ err }, "Error revoking unlimited plan");
      res.status(500).json({ success: false, error: "Failed to revoke unlimited plan" });
    }
  }
);

adminRoutes.delete(
  "/users/:id",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  async (req, res) => {
    try {
      const targetId = String(req.params.id);
      if (targetId === req.user!.id) {
        return res.status(400).json({ success: false, error: "Cannot delete yourself" });
      }

      const target = await prisma.user.findUnique({ where: { id: targetId } });
      if (!target) return res.status(404).json({ success: false, error: "User not found" });

      // Soft-deactivate; hard delete left to a separate audited workflow
      const updated = await prisma.user.update({
        where: { id: targetId },
        data: { isActive: false },
        select: { id: true, isActive: true },
      });

      await logAudit(req, { action: "DEACTIVATE_USER", entity: "user", entityId: targetId });
      blockUserToken(targetId).catch(() => {}); // invalidate existing JWT immediately
      cache.del(ADMIN_STATS_CACHE_KEY);
      res.json({ success: true, data: updated, message: "User deactivated" });
    } catch (err) {
      logger.error({ err }, "Error deactivating user");
      res.status(500).json({ success: false, error: "Failed to deactivate user" });
    }
  }
);

// ─── Onyx 40+ events ────────────────────────────────────────────────────────

const MAX_EVENT_MEDIA = 5;

function invalidateFortyPlusCache(slug: string) {
  return Promise.all([
    cache.del("40plus:events:published"),
    cache.del(`40plus:events:slug:${slug}`),
  ]);
}

function slugifyEventTitle(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Date.now().toString(36)
  );
}

adminRoutes.get("/40plus/events", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (_req, res) => {
  try {
    const events = await prisma.fortyPlusEvent.findMany({
      include: { media: { orderBy: { order: "asc" } } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    res.json({ success: true, data: events });
  } catch (err) {
    logger.error({ err }, "Error listing 40+ events");
    res.status(500).json({ success: false, error: "Failed to list events" });
  }
});

const createEventSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(3000).optional(),
  eventDate: z.string().datetime().optional(),
  location: z.string().max(200).optional(),
  category: z.string().max(80).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  order: z.number().int().optional(),
});

adminRoutes.post("/40plus/events", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const data = createEventSchema.parse(req.body);
    const event = await prisma.fortyPlusEvent.create({
      data: {
        title: data.title,
        slug: slugifyEventTitle(data.title),
        description: data.description || null,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        location: data.location || null,
        category: data.category || null,
        status: data.status || "DRAFT",
        order: data.order ?? 0,
      },
      include: { media: true },
    });
    await logAudit(req, { action: "CREATE_40PLUS_EVENT", entity: "forty_plus_event", entityId: event.id });
    if (event.status === "PUBLISHED") await invalidateFortyPlusCache(event.slug);
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors });
    }
    logger.error({ err }, "Error creating 40+ event");
    res.status(500).json({ success: false, error: "Failed to create event" });
  }
});

const updateEventSchema = createEventSchema.partial();

adminRoutes.patch("/40plus/events/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const data = updateEventSchema.parse(req.body);
    const eventId = String(req.params.id);
    const existing = await prisma.fortyPlusEvent.findUnique({ where: { id: eventId } });
    if (!existing) return res.status(404).json({ success: false, error: "Event not found" });

    const event = await prisma.fortyPlusEvent.update({
      where: { id: eventId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.eventDate !== undefined && { eventDate: data.eventDate ? new Date(data.eventDate) : null }),
        ...(data.location !== undefined && { location: data.location || null }),
        ...(data.category !== undefined && { category: data.category || null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.order !== undefined && { order: data.order }),
      },
      include: { media: { orderBy: { order: "asc" } } },
    });
    await logAudit(req, { action: "UPDATE_40PLUS_EVENT", entity: "forty_plus_event", entityId: event.id });
    await invalidateFortyPlusCache(existing.slug);
    if (event.slug !== existing.slug) await invalidateFortyPlusCache(event.slug);
    res.json({ success: true, data: event });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors });
    }
    logger.error({ err }, "Error updating 40+ event");
    res.status(500).json({ success: false, error: "Failed to update event" });
  }
});

adminRoutes.delete("/40plus/events/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const event = await prisma.fortyPlusEvent.findUnique({
      where: { id: String(req.params.id) },
      include: { media: true },
    });
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    await Promise.allSettled(event.media.map((m) => deleteFile(m.publicId)));
    await prisma.fortyPlusEvent.delete({ where: { id: event.id } });

    await logAudit(req, { action: "DELETE_40PLUS_EVENT", entity: "forty_plus_event", entityId: event.id, details: { title: event.title } });
    await invalidateFortyPlusCache(event.slug);
    res.json({ success: true, message: "Event deleted" });
  } catch (err) {
    logger.error({ err }, "Error deleting 40+ event");
    res.status(500).json({ success: false, error: "Failed to delete event" });
  }
});

const addEventMediaSchema = z.object({
  media: z
    .array(
      z.object({
        url: z.string().url(),
        publicId: z.string(),
        type: z.enum(["IMAGE", "VIDEO"]),
      })
    )
    .min(1),
});

adminRoutes.post("/40plus/events/:id/media", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const { media } = addEventMediaSchema.parse(req.body);
    const event = await prisma.fortyPlusEvent.findUnique({
      where: { id: String(req.params.id) },
      include: { media: true },
    });
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    if (event.media.length + media.length > MAX_EVENT_MEDIA) {
      return res.status(400).json({
        success: false,
        error: `An event can have at most ${MAX_EVENT_MEDIA} posters/videos (${event.media.length} already attached).`,
      });
    }

    const startOrder = event.media.length;
    await prisma.fortyPlusEventMedia.createMany({
      data: media.map((m, i) => ({
        url: m.url,
        publicId: m.publicId,
        type: m.type,
        order: startOrder + i,
        eventId: event.id,
      })),
    });

    const updated = await prisma.fortyPlusEvent.findUnique({
      where: { id: event.id },
      include: { media: { orderBy: { order: "asc" } } },
    });

    await logAudit(req, { action: "ADD_40PLUS_EVENT_MEDIA", entity: "forty_plus_event", entityId: event.id, details: { count: media.length } });
    await invalidateFortyPlusCache(event.slug);
    res.status(201).json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors });
    }
    logger.error({ err }, "Error adding 40+ event media");
    res.status(500).json({ success: false, error: "Failed to add media" });
  }
});

adminRoutes.delete(
  "/40plus/events/:id/media/:mediaId",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const media = await prisma.fortyPlusEventMedia.findUnique({
        where: { id: String(req.params.mediaId) },
        include: { event: { select: { id: true, slug: true } } },
      });
      if (!media || media.eventId !== String(req.params.id)) {
        return res.status(404).json({ success: false, error: "Media not found" });
      }

      await prisma.fortyPlusEventMedia.delete({ where: { id: media.id } });
      await deleteFile(media.publicId);

      await logAudit(req, { action: "REMOVE_40PLUS_EVENT_MEDIA", entity: "forty_plus_event", entityId: media.eventId });
      await invalidateFortyPlusCache(media.event.slug);
      res.json({ success: true, message: "Media removed" });
    } catch (err) {
      logger.error({ err }, "Error removing 40+ event media");
      res.status(500).json({ success: false, error: "Failed to remove media" });
    }
  }
);

// GET /api/v1/admin/blog — all posts (published + draft), for oversight of
// the autonomous generation pipeline.
adminRoutes.get(
  "/blog",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (_req, res) => {
    try {
      const posts = await prisma.blogPost.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      });
      res.json({ success: true, data: posts });
    } catch (err) {
      logger.error({ err }, "Error fetching blog posts");
      res.status(500).json({ success: false, error: "Failed to fetch blog posts" });
    }
  }
);

const updateBlogPostSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  excerpt: z.string().max(300).nullable().optional(),
  metaDescription: z.string().max(300).nullable().optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
});

// PATCH /api/v1/admin/blog/:id — edit or unpublish a post. This is the
// oversight lever for the autonomous pipeline: nothing blocks publish
// up front, but any post can be pulled or corrected after the fact.
adminRoutes.patch(
  "/blog/:id",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const data = updateBlogPostSchema.parse(req.body);
      const postId = String(req.params.id);
      const updated = await prisma.blogPost.update({ where: { id: postId }, data });
      await logAudit(req, { action: "UPDATE_BLOG_POST", entity: "blog_post", entityId: postId, details: data as Record<string, unknown> });
      await cache.invalidatePrefix("blog:list:");
      res.json({ success: true, data: updated });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: err.errors });
      }
      logger.error({ err }, "Error updating blog post");
      res.status(500).json({ success: false, error: "Failed to update blog post" });
    }
  }
);

// DELETE /api/v1/admin/blog/:id
adminRoutes.delete(
  "/blog/:id",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const postId = String(req.params.id);
      await prisma.blogPost.delete({ where: { id: postId } });
      await logAudit(req, { action: "DELETE_BLOG_POST", entity: "blog_post", entityId: postId });
      await cache.invalidatePrefix("blog:list:");
      res.json({ success: true, message: "Post deleted" });
    } catch (err) {
      logger.error({ err }, "Error deleting blog post");
      res.status(500).json({ success: false, error: "Failed to delete blog post" });
    }
  }
);

// POST /api/v1/admin/blog/generate-now — manually trigger one generation
// cycle on demand, outside the scheduled cadence (useful for testing and
// for topping up content without waiting for the next scheduled run).
adminRoutes.post(
  "/blog/generate-now",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const result = await runBlogGenerator();
      await logAudit(req, { action: "MANUAL_BLOG_GENERATE", entity: "blog_post", entityId: result.postId || "none", details: result });
      if (result.generated) {
        await cache.invalidatePrefix("blog:list:");
      }
      res.json({ success: true, data: result });
    } catch (err) {
      logger.error({ err }, "Error running manual blog generation");
      res.status(500).json({ success: false, error: "Failed to generate post" });
    }
  }
);
