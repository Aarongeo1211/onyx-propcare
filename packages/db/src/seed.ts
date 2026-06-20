import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default admin user
  const adminEmail = "admin@onyx.com";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("Admin user already exists, skipping...");
  } else {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash("Admin@123", salt);

    const admin = await prisma.user.create({
      data: {
        name: "Onyx Admin",
        email: adminEmail,
        passwordHash,
        role: "SUPER_ADMIN",
        emailVerified: new Date(),
        isActive: true,
      },
    });

    console.log(`Created admin user: ${admin.email} (role: ${admin.role})`);
  }

  // ── Seed Plans ─────────────────────────────────────────

  await prisma.plan.updateMany({
    where: { type: { in: ["STARTER", "PROFESSIONAL", "ENTERPRISE"] } },
    data: { isActive: false },
  });

  const planCatalog = [
    {
      code: "FREE_ALL",
      name: "Free",
      type: "FREE" as const,
      category: "ALL" as const,
      sortOrder: 10,
      price: 0,
      maxProperties: 50,
      maxImages: 5,
      maxVideos: 1,
      listingDuration: 365,
      features: ["50 listings for 1 year", "5 images per listing", "1 video per listing", "Soil data", "Water data", "Legal check with verified badge", "Drone map access"],
      hasSoilData: true,
      hasWaterData: true,
      hasLegalCheck: true,
      hasDroneMap: true,
      hasFeatured: true,
      featuredCount: 1,
      hasVideo: true,
      hasVerifiedBadge: true,
      hasTopRank: true,
      hasHomepagePlacement: true,
      hasTopSectionPlacement: true,
      visibilityLabel: "standard",
    },
    {
      code: "BASIC_FARMLAND",
      name: "Basic Farmland",
      type: "BASIC" as const,
      category: "FARMLAND" as const,
      sortOrder: 20,
      price: 299,
      maxProperties: 1,
      maxImages: 5,
      maxVideos: 0,
      listingDuration: 30,
      features: ["Standard visibility", "5 images", "1 farmland listing"],
      hasSoilData: false,
      hasWaterData: false,
      hasLegalCheck: false,
      hasDroneMap: false,
      hasFeatured: false,
      featuredCount: 0,
      hasVideo: false,
      hasVerifiedBadge: false,
      hasTopRank: false,
      hasHomepagePlacement: false,
      hasTopSectionPlacement: false,
      visibilityLabel: "standard",
    },
    {
      code: "BASIC_RESIDENTIAL_PLOT",
      name: "Basic Residential Plot",
      type: "BASIC" as const,
      category: "RESIDENTIAL_PLOT" as const,
      sortOrder: 30,
      price: 399,
      maxProperties: 1,
      maxImages: 5,
      maxVideos: 0,
      listingDuration: 30,
      features: ["Standard visibility", "5 images", "1 residential plot listing"],
      hasSoilData: false,
      hasWaterData: false,
      hasLegalCheck: false,
      hasDroneMap: false,
      hasFeatured: false,
      featuredCount: 0,
      hasVideo: false,
      hasVerifiedBadge: false,
      hasTopRank: false,
      hasHomepagePlacement: false,
      hasTopSectionPlacement: false,
      visibilityLabel: "standard",
    },
    {
      code: "FEATURED_FARMLAND",
      name: "Featured Farmland",
      type: "FEATURED" as const,
      category: "FARMLAND" as const,
      sortOrder: 40,
      price: 999,
      maxProperties: 1,
      maxImages: 15,
      maxVideos: 1,
      listingDuration: 30,
      features: ["Top section placement", "Highlighted listing", "15 images", "1 video"],
      hasSoilData: false,
      hasWaterData: false,
      hasLegalCheck: false,
      hasDroneMap: false,
      hasFeatured: true,
      featuredCount: 1,
      hasVideo: true,
      hasVerifiedBadge: false,
      hasTopRank: true,
      hasHomepagePlacement: false,
      hasTopSectionPlacement: true,
      visibilityLabel: "highlighted",
    },
    {
      code: "FEATURED_RESIDENTIAL_PLOT",
      name: "Featured Residential Plot",
      type: "FEATURED" as const,
      category: "RESIDENTIAL_PLOT" as const,
      sortOrder: 50,
      price: 1499,
      maxProperties: 1,
      maxImages: 15,
      maxVideos: 1,
      listingDuration: 30,
      features: ["Top section placement", "Highlighted listing", "15 images", "1 video"],
      hasSoilData: false,
      hasWaterData: false,
      hasLegalCheck: false,
      hasDroneMap: false,
      hasFeatured: true,
      featuredCount: 1,
      hasVideo: true,
      hasVerifiedBadge: false,
      hasTopRank: true,
      hasHomepagePlacement: false,
      hasTopSectionPlacement: true,
      visibilityLabel: "highlighted",
    },
    {
      code: "PREMIUM_FARMLAND",
      name: "Premium Farmland",
      type: "PREMIUM" as const,
      category: "FARMLAND" as const,
      sortOrder: 60,
      price: 2999,
      maxProperties: 1,
      maxImages: -1,
      maxVideos: 3,
      listingDuration: 30,
      features: ["Homepage placement", "Top rank", "Unlimited media", "Verified badge"],
      hasSoilData: true,
      hasWaterData: true,
      hasLegalCheck: true,
      hasDroneMap: true,
      hasFeatured: true,
      featuredCount: 1,
      hasVideo: true,
      hasVerifiedBadge: true,
      hasTopRank: true,
      hasHomepagePlacement: true,
      hasTopSectionPlacement: true,
      visibilityLabel: "premium",
    },
    {
      code: "PREMIUM_RESIDENTIAL_PLOT",
      name: "Premium Residential Plot",
      type: "PREMIUM" as const,
      category: "RESIDENTIAL_PLOT" as const,
      sortOrder: 70,
      price: 3999,
      maxProperties: 1,
      maxImages: -1,
      maxVideos: 3,
      listingDuration: 30,
      features: ["Homepage placement", "Top rank", "Unlimited media", "Verified badge"],
      hasSoilData: true,
      hasWaterData: true,
      hasLegalCheck: true,
      hasDroneMap: true,
      hasFeatured: true,
      featuredCount: 1,
      hasVideo: true,
      hasVerifiedBadge: true,
      hasTopRank: true,
      hasHomepagePlacement: true,
      hasTopSectionPlacement: true,
      visibilityLabel: "premium",
    },
  ];

  for (const planInput of planCatalog) {
    const plan = await prisma.plan.upsert({
      where: { code: planInput.code },
      update: planInput,
      create: planInput,
    });
    console.log(`Plan seeded: ${plan.name}`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
