import express from 'express';
import {
  updateHomestayProfile,
  addHomestayImage,
  deleteHomestayImage,
  addRoom,
  updateRoom,
  deleteRoom,
  updateTourGuideProfile,
  updateMunicipalDotProfile,
  getApplications,
  endorseStakeholder,
  approveAccount,
  getAllDotUsers,
  createDotUser,
  updateDotUser,
  deleteDotUser,
} from '../controllers/listingController.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Homestay owner routes
router.put('/homestay', verifyToken, requireRoles(['HOMESTAY_OWNER']), updateHomestayProfile);
router.post('/homestay/images', verifyToken, requireRoles(['HOMESTAY_OWNER']), upload.single('image'), addHomestayImage);
router.delete('/homestay/images/:id', verifyToken, requireRoles(['HOMESTAY_OWNER']), deleteHomestayImage);
router.post('/homestay/rooms', verifyToken, requireRoles(['HOMESTAY_OWNER']), addRoom);
router.put('/homestay/rooms/:id', verifyToken, requireRoles(['HOMESTAY_OWNER']), updateRoom);
router.delete('/homestay/rooms/:id', verifyToken, requireRoles(['HOMESTAY_OWNER']), deleteRoom);

// Tour guide routes
router.put('/guide', verifyToken, requireRoles(['TOUR_GUIDE']), upload.single('profilePicture'), updateTourGuideProfile);

// Municipal DOT routes
router.put('/municipal-dot', verifyToken, requireRoles(['MUNICIPAL_DOT']), upload.single('profilePicture'), updateMunicipalDotProfile);

// Admin review workflows
router.get('/applications', verifyToken, requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']), getApplications);
router.put('/endorse/:id', verifyToken, requireRoles(['MUNICIPAL_DOT']), endorseStakeholder);
router.put('/approve/:id', verifyToken, requireRoles(['PROVINCIAL_DOT']), approveAccount);

// DOT User Account CRUD (Provincial DOT only)
router.get('/users', verifyToken, requireRoles(['PROVINCIAL_DOT']), getAllDotUsers);
router.post('/users', verifyToken, requireRoles(['PROVINCIAL_DOT']), createDotUser);
router.put('/users/:id', verifyToken, requireRoles(['PROVINCIAL_DOT']), updateDotUser);
router.delete('/users/:id', verifyToken, requireRoles(['PROVINCIAL_DOT']), deleteDotUser);

export default router;

