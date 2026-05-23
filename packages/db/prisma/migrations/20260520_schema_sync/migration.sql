-- Add enums introduced after the initial migration chain
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "CallbackStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "RefundRequestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSED');

-- Bring callback request status in line with the schema without losing existing values
ALTER TABLE "callback_requests"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "callback_requests"
  ALTER COLUMN "status" TYPE "CallbackStatus"
  USING ("status"::text::"CallbackStatus");

ALTER TABLE "callback_requests"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Add approval workflow metadata
ALTER TABLE "legal_checks"
  ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "reviewNotes" TEXT;

ALTER TABLE "soil_data"
  ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "approvedBy" TEXT,
  ADD COLUMN "reviewNotes" TEXT;

ALTER TABLE "water_data"
  ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "approvedBy" TEXT,
  ADD COLUMN "reviewNotes" TEXT;

-- Sync property schema updates
ALTER TABLE "properties"
  ADD COLUMN "nearbyLocations" JSONB;

ALTER TABLE "properties"
  RENAME COLUMN "search_vector" TO "searchVector";

DROP INDEX IF EXISTS "properties_search_vector_idx";

ALTER TABLE "property_documents"
  ADD COLUMN "publicId" TEXT;

ALTER TABLE "subscriptions"
  ADD COLUMN "razorpaySignature" TEXT;

-- Missing tables from the migration chain
CREATE TABLE "platform_settings" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "description" TEXT,
  "updatedBy" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "property_videos" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "title" TEXT,
  "publicId" TEXT,
  "thumbnailUrl" TEXT,
  "durationSeconds" DOUBLE PRECISION,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  "propertyId" TEXT NOT NULL,

  CONSTRAINT "property_videos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "property_views" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "property_views_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refund_requests" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "reason" TEXT NOT NULL,
  "details" TEXT,
  "preferredContact" TEXT,
  "status" "RefundRequestStatus" NOT NULL DEFAULT 'PENDING',
  "adminNotes" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

-- Supporting indexes
CREATE UNIQUE INDEX "platform_settings_key_key" ON "platform_settings"("key");
CREATE INDEX "platform_settings_category_key_idx" ON "platform_settings"("category", "key");

CREATE INDEX "property_videos_propertyId_idx" ON "property_videos"("propertyId");

CREATE UNIQUE INDEX "property_views_propertyId_userId_key" ON "property_views"("propertyId", "userId");
CREATE INDEX "property_views_propertyId_viewedAt_idx" ON "property_views"("propertyId", "viewedAt");
CREATE INDEX "property_views_userId_viewedAt_idx" ON "property_views"("userId", "viewedAt");

CREATE INDEX "refund_requests_status_createdAt_idx" ON "refund_requests"("status", "createdAt");
CREATE INDEX "refund_requests_userId_createdAt_idx" ON "refund_requests"("userId", "createdAt");

-- Foreign keys for the new tables
ALTER TABLE "property_videos"
  ADD CONSTRAINT "property_videos_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property_views"
  ADD CONSTRAINT "property_views_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property_views"
  ADD CONSTRAINT "property_views_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "refund_requests"
  ADD CONSTRAINT "refund_requests_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "refund_requests"
  ADD CONSTRAINT "refund_requests_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
