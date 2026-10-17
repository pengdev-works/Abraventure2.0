import express from 'express';
import {
  updateHomestayProfile,
  addHomestayImage,
  deleteHomestayImage,
  addRoom,
  updateRoom,
  deleteRoom,
  addRoomImage,
  deleteRoomImage,
  updateTourGuideProfile,
  updateMunicipalDotProfile,
  getApplications,
  endorseStakeholder,
  approveAccount,
  getAllDotUsers,
  createDotUser,
  updateDotUser,
  deleteDotUser,
  createMunicipalityHomestay,
  updateMunicipalityHomestay,
  createMunicipalityGuide,
  updateMunicipalityGuide,
  deleteMunicipalityStakeholder,
  getStakeholderActivity,
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
// Room image routes
router.post('/homestay/rooms/:roomId/images', verifyToken, requireRoles(['HOMESTAY_OWNER']), upload.single('roomImage'), addRoomImage);
router.delete('/homestay/room-images/:imageId', verifyToken, requireRoles(['HOMESTAY_OWNER']), deleteRoomImage);

// Tour guide routes
router.put('/guide', verifyToken, requireRoles(['TOUR_GUIDE']), upload.single('profilePicture'), updateTourGuideProfile);

// Municipal DOT routes
router.put('/municipal-dot', verifyToken, requireRoles(['MUNICIPAL_DOT']), upload.single('profilePicture'), updateMunicipalDotProfile);

// Municipality Homestay & Tour Guide direct addition & management
router.post(
  '/municipality/homestays',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  upload.single('image'),
  createMunicipalityHomestay
);
router.put(
  '/municipality/homestays/:id',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  upload.single('image'),
  updateMunicipalityHomestay
);
router.post(
  '/municipality/guides',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  upload.single('profilePicture'),
  createMunicipalityGuide
);
router.put(
  '/municipality/guides/:id',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  upload.single('profilePicture'),
  updateMunicipalityGuide
);
router.delete(
  '/municipality/stakeholders/:type/:id',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  deleteMunicipalityStakeholder
);
router.get(
  '/municipality/stakeholder-activity/:type/:id',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  getStakeholderActivity
);

// Admin review workflows (Municipal DOT directly approves/rejects; Provincial DOT approves Municipal DOT accounts)
router.get('/applications', verifyToken, requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']), getApplications);
router.put('/endorse/:id', verifyToken, requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']), endorseStakeholder);
router.put('/municipality/stakeholders/:type/:id/review', verifyToken, requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']), endorseStakeholder);
router.put('/approve/:id', verifyToken, requireRoles(['PROVINCIAL_DOT']), approveAccount);

// DOT User Account CRUD (Provincial DOT only)
const userProofUploads = upload.fields([
  { name: 'validId', maxCount: 1 },
  { name: 'accreditationDoc', maxCount: 1 },
  { name: 'supportingDoc', maxCount: 1 },
]);

router.get('/users', verifyToken, requireRoles(['PROVINCIAL_DOT']), getAllDotUsers);
router.post('/users', verifyToken, requireRoles(['PROVINCIAL_DOT']), userProofUploads, createDotUser);
router.put('/users/:id', verifyToken, requireRoles(['PROVINCIAL_DOT']), userProofUploads, updateDotUser);
router.delete('/users/:id', verifyToken, requireRoles(['PROVINCIAL_DOT']), deleteDotUser);

export default router;

