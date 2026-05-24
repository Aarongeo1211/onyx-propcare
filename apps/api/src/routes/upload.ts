import { Router } from "express";
import multer from "multer";
import { prisma } from "@onyx/db";
import { z } from "zod";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { logger } from "../lib/logger";
import { buildAssetUrl, createPresignedUploadUrl, deleteFile, storageMode, streamBucketFile, uploadFile } from "../lib/storage";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];
const IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024;
const VIDEO_MAX_FILE_SIZE = 100 * 1024 * 1024;
const DOCUMENT_MAX_FILE_SIZE = 10 * 1024 * 1024;

function createUploader(allowedTypes: string[], maxFileSize: number, maxFiles: number) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSize, files: maxFiles },
    fileFilter: (_req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}`));
      }
    },
  });
}

const imageUpload = createUploader(IMAGE_TYPES, IMAGE_MAX_FILE_SIZE, 10);
const videoUpload = createUploader(VIDEO_TYPES, VIDEO_MAX_FILE_SIZE, 3);
const documentUpload = createUploader(DOCUMENT_TYPES, DOCUMENT_MAX_FILE_SIZE, 10);

export const uploadRoutes = Router();

uploadRoutes.post("/images", requireAuth, imageUpload.array("images", 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: "No images provided" });
    }

    const results = await Promise.all(
      files.map((file) =>
        uploadFile(req, file, {
          folder: "onyx-propcare/properties",
          resourceType: "image",
          format: file.mimetype.split("/")[1] === "jpeg" ? "jpg" : file.mimetype.split("/")[1],
        })
      )
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

uploadRoutes.post("/videos", requireAuth, videoUpload.array("videos", 3), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: "No videos provided" });
    }

    const results = await Promise.all(
      files.map((file) =>
        uploadFile(req, file, {
          folder: "onyx-propcare/videos",
          resourceType: "video",
        })
      )
    );

    res.json({ success: true, data: results });
  } catch (error) {
    logger.error({ err: error }, "Video upload error");
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, error: "Video too large. Maximum size is 100MB." });
    }
    res.status(500).json({ success: false, error: "Failed to upload videos" });
  }
});

uploadRoutes.post("/documents", requireAuth, documentUpload.array("documents", 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: "No documents provided" });
    }

    const results = await Promise.all(
      files.map((file) =>
        uploadFile(req, file, {
          folder: "onyx-propcare/documents",
          resourceType: "raw",
        })
      )
    );

    res.json({ success: true, data: results });
  } catch (error) {
    logger.error({ err: error }, "Document upload error");
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, error: "Document too large. Maximum size is 10MB." });
    }
    res.status(500).json({ success: false, error: "Failed to upload documents" });
  }
});

// ─── Presigned upload URL endpoints (browser → bucket direct upload) ──────────

const presignVideoSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(["video/mp4", "video/webm", "video/quicktime"]),
  size: z.number().int().positive().max(VIDEO_MAX_FILE_SIZE, { message: "Video too large. Maximum size is 100MB." }),
});

const presignDocumentSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ]),
  size: z.number().int().positive().max(DOCUMENT_MAX_FILE_SIZE, { message: "Document too large. Maximum size is 10MB." }),
});

uploadRoutes.post("/presign/video", requireAuth, async (req, res) => {
  try {
    if (storageMode !== "railway-bucket") {
      return res.status(400).json({ success: false, error: "Presigned uploads require bucket storage" });
    }
    const { filename, contentType, size } = presignVideoSchema.parse(req.body);
    const result = await createPresignedUploadUrl("onyx-propcare/videos", filename, contentType);
    if (!result) {
      return res.status(500).json({ success: false, error: "Failed to generate upload URL" });
    }
    const apiBase = `${req.protocol}://${req.get("host")}`;
    res.json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        objectKey: result.objectKey,
        fileUrl: buildAssetUrl(apiBase, result.objectKey),
        originalName: filename,
        size,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    logger.error({ err: error }, "Video presign error");
    res.status(500).json({ success: false, error: "Failed to generate upload URL" });
  }
});

uploadRoutes.post("/presign/document", requireAuth, async (req, res) => {
  try {
    if (storageMode !== "railway-bucket") {
      return res.status(400).json({ success: false, error: "Presigned uploads require bucket storage" });
    }
    const { filename, contentType, size } = presignDocumentSchema.parse(req.body);
    const result = await createPresignedUploadUrl("onyx-propcare/documents", filename, contentType);
    if (!result) {
      return res.status(500).json({ success: false, error: "Failed to generate upload URL" });
    }
    const apiBase = `${req.protocol}://${req.get("host")}`;
    res.json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        objectKey: result.objectKey,
        fileUrl: buildAssetUrl(apiBase, result.objectKey),
        originalName: filename,
        size,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    logger.error({ err: error }, "Document presign error");
    res.status(500).json({ success: false, error: "Failed to generate upload URL" });
  }
});

// ─── Property images (metadata only — files already uploaded) ─────────────────

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

// Documents require authentication; images and videos are public
const PRIVATE_KEY_PREFIXES = ["onyx-propcare/documents"];

uploadRoutes.get("/files/:objectKey(*)", optionalAuth, async (req, res) => {
  try {
    const raw = (req.params.objectKey || req.params[0] || "") as string;
    const objectKey = raw ? decodeURIComponent(raw) : "";
    if (!objectKey) {
      return res.status(400).json({ success: false, error: "Missing file key" });
    }

    const isPrivate = PRIVATE_KEY_PREFIXES.some((prefix) => objectKey.startsWith(prefix));
    if (isPrivate && !req.user) {
      return res.status(401).json({ success: false, error: "Authentication required to access this file" });
    }

    if (storageMode !== "railway-bucket") {
      return res.status(404).json({ success: false, error: "Bucket storage is not enabled" });
    }

    // Stream bytes directly — this properly supports browser range requests for
    // video playback (seek, scrub) without relying on redirect + S3 signed URL chains.
    await streamBucketFile(req, res, objectKey);
  } catch (error) {
    logger.error({ err: error }, "File access error");
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: "Failed to access file" });
    }
  }
});

uploadRoutes.delete("/images/:publicId(*)", requireAuth, async (req, res) => {
  try {
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

    await deleteFile(publicId);

    res.json({ success: true, message: "Image deleted" });
  } catch (error) {
    logger.error({ err: error }, "Image delete error");
    res.status(500).json({ success: false, error: "Failed to delete image" });
  }
});
