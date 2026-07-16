import express from 'express';
import { createInquiry, getInquiries, replyInquiry, uploadPaymentProof, upload, getBookedDates } from '../controllers/inquiryController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, upload.single('paymentProof'), createInquiry);
router.get('/', verifyToken, getInquiries);
router.put('/reply/:id', verifyToken, replyInquiry);
router.put('/:id/payment', verifyToken, upload.single('paymentProof'), uploadPaymentProof);
router.get('/booked-dates', getBookedDates); // public — shows booked date ranges

export default router;

