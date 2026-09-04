import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
const isLocalhost = !connectionString || connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
});

pool.on('connect', () => {
  console.log('[DATABASE] Connection pool established.');
});

pool.on('error', (err) => {
  console.error('[DATABASE] Unexpected pool error:', err.message || err);
});

export default pool;
