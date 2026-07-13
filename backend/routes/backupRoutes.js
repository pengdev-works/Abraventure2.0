import express from 'express';
import { exportBackup, importBackup } from '../controllers/backupController.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/export', verifyToken, requireRoles(['PROVINCIAL_DOT']), exportBackup);
router.post('/import', verifyToken, requireRoles(['PROVINCIAL_DOT']), importBackup);

export default router;
