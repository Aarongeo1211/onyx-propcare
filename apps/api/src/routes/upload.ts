import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@onyx/db";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { logger } from "../lib/logger";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

function uploadToCloudinary(buffer: Buffer, mimetype: string): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "onyx-propcare/properties",
        resource_type: "image",
        format: mimetype.split("/")[1] === "jpeg" ? "jpg" : mimetype.split("/")[1],
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error("Upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export const uploadRoutes = Router();

uploadRoutes.post("/images", requireAuth, upload.array("images", 10), async (req, res) => {
  try {
    if (!isCloudinaryConfigured) {
      return res.status(503).json({ success: false, error: "Image uploads are not configured" });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: "No images provided" });
    }

    const results = await Promise.all(
      files.map((file) => uploadToCloudinary(file.buffer, file.mimetype))
    );

    res.json({ success: true, data: results });
  } catch (error) {
    logger.error({ err: error }, "Image upload error");
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, error: "File too large. Maximum size is 5MB." });
      }
      if (error.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ success: false, error: "Too many files. Maximum is 10." });
      }
    }
    res.status(500).json({ success: false, error: "Failed to upload images" });
  }
});

const propertyImagesSchema = z.object({
  propertyId: z.string(),
  images: z.array(
    z.object({
      url: z.string().url(),
      publicId: z.string(),
      alt: z.string().optional(),
      isPrimary: z.boolean().optional(),
      order: z.number().optional(),
    })
  ),
});

uploadRoutes.post("/property-images", requireAuth, async (req, res) => {
  try {
    const { propertyId, images } = propertyImagesSchema.parse(req.body);

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!property) {
      return res.status(404).json({ success: false, error: "Property not found" });
    }

    if (property.ownerId !== req.user!.id) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const existingCount = await prisma.propertyImage.count({
      where: { propertyId },
    });

    const created = await prisma.propertyImage.createMany({
      data: images.map((img, i) => ({
        url: img.url,
        alt: img.alt || null,
        isPrimary: img.isPrimary ?? (existingCount === 0 && i === 0),
        order: img.order ?? existingCount + i,
        propertyId,
      })),
    });

    const allImages = await prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: { order: "asc" },
    });

    res.status(201).json({ success: true, data: allImages, count: created.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error({ err: error }, "Property images error");
    res.status(500).json({ success: false, error: "Failed to save property images" });
  }
});

uploadRoutes.delete("/images/:publicId(*)", requireAuth, async (req, res) => {
  try {
    if (!isCloudinaryConfigured) {
      return res.status(503).json({ success: false, error: "Image uploads are not configured" });
    }

    const publicId = req.params.publicId as string;
    const filename = publicId.split("/").pop() || "";

    const image = await prisma.propertyImage.findFirst({
      where: { url: { contains: filename } },
      include: { property: { select: { ownerId: true } } },
    });

    if (image) {
      if (image.property.ownerId !== req.user!.id) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }
      await prisma.propertyImage.delete({ where: { id: image.id } });
    }

    await cloudinary.uploader.destroy(publicId);

    res.json({ success: true, message: "Image deleted" });
  } catch (error) {
    logger.error({ err: error }, "Image delete error");
    res.status(500).json({ success: false, error: "Failed to delete image" });
  }
});
