import { Router } from "express";
import multer from "multer";
import fs from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { prisma } from "@onyx/db";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { logger } from "../lib/logger";
import { env } from "../config/env";

function hasRealCredential(value?: string | null) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;

  return ![
    "your_cloud_name",
    "your_api_key",
    "your_api_secret",
    "your_email@gmail.com",
    "your_app_password",
    "changeme",
    "replace_me",
  ].includes(normalized);
}

function getWorkspaceRoot() {
  const cwd = process.cwd();
  return cwd.endsWith(path.join("apps", "api")) ? path.resolve(cwd, "..", "..") : cwd;
}

function getUploadRoot() {
  if (!env.UPLOAD_DIR) {
    return path.join(getWorkspaceRoot(), "uploads");
  }

  return path.isAbsolute(env.UPLOAD_DIR)
    ? env.UPLOAD_DIR
    : path.join(getWorkspaceRoot(), env.UPLOAD_DIR);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isCloudinaryConfigured = Boolean(
  hasRealCredential(process.env.CLOUDINARY_CLOUD_NAME) &&
    hasRealCredential(process.env.CLOUDINARY_API_KEY) &&
    hasRealCredential(process.env.CLOUDINARY_API_SECRET)
);

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
const LOCAL_UPLOAD_ROOT = getUploadRoot();

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

type UploadedFilePayload = {
  url: string;
  publicId: string;
  originalName?: string;
  size?: number;
};

function uploadToCloudinary(
  buffer: Buffer,
  mimetype: string,
  options: { folder: string; resourceType: "image" | "video" | "raw"; format?: string }
): Promise<UploadedFilePayload> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: options.resourceType,
        format: options.format,
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error("Upload failed"));
        const uploadResult = result as UploadApiResponse;
        resolve({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          size: uploadResult.bytes,
        });
      }
    );
    stream.end(buffer);
  });
}

async function saveToLocalUploads(
  req: import("express").Request,
  file: Express.Multer.File,
  folder: string
) {
  const targetDir = path.join(LOCAL_UPLOAD_ROOT, folder);
  await fs.mkdir(targetDir, { recursive: true });

  const extension = file.mimetype === "image/jpeg"
    ? "jpg"
    : file.originalname.includes(".")
      ? file.originalname.split(".").pop()
      : file.mimetype.split("/")[1];
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const absolutePath = path.join(targetDir, safeName);

  await fs.writeFile(absolutePath, file.buffer);

  return {
    url: `${req.protocol}://${req.get("host")}/uploads/${folder}/${safeName}`,
    publicId: `local/${folder}/${safeName}`,
    originalName: file.originalname,
    size: file.size,
  };
}

async function uploadFile(
  req: import("express").Request,
  file: Express.Multer.File,
  options: { folder: string; resourceType: "image" | "video" | "raw"; format?: string }
) {
  if (isCloudinaryConfigured) {
    const uploaded = await uploadToCloudinary(file.buffer, file.mimetype, options);
    return {
      ...uploaded,
      originalName: file.originalname,
    };
  }

  return saveToLocalUploads(req, file, options.folder.replace("onyx-propcare/", ""));
}

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
    const publicId = req.params.publicId as string;
    const filename = publicId.split("/").pop() || "";
    const isLocalUpload = publicId.startsWith("local/");

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

    if (isLocalUpload) {
      const relativeFolder = publicId.replace(/^local\//, "").split("/").slice(0, -1).join(path.sep);
      const absolutePath = path.join(LOCAL_UPLOAD_ROOT, relativeFolder, filename);
      await fs.rm(absolutePath, { force: true });
    } else if (isCloudinaryConfigured) {
      await cloudinary.uploader.destroy(publicId);
    }

    res.json({ success: true, message: "Image deleted" });
  } catch (error) {
    logger.error({ err: error }, "Image delete error");
    res.status(500).json({ success: false, error: "Failed to delete image" });
  }
});
