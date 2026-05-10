import { Router } from "express";
import { z } from "zod";
import { prisma } from "@onyx/db";
import { requireAuth } from "../middleware/auth";
import { logger } from "../lib/logger";

export const userRoutes = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(7).max(20).nullable().optional(),
  avatar: z.string().url().nullable().optional(),
});

// GET /api/v1/users/me — current user profile (canonical)
userRoutes.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        avatar: true, isActive: true, emailVerified: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    logger.error({ err }, "Error fetching profile");
    res.status(500).json({ success: false, error: "Failed to fetch profile" });
  }
});

// PATCH /api/v1/users/me — edit profile
userRoutes.patch("/me", requireAuth, async (req, res) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    if (data.phone) {
      const existingPhone = await prisma.user.findFirst({
        where: { phone: data.phone, NOT: { id: req.user!.id } },
        select: { id: true },
      });
      if (existingPhone) {
        return res.status(409).json({ success: false, error: "Phone number already in use" });
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        avatar: true, isActive: true, createdAt: true,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors });
    }
    logger.error({ err }, "Error updating profile");
    res.status(500).json({ success: false, error: "Failed to update profile" });
  }
});

userRoutes.get("/me/properties", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { status, page = "1", limit = "12" } = req.query;

    const where: Record<string, unknown> = { ownerId: userId };
    if (status) where.status = status;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { inquiries: true } },
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
    logger.error({ err }, "Error fetching user properties");
    res.status(500).json({ success: false, error: "Failed to fetch properties" });
  }
});

userRoutes.get("/me/inquiries", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { status, page = "1", limit = "20" } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));

    let where: Record<string, unknown> = {};
    if (userRole === "SELLER" || userRole === "AGENT") {
      where = { property: { ownerId: userId } };
    } else {
      where = { userId };
    }

    if (status) where.status = status;

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: {
          property: { select: { id: true, title: true, slug: true } },
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.inquiry.count({ where }),
    ]);

    res.json({
      success: true,
      data: inquiries,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    logger.error({ err }, "Error fetching user inquiries");
    res.status(500).json({ success: false, error: "Failed to fetch inquiries" });
  }
});

userRoutes.get("/me/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const [
      totalProperties, activeListings, properties,
      totalInquiries, newInquiries, subscription, recentInquiries,
    ] = await Promise.all([
      prisma.property.count({ where: { ownerId: userId } }),
      prisma.property.count({ where: { ownerId: userId, status: "ACTIVE" } }),
      prisma.property.findMany({ where: { ownerId: userId }, select: { viewCount: true } }),
      prisma.inquiry.count({ where: { property: { ownerId: userId } } }),
      prisma.inquiry.count({ where: { property: { ownerId: userId }, status: "NEW" } }),
      prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE", endDate: { gt: new Date() } },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.inquiry.findMany({
        where: { property: { ownerId: userId } },
        include: {
          property: { select: { title: true, slug: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const totalViews = properties.reduce((sum, p) => sum + p.viewCount, 0);

    res.json({
      success: true,
      data: {
        totalProperties, activeListings, totalViews, totalInquiries, newInquiries,
        subscription: subscription
          ? {
              planName: subscription.plan.name,
              planType: subscription.plan.type,
              maxProperties: subscription.plan.maxProperties,
              propertiesUsed: subscription.propertiesUsed,
              startDate: subscription.startDate,
              endDate: subscription.endDate,
              daysRemaining: Math.max(
                0,
                Math.ceil((new Date(subscription.endDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              ),
              features: subscription.plan.features,
              price: subscription.plan.price,
            }
          : null,
        recentInquiries,
      },
    });
  } catch (err) {
    logger.error({ err }, "Error fetching user stats");
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

userRoutes.get("/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, avatar: true, role: true, createdAt: true,
        properties: {
          where: { status: "ACTIVE" },
          select: { id: true, title: true, slug: true, price: true, type: true },
        },
      },
    });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    logger.error({ err }, "Error fetching user");
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});
