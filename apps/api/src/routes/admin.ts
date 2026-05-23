import { Router } from "express";
import { z } from "zod";
import { prisma } from "@onyx/db";
import { requireAuth, requireRole } from "../middleware/auth";
import { getQueryNumber, getSingleQueryParam } from "../utils/request";
import { logger } from "../lib/logger";
import { logAudit } from "../middleware/audit";
import { getStorageSettingsSummary } from "../lib/storage";
import { cache } from "../lib/redis";

const ADMIN_STATS_CACHE_KEY = "admin:stats";
const ADMIN_STATS_TTL = 60;

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
      const page = getQueryNumber(req.query.page, 1);
      const limit = getQueryNumber(req.query.limit, 20);
      const where: Record<string, unknown> = {};
      if (status) where.status = status;

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
            owner: { select: { id: true, name: true, email: true } },
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
      const { status } = req.body;
      const property = await prisma.property.update({
        where: { id: String(String(req.params.id)) },
        data: { status, ...(status === "ACTIVE" ? { featuredAt: new Date() } : {}) },
      });
      await logAudit(req, { action: "UPDATE_STATUS", entity: "property", entityId: property.id, details: { status } });
      cache.del(ADMIN_STATS_CACHE_KEY);
      res.json({ success: true, data: property });
    } catch (err) {
      logger.error({ err }, "Error updating property status");
      res.status(500).json({ success: false, error: "Failed to update status" });
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
      cache.del(ADMIN_STATS_CACHE_KEY);
      res.json({ success: true, data: property, message: "Property archived successfully" });
    } catch (err) {
      logger.error({ err }, "Error archiving property");
      res.status(500).json({ success: false, error: "Failed to archive property" });
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
          },
          orderBy: { createdAt: "desc" },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: users,
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
      if (data.isActive !== undefined) cache.del(ADMIN_STATS_CACHE_KEY);
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
      cache.del(ADMIN_STATS_CACHE_KEY);
      res.json({ success: true, data: updated, message: "User deactivated" });
    } catch (err) {
      logger.error({ err }, "Error deactivating user");
      res.status(500).json({ success: false, error: "Failed to deactivate user" });
    }
  }
);
