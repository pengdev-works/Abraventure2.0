// In-Memory Rate Limiter Middleware for Auth Endpoints
// Protects against brute-force and credential stuffing attacks

const attemptsMap = new Map();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of attemptsMap.entries()) {
    if (now - data.firstAttempt > 15 * 60 * 1000) {
      attemptsMap.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export const authRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const maxAttempts = options.maxAttempts || 5; // 5 attempts per window

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || process.env.NODE_ENV !== 'production';

    if (isLocalhost) {
      return next(); // Skip auth rate limiting in development/localhost
    }

    const now = Date.now();

    const record = attemptsMap.get(ip);

    if (!record) {
      attemptsMap.set(ip, { count: 1, firstAttempt: now });
      return next();
    }

    // Reset window if expired
    if (now - record.firstAttempt > windowMs) {
      attemptsMap.set(ip, { count: 1, firstAttempt: now });
      return next();
    }

    if (record.count >= maxAttempts) {
      const retryMinutes = Math.ceil((windowMs - (now - record.firstAttempt)) / 60000);
      return res.status(429).json({
        message: `Too many login attempts from this IP. Please try again in ${retryMinutes} minute(s).`,
        retryAfterMinutes: retryMinutes,
      });
    }

    record.count += 1;
    next();
  };
};

export const clearRateLimit = (ip) => {
  attemptsMap.delete(ip);
};
