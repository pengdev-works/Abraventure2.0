import express from 'express';
import {
  // Public
  getTourPackages,
  getTourPackageDetails,
  getPackageCalendar,
  // DOT Package Management
  createTourPackage,
  updateTourPackage,
  deleteTourPackage,
  submitForApproval,
  reviewPackage,
  publishPackage,
  // My/All packages
  getMyMunicipalPackages,
  getProvincePackageStats,
  // Multi-municipality
  getParticipationRequests,
  respondToParticipation,
  // Schedule management
  getPackageSchedules,
  upsertPackageSchedule,
  deletePackageSchedule,
  // Transport management
  getTransportSchedules,
  upsertTransportSchedule,
  deleteTransportSchedule,
  // Tourist booking flow
  createPackageBooking,
  getMyPackageBookings,
  getAllPackageBookings,
  updateBookingStatus,
  uploadBookingPaymentProof,
  verifyBookingPayment,
} from '../controllers/tourPackageController.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────────────
router.get('/', getTourPackages);
router.get('/calendar/:id', getPackageCalendar);
router.get('/:id', getTourPackageDetails);

// ─── DOT Dashboard Routes ─────────────────────────────────────────────────
router.get(
  '/manage/my-packages',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  getMyMunicipalPackages
);
router.get(
  '/manage/stats',
  verifyToken,
  requireRoles(['PROVINCIAL_DOT']),
  getProvincePackageStats
);

// Package CRUD
router.post(
  '/',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  upload.single('coverImage'),
  createTourPackage
);
router.put(
  '/:id',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  upload.single('coverImage'),
  updateTourPackage
);
router.delete(
  '/:id',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  deleteTourPackage
);

// Package status workflow
router.post(
  '/:id/submit',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT']),
  submitForApproval
);
router.put(
  '/:id/review',
  verifyToken,
  requireRoles(['PROVINCIAL_DOT']),
  reviewPackage
);
router.put(
  '/:id/publish',
  verifyToken,
  requireRoles(['PROVINCIAL_DOT']),
  publishPackage
);

// ─── Multi-Municipality Coordination ─────────────────────────────────────
router.get(
  '/participation/requests',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT']),
  getParticipationRequests
);
router.put(
  '/participation/:id/respond',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT']),
  respondToParticipation
);

// ─── Schedule Management ──────────────────────────────────────────────────
router.get(
  '/:id/schedules',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  getPackageSchedules
);
router.post(
  '/:id/schedules',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  upsertPackageSchedule
);
router.delete(
  '/:id/schedules/:sid',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  deletePackageSchedule
);

// ─── Transportation Management ────────────────────────────────────────────
router.get(
  '/:id/transport',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  getTransportSchedules
);
router.post(
  '/:id/transport',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  upsertTransportSchedule
);
router.delete(
  '/:id/transport/:tid',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  deleteTransportSchedule
);

// ─── Tourist Booking Flow ─────────────────────────────────────────────────
router.post(
  '/:id/book',
  verifyToken,
  requireRoles(['TOURIST']),
  createPackageBooking
);
router.get(
  '/bookings/mine',
  verifyToken,
  requireRoles(['TOURIST']),
  getMyPackageBookings
);
router.get(
  '/tourist/my-bookings',
  verifyToken,
  requireRoles(['TOURIST']),
  getMyPackageBookings
);
router.get(
  '/bookings/all',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  getAllPackageBookings
);
router.put(
  '/bookings/:bid/status',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  updateBookingStatus
);
router.post(
  '/bookings/:bid/payment',
  verifyToken,
  requireRoles(['TOURIST']),
  upload.single('paymentProof'),
  uploadBookingPaymentProof
);
router.put(
  '/bookings/:bid/verify-payment',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  verifyBookingPayment
);

export default router;
