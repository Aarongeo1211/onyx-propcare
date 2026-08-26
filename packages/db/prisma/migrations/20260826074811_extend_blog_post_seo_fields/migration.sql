-- AlterTable
ALTER TABLE "blog_posts" ADD COLUMN     "generatedBy" TEXT,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "sourceTopic" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];


-- CreateIndex
CREATE INDEX "blog_posts_isPublished_createdAt_idx" ON "blog_posts"("isPublished", "createdAt");
