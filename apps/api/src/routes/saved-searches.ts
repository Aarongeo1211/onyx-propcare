import { Router } from "express";
import { prisma } from "@onyx/db";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { logger } from "../lib/logger";

export const savedSearchRoutes = Router();

// GET /api/v1/saved-searches — list the current user's saved searches
savedSearchRoutes.get("/", requireAuth, async (req, res) => {
  try {
    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: savedSearches });
  } catch (error) {
    logger.error({ err: error }, "Error fetching saved searches");
    res.status(500).json({ success: false, error: "Failed to fetch saved searches" });
  }
});

// POST /api/v1/saved-searches — create a saved search from the current filter state
const createSavedSearchSchema = z.object({
  name: z.string().max(120).optional(),
  type: z.enum(["FARMLAND", "RESIDENTIAL_PLOT", "AGRICULTURAL_LAND", "ORCHARD", "PLANTATION"]).optional(),
  listingType: z.enum(["SALE", "LEASE", "RENT"]).optional(),
  state: z.string().max(80).optional(),
  district: z.string().max(80).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  search: z.string().max(200).optional(),
});

const MAX_SAVED_SEARCHES_PER_USER = 20;

savedSearchRoutes.post("/", requireAuth, async (req, res) => {
  try {
    const data = createSavedSearchSchema.parse(req.body);
    const userId = req.user!.id;

    const existingCount = await prisma.savedSearch.count({ where: { userId } });
    if (existingCount >= MAX_SAVED_SEARCHES_PER_USER) {
      return res.status(400).json({
        success: false,
        error: `You can save up to ${MAX_SAVED_SEARCHES_PER_USER} searches. Remove one to add another.`,
      });
    }

    const savedSearch = await prisma.savedSearch.create({
      data: { ...data, userId },
    });

    res.status(201).json({ success: true, data: savedSearch });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error({ err: error }, "Error creating saved search");
    res.status(500).json({ success: false, error: "Failed to create saved search" });
  }
});

// PATCH /api/v1/saved-searches/:id — toggle active/inactive (pause alerts without deleting)
const updateSavedSearchSchema = z.object({
  active: z.boolean().optional(),
  name: z.string().max(120).optional(),
});

savedSearchRoutes.patch("/:id", requireAuth, async (req, res) => {
  try {
    const data = updateSavedSearchSchema.parse(req.body);
    const id = String(req.params.id);
    const existing = await prisma.savedSearch.findUnique({ where: { id } });

    if (!existing || existing.userId !== req.user!.id) {
      return res.status(404).json({ success: false, error: "Saved search not found" });
    }

    const updated = await prisma.savedSearch.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error({ err: error }, "Error updating saved search");
    res.status(500).json({ success: false, error: "Failed to update saved search" });
  }
});

// DELETE /api/v1/saved-searches/:id
savedSearchRoutes.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.savedSearch.findUnique({ where: { id } });

    if (!existing || existing.userId !== req.user!.id) {
      return res.status(404).json({ success: false, error: "Saved search not found" });
    }

    await prisma.savedSearch.delete({ where: { id } });
    res.json({ success: true, message: "Saved search removed" });
  } catch (error) {
    logger.error({ err: error }, "Error deleting saved search");
    res.status(500).json({ success: false, error: "Failed to delete saved search" });
  }
});
