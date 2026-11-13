import app from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

async function startServer(): Promise<void> {
  try {
    await pool.query('SELECT 1');
    console.log('Database connected successfully.');

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database connection error.';
    console.error(`Database connection failed: ${message}`);
    await pool.end();
    process.exitCode = 1;
  }
}

void startServer();
