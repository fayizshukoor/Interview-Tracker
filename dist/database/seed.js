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
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const SEEDS_DIR = path.join(__dirname, 'seeds');
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('[seed] ERROR: DATABASE_URL environment variable is not set.');
    process.exit(1);
}
// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
async function runSeeds(client) {
    const files = fs
        .readdirSync(SEEDS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();
    if (files.length === 0) {
        console.log('[seed] No seed files found.');
        return;
    }
    for (const file of files) {
        const filePath = path.join(SEEDS_DIR, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        console.log(`[seed] Running: ${file}`);
        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('COMMIT');
            console.log(`[seed] Done:    ${file} ✓`);
        }
        catch (err) {
            await client.query('ROLLBACK');
            console.error(`[seed] FAILED:  ${file}`);
            console.error(err);
            process.exit(1);
        }
    }
    console.log('[seed] All seed files applied.');
}
// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
async function main() {
    const client = new Client({ connectionString: DATABASE_URL });
    try {
        await client.connect();
        console.log('[seed] Connected to database.');
        await runSeeds(client);
    }
    catch (err) {
        console.error('[seed] Unexpected error:', err);
        process.exit(1);
    }
    finally {
        await client.end();
    }
}
main();
//# sourceMappingURL=seed.js.map