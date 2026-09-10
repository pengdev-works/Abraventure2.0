import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Force IPv4 lookup order to prevent ENOTFOUND / EAI_AGAIN on dual-stack systems (Windows / ISP IPv6 routing issues)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
const isLocalhost = !connectionString || connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('connect', () => {
  console.log('[DATABASE] Connection pool established.');
});

pool.on('error', (err) => {
  console.error('[DATABASE] Unexpected pool error:', err.message || err);
});

// Automatic retry wrapper for transient network / DNS glitches (e.g. ENOTFOUND, EAI_AGAIN, ECONNRESET)
const originalQuery = pool.query.bind(pool);

pool.query = async function (text, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = undefined;
  }

  const isTransientError = (err) => {
    if (!err) return false;
    const code = err.code || '';
    const msg = String(err.message || '');
    return (
      code === 'ENOTFOUND' ||
      code === 'EAI_AGAIN' ||
      code === 'ECONNRESET' ||
      code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT' ||
      msg.includes('getaddrinfo') ||
      msg.includes('Connection terminated unexpectedly') ||
      msg.includes('timeout')
    );
  };

  let lastError;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await originalQuery(text, params);
      if (callback) return callback(null, res);
      return res;
    } catch (err) {
      lastError = err;
      if (isTransientError(err) && attempt < maxAttempts) {
        const delay = attempt * 1000;
        console.warn(`[DATABASE] Transient network/DNS issue (${err.code || err.message}). Retrying query in ${delay}ms (attempt ${attempt}/${maxAttempts})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      if (callback) return callback(err);
      throw err;
    }
  }

  if (callback) return callback(lastError);
  throw lastError;
};

export default pool;
