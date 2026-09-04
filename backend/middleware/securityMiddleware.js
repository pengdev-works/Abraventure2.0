// Comprehensive Security Middleware: XSS Sanitization, Security Headers, & Rate Limiting
import crypto from 'crypto';

// ─── 1. XSS & Script Payload Sanitizer ─────────────────────────────────────────
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  // Remove script tags, inline event handlers, and dangerous protocols
  return str
    .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '');
};

const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
};

export const sanitizeInput = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

// ─── 2. HTTP Security Headers ───────────────────────────────────────────────────
export const setSecurityHeaders = (req, res, next) => {
  // Protect against MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Protect against Clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS Filter in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Enforce HSTS for HTTPS connections
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Restrict referrer info
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Basic Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; media-src 'self' https: blob:; connect-src 'self' https:;"
  );

  next();
};

// ─── 3. Global API Throttling Rate Limiter ──────────────────────────────────────
const requestCounts = new Map();

// Cleanup every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.resetTime > 15 * 60 * 1000) {
      requestCounts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export const globalApiRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 mins
  const maxRequests = options.maxRequests || 2000; // 2000 requests per 15 min

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || process.env.NODE_ENV !== 'production';

    if (isLocalhost) {
      return next(); // Skip rate limiting on local development & localhost
    }

    const now = Date.now();

    const record = requestCounts.get(ip);

    if (!record) {
      requestCounts.set(ip, { count: 1, resetTime: now });
      return next();
    }

    if (now - record.resetTime > windowMs) {
      requestCounts.set(ip, { count: 1, resetTime: now });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        message: 'Too many requests from this IP address. Please slow down.',
        retryAfterMinutes: Math.ceil((windowMs - (now - record.resetTime)) / 60000)
      });
    }

    record.count += 1;
    next();
  };
};
