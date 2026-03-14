import express from 'express';
import { getDrivers, addDriver, deleteDriver } from '../controllers/driverController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, adminOnly, getDrivers);
router.post('/', protect, adminOnly, addDriver);
router.delete('/:id', protect, adminOnly, deleteDriver);

export default router;
