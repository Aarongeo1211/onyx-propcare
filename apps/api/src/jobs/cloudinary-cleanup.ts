import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@onyx/db";
import { logger } from "../lib/logger";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function cleanupOrphanedImages() {
  const isConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

  if (!isConfigured) {
    logger.warn("Cloudinary not configured, skipping cleanup");
    return { deleted: 0, errors: 0 };
  }

  let deleted = 0;
  let errors = 0;
  let nextCursor: string | undefined;

  do {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "onyx-propcare/properties",
      max_results: 100,
      next_cursor: nextCursor,
    });

    for (const resource of result.resources) {
      const filename = resource.public_id.split("/").pop() || "";
      const imageInDb = await prisma.propertyImage.findFirst({
        where: { url: { contains: filename } },
        select: { id: true },
      });

      if (!imageInDb) {
        try {
          await cloudinary.uploader.destroy(resource.public_id);
          deleted++;
          logger.info({ publicId: resource.public_id }, "Deleted orphaned image");
        } catch (err) {
          errors++;
          logger.error({ err, publicId: resource.public_id }, "Failed to delete orphaned image");
        }
      }
    }

    nextCursor = result.next_cursor;
  } while (nextCursor);

  logger.info({ deleted, errors }, "Cloudinary cleanup complete");
  return { deleted, errors };
}

if (require.main === module) {
  cleanupOrphanedImages()
    .then((result) => {
      console.log("Cleanup result:", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Cleanup failed:", err);
      process.exit(1);
    });
}
