-- Allow guest (unauthenticated) inquiries: userId becomes optional, add guest contact fields
ALTER TABLE "inquiries" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "inquiries" ADD COLUMN "guestName" TEXT;
ALTER TABLE "inquiries" ADD COLUMN "guestPhone" TEXT;
