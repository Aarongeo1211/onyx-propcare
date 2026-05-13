import { Router } from "express";
import { z } from "zod";
import { prisma } from "@onyx/db";
import { requireAuth } from "../middleware/auth";
import { logger } from "../lib/logger";

export const refundRoutes = Router();

const createRefundSchema = z.object({
  subscriptionId: z.string().optional(),
  reason: z.string().min(20).max(2000),
  details: z.string().max(4000).optional(),
  preferredContact: z.string().max(120).optional(),
});

refundRoutes.get("/", requireAuth, async (req, res) => {
  try {
    const requests = await prisma.refundRequest.findMany({
      where: { userId: req.user!.id },
      include: {
        subscription: {
          include: {
            plan: { select: { name: true, price: true, category: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    logger.error({ err: error }, "Error fetching refund requests");
    res.status(500).json({ success: false, error: "Failed to fetch refund requests" });
  }
});

refundRoutes.post("/", requireAuth, async (req, res) => {
  try {
    const data = createRefundSchema.parse(req.body);

    if (data.subscriptionId) {
      const subscription = await prisma.subscription.findFirst({
        where: { id: data.subscriptionId, userId: req.user!.id },
        select: { id: true },
      });

      if (!subscription) {
        return res.status(404).json({ success: false, error: "Subscription not found" });
      }
    }

    const created = await prisma.refundRequest.create({
      data: {
        userId: req.user!.id,
        subscriptionId: data.subscriptionId || null,
        reason: data.reason,
        details: data.details || null,
        preferredContact: data.preferredContact || null,
      },
      include: {
        subscription: {
          include: {
            plan: { select: { name: true, price: true, category: true } },
          },
        },
      },
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error({ err: error }, "Error creating refund request");
    res.status(500).json({ success: false, error: "Failed to submit refund request" });
  }
});
