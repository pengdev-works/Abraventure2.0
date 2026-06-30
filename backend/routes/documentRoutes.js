import express from 'express';
import { submitDocument, getMySubmissions, getMunicipalSubmissions, reviewDocument } from '../controllers/documentController.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/submit', verifyToken, requireRoles(['HOMESTAY_OWNER', 'TOUR_GUIDE']), upload.single('document'), submitDocument);
router.get('/my-submissions', verifyToken, requireRoles(['HOMESTAY_OWNER', 'TOUR_GUIDE']), getMySubmissions);
router.get('/municipal-submissions', verifyToken, requireRoles(['MUNICIPAL_DOT']), getMunicipalSubmissions);
router.put('/review/:id', verifyToken, requireRoles(['MUNICIPAL_DOT']), reviewDocument);

export default router;
