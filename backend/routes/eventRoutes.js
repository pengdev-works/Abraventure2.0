import express from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventController.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public
router.get('/', getEvents);

// Municipal DOT only
router.post('/', verifyToken, requireRoles(['MUNICIPAL_DOT']), upload.single('image'), createEvent);
router.put('/:id', verifyToken, requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']), upload.single('image'), updateEvent);
router.delete('/:id', verifyToken, requireRoles(['MUNICIPAL_DOT', 'PROVINCIAL_DOT']), deleteEvent);

export default router;
