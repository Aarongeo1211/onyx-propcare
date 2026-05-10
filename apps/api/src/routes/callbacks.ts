import { Router } from "express";
import { prisma } from "@onyx/db";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { logger } from "../lib/logger";

export const callbackRoutes = Router();

const createCallbackSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(6).max(20),
  propertyId: z.string(),
});

// POST /api/v1/callbacks — Request a callback (auth optional via userId)
callbackRoutes.post("/", requireAuth, async (req, res) => {
  try {
    const data = createCallbackSchema.parse(req.body);

    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: { id: true, status: true },
    });

    if (!property || property.status !== "ACTIVE") {
      return res.status(404).json({ success: false, error: "Property not found" });
    }

    const callback = await prisma.callbackRequest.create({
      data: {
        name: data.name,
        phone: data.phone,
        propertyId: data.propertyId,
        userId: req.user!.id,
      },
      include: {
        property: { select: { title: true, slug: true } },
      },
    });

    res.status(201).json({ success: true, data: callback });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error({ err: error }, "Error creating callback request");
    res.status(500).json({ success: false, error: "Failed to create callback request" });
  }
});

// GET /api/v1/callbacks — List callback requests (seller sees own properties, admin sees all)
callbackRoutes.get("/", requireAuth, async (req, res) => {
  try {
    const where: Record<string, unknown> = {};

    if (req.user!.role === "ADMIN" || req.user!.role === "SUPER_ADMIN") {
      // admin sees all
    } else if (req.user!.role === "SELLER" || req.user!.role === "AGENT") {
      where.property = { ownerId: req.user!.id };
    } else {
      where.userId = req.user!.id;
    }

    const status = req.query.status as string | undefined;
    if (status) where.status = status;

    const callbacks = await prisma.callbackRequest.findMany({
      where,
      include: {
        property: { select: { title: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    res.json({ success: true, data: callbacks });
  } catch (error) {
    logger.error({ err: error }, "Error fetching callbacks");
    res.status(500).json({ success: false, error: "Failed to fetch callbacks" });
  }
});

// PATCH /api/v1/callbacks/:id — Update status (property owner or admin)
const updateCallbackSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]),
  note: z.string().max(500).optional(),
});

callbackRoutes.patch("/:id", requireAuth, async (req, res) => {
  try {
    const callback = await prisma.callbackRequest.findUnique({
      where: { id: String(req.params.id) },
      include: { property: { select: { ownerId: true } } },
    });

    if (!callback) {
      return res.status(404).json({ success: false, error: "Callback not found" });
    }

    const isOwner = callback.property.ownerId === req.user!.id;
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(req.user!.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const data = updateCallbackSchema.parse(req.body);

    const updated = await prisma.callbackRequest.update({
      where: { id: String(req.params.id) },
      data,
      include: {
        property: { select: { title: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error({ err: error }, "Error updating callback");
    res.status(500).json({ success: false, error: "Failed to update callback" });
  }
});
