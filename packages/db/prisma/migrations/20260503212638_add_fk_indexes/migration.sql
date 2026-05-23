-- CreateIndex
CREATE INDEX IF NOT EXISTS "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "favorites_userId_idx" ON "favorites"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "inquiries_propertyId_status_idx" ON "inquiries"("propertyId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "inquiries_userId_createdAt_idx" ON "inquiries"("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "inquiries_status_createdAt_idx" ON "inquiries"("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "properties_ownerId_idx" ON "properties"("ownerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "properties_status_createdAt_idx" ON "properties"("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "properties_isFeatured_featuredAt_idx" ON "properties"("isFeatured", "featuredAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "property_documents_propertyId_idx" ON "property_documents"("propertyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "property_images_propertyId_idx" ON "property_images"("propertyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviews_propertyId_idx" ON "reviews"("propertyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions_userId_status_idx" ON "subscriptions"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions_planId_idx" ON "subscriptions"("planId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions_razorpayOrderId_idx" ON "subscriptions"("razorpayOrderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscriptions_endDate_idx" ON "subscriptions"("endDate");

