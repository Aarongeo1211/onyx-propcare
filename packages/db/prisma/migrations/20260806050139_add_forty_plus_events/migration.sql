-- CreateEnum
CREATE TYPE "FortyPlusEventStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "FortyPlusMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "forty_plus_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3),
    "location" TEXT,
    "category" TEXT,
    "status" "FortyPlusEventStatus" NOT NULL DEFAULT 'DRAFT',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forty_plus_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forty_plus_event_media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "type" "FortyPlusMediaType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "forty_plus_event_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "forty_plus_events_slug_key" ON "forty_plus_events"("slug");

-- CreateIndex
CREATE INDEX "forty_plus_events_status_order_idx" ON "forty_plus_events"("status", "order");

-- CreateIndex
CREATE INDEX "forty_plus_event_media_eventId_idx" ON "forty_plus_event_media"("eventId");

-- AddForeignKey
ALTER TABLE "forty_plus_event_media" ADD CONSTRAINT "forty_plus_event_media_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "forty_plus_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
