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
  coordinateBookingMunicipalities,
} from '../controllers/tourPackageController.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ─── Multer middleware for payment proof uploads ───────────────────────────
const uploadProof = [
  upload.fields([
    { name: 'paymentProof', maxCount: 1 },
    { name: 'proof_image', maxCount: 1 },
    { name: 'payment', maxCount: 1 },
  ]),
  (req, res, next) => {
    // Normalise: ensure req.file points to whichever field was sent
    if (!req.file) {
      req.file = req.files?.paymentProof?.[0] || req.files?.proof_image?.[0] || req.files?.payment?.[0];
    }
    next();
  },
];

// ─── Public Routes ─────────────────────────────────────────────────────────
// NOTE: The catch-all `GET /:id` MUST come last. All specific paths below.
router.get('/', getTourPackages);
router.get('/calendar/:packageId', getPackageCalendar);

// ─── DOT Dashboard – Statistics & My-Packages ─────────────────────────────
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

// ─── Tourist Booking Endpoints (MUST be before /:id catch-all) ────────────
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
// Upload payment proof (tourist) — both path aliases supported
router.post(
  '/bookings/:bid/payment',
  verifyToken,
  requireRoles(['TOURIST']),
  uploadProof,
  uploadBookingPaymentProof
);
router.post(
  '/bookings/:bid/payment-proof',
  verifyToken,
  requireRoles(['TOURIST']),
  uploadProof,
  uploadBookingPaymentProof
);
router.put(
  '/bookings/:bid/payment-proof',
  verifyToken,
  requireRoles(['TOURIST']),
  uploadProof,
  uploadBookingPaymentProof
);
router.put(
  '/bookings/:bid/verify-payment',
  verifyToken,
  requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']),
  verifyBookingPayment
);
router.post(
  '/bookings/:bid/coordinate',
  verifyToken,
  requireRoles(['PROVINCIAL_DOT', 'MUNICIPAL_DOT']),
  coordinateBookingMunicipalities
);

// ─── Package CRUD (uses /:id — must stay below all /static-prefix routes) ─
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

// ─── Tourist: Book a package ──────────────────────────────────────────────
router.post(
  '/:id/book',
  verifyToken,
  requireRoles(['TOURIST']),
  createPackageBooking
);

// ─── Public Package Detail (catch-all — MUST be last GET /:id) ────────────
router.get('/:id', getTourPackageDetails);

export default router;
