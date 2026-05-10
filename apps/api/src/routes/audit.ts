import { Router } from "express";
import { prisma } from "@onyx/db";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { getQueryNumber, getSingleQueryParam } from "../utils/request";
import { logger } from "../lib/logger";

export const auditRoutes = Router();

// GET /api/v1/admin/audit-logs
auditRoutes.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const page = getQueryNumber(req.query.page, 1);
    const limit = getQueryNumber(req.query.limit, 50);
    const entity = getSingleQueryParam(req.query.entity);
    const action = getSingleQueryParam(req.query.action);
    const actorId = getSingleQueryParam(req.query.actorId);

    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));

    const where: Record<string, unknown> = {};
    if (entity) where.entity = entity;
    if (action) where.action = { contains: action, mode: "insensitive" };
    if (actorId) where.actorId = actorId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching audit logs");
    res.status(500).json({ success: false, error: "Failed to fetch audit logs" });
  }
});
