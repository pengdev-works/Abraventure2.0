import express from 'express';
import { createComplaint, getComplaints, resolveComplaint } from '../controllers/complaintController.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getComplaints);
router.post('/', verifyToken, requireRoles(['TOURIST']), createComplaint);
router.put('/:id/resolve', verifyToken, requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']), resolveComplaint);

export default router;
