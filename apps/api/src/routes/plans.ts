import { Router } from "express";
import { PlanCategory, PlanType, prisma } from "@onyx/db";
import { getSingleQueryParam } from "../utils/request";
import { logger } from "../lib/logger";
import { getRazorpayPublicConfig } from "../services/razorpay";
import { cache } from "../lib/redis";

export const planRoutes = Router();

const PLAN_CATEGORIES: PlanCategory[] = ["ALL", "FARMLAND", "RESIDENTIAL_PLOT"];
const PLAN_TYPES: PlanType[] = ["STARTER", "PROFESSIONAL", "ENTERPRISE", "FREE", "BASIC", "FEATURED", "PREMIUM"];

// GET /api/v1/plans — List all active plans (public)
planRoutes.get("/", async (req, res) => {
  try {
    const categoryParam = getSingleQueryParam(req.query.category);
    const typeParam = getSingleQueryParam(req.query.type);
    const category = categoryParam && PLAN_CATEGORIES.includes(categoryParam as PlanCategory)
      ? (categoryParam as PlanCategory)
      : undefined;
    const type = typeParam && PLAN_TYPES.includes(typeParam as PlanType)
      ? (typeParam as PlanType)
      : undefined;

    const cacheKey = `plans:list:${category ?? "all"}:${type ?? "all"}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      const paymentConfig = getRazorpayPublicConfig();
      return res.json({ success: true, data: cached, meta: { paymentsEnabled: paymentConfig.enabled } });
    }

    const plans = await prisma.plan.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
        ...(type ? { type } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    });

    await cache.set(cacheKey, plans, 300);

    const paymentConfig = getRazorpayPublicConfig();

    res.json({
      success: true,
      data: plans,
      meta: {
        paymentsEnabled: paymentConfig.enabled,
      },
    });
  } catch (err) {
    logger.error({ err }, "Error fetching plans");
    res.status(500).json({ success: false, error: "Failed to fetch plans" });
  }
});

// GET /api/v1/plans/:id — Get single plan details (public)
planRoutes.get("/:id", async (req, res) => {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: req.params.id },
    });

    if (!plan) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    res.json({ success: true, data: plan });
  } catch (err) {
    logger.error({ err }, "Error fetching plan");
    res.status(500).json({ success: false, error: "Failed to fetch plan" });
  }
});
