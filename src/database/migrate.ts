/**
 * migrate.ts — PostgreSQL Migration Runner
 *
 * Usage:
 *   npx ts-node src/infrastructure/database/migrate.ts           # run pending migrations
 *   npx ts-node src/infrastructure/database/migrate.ts --rollback # drop all tables (dev only)
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

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('[migrate] ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** SHA-256 checksum of a string — used to detect tampering with applied migrations. */
function sha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/** Read all .sql files from the migrations directory, sorted by filename. */
function getMigrationFiles(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // lexicographic sort — relies on numeric prefix (001_, 002_, …)
}

// ---------------------------------------------------------------------------
// Tracking table
// ---------------------------------------------------------------------------

const CREATE_TRACKING_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id           SERIAL      PRIMARY KEY,
    filename     VARCHAR(255) NOT NULL UNIQUE,
    checksum     CHAR(64)     NOT NULL,
    applied_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
  );
`;

// ---------------------------------------------------------------------------
// Run migrations
// ---------------------------------------------------------------------------

async function runMigrations(client: Client): Promise<void> {
  // Ensure the tracking table exists (outside any migration transaction)
  await client.query(CREATE_TRACKING_TABLE);

  const files = getMigrationFiles();
  if (files.length === 0) {
    console.log('[migrate] No migration files found.');
    return;
  }

  // Fetch already-applied migrations
  const { rows: applied } = await client.query<{ filename: string; checksum: string }>(
    'SELECT filename, checksum FROM schema_migrations ORDER BY filename',
  );
  const appliedMap = new Map(applied.map((r) => [r.filename, r.checksum]));

  let ranCount = 0;

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    const checksum = sha256(sql);

    if (appliedMap.has(file)) {
      const storedChecksum = appliedMap.get(file)!;
      if (storedChecksum !== checksum) {
        // Migration file was modified after it was applied — this is dangerous
        console.error(
          `[migrate] CHECKSUM MISMATCH: "${file}" has been modified after it was applied.\n` +
            `  Stored : ${storedChecksum}\n` +
            `  Current: ${checksum}\n` +
            '  Never edit an applied migration. Create a new migration to make changes.',
        );
        process.exit(1);
      }
      console.log(`[migrate] Skipping  (already applied): ${file}`);
      continue;
    }

    // Run the migration inside a transaction
    console.log(`[migrate] Applying: ${file}`);
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
        [file, checksum],
      );
      await client.query('COMMIT');
      console.log(`[migrate] Applied:  ${file} ✓`);
      ranCount++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[migrate] FAILED:   ${file}`);
      console.error(err);
      process.exit(1);
    }
  }

  if (ranCount === 0) {
    console.log('[migrate] Database is already up to date.');
  } else {
    console.log(`[migrate] Done. ${ranCount} migration(s) applied.`);
  }
}

// ---------------------------------------------------------------------------
// Rollback (development only)
// ---------------------------------------------------------------------------

async function rollback(client: Client): Promise<void> {
  const env = process.env.NODE_ENV ?? 'development';
  if (env === 'production') {
    console.error('[migrate] Rollback is disabled in production.');
    process.exit(1);
  }

  console.warn('[migrate] WARNING: Rolling back — this will DROP all tables and types.');

  await client.query(`
    DROP VIEW  IF EXISTS v_topic_failure_counts    CASCADE;
    DROP VIEW  IF EXISTS v_candidate_latest_review CASCADE;

    DROP TABLE IF EXISTS review_pending_topics     CASCADE;
    DROP TABLE IF EXISTS review_practical_tasks    CASCADE;
    DROP TABLE IF EXISTS review_theory_questions   CASCADE;
    DROP TABLE IF EXISTS reviews                   CASCADE;
    DROP TABLE IF EXISTS questions                 CASCADE;
    DROP TABLE IF EXISTS candidates                CASCADE;
    DROP TABLE IF EXISTS schema_migrations         CASCADE;

    DROP FUNCTION IF EXISTS set_updated_at         CASCADE;

    DROP TYPE IF EXISTS question_result            CASCADE;
    DROP TYPE IF EXISTS review_status              CASCADE;
  `);

  console.log('[migrate] Rollback complete. All tables, types, and views dropped.');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const isRollback = process.argv.includes('--rollback');

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('[migrate] Connected to database.');

    if (isRollback) {
      await rollback(client);
    } else {
      await runMigrations(client);
    }
  } catch (err) {
    console.error('[migrate] Unexpected error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
