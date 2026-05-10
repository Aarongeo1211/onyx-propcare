-- Full-text search index on properties
-- Uses GIN index on a generated tsvector column for fast search

-- Add the search vector column
ALTER TABLE "properties"
ADD COLUMN IF NOT EXISTS "search_vector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("district", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("state", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("description", '')), 'C')
) STORED;

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "properties_search_vector_idx" ON "properties" USING GIN ("search_vector");
