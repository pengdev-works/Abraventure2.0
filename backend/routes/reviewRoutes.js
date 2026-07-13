import express from 'express';
import { getReviews, createReview, deleteReview, getMyReviews, getReceivedReviews } from '../controllers/reviewController.js';
import { verifyToken, requireRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getReviews); // public
router.get('/my', verifyToken, requireRoles(['TOURIST']), getMyReviews);
router.get('/received', verifyToken, requireRoles(['HOMESTAY_OWNER', 'TOUR_GUIDE']), getReceivedReviews);
router.post('/', verifyToken, requireRoles(['TOURIST']), createReview);
router.delete('/:id', verifyToken, deleteReview);

export default router;
