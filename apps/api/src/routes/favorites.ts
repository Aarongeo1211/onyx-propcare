import { Router } from "express";
import { prisma } from "@onyx/db";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { logger } from "../lib/logger";

export const favoriteRoutes = Router();

// GET /api/v1/favorites — Get user's favorites with property data
favoriteRoutes.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        property: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            soilData: { select: { soilType: true, fertility: true } },
            waterData: { select: { waterQuality: true } },
            legalCheck: { select: { titleStatus: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: favorites });
  } catch (error) {
    logger.error({ err: error }, "Error fetching favorites");
    res.status(500).json({ success: false, error: "Failed to fetch favorites" });
  }
});

// POST /api/v1/favorites — Add a favorite
const addFavoriteSchema = z.object({
  propertyId: z.string(),
});

favoriteRoutes.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { propertyId } = addFavoriteSchema.parse(req.body);

    // Check property exists
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      return res.status(404).json({ success: false, error: "Property not found" });
    }

    // Handle duplicate gracefully via upsert
    const favorite = await prisma.favorite.upsert({
      where: {
        userId_propertyId: { userId, propertyId },
      },
      update: {},
      create: { userId, propertyId },
      include: {
        property: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });

    res.status(201).json({ success: true, data: favorite });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error({ err: error }, "Error adding favorite");
    res.status(500).json({ success: false, error: "Failed to add favorite" });
  }
});

// DELETE /api/v1/favorites/:propertyId — Remove a favorite
favoriteRoutes.delete("/:propertyId", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const propertyId = String(req.params.propertyId);

    await prisma.favorite.deleteMany({
      where: { userId, propertyId },
    });

    res.json({ success: true, message: "Favorite removed" });
  } catch (error) {
    logger.error({ err: error }, "Error removing favorite");
    res.status(500).json({ success: false, error: "Failed to remove favorite" });
  }
});
