import { Router } from "express";
import { prisma } from "@onyx/db";
import { z } from "zod";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { sendInquiryNotification } from "../services/email";
import { getQueryNumber, getSingleQueryParam } from "../utils/request";
import { logger } from "../lib/logger";

export const inquiryRoutes = Router();

const createInquirySchema = z.object({
  message: z.string().min(10).max(2000),
  propertyId: z.string(),
  guestName: z.string().min(2).max(100).optional(),
  guestPhone: z.string().min(6).max(20).optional(),
});

// POST /api/v1/inquiries — auth optional; guests must supply guestName + guestPhone
inquiryRoutes.post("/", optionalAuth, async (req, res) => {
  try {
    const data = createInquirySchema.parse(req.body);

    if (!req.user && (!data.guestName || !data.guestPhone)) {
      return res.status(400).json({
        success: false,
        error: "Name and phone are required for a guest inquiry",
      });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        message: data.message,
        propertyId: data.propertyId,
        userId: req.user?.id,
        guestName: req.user ? null : data.guestName,
        guestPhone: req.user ? null : data.guestPhone,
      },
      include: {
        property: { select: { title: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
    });

    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: {
        title: true,
        owner: { select: { email: true } },
      },
    });

    if (property) {
      const buyerName = inquiry.user?.name || inquiry.guestName || "A guest";
      const buyerContact = inquiry.user?.email || inquiry.guestPhone || "no contact supplied";
      sendInquiryNotification(
        property.owner.email,
        property.title,
        buyerName,
        buyerContact,
        data.message
      ).catch(() => {});
    }

    res.status(201).json({ success: true, data: inquiry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error({ err: error }, "Error creating inquiry");
    res.status(500).json({ success: false, error: "Failed to create inquiry" });
  }
});

// GET /api/v1/inquiries
inquiryRoutes.get("/", requireAuth, async (req, res) => {
  try {
    const propertyId = getSingleQueryParam(req.query.propertyId);
    const userId = getSingleQueryParam(req.query.userId);
    const status = getSingleQueryParam(req.query.status);
    const page = getQueryNumber(req.query.page, 1);
    const limit = getQueryNumber(req.query.limit, 20);

    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const where: Record<string, unknown> = {};

    if (req.user!.role === "ADMIN" || req.user!.role === "SUPER_ADMIN") {
      if (propertyId) where.propertyId = propertyId;
      if (userId) where.userId = userId;
    } else if (req.user!.role === "SELLER" || req.user!.role === "AGENT") {
      where.property = { ownerId: req.user!.id };
      if (propertyId) where.propertyId = propertyId;
    } else {
      where.userId = req.user!.id;
      if (propertyId) where.propertyId = propertyId;
    }

    if (status) where.status = status;

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: {
          property: { select: { title: true, slug: true, ownerId: true } },
          user: { select: { name: true, email: true, phone: true } },
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
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching inquiries");
    res.status(500).json({ success: false, error: "Failed to fetch inquiries" });
  }
});

// PATCH /api/v1/inquiries/:id/status — Update inquiry status (property owner only)
const updateInquiryStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "SITE_VISIT", "NEGOTIATING", "CLOSED_WON", "CLOSED_LOST"]),
});

inquiryRoutes.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: String(req.params.id) },
      include: {
        property: { select: { ownerId: true } },
      },
    });

    if (!inquiry) {
      return res.status(404).json({ success: false, error: "Inquiry not found" });
    }

    // Validate that the user owns the property the inquiry is about
    if (inquiry.property.ownerId !== req.user!.id) {
      return res.status(403).json({ success: false, error: "Not authorized to update this inquiry" });
    }

    const { status } = updateInquiryStatusSchema.parse(req.body);

    const updated = await prisma.inquiry.update({
      where: { id: String(req.params.id) },
      data: { status },
      include: {
        property: { select: { title: true, slug: true } },
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error({ err: error }, "Error updating inquiry status");
    res.status(500).json({ success: false, error: "Failed to update inquiry status" });
  }
});
