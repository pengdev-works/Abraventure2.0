import express from 'express';
import { getOverview, getMunicipalAnalytics, exportData } from '../controllers/analyticsController.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/overview', verifyToken, requireRoles(['PROVINCIAL_DOT']), getOverview);
router.get('/municipal', verifyToken, requireRoles(['MUNICIPAL_DOT']), getMunicipalAnalytics);
router.get('/export', verifyToken, requireRoles(['PROVINCIAL_DOT', 'MUNICIPAL_DOT']), exportData);

export default router;
