import express from 'express';
import { register, applyProvider, login, loginTourist, loginPortal, getMe, setupTwoFactor, verifyTwoFactor } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Apply rate limiter to authentication attempt endpoints
router.post('/register', authRateLimiter({ maxAttempts: 10, windowMs: 15 * 60 * 1000 }), register);
router.post(
  '/apply/provider',
  authRateLimiter({ maxAttempts: 10, windowMs: 15 * 60 * 1000 }),
  upload.fields([
    { name: 'validId', maxCount: 1 },
    { name: 'accreditationDoc', maxCount: 1 },
    { name: 'supportingDoc', maxCount: 1 },
  ]),
  applyProvider
);
router.post('/login', authRateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 }), login);
router.post('/tourist/login', authRateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 }), loginTourist);
router.post('/portal/login', authRateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 }), loginPortal);

// 2FA Routes
router.post('/2fa/setup', verifyToken, setupTwoFactor);
router.post('/2fa/verify', verifyToken, verifyTwoFactor);

router.get('/me', verifyToken, getMe);

export default router;
