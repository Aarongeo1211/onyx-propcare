import { Request, Response, NextFunction } from "express";
import { prisma } from "@onyx/db";
import { logger } from "../lib/logger";

declare global {
  namespace Express {
    interface Request {
      subscription?: {
        id: string;
        planType: string;
        maxProperties: number;
        maxImages: number;
        propertiesUsed: number;
        endDate: Date;
      };
    }
  }
}

export function requireActivePlan(req: Request, res: Response, next: NextFunction) {
  (async () => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.id,
        status: "ACTIVE",
        endDate: { gt: new Date() },
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        error: "Active subscription required. Please subscribe to a plan.",
        code: "NO_ACTIVE_PLAN",
      });
    }

    // Check property limit (maxProperties -1 means unlimited)
    if (
      subscription.plan.maxProperties !== -1 &&
      subscription.propertiesUsed >= subscription.plan.maxProperties
    ) {
      return res.status(403).json({
        success: false,
        error: `Property limit reached (${subscription.propertiesUsed}/${subscription.plan.maxProperties}). Upgrade your plan to list more properties.`,
        code: "PROPERTY_LIMIT_REACHED",
      });
    }

    req.subscription = {
      id: subscription.id,
      planType: subscription.plan.type,
      maxProperties: subscription.plan.maxProperties,
      maxImages: subscription.plan.maxImages,
      propertiesUsed: subscription.propertiesUsed,
      endDate: subscription.endDate!,
    };

    next();
  })().catch((err) => {
    logger.error({ err }, "Plan check error");
    res.status(500).json({ success: false, error: "Failed to verify subscription" });
  });
}

export const requireAnyActivePlan = requireActivePlan;
