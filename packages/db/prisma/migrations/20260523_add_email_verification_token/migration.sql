-- Add email verification token fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verifyToken" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verifyTokenExpiry" TIMESTAMP(3);
