import type { Request, Response } from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Agent as HttpsAgent } from "node:https";
import { DeleteObjectCommand, GetObjectCommand, PutBucketCorsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "../config/env";
import { logger } from "./logger";

export type StorageMode = "railway-bucket" | "cloudinary" | "local";

export type UploadedFilePayload = {
  url: string;
  publicId: string;
  originalName?: string;
  size?: number;
};

type UploadOptions = {
  folder: string;
  resourceType: "image" | "video" | "raw";
  format?: string;
};

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

export function getUploadRoot() {
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

const isBucketConfigured = Boolean(
  hasRealCredential(process.env.AWS_ENDPOINT_URL) &&
    hasRealCredential(process.env.AWS_ACCESS_KEY_ID) &&
    hasRealCredential(process.env.AWS_SECRET_ACCESS_KEY) &&
    hasRealCredential(process.env.AWS_S3_BUCKET_NAME)
);

export const storageMode: StorageMode = isBucketConfigured
  ? "railway-bucket"
  : isCloudinaryConfigured
    ? "cloudinary"
    : "local";

// The default NodeHttpHandler caps concurrent connections to the bucket at 50 sockets.
// Every property image/video is served by proxying through streamBucketFile (below), and
// Next.js's image optimizer alone fires several concurrent requests per page (one per
// breakpoint/size), so the default pool saturates under normal traffic and requests queue
// up for minutes before timing out (504). Raise the ceiling and bound how long a single
// request can hold a socket so a slow/stalled bucket read can't starve the rest.
const bucketClient = isBucketConfigured
  ? new S3Client({
      region: process.env.AWS_DEFAULT_REGION || "auto",
      endpoint: process.env.AWS_ENDPOINT_URL,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: process.env.AWS_URL_STYLE === "path",
      requestHandler: new NodeHttpHandler({
        httpsAgent: new HttpsAgent({ keepAlive: true, maxSockets: 500 }),
        connectionTimeout: 5_000,
        requestTimeout: 30_000,
      }),
    })
  : null;

function guessExtension(file: Express.Multer.File, explicitFormat?: string) {
  if (explicitFormat) {
    return explicitFormat;
  }

  if (file.originalname.includes(".")) {
    return file.originalname.split(".").pop()!.toLowerCase();
  }

  if (file.mimetype === "image/jpeg") {
    return "jpg";
  }

  return file.mimetype.split("/")[1] || "bin";
}

function toLocalFolder(folder: string) {
  return folder.replace(/^onyx-propcare\//, "");
}

export function buildAssetUrl(apiBase: string, objectKey: string) {
  return `${apiBase}/api/v1/upload/files/${encodeURIComponent(objectKey)}`;
}

async function uploadToCloudinary(
  file: Express.Multer.File,
  options: UploadOptions
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
          originalName: file.originalname,
          size: uploadResult.bytes,
        });
      }
    );
    stream.end(file.buffer);
  });
}

async function uploadToBucket(
  req: Request,
  file: Express.Multer.File,
  options: UploadOptions
): Promise<UploadedFilePayload> {
  if (!bucketClient || !process.env.AWS_S3_BUCKET_NAME) {
    throw new Error("Bucket storage is not configured");
  }

  const extension = guessExtension(file, options.format);
  const objectKey = `${options.folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  await bucketClient.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: objectKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: "public, max-age=31536000, immutable",
      ContentDisposition: `inline; filename="${path.basename(file.originalname).replace(/"/g, "")}"`,
    })
  );

  const apiBase = `${req.protocol}://${req.get("host")}`;
  return {
    url: buildAssetUrl(apiBase, objectKey),
    publicId: objectKey,
    originalName: file.originalname,
    size: file.size,
  };
}

async function saveToLocalUploads(req: Request, file: Express.Multer.File, folder: string) {
  const targetDir = path.join(getUploadRoot(), toLocalFolder(folder));
  await fs.mkdir(targetDir, { recursive: true });

  const extension = guessExtension(file);
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const absolutePath = path.join(targetDir, safeName);

  await fs.writeFile(absolutePath, file.buffer);

  const apiBase = `${req.protocol}://${req.get("host")}`;
  return {
    url: `${apiBase}/uploads/${toLocalFolder(folder)}/${safeName}`,
    publicId: `local/${toLocalFolder(folder)}/${safeName}`,
    originalName: file.originalname,
    size: file.size,
  };
}

export async function uploadFile(req: Request, file: Express.Multer.File, options: UploadOptions) {
  if (storageMode === "railway-bucket") {
    return uploadToBucket(req, file, options);
  }

  if (storageMode === "cloudinary") {
    return uploadToCloudinary(file, options);
  }

  return saveToLocalUploads(req, file, options.folder);
}

export async function deleteFile(publicId: string) {
  if (storageMode === "railway-bucket") {
    if (!bucketClient || !process.env.AWS_S3_BUCKET_NAME) {
      throw new Error("Bucket storage is not configured");
    }

    await bucketClient.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: publicId,
      })
    );
    return;
  }

  if (publicId.startsWith("local/")) {
    const relativeFolder = publicId.replace(/^local\//, "").split("/").slice(0, -1).join(path.sep);
    const filename = publicId.split("/").pop() || "";
    const absolutePath = path.join(getUploadRoot(), relativeFolder, filename);
    await fs.rm(absolutePath, { force: true });
    return;
  }

  if (storageMode === "cloudinary") {
    await cloudinary.uploader.destroy(publicId);
  }
}

export async function getFileAccessUrl(objectKey: string, download = false) {
  if (storageMode !== "railway-bucket" || !bucketClient || !process.env.AWS_S3_BUCKET_NAME) {
    return null;
  }

  return getSignedUrl(
    bucketClient,
    new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: objectKey,
      ResponseContentDisposition: download ? "attachment" : "inline",
    }),
    { expiresIn: 60 * 10 }
  );
}

/**
 * Generate a presigned PUT URL so the browser can upload a file directly to the
 * bucket without routing the bytes through the API server.
 *
 * Returns null when not in bucket mode (caller should fall back to server upload).
 */
export async function createPresignedUploadUrl(
  folder: string,
  filename: string,
  contentType: string,
  expiresIn = 300 // 5 minutes
): Promise<{ uploadUrl: string; objectKey: string } | null> {
  if (storageMode !== "railway-bucket" || !bucketClient || !process.env.AWS_S3_BUCKET_NAME) {
    return null;
  }

  const ext = filename.includes(".")
    ? filename.split(".").pop()!.toLowerCase()
    : contentType.split("/")[1] || "bin";
  const objectKey = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const uploadUrl = await getSignedUrl(
    bucketClient,
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
    { expiresIn }
  );

  return { uploadUrl, objectKey };
}

/**
 * Set CORS rules on the bucket so browsers can PUT directly via presigned URLs.
 * Called once at API startup — safe to call multiple times (idempotent PUT).
 */
export async function configureBucketCors(allowedOrigins: string[]) {
  if (storageMode !== "railway-bucket" || !bucketClient || !process.env.AWS_S3_BUCKET_NAME) {
    return;
  }

  try {
    await bucketClient.send(
      new PutBucketCorsCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: allowedOrigins,
              AllowedMethods: ["GET", "PUT", "HEAD"],
              AllowedHeaders: ["Content-Type", "Content-Disposition", "Cache-Control"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    );
    logger.info({ origins: allowedOrigins }, "Bucket CORS configured for direct uploads");
  } catch (err) {
    // Non-fatal — server-side upload still works as fallback
    logger.warn({ err }, "Could not configure bucket CORS (presigned uploads may not work from browser)");
  }
}

/**
 * Stream a bucket object directly to the HTTP response with full range-request support.
 * Used for video and document playback so the browser never needs to follow a redirect —
 * range requests work correctly and videos play in every browser.
 */
export async function streamBucketFile(
  req: Request,
  res: Response,
  objectKey: string
): Promise<void> {
  if (!bucketClient || !process.env.AWS_S3_BUCKET_NAME) {
    throw new Error("Bucket storage is not configured");
  }

  const rangeHeader = req.headers.range as string | undefined;
  const download = req.query.download === "1";

  const s3Response = await bucketClient.send(
    new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: objectKey,
      ...(rangeHeader ? { Range: rangeHeader } : {}),
    })
  );

  const isDocument = objectKey.startsWith("onyx-propcare/documents");
  const status = rangeHeader ? 206 : 200;
  const headers: Record<string, string> = {
    "Content-Type": s3Response.ContentType || "application/octet-stream",
    "Accept-Ranges": "bytes",
    // Allow browsers to cache public media aggressively; documents get a shorter TTL
    "Cache-Control": isDocument ? "private, max-age=600" : "public, max-age=31536000, immutable",
    // Helmet sets CORP: same-origin globally, which blocks cross-origin <img>/<video> loads
    // (e.g. admin.onyxpropcare.com loading images from the API origin).
    // Override to cross-origin for public media so any page can embed it;
    // keep same-origin for private documents.
    "Cross-Origin-Resource-Policy": isDocument ? "same-origin" : "cross-origin",
  };

  if (s3Response.ContentLength != null) {
    headers["Content-Length"] = String(s3Response.ContentLength);
  }
  if (s3Response.ContentRange) {
    headers["Content-Range"] = s3Response.ContentRange;
  }
  headers["Content-Disposition"] = download
    ? `attachment; filename="${path.basename(objectKey)}"`
    : "inline";

  res.writeHead(status, headers);

  // AWS SDK v3 returns a Node.js Readable stream in server environments
  const body = s3Response.Body as unknown as NodeJS.ReadableStream & { destroy: (error?: Error) => void };

  // If the client disconnects (nav away, cancelled image-optimizer request, aborted
  // range fetch) before the bucket read finishes, destroy the upstream stream so its
  // socket is released back to the S3 client's connection pool immediately — otherwise
  // it dangles until the bucket times it out, and concurrent requests queue up behind it.
  res.on("close", () => {
    body.destroy();
  });
  body.on("error", (err: Error) => {
    logger.warn({ err }, "Bucket stream error");
    res.destroy();
  });

  body.pipe(res);
}

export function getStorageSettingsSummary() {
  if (storageMode === "railway-bucket") {
    return {
      mode: storageMode,
      bucketName: process.env.AWS_S3_BUCKET_NAME || null,
      assetProxyPath: "/api/v1/upload/files/:key",
    };
  }

  if (storageMode === "cloudinary") {
    return {
      mode: storageMode,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
    };
  }

  return {
    mode: storageMode,
    localPath: "/uploads",
  };
}
