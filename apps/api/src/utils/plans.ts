import { prisma } from "@onyx/db";
import type { PlanCategory, PropertyType } from "@onyx/db";

const FARMLAND_TYPES: PropertyType[] = [
  "FARMLAND",
  "AGRICULTURAL_LAND",
  "ORCHARD",
  "PLANTATION",
];

export function getPlanCategoryForPropertyType(propertyType: PropertyType): PlanCategory {
  if (propertyType === "RESIDENTIAL_PLOT") {
    return "RESIDENTIAL_PLOT";
  }

  if (FARMLAND_TYPES.includes(propertyType)) {
    return "FARMLAND";
  }

  return "ALL";
}

export function planSupportsPropertyType(
  planCategory: PlanCategory,
  propertyType: PropertyType
) {
  if (planCategory === "ALL") {
    return true;
  }

  return planCategory === getPlanCategoryForPropertyType(propertyType);
}

export async function findEligibleSubscription(userId: string, propertyType: PropertyType) {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      status: "ACTIVE",
      endDate: { gt: new Date() },
    },
    include: { plan: true },
    orderBy: [{ createdAt: "desc" }],
  });

  return subscriptions.find((subscription) => {
    if (!planSupportsPropertyType(subscription.plan.category, propertyType)) {
      return false;
    }

    if (subscription.plan.maxProperties !== -1 && subscription.propertiesUsed >= subscription.plan.maxProperties) {
      return false;
    }

    return true;
  }) || null;
}

export async function findCategoryCompatibleSubscription(userId: string, propertyType: PropertyType) {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      status: "ACTIVE",
      endDate: { gt: new Date() },
    },
    include: { plan: true },
    orderBy: [{ createdAt: "desc" }],
  });

  return subscriptions.find((subscription) =>
    planSupportsPropertyType(subscription.plan.category, propertyType)
  ) || null;
}
