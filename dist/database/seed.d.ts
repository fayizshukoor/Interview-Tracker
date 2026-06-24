/**
 * seed.ts — Database Seed Runner
 *
 * Usage:
 *   npx ts-node src/infrastructure/database/seed.ts
 *
 * Runs all *.sql files inside the seeds/ directory in alphabetical order.
 * All seed files must be idempotent (INSERT ... ON CONFLICT DO NOTHING).
 * Safe to run multiple times — duplicate rows are silently skipped.
 *
 * NOTE: Always run migrations before seeding.
 *   npx ts-node src/infrastructure/database/migrate.ts
 *   npx ts-node src/infrastructure/database/seed.ts
 */
export {};
//# sourceMappingURL=seed.d.ts.map