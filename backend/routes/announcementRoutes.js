import express from 'express';
import {
  getAnnouncements, getAllAnnouncements, createAnnouncement,
  updateAnnouncement, deleteAnnouncement, getActivityLogs,
  getGuideAvailability, setGuideAvailability,
  getHeroConfig, updateHeroConfig
} from '../controllers/announcementController.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Homepage Hero Config
router.get('/hero', getHeroConfig); // public
router.put('/hero', verifyToken, requireRoles(['PROVINCIAL_DOT']), upload.single('media'), updateHeroConfig);

// Announcements
router.get('/', getAnnouncements); // public
router.get('/all', verifyToken, requireRoles(['PROVINCIAL_DOT']), getAllAnnouncements);
router.post('/', verifyToken, requireRoles(['PROVINCIAL_DOT']), createAnnouncement);
router.put('/:id', verifyToken, requireRoles(['PROVINCIAL_DOT']), updateAnnouncement);
router.delete('/:id', verifyToken, requireRoles(['PROVINCIAL_DOT']), deleteAnnouncement);

// Activity Logs
router.get('/activity-logs', verifyToken, requireRoles(['PROVINCIAL_DOT']), getActivityLogs);

// Guide Availability
router.get('/guide-availability', getGuideAvailability); // public query
router.post('/guide-availability', verifyToken, requireRoles(['TOUR_GUIDE']), setGuideAvailability);

export default router;
