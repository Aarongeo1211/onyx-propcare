import { Router } from "express";
import { z } from "zod";
import { prisma } from "@onyx/db";
import { requireAuth, requireRole } from "../middleware/auth";
import { getQueryNumber, getSingleQueryParam } from "../utils/request";
import { logger } from "../lib/logger";
import { logAudit } from "../middleware/audit";

export const adminRoutes = Router();

adminRoutes.get(
  "/stats",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN"),
  async (_req, res) => {
    try {
      const [
        totalProperties, activeListings, totalInquiries,
        totalUsers, activeUsers, recentInquiries,
        totalViews, propertiesByType, propertiesByState,
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
      ]);

      res.json({
        success: true,
        data: {
          totalProperties, activeListings, totalInquiries, totalUsers, activeUsers,
          newInquiries: recentInquiries,
          recentInquiries,
          totalViews: totalViews._sum.viewCount ?? 0,
          propertiesByType: Object.fromEntries(propertiesByType.map((p) => [p.type, p._count._all])),
          propertiesByState: Object.fromEntries(propertiesByState.map((p) => [p.state, p._count._all])),
        },
      });
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
            owner: { select: { id: true, name: true, email: true } },
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
      res.json({ success: true, data: updated, message: "User deactivated" });
    } catch (err) {
      logger.error({ err }, "Error deactivating user");
      res.status(500).json({ success: false, error: "Failed to deactivate user" });
    }
  }
);
