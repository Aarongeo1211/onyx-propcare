-- Add missing indexes for performance and query efficiency

-- Property listing type filter (SALE/LEASE/RENT) — used on every search
CREATE INDEX IF NOT EXISTS "properties_listingType_status_idx" ON "properties"("listingType", "status");

-- User role and isActive — used in admin user management queries
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_isActive_idx" ON "users"("isActive");
