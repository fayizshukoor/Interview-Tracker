/**
 * migrate.ts — PostgreSQL Migration Runner
 *
 * Usage:
 *   npx ts-node --esm src/database/migrate.ts           # run pending migrations
 *   npx ts-node --esm src/database/migrate.ts --rollback # drop all tables (dev only)
 *
 * How it works:
 *   1. Connects to the database using DATABASE_URL from the environment.
 *   2. Creates a `schema_migrations` tracking table if it does not exist.
 *   3. Reads all *.sql files from the migrations/ directory, sorted by filename.
 *   4. Skips files that are already recorded in `schema_migrations`.
 *   5. Runs each pending file inside its own transaction — if any statement
 *      fails the transaction is rolled back and the runner exits with code 1.
 *   6. Records the filename and a SHA-256 checksum on success so the file
 *      cannot be silently re-run after it has been modified.
 */
import 'dotenv/config.js';
//# sourceMappingURL=migrate.d.ts.map