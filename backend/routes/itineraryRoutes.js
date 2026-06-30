import express from 'express';
import {
  createItinerary,
  getMyItineraries,
  getItineraryDetails,
  addItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
  deleteItinerary
} from '../controllers/itineraryController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, createItinerary);
router.get('/', verifyToken, getMyItineraries);
router.get('/:id', verifyToken, getItineraryDetails);
router.post('/items', verifyToken, addItineraryItem);
router.put('/items/:id', verifyToken, updateItineraryItem);
router.delete('/items/:id', verifyToken, deleteItineraryItem);
router.delete('/:id', verifyToken, deleteItinerary);

export default router;
