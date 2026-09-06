import express from 'express';
import { createRequirement, getRequirements, updateRequirement, deleteRequirement } from '../controllers/requirementController.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, requireRoles(['MUNICIPAL_DOT']), createRequirement);
router.get('/municipality/:municipalityId', getRequirements);
router.put('/:id', verifyToken, requireRoles(['MUNICIPAL_DOT']), updateRequirement);
router.delete('/:id', verifyToken, requireRoles(['MUNICIPAL_DOT']), deleteRequirement);

export default router;
