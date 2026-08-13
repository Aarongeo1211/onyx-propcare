import { prisma } from "@onyx/db";
import { logger } from "../lib/logger";
import { sendSavedSearchAlert } from "../services/email";
import { env } from "../config/env";

// Standalone, run-on-a-schedule job (same pattern as cloudinary-cleanup.ts) —
// for each active saved search, finds properties that went ACTIVE since the
// search's last check and emails a digest if there are any. Deliberately a
// periodic digest rather than instant-on-create: avoids spamming a user with
// one email per listing, and decouples alerting from the property-creation
// request path entirely.
export async function runSavedSearchAlerts() {
  const searches = await prisma.savedSearch.findMany({
    where: { active: true },
    include: { user: { select: { id: true, email: true, name: true, isActive: true } } },
  });

  let emailsSent = 0;
  let errors = 0;

  for (const search of searches) {
    const checkedAt = new Date();
    try {
      if (!search.user.isActive) continue;

      const where: Record<string, unknown> = {
        status: "ACTIVE",
        createdAt: { gt: search.lastNotifiedAt },
      };
      if (search.type) where.type = search.type;
      if (search.listingType) where.listingType = search.listingType;
      if (search.state) where.state = { equals: search.state, mode: "insensitive" };
      if (search.district) where.district = { equals: search.district, mode: "insensitive" };
      if (search.minPrice || search.maxPrice) {
        where.price = {
          ...(search.minPrice ? { gte: search.minPrice } : {}),
          ...(search.maxPrice ? { lte: search.maxPrice } : {}),
        };
      }
      if (search.search) {
        where.OR = [
          { title: { contains: search.search, mode: "insensitive" } },
          { district: { contains: search.search, mode: "insensitive" } },
          { state: { contains: search.search, mode: "insensitive" } },
          { village: { contains: search.search, mode: "insensitive" } },
          { taluka: { contains: search.search, mode: "insensitive" } },
        ];
      }

      const matches = await prisma.property.findMany({
        where,
        select: {
          title: true,
          price: true,
          district: true,
          state: true,
          slug: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      if (matches.length > 0) {
        const label = search.name || [search.type, search.district || search.state].filter(Boolean).join(" in ") || "your search";
        await sendSavedSearchAlert(
          search.user.email,
          label,
          matches.map((m) => ({
            title: m.title,
            price: m.price,
            district: m.district,
            state: m.state,
            url: `${env.APP_URL}/properties/${m.slug}`,
            imageUrl: m.images[0]?.url,
          })),
          `${env.APP_URL}/dashboard/saved-searches`
        );
        emailsSent++;
      }

      await prisma.savedSearch.update({ where: { id: search.id }, data: { lastNotifiedAt: checkedAt } });
    } catch (err) {
      errors++;
      logger.error({ err, savedSearchId: search.id }, "Failed to process saved search alert");
    }
  }

  logger.info({ searchesChecked: searches.length, emailsSent, errors }, "Saved search alerts run complete");
  return { searchesChecked: searches.length, emailsSent, errors };
}

if (require.main === module) {
  runSavedSearchAlerts()
    .then((result) => {
      console.log("Saved search alerts result:", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Saved search alerts failed:", err);
      process.exit(1);
    });
}
