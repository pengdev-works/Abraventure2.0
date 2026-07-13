import express from 'express';
import { getNotifications, getUnreadCount, markRead, markAllRead, deleteNotification } from '../controllers/notificationController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getNotifications);
router.get('/unread-count', verifyToken, getUnreadCount);
router.put('/read-all', verifyToken, markAllRead);
router.put('/:id/read', verifyToken, markRead);
router.delete('/:id', verifyToken, deleteNotification);

export default router;
