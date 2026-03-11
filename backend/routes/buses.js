import express from 'express';
import {
  getBuses,
  getAvailableBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
  getBusTypes,
  getBusAmenities,
  getBusStats
} from '../controllers/busController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.get('/types', getBusTypes);
router.get('/amenities', getBusAmenities);
router.get('/available', getAvailableBuses);
router.get('/', getBuses);
router.get('/:id', getBusById);

// Admin routes
router.use(protect, adminOnly);
router.post('/', upload.single('busImage'), createBus);
router.put('/:id', upload.single('busImage'), updateBus);
router.delete('/:id', deleteBus);
router.get('/admin/stats', getBusStats);

export default router;
