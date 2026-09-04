import express from 'express';
import { register, login, loginTourist, loginPortal, getMe, setupTwoFactor, verifyTwoFactor } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiter to authentication attempt endpoints
router.post('/register', authRateLimiter({ maxAttempts: 10, windowMs: 15 * 60 * 1000 }), register);
router.post('/login', authRateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 }), login);
router.post('/tourist/login', authRateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 }), loginTourist);
router.post('/portal/login', authRateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 }), loginPortal);

// 2FA Routes
router.post('/2fa/setup', verifyToken, setupTwoFactor);
router.post('/2fa/verify', verifyToken, verifyTwoFactor);

router.get('/me', verifyToken, getMe);

export default router;
