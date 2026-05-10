import { Router } from "express";
import { prisma } from "@onyx/db";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth";
import { logger } from "../lib/logger";

export const contactRoutes = Router();

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(5000),
});

contactRoutes.post("/", async (req, res) => {
  try {
    const data = contactSchema.parse(req.body);
    const submission = await prisma.contactSubmission.create({ data });
    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error({ err: error }, "Error creating contact submission");
    res.status(500).json({ success: false, error: "Failed to submit contact form" });
  }
});

contactRoutes.get("/", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (_req, res) => {
  try {
    const submissions = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: submissions });
  } catch (error) {
    logger.error({ err: error }, "Error fetching contact submissions");
    res.status(500).json({ success: false, error: "Failed to fetch submissions" });
  }
});
