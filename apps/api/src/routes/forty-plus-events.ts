import { Router } from "express";
import { prisma } from "@onyx/db";
import { cache } from "../lib/redis";
import { logger } from "../lib/logger";

export const fortyPlusEventRoutes = Router();

const EVENTS_CACHE_KEY = "40plus:events:published";
const EVENTS_CACHE_TTL = 120;

// GET /api/v1/40plus/events — published events for the public landing/events pages
fortyPlusEventRoutes.get("/", async (_req, res) => {
  try {
    const cached = await cache.get(EVENTS_CACHE_KEY);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const events = await prisma.fortyPlusEvent.findMany({
      where: { status: "PUBLISHED" },
      include: { media: { orderBy: { order: "asc" } } },
      orderBy: [{ order: "asc" }, { eventDate: "desc" }],
    });

    await cache.set(EVENTS_CACHE_KEY, events, EVENTS_CACHE_TTL);
    res.json({ success: true, data: events });
  } catch (error) {
    logger.error({ err: error }, "Error fetching 40+ events");
    res.status(500).json({ success: false, error: "Failed to fetch events" });
  }
});

// GET /api/v1/40plus/events/:slug — single published event
fortyPlusEventRoutes.get("/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug);
    const cacheKey = `40plus:events:slug:${slug}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const event = await prisma.fortyPlusEvent.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { media: { orderBy: { order: "asc" } } },
    });

    if (!event) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    await cache.set(cacheKey, event, EVENTS_CACHE_TTL);
    res.json({ success: true, data: event });
  } catch (error) {
    logger.error({ err: error }, "Error fetching 40+ event");
    res.status(500).json({ success: false, error: "Failed to fetch event" });
  }
});

export function fortyPlusEventCacheKeys(slug: string) {
  return [EVENTS_CACHE_KEY, `40plus:events:slug:${slug}`];
}
