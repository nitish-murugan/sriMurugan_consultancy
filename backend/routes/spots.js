import express from 'express';
import {
  getSpots,
  searchSpots,
  getSpotById,
  createSpot,
  updateSpot,
  deleteSpot,
  getSpotTypes,
  getAISuggestions
} from '../controllers/spotController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/types', getSpotTypes);
router.get('/', getSpots);
router.post('/search', searchSpots);
router.get('/:id', getSpotById);

// Protected routes
router.post('/ai-suggest', protect, getAISuggestions);

// Admin routes
router.use(protect, adminOnly);
router.post('/', createSpot);
router.put('/:id', updateSpot);
router.delete('/:id', deleteSpot);

export default router;
