-- The "AlterTable ... ALTER COLUMN "searchVector" DROP DEFAULT" statement
-- Prisma generates here is bogus: Prisma's migration engine doesn't fully
-- model PostgreSQL STORED generated columns (represented as
-- Unsupported("tsvector") in schema.prisma) and defensively tries to reset
-- a "default" on it that doesn't exist -- Postgres rejects ALTER COLUMN
-- SET/DROP DEFAULT on any generated column outright, regardless of whether
-- one is set. This is a known Prisma limitation with generated columns, not
-- a real schema change, so it's stripped here. See onyx-propcare docs on
-- the recurring migration-drift issue for the inquiries FK half of this fix
-- (now resolved via the explicit onDelete: Restrict in schema.prisma).

-- Restore the GIN index on properties.searchVector, dropped by the
-- 20260520_schema_sync column rename and never recreated -- full-text
-- search queries have been doing sequential scans on the properties table
-- ever since.
CREATE INDEX IF NOT EXISTS "properties_searchVector_idx" ON "properties" USING GIN ("searchVector");
