import { pool } from './config/db.js';

async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    const result = await client.query<{ now: Date }>('SELECT NOW()');
    const timestamp = result.rows[0]?.now;
    console.log('Database connected successfully');
    console.log('Current database timestamp:', timestamp);
  } finally {
    client.release();
    await pool.end();
  }
}

testConnection().catch((err: unknown) => {
  console.error('Failed to connect to the database:', err instanceof Error ? err.message : err);
  process.exit(1);
});
