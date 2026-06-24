import pg from 'pg';
import { env } from './env.js';
const { Pool } = pg;
export const pool = new Pool({
    connectionString: env.databaseUrl,
    max: 10, // maximum number of connections in the pool
    idleTimeoutMillis: 30_000, // close idle connections after 30 s
    connectionTimeoutMillis: 5_000, // fail fast if a connection can't be acquired in 5 s
});
// Surface connection errors early rather than silently at first query
pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
});
//# sourceMappingURL=db.js.map