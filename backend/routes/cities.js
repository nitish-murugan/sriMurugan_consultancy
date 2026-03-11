import express from 'express';
import {
  getCities,
  getCityById,
  createCity,
  updateCity,
  deleteCity,
  getStates
} from '../controllers/cityController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/states', getStates);
router.get('/', getCities);
router.get('/:id', getCityById);

// Admin routes
router.use(protect, adminOnly);
router.post('/', createCity);
router.put('/:id', updateCity);
router.delete('/:id', deleteCity);

export default router;
