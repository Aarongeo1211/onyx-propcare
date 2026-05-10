import { prisma } from "@onyx/db";
import { logger } from "../lib/logger";
import type { Request } from "express";

interface AuditEntry {
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export async function logAudit(req: Request, entry: AuditEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        details: entry.details ? JSON.parse(JSON.stringify(entry.details)) : undefined,
        ipAddress: req.ip || req.socket.remoteAddress || null,
      },
    });
  } catch (err) {
    logger.error({ err, ...entry }, "Failed to write audit log");
  }
}
