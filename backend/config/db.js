import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Database connection pool established via WebSockets.');
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export default pool;
