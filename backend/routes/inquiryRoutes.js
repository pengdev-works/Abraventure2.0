import express from 'express';
import { createInquiry, getInquiries, replyInquiry } from '../controllers/inquiryController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, createInquiry);
router.get('/', verifyToken, getInquiries);
router.put('/reply/:id', verifyToken, replyInquiry);

export default router;
