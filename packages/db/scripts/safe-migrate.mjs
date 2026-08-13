#!/usr/bin/env node
// Wraps `prisma migrate dev` to work around a permanent Prisma engine
// limitation, confirmed 2026-08-13: properties.searchVector is a
// PostgreSQL STORED generated column, modeled in schema.prisma as
// Unsupported("tsvector") because Prisma has no syntax to express a
// generation expression. Unsupported() fields are assumed to have no
// column default, so every `prisma migrate dev` diff against the real
// database re-detects the generated column as "wrong" and emits
//   ALTER TABLE "properties" ALTER COLUMN "searchVector" DROP DEFAULT;
// which Postgres always rejects for a generated column
// ("column ... is a generated column"). There is no schema.prisma
// change that makes this stop -- it was verified to recur even against
// a migration with zero other changes.
//
// This script generates the migration with --create-only (nothing
// applied yet), strips that one known-bad statement, and applies via
// `migrate deploy` instead of plain `migrate dev`. `migrate deploy`
// just runs migration files in order and does not re-diff afterward,
// so it can't spawn the second auto-generated migration with the same
// bug the way `migrate dev` does.
//
// Usage: pnpm --filter @onyx/db run db:migrate:safe -- --name my_change

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const nameArgIndex = process.argv.indexOf("--name");
const name = nameArgIndex !== -1 ? process.argv[nameArgIndex + 1] : undefined;
if (!name) {
  console.error("Usage: db:migrate:safe -- --name <migration_name>");
  process.exit(1);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(scriptDir, "..", "prisma", "migrations");
const KNOWN_BAD_LINE = /^-- AlterTable\nALTER TABLE "properties" ALTER COLUMN "searchVector" (?:DROP|SET) DEFAULT;\n?/m;

const before = new Set(readdirSync(migrationsDir));

execSync(`npx prisma migrate dev --create-only --name ${name}`, { stdio: "inherit" });

const newFolder = readdirSync(migrationsDir).find((f) => !before.has(f) && f.endsWith(`_${name}`));
if (!newFolder) {
  console.log("No new migration was created (schema already matches migration history).");
  process.exit(0);
}

const sqlPath = join(migrationsDir, newFolder, "migration.sql");
const original = readFileSync(sqlPath, "utf8");
const cleaned = original.replace(KNOWN_BAD_LINE, "");

if (cleaned.trim().length === 0) {
  console.log(`"${newFolder}" contained only the known searchVector quirk and nothing else -- removing, nothing to apply.`);
  rmSync(join(migrationsDir, newFolder), { recursive: true, force: true });
  process.exit(0);
}

if (cleaned !== original) {
  console.log(`Stripped the known searchVector DROP DEFAULT line from ${newFolder}/migration.sql`);
  writeFileSync(sqlPath, cleaned);
}

execSync("npx prisma migrate deploy", { stdio: "inherit" });
execSync("npx prisma generate", { stdio: "inherit" });
console.log("Done.");
