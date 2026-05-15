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

  // ── Create sample users ──────────────────────────────��──

  const sellerEmail = "rajesh.patel@example.com";
  const buyerEmail = "priya.sharma@example.com";

  let seller = await prisma.user.findUnique({ where: { email: sellerEmail } });
  if (!seller) {
    const salt = await bcrypt.genSalt(12);
    seller = await prisma.user.create({
      data: {
        name: "Rajesh Patel",
        email: sellerEmail,
        phone: "+919876543210",
        passwordHash: await bcrypt.hash("Seller@123", salt),
        role: "SELLER",
        emailVerified: new Date(),
        isActive: true,
      },
    });
    console.log(`Created seller: ${seller.email}`);
  }

  let buyer = await prisma.user.findUnique({ where: { email: buyerEmail } });
  if (!buyer) {
    const salt = await bcrypt.genSalt(12);
    buyer = await prisma.user.create({
      data: {
        name: "Priya Sharma",
        email: buyerEmail,
        phone: "+919812345678",
        passwordHash: await bcrypt.hash("Buyer@123", salt),
        role: "BUYER",
        emailVerified: new Date(),
        isActive: true,
      },
    });
    console.log(`Created buyer: ${buyer.email}`);
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
      maxProperties: 10,
      maxImages: 3,
      maxVideos: 0,
      listingDuration: 30,
      features: ["Basic listing", "Low visibility", "10 listings for 30 days"],
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
      visibilityLabel: "low",
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

  // ── Sample Properties ──────────────────────────────────

  const propertyData = [
    {
      title: "Premium Black Soil Farmland near Nashik",
      slug: "premium-black-soil-farmland-nashik",
      description:
        "A fertile 12-acre farmland with rich black soil, ideal for grape and pomegranate cultivation. The property has two operational borewells, a boundary wall on all sides, and direct access to a 30-foot wide tar road. The farm has been consistently yielding high-quality grapes for the past decade. Located 15 km from Nashik city, close to wine country. Includes a small farmhouse and storage shed.",
      type: "FARMLAND" as const,
      status: "ACTIVE" as const,
      listingType: "SALE" as const,
      price: 18500000,
      pricePerUnit: 1541667,
      priceUnit: "acre",
      isNegotiable: true,
      address: "Survey No. 142, Dindori Road",
      village: "Dindori",
      taluka: "Dindori",
      district: "Nashik",
      state: "Maharashtra",
      pincode: "422202",
      latitude: 20.2144,
      longitude: 73.8866,
      totalArea: 12,
      areaUnit: "acres",
      facing: "East",
      roadAccess: true,
      roadWidth: 30,
      boundaryWall: true,
      soilType: "Black (Regur)",
      waterSource: "Borewell",
      hasClearTitle: true,
      isDisputeFree: true,
      isFeatured: true,
      featuredAt: new Date(),
      viewCount: 342,
      ownerId: seller.id,
    },
    {
      title: "5 Acre Mango Orchard in Ratnagiri",
      slug: "mango-orchard-ratnagiri-konkan",
      description:
        "Lush 5-acre Alphonso mango orchard in the heart of Konkan. Over 200 mature mango trees producing premium Alphonso mangoes. The orchard also has coconut and cashew trees. Natural water stream runs along the eastern boundary. Beautiful hilltop views of the Arabian Sea. Ideal for agro-tourism investment.",
      type: "ORCHARD" as const,
      status: "ACTIVE" as const,
      listingType: "SALE" as const,
      price: 32000000,
      pricePerUnit: 6400000,
      priceUnit: "acre",
      isNegotiable: false,
      address: "Near Devgad village",
      village: "Devgad",
      taluka: "Devgad",
      district: "Ratnagiri",
      state: "Maharashtra",
      pincode: "416613",
      latitude: 16.3815,
      longitude: 73.3814,
      totalArea: 5,
      areaUnit: "acres",
      facing: "South-East",
      roadAccess: true,
      roadWidth: 20,
      boundaryWall: false,
      soilType: "Laterite",
      waterSource: "Well",
      hasClearTitle: true,
      isDisputeFree: true,
      isFeatured: true,
      featuredAt: new Date(),
      viewCount: 567,
      ownerId: seller.id,
    },
    {
      title: "Residential Plot near Bangalore Airport",
      slug: "residential-plot-bangalore-devanahalli",
      description:
        "Well-located 2400 sq.ft residential plot in Devanahalli, just 8 km from Kempegowda International Airport. The plot is part of a BMRDA-approved layout with 40-foot wide roads, underground drainage, and water supply. Close to the upcoming Aerospace SEZ and BIAL IT Investment Region. Excellent appreciation potential.",
      type: "RESIDENTIAL_PLOT" as const,
      status: "ACTIVE" as const,
      listingType: "SALE" as const,
      price: 4800000,
      pricePerUnit: 2000,
      priceUnit: "sq.ft",
      isNegotiable: true,
      address: "Lakshmi Layout, Devanahalli",
      village: "Devanahalli",
      taluka: "Devanahalli",
      district: "Bangalore Rural",
      state: "Karnataka",
      pincode: "562110",
      latitude: 13.2488,
      longitude: 77.7066,
      totalArea: 2400,
      areaUnit: "sq.ft",
      facing: "North",
      roadAccess: true,
      roadWidth: 40,
      boundaryWall: true,
      isNAOrder: true,
      hasClearTitle: true,
      isDisputeFree: true,
      isFeatured: false,
      viewCount: 189,
      ownerId: seller.id,
    },
    {
      title: "20 Acre Agricultural Land in Kutch",
      slug: "agricultural-land-kutch-gujarat",
      description:
        "Expansive 20-acre agricultural land in Kutch district with alluvial soil suitable for cotton, groundnut, and castor cultivation. The property has two borewells with good water yield. Connected to the Sardar Sarovar canal network. Flat terrain ideal for mechanized farming. Government road access available.",
      type: "AGRICULTURAL_LAND" as const,
      status: "ACTIVE" as const,
      listingType: "SALE" as const,
      price: 12000000,
      pricePerUnit: 600000,
      priceUnit: "acre",
      isNegotiable: true,
      address: "Survey No. 89, Bhuj-Mundra Highway",
      village: "Mundra",
      taluka: "Mundra",
      district: "Kutch",
      state: "Gujarat",
      pincode: "370421",
      latitude: 22.8382,
      longitude: 69.7214,
      totalArea: 20,
      areaUnit: "acres",
      facing: "West",
      roadAccess: true,
      roadWidth: 25,
      boundaryWall: false,
      soilType: "Alluvial",
      waterSource: "Canal",
      hasClearTitle: true,
      isDisputeFree: true,
      isFeatured: true,
      featuredAt: new Date(),
      viewCount: 234,
      ownerId: seller.id,
    },
    {
      title: "Coconut Plantation in Coimbatore",
      slug: "coconut-plantation-coimbatore-tamil-nadu",
      description:
        "Established 8-acre coconut plantation with 350+ yielding trees in Pollachi taluka near Coimbatore. Steady income from copra and coconut sales. Drip irrigation system installed. The property also has 50 arecanut trees and a small banana patch. Farm worker quarters available on-site.",
      type: "PLANTATION" as const,
      status: "ACTIVE" as const,
      listingType: "SALE" as const,
      price: 24000000,
      pricePerUnit: 3000000,
      priceUnit: "acre",
      isNegotiable: false,
      address: "Sethumadai-Pollachi Road",
      village: "Sethumadai",
      taluka: "Pollachi",
      district: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "642133",
      latitude: 10.6614,
      longitude: 76.9552,
      totalArea: 8,
      areaUnit: "acres",
      facing: "South",
      roadAccess: true,
      roadWidth: 18,
      boundaryWall: true,
      soilType: "Red",
      waterSource: "Borewell",
      hasClearTitle: true,
      isDisputeFree: true,
      isFeatured: false,
      viewCount: 145,
      ownerId: seller.id,
    },
    {
      title: "Desert Farmland with Solar Potential in Jodhpur",
      slug: "farmland-solar-potential-jodhpur-rajasthan",
      description:
        "50-acre desert farmland on the Jodhpur-Barmer highway with excellent solar irradiation potential. Currently used for cumin and isabgol cultivation. The government is promoting solar parks in this area with attractive subsidies. Dual income opportunity from farming and solar energy. Wide frontage on NH-15.",
      type: "FARMLAND" as const,
      status: "ACTIVE" as const,
      listingType: "SALE" as const,
      price: 75000000,
      pricePerUnit: 1500000,
      priceUnit: "acre",
      isNegotiable: true,
      address: "NH-15, Jodhpur-Barmer Highway",
      taluka: "Balesar",
      district: "Jodhpur",
      state: "Rajasthan",
      pincode: "342028",
      latitude: 26.2389,
      longitude: 71.0042,
      totalArea: 50,
      areaUnit: "acres",
      facing: "North-West",
      roadAccess: true,
      roadWidth: 60,
      boundaryWall: false,
      soilType: "Desert (Arid)",
      waterSource: "Borewell",
      hasClearTitle: true,
      isDisputeFree: true,
      isFeatured: true,
      featuredAt: new Date(),
      viewCount: 412,
      ownerId: seller.id,
    },
    {
      title: "Hill-View Residential Plot in Mysuru",
      slug: "hill-view-plot-mysuru-karnataka",
      description:
        "Premium 3600 sq.ft residential plot with stunning Chamundi Hills view in a gated community near Mysuru ring road. MUDA-approved layout with all amenities including club house, park, and 24x7 security. Underground electricity and water supply. 5 minutes from Infosys Mysuru campus.",
      type: "RESIDENTIAL_PLOT" as const,
      status: "ACTIVE" as const,
      listingType: "SALE" as const,
      price: 5400000,
      pricePerUnit: 1500,
      priceUnit: "sq.ft",
      isNegotiable: true,
      address: "Green Meadows Layout, HD Kote Road",
      district: "Mysuru",
      state: "Karnataka",
      pincode: "570028",
      latitude: 12.2958,
      longitude: 76.6394,
      totalArea: 3600,
      areaUnit: "sq.ft",
      facing: "East",
      roadAccess: true,
      roadWidth: 30,
      boundaryWall: true,
      isNAOrder: true,
      hasClearTitle: true,
      isDisputeFree: true,
      isFeatured: false,
      viewCount: 98,
      ownerId: seller.id,
    },
    {
      title: "Irrigated Farmland in Sangli Sugar Belt",
      slug: "irrigated-farmland-sangli-maharashtra",
      description:
        "15-acre irrigated farmland in Sangli's famous sugar belt. The property is fed by the Krishna canal system, ensuring year-round water availability. Currently under sugarcane cultivation with a contract with a local sugar factory. The farm includes a pumphouse, transformer connection, and cattle shed. Excellent for commercial farming.",
      type: "FARMLAND" as const,
      status: "ACTIVE" as const,
      listingType: "SALE" as const,
      price: 22500000,
      pricePerUnit: 1500000,
      priceUnit: "acre",
      isNegotiable: true,
      address: "Takari-Sangli Road, near Krishna River",
      village: "Takari",
      taluka: "Miraj",
      district: "Sangli",
      state: "Maharashtra",
      pincode: "416416",
      latitude: 16.8524,
      longitude: 74.5815,
      totalArea: 15,
      areaUnit: "acres",
      facing: "South",
      roadAccess: true,
      roadWidth: 20,
      boundaryWall: false,
      soilType: "Black (Regur)",
      waterSource: "Canal",
      hasClearTitle: true,
      isDisputeFree: true,
      isFeatured: false,
      viewCount: 276,
      ownerId: seller.id,
    },
    {
      title: "10 Acre Spice Plantation in Wayanad",
      slug: "spice-plantation-wayanad-kerala",
      description:
        "Scenic 10-acre spice plantation in Wayanad hills growing pepper, cardamom, coffee, and vanilla. The property is surrounded by dense forest and offers a breathtaking view of the Western Ghats. A natural spring provides fresh water. Existing homestay with 4 rooms generates additional income. Perfect for eco-tourism and organic farming.",
      type: "PLANTATION" as const,
      status: "ACTIVE" as const,
      listingType: "SALE" as const,
      price: 45000000,
      pricePerUnit: 4500000,
      priceUnit: "acre",
      isNegotiable: false,
      address: "Vythiri-Lakkidi Road",
      village: "Vythiri",
      taluka: "Vythiri",
      district: "Wayanad",
      state: "Kerala",
      pincode: "673576",
      latitude: 11.5365,
      longitude: 76.0493,
      totalArea: 10,
      areaUnit: "acres",
      facing: "East",
      roadAccess: true,
      roadWidth: 15,
      boundaryWall: false,
      soilType: "Mountain",
      waterSource: "River",
      hasClearTitle: true,
      isDisputeFree: true,
      isFeatured: true,
      featuredAt: new Date(),
      viewCount: 523,
      ownerId: seller.id,
    },
    {
      title: "Farm Plot for Lease near Hyderabad ORR",
      slug: "farm-plot-lease-hyderabad-telangana",
      description:
        "7-acre farmland available on 10-year lease near Hyderabad Outer Ring Road at Shamshabad. Red soil suitable for vegetable and flower cultivation. Two borewells with motor and pipeline. Close to Rajiv Gandhi International Airport. Ideal for contract farming or greenhouse/polyhouse setup.",
      type: "FARMLAND" as const,
      status: "ACTIVE" as const,
      listingType: "LEASE" as const,
      price: 350000,
      pricePerUnit: 50000,
      priceUnit: "acre",
      isNegotiable: true,
      address: "Shamshabad-Chevella Road",
      village: "Shamshabad",
      taluka: "Rajendranagar",
      district: "Rangareddy",
      state: "Telangana",
      pincode: "501218",
      latitude: 17.2403,
      longitude: 78.3816,
      totalArea: 7,
      areaUnit: "acres",
      facing: "North",
      roadAccess: true,
      roadWidth: 20,
      boundaryWall: true,
      soilType: "Red",
      waterSource: "Borewell",
      hasClearTitle: true,
      isDisputeFree: true,
      isFeatured: false,
      viewCount: 167,
      ownerId: seller.id,
    },
  ];

  for (const propData of propertyData) {
    const existing = await prisma.property.findUnique({ where: { slug: propData.slug } });
    if (existing) {
      console.log(`Property "${propData.title}" already exists, skipping...`);
      continue;
    }

    const property = await prisma.property.create({
      data: propData,
    });
    console.log(`Created property: ${property.title}`);

    // Add placeholder image
    await prisma.propertyImage.create({
      data: {
        url: `https://images.unsplash.com/photo-${
          propData.type === "FARMLAND"
            ? "1500382017468-9049fed747ef"
            : propData.type === "ORCHARD"
            ? "1464226184884-fa280b87c399"
            : propData.type === "RESIDENTIAL_PLOT"
            ? "1500076656116-558758c991c1"
            : propData.type === "PLANTATION"
            ? "1416879595882-3373a0480b5b"
            : "1500382017468-9049fed747ef"
        }?w=800&h=600&fit=crop`,
        alt: property.title,
        isPrimary: true,
        order: 0,
        propertyId: property.id,
      },
    });

    // Add a second image
    await prisma.propertyImage.create({
      data: {
        url: `https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=600&fit=crop`,
        alt: `${property.title} - aerial view`,
        isPrimary: false,
        order: 1,
        propertyId: property.id,
      },
    });

    // Soil data for farmland/orchard/plantation
    if (["FARMLAND", "ORCHARD", "PLANTATION", "AGRICULTURAL_LAND"].includes(propData.type)) {
      const soilTypes: Record<string, { ph: number; n: number; p: number; k: number; oc: number; texture: string; fertility: string; crops: string }> = {
        "Black (Regur)": { ph: 7.2, n: 280, p: 18, k: 340, oc: 0.65, texture: "Clay", fertility: "High", crops: "Sugarcane, Cotton, Grapes, Soybean, Wheat" },
        Laterite: { ph: 5.8, n: 200, p: 12, k: 180, oc: 0.45, texture: "Sandy Loam", fertility: "Medium", crops: "Mango, Cashew, Coconut, Jackfruit" },
        Alluvial: { ph: 7.5, n: 320, p: 22, k: 280, oc: 0.72, texture: "Loam", fertility: "High", crops: "Cotton, Groundnut, Castor, Wheat, Cumin" },
        Red: { ph: 6.5, n: 220, p: 15, k: 200, oc: 0.52, texture: "Sandy Clay", fertility: "Medium", crops: "Coffee, Pepper, Coconut, Vegetables, Flowers" },
        "Desert (Arid)": { ph: 8.2, n: 140, p: 8, k: 160, oc: 0.25, texture: "Sandy", fertility: "Low", crops: "Cumin, Isabgol, Bajra, Guar, Mustard" },
        Mountain: { ph: 5.5, n: 310, p: 20, k: 260, oc: 0.85, texture: "Loam", fertility: "High", crops: "Pepper, Cardamom, Coffee, Vanilla, Tea" },
      };

      const soilInfo = soilTypes[propData.soilType || ""] || soilTypes["Alluvial"];

      await prisma.soilData.create({
        data: {
          propertyId: property.id,
          soilType: propData.soilType || "Alluvial",
          ph: soilInfo.ph,
          nitrogen: soilInfo.n,
          phosphorus: soilInfo.p,
          potassium: soilInfo.k,
          organicCarbon: soilInfo.oc,
          texture: soilInfo.texture,
          fertility: soilInfo.fertility,
          suitableCrops: soilInfo.crops,
          testedAt: new Date("2025-06-15"),
        },
      });
      console.log(`  + soil data for ${property.slug}`);
    }

    // Water data for selected properties
    if (propData.waterSource) {
      const waterPresets: Record<string, { depth: number; quality: string; tds: number; borewell: number; borewellDepth: number; canal: number | null; river: number | null; rainfall: number }> = {
        Borewell: { depth: 120, quality: "Good", tds: 450, borewell: 2, borewellDepth: 200, canal: null, river: null, rainfall: 700 },
        Canal: { depth: 80, quality: "Good", tds: 350, borewell: 1, borewellDepth: 150, canal: 0.5, river: 3, rainfall: 600 },
        Well: { depth: 40, quality: "Good", tds: 280, borewell: 0, borewellDepth: 0, canal: null, river: 2, rainfall: 3000 },
        River: { depth: 30, quality: "Moderate", tds: 200, borewell: 0, borewellDepth: 0, canal: null, river: 0.5, rainfall: 2500 },
      };

      const waterInfo = waterPresets[propData.waterSource] || waterPresets["Borewell"];

      await prisma.waterData.create({
        data: {
          propertyId: property.id,
          waterTableDepth: waterInfo.depth,
          waterQuality: waterInfo.quality,
          tdsLevel: waterInfo.tds,
          borewellCount: waterInfo.borewell,
          borewellDepth: waterInfo.borewellDepth || null,
          canalDistance: waterInfo.canal,
          riverDistance: waterInfo.river,
          rainfallAvg: waterInfo.rainfall,
          testedAt: new Date("2025-08-10"),
        },
      });
      console.log(`  + water data for ${property.slug}`);
    }

    // Legal check for properties with clear title
    if (propData.hasClearTitle) {
      await prisma.legalCheck.create({
        data: {
          propertyId: property.id,
          titleStatus: "clear",
          encumbranceCheck: true,
          encumbranceResult: "clear",
          litigationCheck: true,
          litigationResult: "none",
          revenueRecordOk: true,
          verifiedBy: "Onyx Legal Team",
          verifiedAt: new Date("2025-09-01"),
        },
      });
      console.log(`  + legal check for ${property.slug}`);
    }
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
