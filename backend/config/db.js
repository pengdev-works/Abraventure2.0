import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Database connection pool established.');
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export default pool;
