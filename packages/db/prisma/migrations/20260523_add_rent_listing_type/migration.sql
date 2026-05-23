-- Add RENT value to ListingType enum
ALTER TYPE "ListingType" ADD VALUE IF NOT EXISTS 'RENT';
