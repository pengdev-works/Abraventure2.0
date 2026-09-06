import express from 'express';
import {
  getPublicAdvertisements,
  getAllAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  toggleAdvertisementStatus,
  deleteAdvertisement,
} from '../controllers/advertisementController.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

const adUpload = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

// Public endpoint for landing page
router.get('/public', getPublicAdvertisements);

// Management endpoints (Provincial DOT & Municipal DOT)
router.get('/all', verifyToken, requireRoles(['PROVINCIAL_DOT', 'MUNICIPAL_DOT']), getAllAdvertisements);
router.post('/', verifyToken, requireRoles(['PROVINCIAL_DOT', 'MUNICIPAL_DOT']), adUpload, createAdvertisement);
router.put('/:id', verifyToken, requireRoles(['PROVINCIAL_DOT', 'MUNICIPAL_DOT']), adUpload, updateAdvertisement);
router.patch('/:id/toggle', verifyToken, requireRoles(['PROVINCIAL_DOT', 'MUNICIPAL_DOT']), toggleAdvertisementStatus);
router.delete('/:id', verifyToken, requireRoles(['PROVINCIAL_DOT', 'MUNICIPAL_DOT']), deleteAdvertisement);

export default router;
