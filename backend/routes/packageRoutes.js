import express from 'express';
import {
  getPackages,
  getPackageDetails,
  createPackage,
  updatePackage,
  deletePackage,
  importPackageToItinerary,
} from '../controllers/packageController.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getPackages);
router.get('/:id', getPackageDetails);

// Protected routes (DOT Roles)
router.post('/', verifyToken, requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']), upload.single('coverImage'), createPackage);
router.put('/:id', verifyToken, requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']), upload.single('coverImage'), updatePackage);
router.delete('/:id', verifyToken, requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']), deletePackage);

// Protected route (Tourist import)
router.post('/:id/import', verifyToken, requireRoles(['TOURIST']), importPackageToItinerary);

export default router;
