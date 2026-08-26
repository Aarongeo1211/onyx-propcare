import { Router } from "express";
import { prisma } from "@onyx/db";
import { logger } from "../lib/logger";
import { getQueryNumber } from "../utils/request";
import { cache } from "../lib/redis";

export const blogRoutes = Router();

// GET /api/v1/blog — published posts only, newest first
blogRoutes.get("/", async (req, res) => {
  try {
    const page = Math.max(1, getQueryNumber(req.query.page, 1));
    const limit = Math.min(50, Math.max(1, getQueryNumber(req.query.limit, 12)));

    const cacheKey = `blog:list:${page}:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: { isPublished: true },
        select: {
          id: true, title: true, slug: true, excerpt: true, coverImage: true,
          tags: true, authorName: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where: { isPublished: true } }),
    ]);

    const payload = {
      success: true,
      data: posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
    await cache.set(cacheKey, payload, 300);
    res.json(payload);
  } catch (err) {
    logger.error({ err }, "Error fetching blog posts");
    res.status(500).json({ success: false, error: "Failed to fetch blog posts" });
  }
});

// GET /api/v1/blog/:slug — single published post
blogRoutes.get("/:slug", async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({ where: { slug: String(req.params.slug) } });
    if (!post || !post.isPublished) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }
    res.json({ success: true, data: post });
  } catch (err) {
    logger.error({ err }, "Error fetching blog post");
    res.status(500).json({ success: false, error: "Failed to fetch blog post" });
  }
});
